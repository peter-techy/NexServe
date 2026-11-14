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

export async function getAvailableHrMembers(): Promise<HrMember[]> {
  try {
    const admin = createAdminClient();
    // Strictly fetch active HR department personnel only — exclude admins and other sector employees
    const { data, error } = await admin
      .from("profiles")
      .select("id, full_name, email, role, department, employee_id")
      .eq("is_active", true)
      .eq("role", "hr")
      .eq("department", "HR")
      .order("full_name");

    if (error || !data) return [];

    // Strictly restrict to ONLY Akshat and Sapan (Vir Sapan Pratap Anand). Rest all are admins.
    const list = data
      .filter((p) => {
        if (p.role !== "hr" || p.department !== "HR") return false;
        const name = (p.full_name || "").toLowerCase();
        const email = (p.email || "").toLowerCase();
        return (
          name.includes("akshat") ||
          name.includes("sapan") ||
          email === "hr1.nexserve@gmail.com" ||
          email === "hr2.nexserve@gmail.com"
        );
      })
      .map((p) => ({
        id: p.id,
        fullName: p.full_name,
        email: p.email,
        role: p.role as AppRole,
        department: p.department as Department,
        employeeId: p.employee_id,
      }));

    return list;
  } catch {
    return [];
  }
}
