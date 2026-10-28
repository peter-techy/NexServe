"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { authorize } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import type { ActionState, AppRole, Department } from "@/lib/types";

export async function createEmployeeAction(
  arg1: ActionState | FormData,
  arg2?: FormData
): Promise<ActionState> {
  const session = await authorize(["super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized. Super Admin access required." };
  }

  const formData = arg1 instanceof FormData ? arg1 : arg2;
  if (!formData) {
    return { ok: false, message: "Invalid form submission: missing form data." };
  }

  const employee_id = (formData.get("employee_id") as string)?.trim().toUpperCase() || "";
  const full_name = (formData.get("full_name") as string)?.trim() || "";
  const email = (formData.get("email") as string)?.trim().toLowerCase() || "";
  const phone = (formData.get("phone") as string)?.trim() || null;
  const role = (formData.get("role") as AppRole) || "sales";
  let department = (formData.get("department") as Department) || (role === "hr" ? "HR" : "Sales");
  if (role === "super_admin" && !department) {
    department = "Administration";
  }
  const tempPassword = (formData.get("password") as string)?.trim() || "NexServe@2026";

  if (!employee_id || !full_name || !email) {
    return { ok: false, message: "Employee ID, Full Name, and Work Email are required." };
  }

  if (tempPassword.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters long." };
  }

  const admin = createAdminClient();

  // Pre-check for duplicate employee_id or email in profiles
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("employee_id, email")
    .or(`employee_id.eq.${employee_id},email.eq.${email}`)
    .maybeSingle();

  if (existingProfile) {
    if (existingProfile.employee_id === employee_id) {
      return { ok: false, message: `Employee ID "${employee_id}" is already assigned to another user.` };
    }
    if (existingProfile.email === email) {
      return { ok: false, message: `An employee profile with email "${email}" already exists.` };
    }
  }

  // 1. Create Supabase Auth User
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name, employee_id },
  });

  if (authError || !authUser.user) {
    const isDup =
      authError?.message?.toLowerCase().includes("already registered") ||
      authError?.message?.toLowerCase().includes("already exists");
    return {
      ok: false,
      message: isDup
        ? `An authentication account with email "${email}" already exists.`
        : authError?.message || "Failed to create authentication user.",
    };
  }

  // 2. Create Profile Record
  const { data: newProfile, error: profileError } = await admin
    .from("profiles")
    .insert({
      auth_user_id: authUser.user.id,
      employee_id,
      full_name,
      department,
      role,
      email,
      phone,
      is_active: true,
    })
    .select()
    .single();

  if (profileError) {
    // Rollback user creation to prevent orphaned auth user
    try {
      await admin.auth.admin.deleteUser(authUser.user.id);
    } catch (delErr) {
      console.error("Failed to rollback auth user:", delErr);
    }
    const msg =
      profileError.code === "23505" || profileError.message?.toLowerCase().includes("duplicate")
        ? `Employee ID "${employee_id}" or email "${email}" already exists.`
        : profileError.message || "Failed to create employee profile.";
    return { ok: false, message: msg };
  }

  try {
    await writeAudit(session.profile.id, "employee.create", "profiles", newProfile.id, {
      employee_id,
      role,
      department,
    });
  } catch (auditErr) {
    console.error("Audit log error:", auditErr);
  }

  revalidateEmployeeViews();
  return { ok: true, message: `Account for ${full_name} (${employee_id}) created successfully.` };
}

const REVALIDATE_PATHS = [
  "/admin/users",
  "/admin/dashboard",
  "/hr/employees",
  "/hr/dashboard",
  "/hr/activity",
  "/hr/reports",
];

function revalidateEmployeeViews() {
  for (const path of REVALIDATE_PATHS) {
    try {
      revalidatePath(path);
    } catch (e) {
      console.warn("Failed to revalidate path:", path, e);
    }
  }
}

