import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/audit";
import { STALE_HEARTBEAT_TIMEOUT_MS, reconcileStaleAttendanceSessions } from "@/lib/attendance";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.profile.role !== "sales" && session.profile.role !== "super_admin")) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const nowIso = new Date().toISOString();

    // 1. Fetch current open session for this employee
    const { data: openSession } = await admin
      .from("attendance_sessions")
      .select("id, check_in_at, updated_at")
      .eq("employee_id", session.profile.id)
      .is("check_out_at", null)
      .maybeSingle();

    if (!openSession) {
      return NextResponse.json({ ok: true, active: false });
    }

    // 2. Check if the gap since last activity exceeds the sleep/stale threshold
    const lastActiveMs = new Date(openSession.updated_at || openSession.check_in_at).getTime();
    const gapMs = Date.now() - lastActiveMs;

    if (gapMs > STALE_HEARTBEAT_TIMEOUT_MS) {
      // The device missed heartbeats because it was asleep or disconnected!
      // Check out immediately at the last known heartbeat timestamp before sleep.
      const checkoutTime = openSession.updated_at || openSession.check_in_at;
      await admin
        .from("attendance_sessions")
        .update({ check_out_at: checkoutTime })
        .eq("id", openSession.id);

      try {
        await writeAudit(
          session.profile.id,
          "attendance.check_out",
          "attendance_session",
          openSession.id,
          { reason: "device_sleep_heartbeat_timeout" }
        );
      } catch {}

      return NextResponse.json({
        ok: true,
        active: false,
        checkedOutDueToSleep: true,
        checkOutAt: checkoutTime,
      });
    }

    // 3. Device is actively connected: refresh the updated_at timestamp
    await admin
      .from("attendance_sessions")
      .update({ updated_at: nowIso })
      .eq("id", openSession.id);

    // 4. Also reconcile any other stale sessions across the system
    reconcileStaleAttendanceSessions().catch(() => {});

    return NextResponse.json({ ok: true, active: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
