-- =============================================================================
-- NexServe Corporate Management Portal — core schema
-- =============================================================================
-- Conventions
--   * All timestamps are stored as timestamptz (UTC). Display/reporting uses the
--     business timezone stored in app_settings ('business_timezone').
--   * Business-day boundaries are computed with ns_day_start()/ns_day_end().
--   * Attendance sessions are attributed in full to the business day on which
--     they were checked in (overnight sessions are NOT split).
-- =============================================================================

create extension if not exists btree_gist;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('super_admin', 'hr', 'sales');
create type public.department as enum ('HR', 'Sales', 'Administration');
create type public.work_status as enum ('Followup', 'Done', 'Cancelled');
create type public.deal_outcome as enum ('won', 'lost');
create type public.inquiry_status as enum ('new', 'in_review', 'resolved', 'spam');

-- ---------------------------------------------------------------------------
-- Generic updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.ns_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- A. Profiles / Employees
-- ---------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null unique references auth.users (id) on delete restrict,
  employee_id   text not null unique check (employee_id ~ '^[A-Za-z0-9-]{2,20}$'),
  full_name     text not null check (char_length(full_name) between 2 and 120),
  department    public.department not null,
  role          public.app_role not null,
  email         text not null unique check (position('@' in email) > 1),
  phone         text check (phone is null or char_length(phone) <= 30),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Department/role consistency: Sales role => Sales dept, HR role => HR dept.
  constraint profiles_role_department_chk check (
    (role = 'sales' and department = 'Sales') or
    (role = 'hr' and department = 'HR') or
    (role = 'super_admin')
  )
);
create index profiles_role_idx on public.profiles (role);
create index profiles_department_idx on public.profiles (department);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.ns_set_updated_at();

-- ---------------------------------------------------------------------------
-- Security helper functions (SECURITY DEFINER so they can read profiles
-- regardless of RLS; they only ever expose the caller's own data).
-- ---------------------------------------------------------------------------
create or replace function public.auth_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.profiles where auth_user_id = auth.uid() and is_active
$$;

create or replace function public.auth_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where auth_user_id = auth.uid() and is_active
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'super_admin' from public.profiles
                   where auth_user_id = auth.uid() and is_active), false)
$$;

create or replace function public.is_hr_or_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('super_admin', 'hr') from public.profiles
                   where auth_user_id = auth.uid() and is_active), false)
$$;

-- ---------------------------------------------------------------------------
-- G. Application settings (key/value, non-secret configuration only)
-- ---------------------------------------------------------------------------
create table public.app_settings (
  key         text primary key check (key ~ '^[a-z_]{2,60}$'),
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles (id)
);
create trigger app_settings_updated_at before update on public.app_settings
  for each row execute function public.ns_set_updated_at();

create or replace function public.ns_timezone()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select value #>> '{}' from public.app_settings where key = 'business_timezone'),
                  'Asia/Kolkata')
$$;

-- Business-day boundaries (inclusive start, exclusive end) in UTC.
create or replace function public.ns_day_start(p_day date)
returns timestamptz language sql stable as $$
  select (p_day::timestamp) at time zone public.ns_timezone()
$$;
create or replace function public.ns_day_end(p_day date)
returns timestamptz language sql stable as $$
  select ((p_day + 1)::timestamp) at time zone public.ns_timezone()
$$;
create or replace function public.ns_business_date(p_ts timestamptz)
returns date language sql stable as $$
  select (p_ts at time zone public.ns_timezone())::date
$$;

