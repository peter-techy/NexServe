import { createAdminClient } from "@/lib/supabase/admin";
import type { AttendanceSession } from "@/lib/types";

// If a device hasn't sent a heartbeat for 90 seconds (heartbeat interval is 20s),
// the device is considered asleep, shut down, or disconnected.
export const STALE_HEARTBEAT_TIMEOUT_MS = 90_000;

/**
 * Automatically reconciles any abandoned / asleep attendance sessions.
 * If employeeId is specified, reconciles only that employee's open sessions.
 * If employeeId is omitted, reconciles all open sessions older than STALE_HEARTBEAT_TIMEOUT_MS.
 */
export async function reconcileStaleAttendanceSessions(employeeId?: string): Promise<number> {
  try {
    const admin = createAdminClient();
    const cutoffTime = new Date(Date.now() - STALE_HEARTBEAT_TIMEOUT_MS).toISOString();

    let query = admin
      .from("attendance_sessions")
      .select("id, employee_id, check_in_at, updated_at")
      .is("check_out_at", null)
      .lt("updated_at", cutoffTime);

    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    const { data: staleSessions, error } = await query;
    if (error || !staleSessions || staleSessions.length === 0) {
      return 0;
    }

    let closedCount = 0;
    for (const stale of staleSessions) {
      // The checkout time is set to the last known heartbeat (updated_at)
      // or check_in_at if updated_at is missing.
      const checkoutTime = stale.updated_at || stale.check_in_at;
      const { error: updateErr } = await admin
        .from("attendance_sessions")
        .update({
          check_out_at: checkoutTime,
        })
        .eq("id", stale.id);

      if (!updateErr) {
        closedCount++;
      }
    }

    return closedCount;
  } catch (err) {
    console.error("Error reconciling stale attendance sessions:", err);
    return 0;
  }
}

/**
 * Gets the current active attendance session for an employee,
 * automatically reconciling any stale session (e.g. from device sleep) first.
 */
export async function getActiveAttendanceSession(
  employeeId: string
): Promise<AttendanceSession | null> {
  try {
    // 1. Close any stale sessions for this employee
    await reconcileStaleAttendanceSessions(employeeId);

    // 2. Fetch the current active session (if still active)
    const admin = createAdminClient();
    const { data } = await admin
      .from("attendance_sessions")
      .select("*")
      .eq("employee_id", employeeId)
      .is("check_out_at", null)
      .maybeSingle<AttendanceSession>();

    return data;
  } catch (err) {
    console.error("Error getting active attendance session:", err);
    return null;
  }
}
