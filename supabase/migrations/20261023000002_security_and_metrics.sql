-- =============================================================================
-- NexServe — Row Level Security, RPC functions, metrics and default settings
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles               enable row level security;
alter table public.app_settings           enable row level security;
alter table public.contact_sources        enable row level security;
alter table public.clients                enable row level security;
alter table public.client_activities      enable row level security;
alter table public.activity_status_history enable row level security;
alter table public.attendance_sessions    enable row level security;
alter table public.audit_logs             enable row level security;
alter table public.contact_inquiries      enable row level security;

-- Profiles: everyone sees their own profile; HR and Super Admin see all.
-- No direct writes from browsers: account management runs through
-- server-side code using the service role after explicit role checks.
create policy profiles_select on public.profiles for select to authenticated
  using (auth_user_id = auth.uid() or public.is_hr_or_admin());

-- Settings & contact sources: readable by anyone (no secrets stored here),
-- writable only by Super Admin.
create policy settings_read on public.app_settings for select to anon, authenticated using (true);
create policy settings_write on public.app_settings for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy sources_read on public.contact_sources for select to anon, authenticated using (true);
create policy sources_write on public.contact_sources for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Clients
create policy clients_select on public.clients for select to authenticated
  using (public.is_hr_or_admin() or (public.auth_role() = 'sales' and assigned_to = public.auth_profile_id()));
create policy clients_insert on public.clients for insert to authenticated
  with check (public.auth_role() in ('sales', 'super_admin')
              and created_by = public.auth_profile_id() and assigned_to = public.auth_profile_id());
create policy clients_update on public.clients for update to authenticated
  using (public.is_super_admin() or (public.auth_role() = 'sales' and assigned_to = public.auth_profile_id()))
  with check (public.is_super_admin() or (public.auth_role() = 'sales' and assigned_to = public.auth_profile_id()));
-- No delete policy: clients are archived, never hard-deleted from the app.

-- Client activities
create policy activities_select on public.client_activities for select to authenticated
  using (public.is_hr_or_admin() or (public.auth_role() = 'sales' and employee_id = public.auth_profile_id()));
create policy activities_insert on public.client_activities for insert to authenticated
  with check (
    public.auth_role() in ('sales', 'super_admin')
    and employee_id = public.auth_profile_id()
    and exists (select 1 from public.clients c
                where c.id = client_id and c.archived_at is null
                  and (c.assigned_to = public.auth_profile_id() or public.is_super_admin())));
create policy activities_update on public.client_activities for update to authenticated
  using (public.is_super_admin() or (public.auth_role() = 'sales' and employee_id = public.auth_profile_id()))
  with check (public.is_super_admin() or (public.auth_role() = 'sales' and employee_id = public.auth_profile_id()));

create policy status_history_select on public.activity_status_history for select to authenticated
  using (exists (select 1 from public.client_activities a where a.id = activity_id));

-- Attendance: read own (sales) or all (HR/Super Admin). Writes only via RPC.
create policy attendance_select on public.attendance_sessions for select to authenticated
  using (public.is_hr_or_admin() or employee_id = public.auth_profile_id());

-- Audit logs: Super Admin only.
create policy audit_select on public.audit_logs for select to authenticated using (public.is_super_admin());

-- Inquiries: Super Admin reviews; inserts only via submit_contact_inquiry().
create policy inquiries_select on public.contact_inquiries for select to authenticated using (public.is_super_admin());
create policy inquiries_update on public.contact_inquiries for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Prevent the anon role from touching anything not explicitly granted.
revoke all on all tables in schema public from anon;
grant select on public.app_settings, public.contact_sources to anon;

-- ---------------------------------------------------------------------------
-- Attendance RPCs (server timestamps only)
-- ---------------------------------------------------------------------------
create or replace function public.check_in()
returns public.attendance_sessions language plpgsql security definer set search_path = public as $$
declare
  v_profile uuid := public.auth_profile_id();
  v_row public.attendance_sessions;
