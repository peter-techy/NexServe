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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle<Profile>();
  if (!profile) return null;
  return { userId: user.id, profile };
});

/** Page/layout guard. Redirects when not signed in, inactive or not permitted. */
export async function requireRole(roles: AppRole[]): Promise<SessionContext> {
  const session = await getSession();
  if (!session) redirect("/auth/signout?reason=session");
  if (!session.profile.is_active) redirect("/auth/signout?reason=inactive");
  if (!roles.includes(session.profile.role)) redirect("/dashboard?denied=1");
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
