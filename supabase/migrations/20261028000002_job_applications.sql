-- ---------------------------------------------------------------------------
-- Migration: Job Applications / Candidate Recruitment System for HR
-- ---------------------------------------------------------------------------

create type public.application_status as enum (
  'new',
  'screening',
  'interview',
  'offered',
  'rejected',
  'hired'
);

create table if not exists public.job_applications (
  id                        uuid primary key default gen_random_uuid(),
  full_name                 text not null check (char_length(full_name) between 2 and 150),
  email                     text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  mobile_number             text not null check (char_length(mobile_number) between 5 and 30),
  current_city              text not null check (char_length(current_city) between 2 and 120),
  institution_or_employer   text not null check (char_length(institution_or_employer) between 2 and 200),
  educational_qualification text not null check (char_length(educational_qualification) between 2 and 120),
  relevant_experience       text not null check (char_length(relevant_experience) between 1 and 100),
  skills                    text not null check (char_length(skills) between 2 and 3000),
  resume_name               text,
  resume_data               text,
  position_applied          text not null check (char_length(position_applied) between 2 and 150),
  availability              text not null check (char_length(availability) between 2 and 100),
  linkedin_url              text check (linkedin_url is null or char_length(linkedin_url) <= 300),
  why_join                  text not null check (char_length(why_join) between 5 and 5000),
  status                    public.application_status not null default 'new',
  hr_notes                  text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists job_applications_created_idx on public.job_applications (created_at desc);
create index if not exists job_applications_status_idx on public.job_applications (status, created_at desc);
create index if not exists job_applications_email_idx on public.job_applications (email);
create index if not exists job_applications_position_idx on public.job_applications (position_applied);

create trigger job_applications_updated_at before update on public.job_applications
  for each row execute function public.ns_set_updated_at();

alter table public.job_applications enable row level security;

-- Public/anon can insert new applications
create policy "Public can submit applications"
  on public.job_applications for insert
  to anon, authenticated
  with check (true);

-- HR and Super Admin can read all applications
create policy "HR and Super Admin can view applications"
  on public.job_applications for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.auth_user_id = auth.uid()
        and profiles.role in ('hr', 'super_admin')
    )
  );

-- HR and Super Admin can update applications
create policy "HR and Super Admin can update applications"
  on public.job_applications for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.auth_user_id = auth.uid()
        and profiles.role in ('hr', 'super_admin')
    )
  );

-- Super Admin can delete applications
create policy "Super Admin can delete applications"
  on public.job_applications for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.auth_user_id = auth.uid()
        and profiles.role = 'super_admin'
    )
  );
