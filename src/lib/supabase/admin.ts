import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

/**
 * Service-role client. SERVER ONLY — bypasses RLS. Use exclusively after an
 * explicit server-side authorization check (e.g. requireRole("super_admin")).
 */
export function createAdminClient() {
  return createSupabaseClient(env.supabaseUrl(), env.serviceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
