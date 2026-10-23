import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const REMEMBER_COOKIE = "ns_remember";

type CookieOptions = Record<string, unknown> & { maxAge?: number; expires?: Date };

/** When "Remember me" is off, auth cookies become browser-session cookies. */
export function applyRememberPreference(options: CookieOptions, remember: string | undefined): CookieOptions {
  if (remember === "0" && options.maxAge !== 0) {
    const rest = { ...options };
    delete rest.maxAge;
    delete rest.expires;
    return rest;
  }
  return options;
}

/** Supabase client bound to the current user's session (RLS enforced). */
export async function createClient() {
  const cookieStore = await cookies();
  const remember = cookieStore.get(REMEMBER_COOKIE)?.value;
  return createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, applyRememberPreference(options as CookieOptions, remember)),
          );
        } catch {
          // Called from a Server Component — middleware refreshes the session instead.
        }
      },
    },
  });
}