-- Contact source lookup (managed by Super Admin)
create table public.contact_sources (
  id          serial primary key,
  label       text not null unique check (char_length(label) between 2 and 40),
  is_active   boolean not null default true,
  sort_order  int not null default 100,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- B. Clients (client identity — one row per client, per owning employee)
-- ---------------------------------------------------------------------------
create table public.clients (
  id                 uuid primary key default gen_random_uuid(),
  person_name        text not null check (char_length(person_name) between 2 and 120),
  business_name      text not null check (char_length(business_name) between 2 and 160),
  location           text not null check (char_length(location) between 2 and 160),
  client_number      text check (client_number is null or client_number ~ '^\+?[0-9 ()-]{6,20}$'),
  client_number_norm text generated always as (nullif(regexp_replace(coalesce(client_number, ''), '[^0-9]', '', 'g'), '')) stored,
  created_by         uuid not null references public.profiles (id),
  assigned_to        uuid not null references public.profiles (id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  archived_at        timestamptz,
  archived_by        uuid references public.profiles (id)
);
-- An employee cannot hold two active client identities with the same number.
create unique index clients_owner_number_uniq on public.clients (assigned_to, client_number_norm)
  where archived_at is null and client_number_norm is not null;
create index clients_assigned_idx on public.clients (assigned_to);
create index clients_search_idx on public.clients (lower(person_name), lower(business_name));
create trigger clients_updated_at before update on public.clients
  for each row execute function public.ns_set_updated_at();

-- ---------------------------------------------------------------------------
-- C. Client activities (each contact / interaction)
-- ---------------------------------------------------------------------------
create table public.client_activities (
  id                          uuid primary key default gen_random_uuid(),
  client_id                   uuid not null references public.clients (id) on delete restrict,
  employee_id                 uuid not null references public.profiles (id),
  contact_date                timestamptz not null default now(),
  contact_source              text not null check (char_length(contact_source) between 2 and 40),
  contact_source_other        text check (contact_source_other is null or char_length(contact_source_other) <= 120),
  client_review               text not null check (char_length(client_review) between 1 and 4000),
  notes                       text check (notes is null or char_length(notes) <= 4000),
  work_status                 public.work_status not null,
  criteria                    text[] not null check (
                                 cardinality(criteria) >= 1 and
                                 criteria <@ array['Digital Marketing', 'Content Creation', 'Special Demand']),
  criteria_description        text check (criteria_description is null or char_length(criteria_description) <= 4000),
  special_demand_description  text check (special_demand_description is null or char_length(special_demand_description) <= 4000),
  follow_up_required          boolean not null default false,
  follow_up_at                timestamptz,
  follow_up_notes             text check (follow_up_notes is null or char_length(follow_up_notes) <= 2000),
  follow_up_completed_at      timestamptz,
  deal_outcome                public.deal_outcome,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  updated_by                  uuid references public.profiles (id),
  constraint activity_followup_chk check (not follow_up_required or follow_up_at is not null),
  constraint activity_status_followup_chk check (work_status <> 'Followup' or follow_up_required),
  constraint activity_other_source_chk check (contact_source <> 'Other' or contact_source_other is not null),
  constraint activity_special_demand_chk check (
    not ('Special Demand' = any (criteria)) or special_demand_description is not null),
  constraint activity_deal_chk check (deal_outcome is null or work_status <> 'Followup')
);
create index activities_employee_date_idx on public.client_activities (employee_id, contact_date desc);
create index activities_client_idx on public.client_activities (client_id, contact_date desc);
create index activities_status_idx on public.client_activities (work_status);
create index activities_pending_followup_idx on public.client_activities (follow_up_at)
  where follow_up_required and follow_up_completed_at is null;
create trigger activities_updated_at before update on public.client_activities
  for each row execute function public.ns_set_updated_at();

-- Status-change history
create table public.activity_status_history (
  id           bigserial primary key,
  activity_id  uuid not null references public.client_activities (id) on delete cascade,
  old_status   public.work_status,
  new_status   public.work_status not null,
  changed_by   uuid references public.profiles (id),
  changed_at   timestamptz not null default now()
);
create index activity_status_history_activity_idx on public.activity_status_history (activity_id);

-- Activity integrity trigger: stamps ownership, keeps updated_by trusted,
-- prevents re-parenting and records status history.
create or replace function public.ns_activity_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := public.auth_profile_id();
begin
  if tg_op = 'INSERT' then
    if v_actor is not null then
      new.employee_id := v_actor;   -- never trust a browser-supplied employee id
    end if;
    new.updated_by := coalesce(v_actor, new.employee_id);
    new.created_at := now();
    if new.follow_up_completed_at is not null then
      new.follow_up_completed_at := now();
    end if;
    -- Logging a new activity on a client closes that client's earlier open follow-ups.
    update public.client_activities
       set follow_up_completed_at = now(), updated_by = new.updated_by
     where client_id = new.client_id
       and follow_up_required and follow_up_completed_at is null;
    return new;
  end if;

  -- UPDATE
  if v_actor is not null and not public.is_super_admin() then
    new.employee_id := old.employee_id;
  end if;
  new.client_id := old.client_id;
  new.created_at := old.created_at;
  new.updated_by := coalesce(v_actor, new.updated_by);
  if new.work_status = 'Cancelled' and new.follow_up_completed_at is null and new.follow_up_required then
    new.follow_up_completed_at := now();
  end if;
  return new;
end $$;

create trigger activities_guard before insert or update on public.client_activities
  for each row execute function public.ns_activity_guard();

create or replace function public.ns_activity_history()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_status_history (activity_id, old_status, new_status, changed_by)
    values (new.id, null, new.work_status, new.updated_by);
  elsif new.work_status is distinct from old.work_status then
    insert into public.activity_status_history (activity_id, old_status, new_status, changed_by)
    values (new.id, old.work_status, new.work_status, new.updated_by);
  end if;
  return null;
end $$;

create trigger activities_history after insert or update on public.client_activities
  for each row execute function public.ns_activity_history();

-- Client guard: ownership stamps.
create or replace function public.ns_client_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := public.auth_profile_id();
begin
  if tg_op = 'INSERT' then
    if v_actor is not null then
      new.created_by := v_actor;
      new.assigned_to := v_actor;
    end if;
    new.archived_at := null;
    new.archived_by := null;
    new.created_at := now();
  else
    if v_actor is not null and not public.is_super_admin() then
      new.created_by := old.created_by;
    end if;
    new.created_at := old.created_at;
    -- Only Super Admin may re-assign a client.
    if new.assigned_to is distinct from old.assigned_to and v_actor is not null
       and not public.is_super_admin() then
      new.assigned_to := old.assigned_to;
    end if;
    if new.archived_at is not null and old.archived_at is null then
      new.archived_at := now();
      new.archived_by := v_actor;
    end if;
  end if;
  return new;
end $$;

create trigger clients_guard before insert or update on public.clients
  for each row execute function public.ns_client_guard();

-- ---------------------------------------------------------------------------
-- D. Attendance / work sessions
-- ---------------------------------------------------------------------------
create table public.attendance_sessions (
  id                uuid primary key default gen_random_uuid(),
  employee_id       uuid not null references public.profiles (id),
  check_in_at       timestamptz not null default now(),
  check_out_at      timestamptz,
  duration_seconds  integer generated always as
                      (case when check_out_at is null then null
                            else extract(epoch from (check_out_at - check_in_at))::integer end) stored,
  corrected         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint attendance_order_chk check (check_out_at is null or check_out_at >= check_in_at),
  constraint attendance_no_overlap exclude using gist (
    employee_id with =,
    tstzrange(check_in_at, coalesce(check_out_at, 'infinity'::timestamptz), '[)') with &&
  )
);
create unique index attendance_one_open_session on public.attendance_sessions (employee_id)
  where check_out_at is null;
create index attendance_employee_checkin_idx on public.attendance_sessions (employee_id, check_in_at desc);
create trigger attendance_updated_at before update on public.attendance_sessions
  for each row execute function public.ns_set_updated_at();

-- ---------------------------------------------------------------------------
-- E. Audit logs
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id             bigserial primary key,
  actor_user_id  uuid references public.profiles (id),
  action         text not null,
  entity_type    text not null,
  entity_id      text,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

create or replace function public.ns_audit(p_action text, p_entity_type text, p_entity_id text, p_metadata jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (public.auth_profile_id(), p_action, p_entity_type, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
$$;

-- ---------------------------------------------------------------------------
-- F. Contact inquiries (public About Us form)
-- ---------------------------------------------------------------------------
create table public.contact_inquiries (
  id                   uuid primary key default gen_random_uuid(),
  full_name            text not null check (char_length(full_name) between 2 and 120),
  email                text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  phone                text check (phone is null or char_length(phone) <= 30),
  subject              text not null check (char_length(subject) between 3 and 160),
  message              text not null check (char_length(message) between 10 and 5000),
  status               public.inquiry_status not null default 'new',
  notification_status  text not null default 'not_configured'
                         check (notification_status in ('not_configured', 'sent', 'failed')),
  source_hash          text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index contact_inquiries_created_idx on public.contact_inquiries (created_at desc);
create index contact_inquiries_hash_idx on public.contact_inquiries (source_hash, created_at desc);
create trigger contact_inquiries_updated_at before update on public.contact_inquiries
  for each row execute function public.ns_set_updated_at();

-- Rate-limited public submission (5 per source per 15 minutes, 200/hour globally).
create or replace function public.submit_contact_inquiry(
  p_full_name text, p_email text, p_phone text, p_subject text, p_message text, p_source_hash text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if (select count(*) from public.contact_inquiries
       where source_hash = p_source_hash and created_at > now() - interval '15 minutes') >= 5 then
    raise exception 'RATE_LIMITED' using errcode = 'P0001';
  end if;
  if (select count(*) from public.contact_inquiries where created_at > now() - interval '1 hour') >= 200 then
    raise exception 'RATE_LIMITED' using errcode = 'P0001';
  end if;
  insert into public.contact_inquiries (full_name, email, phone, subject, message, source_hash)
  values (trim(p_full_name), lower(trim(p_email)), nullif(trim(coalesce(p_phone, '')), ''),
          trim(p_subject), trim(p_message), p_source_hash)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.submit_contact_inquiry(text, text, text, text, text, text) from public;
grant execute on function public.submit_contact_inquiry(text, text, text, text, text, text) to anon, authenticated, service_role;