begin
  if v_profile is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;
  if public.auth_role() <> 'sales' then
    raise exception 'ROLE_NOT_PERMITTED' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.attendance_sessions where employee_id = v_profile and check_out_at is null) then
    raise exception 'ALREADY_CHECKED_IN' using errcode = 'P0001';
  end if;
  insert into public.attendance_sessions (employee_id, check_in_at)
  values (v_profile, now())
  returning * into v_row;
  perform public.ns_audit('attendance.check_in', 'attendance_session', v_row.id::text, '{}'::jsonb);
  return v_row;
exception
  when unique_violation or exclusion_violation then
    raise exception 'ALREADY_CHECKED_IN' using errcode = 'P0001';
end $$;

create or replace function public.check_out()
returns public.attendance_sessions language plpgsql security definer set search_path = public as $$
declare
  v_profile uuid := public.auth_profile_id();
  v_row public.attendance_sessions;
begin
  if v_profile is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = 'P0001';
  end if;
  update public.attendance_sessions
     set check_out_at = greatest(now(), check_in_at)
   where employee_id = v_profile and check_out_at is null
  returning * into v_row;
  if v_row.id is null then
    raise exception 'NOT_CHECKED_IN' using errcode = 'P0001';
  end if;
  perform public.ns_audit('attendance.check_out', 'attendance_session', v_row.id::text,
                          jsonb_build_object('duration_seconds', v_row.duration_seconds));
  return v_row;
end $$;

-- Administrative correction (Super Admin only, always audited with reason).
create or replace function public.correct_attendance_session(
  p_session_id uuid, p_check_in_at timestamptz, p_check_out_at timestamptz, p_reason text)
returns public.attendance_sessions language plpgsql security definer set search_path = public as $$
declare
  v_old public.attendance_sessions;
  v_row public.attendance_sessions;
begin
  if not public.is_super_admin() then
    raise exception 'ROLE_NOT_PERMITTED' using errcode = 'P0001';
  end if;
  if p_reason is null or char_length(trim(p_reason)) < 5 then
    raise exception 'REASON_REQUIRED' using errcode = 'P0001';
  end if;
  if p_check_out_at is not null and p_check_out_at < p_check_in_at then
    raise exception 'INVALID_RANGE' using errcode = 'P0001';
  end if;
  if p_check_in_at > now() or (p_check_out_at is not null and p_check_out_at > now()) then
    raise exception 'FUTURE_TIMESTAMP' using errcode = 'P0001';
  end if;
  select * into v_old from public.attendance_sessions where id = p_session_id for update;
  if v_old.id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  update public.attendance_sessions
     set check_in_at = p_check_in_at, check_out_at = p_check_out_at, corrected = true
   where id = p_session_id
  returning * into v_row;
  perform public.ns_audit('attendance.correct', 'attendance_session', p_session_id::text,
    jsonb_build_object('reason', trim(p_reason),
                       'old_check_in_at', v_old.check_in_at, 'old_check_out_at', v_old.check_out_at,
                       'new_check_in_at', v_row.check_in_at, 'new_check_out_at', v_row.check_out_at));
  return v_row;
exception
  when exclusion_violation or unique_violation then
    raise exception 'OVERLAPPING_SESSION' using errcode = 'P0001';
end $$;

-- ---------------------------------------------------------------------------
-- Deal rule helper.
--   'deal_outcome' (default): a deal is won when an activity is marked with
--                              deal_outcome = 'won' (only allowed on Done /
--                              Cancelled records — normally Done).
--   'status_done'           : every activity with work_status = 'Done' counts.
-- ---------------------------------------------------------------------------
create or replace function public.ns_deal_rule()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select value #>> '{}' from public.app_settings where key = 'deal_rule'), 'deal_outcome')
$$;

create or replace function public.ns_is_deal(p_status public.work_status, p_outcome public.deal_outcome)
returns boolean language sql stable as $$
  select case when public.ns_deal_rule() = 'status_done' then p_status = 'Done'
              else p_outcome = 'won' end
