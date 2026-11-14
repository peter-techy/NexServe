import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole, Department, Profile } from "@/lib/types";

export interface SessionContext {
  userId: string;
  profile: Profile;
}

const profileMemoryCache = new Map<string, { profile: Profile; expiresAt: number }>();
const PROFILE_CACHE_TTL_MS = 30_000; // 30 seconds cache for profile queries

export function invalidateProfileCache(userId?: string) {
  if (userId) {
    profileMemoryCache.delete(userId);
  } else {
    profileMemoryCache.clear();
  }
}

/**
 * Returns the authenticated user and their trusted profile (read from the
 * database, never from the browser). Cached per request and short TTL.
 */
export const getSession = cache(async (): Promise<SessionContext | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) return null;

    const now = Date.now();
    const cached = profileMemoryCache.get(user.id);
    if (cached && cached.expiresAt > now) {
      return { userId: user.id, profile: cached.profile };
    }

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle<Profile>();
    if (profErr || !profile) return null;

    profileMemoryCache.set(user.id, {
      profile,
      expiresAt: now + PROFILE_CACHE_TTL_MS,
    });

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

export interface HrMember {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
  department: Department;
  employeeId: string;
}

let cachedHrMembers: { list: HrMember[]; expiresAt: number } | null = null;
const HR_MEMBERS_CACHE_TTL_MS = 60_000; // 60s cache

export function invalidateHrMembersCache() {
  cachedHrMembers = null;
}

export async function getAvailableHrMembers(): Promise<HrMember[]> {
  const now = Date.now();
  if (cachedHrMembers && cachedHrMembers.expiresAt > now) {
    return cachedHrMembers.list;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id, full_name, email, role, department, employee_id")
      .eq("is_active", true)
      .or("role.eq.hr,department.eq.HR,role.eq.super_admin")
      .order("full_name");

    if (error || !data) return [];
    const list = data.map((p) => ({
      id: p.id,
      fullName: p.full_name,
      email: p.email,
      role: p.role as AppRole,
      department: p.department as Department,
      employeeId: p.employee_id,
    }));

    cachedHrMembers = {
      list,
      expiresAt: now + HR_MEMBERS_CACHE_TTL_MS,
    };

    return list;
  } catch {
    return [];
  }
}
