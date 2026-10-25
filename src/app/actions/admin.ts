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
  const tempPassword = (formData.get("password") as string) || "NexServe@2026";

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

  revalidatePath("/admin/users");
  revalidatePath("/hr/employees");
  return { ok: true, message: `Account for ${full_name} (${employee_id}) created successfully.` };
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

  await writeAudit(session.profile.id, nextStatus ? "employee.activate" : "employee.deactivate", "profiles", profileId);

  revalidatePath("/admin/users");
  revalidatePath("/hr/employees");
  return { ok: true, message: `Account ${nextStatus ? "activated" : "deactivated"} successfully.` };
}