export async function updateEmployeeAction(
  profileId: string,
  formData: FormData
): Promise<ActionState> {
  const session = await authorize(["super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized. Super Admin access required." };
  }

  const full_name = (formData.get("full_name") as string)?.trim() || "";
  const email = (formData.get("email") as string)?.trim().toLowerCase() || "";
  const phone = (formData.get("phone") as string)?.trim() || null;
  const role = (formData.get("role") as AppRole) || "sales";
  let department = (formData.get("department") as Department) || (role === "hr" ? "HR" : "Sales");
  if (role === "super_admin" && !department) {
    department = "Administration";
  }
  const newPassword = (formData.get("password") as string)?.trim() || "";

  if (!full_name || !email) {
    return { ok: false, message: "Full Name and Work Email are required." };
  }

  if (newPassword && newPassword.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters long." };
  }

  const admin = createAdminClient();

  // 1. Fetch current profile
  const { data: currentProfile, error: fetchErr } = await admin
    .from("profiles")
    .select("id, auth_user_id, employee_id, email, full_name, role, department")
    .eq("id", profileId)
    .single();

  if (fetchErr || !currentProfile) {
    return { ok: false, message: "Employee profile not found." };
  }

  // 2. Check email uniqueness if email changed
  if (email !== currentProfile.email) {
    const { data: dupEmail } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .neq("id", profileId)
      .maybeSingle();

    if (dupEmail) {
      return { ok: false, message: `Email "${email}" is already in use by another user.` };
    }
  }

  // 3. Update Supabase Auth user if needed
  if (currentProfile.auth_user_id) {
    const authUpdates: any = {
      user_metadata: { full_name, employee_id: currentProfile.employee_id },
    };
    if (email !== currentProfile.email) {
      authUpdates.email = email;
      authUpdates.email_confirm = true;
    }
    if (newPassword) {
      authUpdates.password = newPassword;
    }

    const { error: authErr } = await admin.auth.admin.updateUserById(
      currentProfile.auth_user_id,
      authUpdates
    );

    if (authErr) {
      return { ok: false, message: authErr.message || "Failed to update authentication credentials." };
    }
  }

  // 4. Update Profile
  const { error: updateErr } = await admin
    .from("profiles")
    .update({
      full_name,
      email,
      phone,
      role,
      department,
    })
    .eq("id", profileId);

  if (updateErr) {
    return { ok: false, message: updateErr.message || "Failed to update employee profile." };
  }

  // 5. Audit Log
  try {
    await writeAudit(session.profile.id, "employee.update", "profiles", profileId, {
      full_name,
      email,
      role,
      department,
      phone,
      password_updated: !!newPassword,
    });
  } catch (auditErr) {
    console.error("Audit log error:", auditErr);
  }

  revalidateEmployeeViews();

  return {
    ok: true,
    message: `Profile for ${full_name} (${currentProfile.employee_id}) updated successfully.`,
  };
}

export async function toggleEmployeeStatusAction(profileId: string, currentStatus: boolean): Promise<ActionState> {
  const session = await authorize(["super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized. Super Admin access required." };
  }

  if (session.profile.id === profileId) {
    return { ok: false, message: "You cannot deactivate your own Super Admin account." };
  }

  const admin = createAdminClient();
  const nextStatus = !currentStatus;

  const { error } = await admin
    .from("profiles")
    .update({ is_active: nextStatus })
    .eq("id", profileId);

  if (error) {
    return { ok: false, message: error.message };
  }

  // Update Supabase Auth user ban status so deactivated users cannot log in
  const { data: prof } = await admin
    .from("profiles")
    .select("auth_user_id")
    .eq("id", profileId)
    .single();

  if (prof?.auth_user_id) {
    try {
      await admin.auth.admin.updateUserById(prof.auth_user_id, {
        ban_duration: nextStatus ? "none" : "876600h",
      });
    } catch (authErr) {
      console.warn("Could not toggle auth ban status:", authErr);
    }
  }

  await writeAudit(
    session.profile.id,
    nextStatus ? "employee.activate" : "employee.deactivate",
    "profiles",
    profileId
  );

  revalidateEmployeeViews();
  return { ok: true, message: `Account ${nextStatus ? "activated" : "deactivated"} successfully.` };
}

