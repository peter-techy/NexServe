"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { authorize } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import type { ActionState, AppRole, Department } from "@/lib/types";

export async function createEmployeeAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await authorize(["super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized. Super Admin access required." };
  }

  const employee_id = (formData.get("employee_id") as string)?.trim().toUpperCase() || "";
  const full_name = (formData.get("full_name") as string)?.trim() || "";
  const email = (formData.get("email") as string)?.trim().toLowerCase() || "";
  const phone = (formData.get("phone") as string)?.trim() || null;
  const role = (formData.get("role") as AppRole) || "sales";
  const department = (formData.get("department") as Department) || (role === "hr" ? "HR" : "Sales");
  const tempPassword = (formData.get("password") as string) || "NexServe@2026";

  if (!employee_id || !full_name || !email) {
    return { ok: false, message: "Employee ID, Full Name, and Email are required." };
  }

  const admin = createAdminClient();

  // 1. Create Supabase Auth User
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name, employee_id },
  });

  if (authError || !authUser.user) {
    return { ok: false, message: authError?.message || "Failed to create authentication user." };
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
    // Rollback user creation
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { ok: false, message: profileError.message || "Failed to create employee profile." };
  }

  await writeAudit(session.profile.id, "employee.create", "profiles", newProfile.id, {
    employee_id,
    role,
    department,
  });

  revalidatePath("/admin/users");
  revalidatePath("/hr/employees");
  return { ok: true, message: `Account for ${full_name} created successfully.` };
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
