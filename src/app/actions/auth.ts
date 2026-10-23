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

  const department = (formData.get("department") as Department) || "";
  const email = (formData.get("email") as string)?.trim().toLowerCase() || "";
  const password = (formData.get("password") as string) || "";
  const remember = formData.get("remember") === "on";

  if (!department || !email || !password) {
    return {
      ok: false,
      message: "Please fill in all required fields.",
      values: { department, email },
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
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return {
      ok: false,
      message: "Invalid email or password.",
      values: { department, email },
    };
  }

  // Verify profile and department permission
  const { data: profile } = await supabase
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

  // Validate department selection
  // Super admin can select either HR or Sales (or Administration).
  // HR can only select HR. Sales can only select Sales.
  if (profile.role !== "super_admin") {
    if (profile.department !== department) {
      await supabase.auth.signOut();
      return {
        ok: false,
        message: `Your account is registered under the ${profile.department} department. You cannot log in as ${department}.`,
        values: { department, email },
      };
    }
  }

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
