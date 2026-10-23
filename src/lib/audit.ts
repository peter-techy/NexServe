import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Writes an audit log entry using the service role. Never pass passwords,
 * tokens or unnecessary personal data in `metadata`.
 */
export async function writeAudit(
  actorProfileId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {},
) {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("audit_logs").insert({
      actor_user_id: actorProfileId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
    if (error) console.error("[audit] failed to write audit log", action, error.message);
  } catch (e) {
    console.error("[audit] failed to write audit log", action, e);
  }
}
