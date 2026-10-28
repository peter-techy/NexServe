"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, homeFor } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { REMEMBER_COOKIE } from "@/lib/supabase/server";
import type { ActionState, Department } from "@/lib/types";

export async function loginAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ip = await clientIp();
  const rl = rateLimit(`login:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return {
      ok: false,
      message: `Too many login attempts. Please wait ${rl.retryAfterSec} seconds.`,
    };
  }

  const rawDept = (formData.get("department") as string)?.trim() || "";
  const department: Department =
    rawDept === "Super Admin" || rawDept === "super_admin" || rawDept === "Superadmin"
      ? "Administration"
      : (rawDept as Department);
  const email = (formData.get("email") as string)?.trim().toLowerCase() || "";
  const rawPassword = (formData.get("password") as string) || "";
  const password = rawPassword.trim();
  const remember = formData.get("remember") === "on";

  if (!email || !password) {
    return {
      ok: false,
      message: "Please enter your corporate email and password.",
      values: { department: rawDept || "Sales", email },
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(REMEMBER_COOKIE, remember ? "1" : "0", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: remember ? 60 * 60 * 24 * 30 : undefined,
  });

  const supabase = await createClient();
  let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Fallback: If trimmed password failed, attempt with raw password in case of intentional whitespace
  if (authError && rawPassword !== password) {
    const retry = await supabase.auth.signInWithPassword({
      email,
      password: rawPassword,
    });
    if (!retry.error && retry.data.user) {
      authData = retry.data;
      authError = null;
    }
  }

  if (authError || !authData?.user) {
    return {
      ok: false,
      message: "Invalid corporate email or password. Please check your credentials.",
      values: { department: rawDept, email },
    };
  }

  // Verify profile using admin client to ensure reliable, instantaneous retrieval
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return {
      ok: false,
      message: "No employee profile found for this account. Contact your administrator.",
    };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return {
      ok: false,
      message: "This account has been deactivated. Please contact your administrator.",
    };
  }

  revalidatePath("/", "layout");

  // Route Super Admin based on selected portal tab or default to Admin Workspace
  if (profile.role === "super_admin") {
    if (department === "HR") {
      redirect("/hr/dashboard");
    } else if (department === "Sales") {
      redirect("/sales/dashboard");
    } else {
      redirect("/admin/dashboard");
    }
  }

  // Seamlessly route all employees directly to their department workspace
  redirect(homeFor(profile.role));
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPasswordAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase() || "";
  if (!email) {
    return { ok: false, message: "Please provide your email address." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    message: "Password recovery instructions have been sent to your email address.",
  };
}

export async function resetPasswordAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const password = (formData.get("password") as string) || "";
  const confirmPassword = (formData.get("confirm_password") as string) || "";

  if (!password || password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters long." };
  }
  if (password !== confirmPassword) {
    return { ok: false, message: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Your password has been successfully updated. You may now log in." };
}