$$;

-- ---------------------------------------------------------------------------
-- Metrics — ONE definition used by every dashboard (SECURITY INVOKER: RLS
-- automatically restricts a Sales user to their own records).
--   clients_contacted : distinct clients with >=1 activity whose contact_date
--                       falls in [from, to] (business days, inclusive)
--   activities_count  : number of activity records in the period
--   followups_pending : CURRENT open follow-ups (required, not completed, not
--                       cancelled, client not archived) — not period bound
--   followups_overdue : subset of pending whose follow_up_at < now()
--   deals_won         : distinct clients with a qualifying deal activity in period
--   work_seconds      : sum of COMPLETED sessions checked in within the period
--   open_sessions     : sessions currently open (checked in, not out)
-- ---------------------------------------------------------------------------
create or replace function public.get_activity_metrics(
  p_from date, p_to date, p_employee uuid default null, p_department public.department default null)
returns table (
  clients_contacted bigint, activities_count bigint, followups_pending bigint, followups_overdue bigint,
  deals_won bigint, work_seconds bigint, open_sessions bigint)
language sql stable security invoker set search_path = public as $$
  with emp as (
    select p.id from public.profiles p
     where (p_employee is null or p.id = p_employee)
       and (p_department is null or p.department = p_department)
  ),
  act as (
    select a.* from public.client_activities a
      join public.clients c on c.id = a.client_id
     where a.employee_id in (select id from emp)
  )
  select
    (select count(distinct client_id) from act
      where contact_date >= public.ns_day_start(p_from) and contact_date < public.ns_day_end(p_to)),
    (select count(*) from act
      where contact_date >= public.ns_day_start(p_from) and contact_date < public.ns_day_end(p_to)),
    (select count(*) from act a join public.clients c on c.id = a.client_id
      where a.follow_up_required and a.follow_up_completed_at is null
        and a.work_status <> 'Cancelled' and c.archived_at is null),
    (select count(*) from act a join public.clients c on c.id = a.client_id
      where a.follow_up_required and a.follow_up_completed_at is null
        and a.work_status <> 'Cancelled' and c.archived_at is null and a.follow_up_at < now()),
    (select count(distinct client_id) from act
      where contact_date >= public.ns_day_start(p_from) and contact_date < public.ns_day_end(p_to)
        and public.ns_is_deal(work_status, deal_outcome)),
    (select coalesce(sum(duration_seconds), 0)::bigint from public.attendance_sessions s
      where s.employee_id in (select id from emp) and s.check_out_at is not null
        and s.check_in_at >= public.ns_day_start(p_from) and s.check_in_at < public.ns_day_end(p_to)),
    (select count(*) from public.attendance_sessions s
      where s.employee_id in (select id from emp) and s.check_out_at is null)
$$;

-- Per employee / business-day summary (used by HR views and Excel export).
-- One row per (employee, business date) that has activity and/or a completed
-- or open work session in the range.
create or replace function public.report_daily_summary(
  p_from date, p_to date, p_employee uuid default null, p_department public.department default null)
returns table (
  employee_uuid uuid, employee_code text, employee_name text, department public.department,
  work_date date, clients_contacted bigint, activities_count bigint, followups_pending bigint,
  deals_done bigint, work_seconds bigint)