export async function deleteEmployeeAction(profileId: string): Promise<ActionState> {
  const session = await authorize(["super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized. Super Admin access required." };
  }

  if (session.profile.id === profileId) {
    return { ok: false, message: "You cannot delete your own Super Admin account." };
  }

  const admin = createAdminClient();

  // 1. Fetch profile to get auth_user_id, employee_id, full_name, role
  const { data: targetProfile, error: fetchErr } = await admin
    .from("profiles")
    .select("id, auth_user_id, employee_id, full_name, role")
    .eq("id", profileId)
    .single();

  if (fetchErr || !targetProfile) {
    return { ok: false, message: "Employee profile not found." };
  }

  // Protect system if target is the sole active super admin
  if (targetProfile.role === "super_admin") {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin")
      .eq("is_active", true);

    if ((count || 0) <= 1) {
      return { ok: false, message: "Cannot delete the sole active Super Admin." };
    }
  }

  try {
    const superAdminId = session.profile.id;

    // Try calling atomic RPC function first if migration has been executed in database
    const { error: rpcErr } = await admin.rpc("delete_employee_safely", {
      p_target_profile_id: profileId,
      p_reassign_to_profile_id: superAdminId,
    });

    if (rpcErr) {
      // Fallback: Disassociate foreign key dependencies safely via service role
      await admin.from("app_settings").update({ updated_by: null }).eq("updated_by", profileId);
      await admin.from("activity_status_history").update({ changed_by: null }).eq("changed_by", profileId);
      await admin.from("audit_logs").update({ actor_user_id: null }).eq("actor_user_id", profileId);
      await admin.from("attendance_sessions").delete().eq("employee_id", profileId);

      // Reassign clients to current acting Super Admin so records remain preserved
      await admin.from("clients").update({ created_by: superAdminId }).eq("created_by", profileId);
      await admin.from("clients").update({ assigned_to: superAdminId }).eq("assigned_to", profileId);
      await admin.from("clients").update({ archived_by: superAdminId }).eq("archived_by", profileId);

      // Reassign client activities to current acting Super Admin
      await admin.from("client_activities").update({ employee_id: superAdminId }).eq("employee_id", profileId);
      await admin.from("client_activities").update({ updated_by: superAdminId }).eq("updated_by", profileId);

      // 3. Delete from profiles table
      const { error: deleteProfileErr } = await admin
        .from("profiles")
        .delete()
        .eq("id", profileId);

      if (deleteProfileErr) {
        if (
          deleteProfileErr.code === "23503" ||
          deleteProfileErr.message?.includes("foreign key constraint")
        ) {
          return {
            ok: false,
            message:
              "Cannot delete employee: database triggers prevented reassigning client records. Please run the SQL migration in Supabase or deactivate the employee instead.",
          };
        }
        return { ok: false, message: deleteProfileErr.message || "Failed to delete employee profile." };
      }
    }

    // 4. Delete from Supabase Auth
    if (targetProfile.auth_user_id) {
      try {
        await admin.auth.admin.deleteUser(targetProfile.auth_user_id);
      } catch (authDelErr) {
        console.warn("Could not delete auth user:", authDelErr);
      }
    }

    // 5. Audit log
    await writeAudit(session.profile.id, "employee.delete", "profiles", profileId, {
      deleted_employee_id: targetProfile.employee_id,
      deleted_full_name: targetProfile.full_name,
      deleted_role: targetProfile.role,
    });

    revalidateEmployeeViews();

    return {
      ok: true,
      message: `Employee ${targetProfile.full_name} (${targetProfile.employee_id}) was permanently deleted.`,
    };
  } catch (err: any) {
    return { ok: false, message: err?.message || "An error occurred while deleting the employee." };
  }
}
