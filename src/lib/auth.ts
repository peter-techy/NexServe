import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "@/lib/types";

export interface SessionContext {
  userId: string;
  profile: Profile;
}

/**
 * Returns the authenticated user and their trusted profile (read from the
 * database, never from the browser). Cached per request.
 */
export const getSession = cache(async (): Promise<SessionContext | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) return null;
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle<Profile>();
    if (profErr || !profile) return null;
    return { userId: user.id, profile };
  } catch (e) {
    return null;
  }
});

/** Page/layout guard. Direct redirect to clean destinations. */
export async function requireRole(roles: AppRole[]): Promise<SessionContext> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.profile.is_active) redirect("/login?error=inactive");
  if (!roles.includes(session.profile.role)) redirect(homeFor(session.profile.role));
  return session;
}

/** Server-action guard. Returns null instead of redirecting. */
export async function authorize(roles: AppRole[]): Promise<SessionContext | null> {
  const session = await getSession();
  if (!session || !session.profile.is_active) return null;
  if (!roles.includes(session.profile.role)) return null;
  return session;
}

export function homeFor(role: AppRole): string {
  if (role === "super_admin") return "/admin/dashboard";
  if (role === "hr") return "/hr/dashboard";
  return "/sales/dashboard";
}
