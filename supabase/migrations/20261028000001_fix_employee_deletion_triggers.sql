-- =============================================================================
-- Migration: Fix employee deletion triggers and safe reassignment
-- =============================================================================
-- Problem:
--   When Super Admin permanently deletes an employee profile, their associated
--   clients and client_activities need to be reassigned to the Super Admin.
--   However, ns_client_guard() unconditionally set `new.created_by := old.created_by;`
--   and ns_activity_guard() unconditionally set `new.employee_id := old.employee_id;`,
--   silently preventing reassignments and causing Postgres foreign key constraint
--   violations ("clients_created_by_fkey" / "client_activities_employee_id_fkey")
--   when deleting the row from profiles.
--
-- Solution:
--   Allow Super Admins and the backend service_role (where auth_profile_id() is null)
--   to reassign created_by on clients and employee_id on client_activities.
--   Also provide an atomic delete_employee_safely() RPC function.
-- =============================================================================

-- 1. Update ns_client_guard()
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
    -- Only restrict created_by modification if a non-superadmin authenticated user is making changes.
    -- Super Admin and service_role (v_actor is null) are permitted to reassign created_by.
    if v_actor is not null and not public.is_super_admin() then
      new.created_by := old.created_by;
    end if;
    new.created_at := old.created_at;

    -- Only Super Admin or service_role may re-assign a client.
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

-- 2. Update ns_activity_guard()
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
  -- Only restrict employee_id modification if a non-superadmin authenticated user is making changes.
  -- Super Admin and service_role (v_actor is null) are permitted to reassign employee_id.
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

-- 3. Atomic helper RPC to safely delete an employee and reassign business records
create or replace function public.delete_employee_safely(
  p_target_profile_id uuid,
  p_reassign_to_profile_id uuid
)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- 1. App settings
  update public.app_settings
     set updated_by = null
   where updated_by = p_target_profile_id;

  -- 2. Activity status history
  update public.activity_status_history
     set changed_by = null
   where changed_by = p_target_profile_id;

  -- 3. Audit logs
  update public.audit_logs
     set actor_user_id = null
   where actor_user_id = p_target_profile_id;

  -- 4. Attendance sessions
  delete from public.attendance_sessions
   where employee_id = p_target_profile_id;

  -- 5. Reassign clients
  update public.clients
     set created_by = p_reassign_to_profile_id,
         assigned_to = p_reassign_to_profile_id,
         archived_by = case when archived_by = p_target_profile_id then p_reassign_to_profile_id else archived_by end
   where created_by = p_target_profile_id
      or assigned_to = p_target_profile_id
      or archived_by = p_target_profile_id;

  -- 6. Reassign client activities
  update public.client_activities
     set employee_id = p_reassign_to_profile_id,
         updated_by = case when updated_by = p_target_profile_id then p_reassign_to_profile_id else updated_by end
   where employee_id = p_target_profile_id
      or updated_by = p_target_profile_id;

  -- 7. Delete profile
  delete from public.profiles
   where id = p_target_profile_id;
end $$;

grant execute on function public.delete_employee_safely(uuid, uuid) to authenticated, service_role;
