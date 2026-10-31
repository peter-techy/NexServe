-- ---------------------------------------------------------------------------
-- Migration: Make availability column optional for job applications
-- ---------------------------------------------------------------------------

alter table if exists public.job_applications
  alter column availability drop not null;