language sql stable security invoker set search_path = public as $$
  with emp as (
    select p.* from public.profiles p
     where (p_employee is null or p.id = p_employee)
       and (p_department is null or p.department = p_department)
  ),
  act as (
    select a.*, public.ns_business_date(a.contact_date) as d, c.archived_at as client_archived_at
      from public.client_activities a join public.clients c on c.id = a.client_id
     where a.employee_id in (select id from emp)
       and a.contact_date >= public.ns_day_start(p_from) and a.contact_date < public.ns_day_end(p_to)
  ),
  ses as (
    select s.employee_id, public.ns_business_date(s.check_in_at) as d,
           coalesce(sum(s.duration_seconds), 0)::bigint as secs
      from public.attendance_sessions s
     where s.employee_id in (select id from emp)
       and s.check_in_at >= public.ns_day_start(p_from) and s.check_in_at < public.ns_day_end(p_to)
     group by 1, 2
  ),
  act_agg as (
    select employee_id, d,
           count(distinct client_id) as clients_contacted,
           count(*) as activities_count,
           count(*) filter (where follow_up_required and follow_up_completed_at is null
                            and work_status <> 'Cancelled' and client_archived_at is null) as followups_pending,
           count(distinct client_id) filter (where public.ns_is_deal(work_status, deal_outcome)) as deals_done
      from act group by 1, 2
  ),
  keys as (
    select employee_id, d from act_agg union select employee_id, d from ses
  )
  select e.id, e.employee_id, e.full_name, e.department, k.d,
         coalesce(aa.clients_contacted, 0), coalesce(aa.activities_count, 0),
         coalesce(aa.followups_pending, 0), coalesce(aa.deals_done, 0), coalesce(s.secs, 0)
    from keys k
    join emp e on e.id = k.employee_id
    left join act_agg aa on aa.employee_id = k.employee_id and aa.d = k.d
    left join ses s on s.employee_id = k.employee_id and s.d = k.d
   order by k.d desc, e.full_name
$$;

grant execute on function public.get_activity_metrics(date, date, uuid, public.department) to authenticated;
grant execute on function public.report_daily_summary(date, date, uuid, public.department) to authenticated;
grant execute on function public.check_in() to authenticated;
grant execute on function public.check_out() to authenticated;
grant execute on function public.correct_attendance_session(uuid, timestamptz, timestamptz, text) to authenticated;
revoke execute on function public.check_in() from anon;
revoke execute on function public.check_out() from anon;
revoke execute on function public.correct_attendance_session(uuid, timestamptz, timestamptz, text) from anon;
revoke execute on function public.get_activity_metrics(date, date, uuid, public.department) from anon;
revoke execute on function public.report_daily_summary(date, date, uuid, public.department) from anon;
revoke execute on function public.ns_audit(text, text, text, jsonb) from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- Default settings (editable placeholders — replace via Admin > Settings)
-- ---------------------------------------------------------------------------
insert into public.app_settings (key, value) values
  ('company_name', to_jsonb('NexServe'::text)),
  ('company_tagline', to_jsonb('One Partner. Every Possibility.'::text)),
  ('business_timezone', to_jsonb('Asia/Kolkata'::text)),
  ('deal_rule', to_jsonb('deal_outcome'::text)),
  ('contact_email', to_jsonb(''::text)),
  ('contact_phone', to_jsonb(''::text)),
  ('contact_address', to_jsonb(''::text)),
  ('company_description', to_jsonb('[Placeholder — to be replaced by the company administrator] NexServe is a service partner helping businesses grow through digital marketing, content creation and tailored solutions for special requirements.'::text)),
  ('mission', to_jsonb('[Placeholder — to be replaced by the company administrator] Our mission statement will appear here.'::text)),
  ('vision', to_jsonb('[Placeholder — to be replaced by the company administrator] Our vision statement will appear here.'::text)),
  ('services', '[
     {"title": "Digital Marketing", "description": "[Placeholder] Description of digital marketing services."},
     {"title": "Content Creation", "description": "[Placeholder] Description of content creation services."},
     {"title": "Special Demand", "description": "[Placeholder] Description of tailored solutions for specific client requirements."}
   ]'::jsonb),
  ('what_we_provide', '[
     "[Placeholder] Capability or deliverable one",
     "[Placeholder] Capability or deliverable two",
     "[Placeholder] Capability or deliverable three"
   ]'::jsonb)
on conflict (key) do nothing;

insert into public.contact_sources (label, sort_order) values
  ('LinkedIn', 10), ('Referral', 20), ('Phone Call', 30), ('Email', 40),
  ('Website', 50), ('Social Media', 60), ('Walk-in', 70), ('Other', 999)
on conflict (label) do nothing;
