import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.profile.role !== "sales" && session.profile.role !== "super_admin")) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const nowIso = new Date().toISOString();

    // 1. Update the employee's active attendance session timestamp
    const { data: openSession } = await admin
      .from("attendance_sessions")
      .select("id, check_in_at, updated_at")
      .eq("employee_id", session.profile.id)
      .is("check_out_at", null)
      .maybeSingle();

    if (openSession) {
      await admin
        .from("attendance_sessions")
        .update({ updated_at: nowIso })
        .eq("id", openSession.id);
    }

    // 2. Auto-close any stale abandoned sessions for this employee older than 15 minutes without heartbeat
    // (e.g. if the laptop died suddenly or lost internet without a graceful unload)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: staleSessions } = await admin
      .from("attendance_sessions")
      .select("id, check_in_at, updated_at")
      .eq("employee_id", session.profile.id)
      .is("check_out_at", null)
      .lt("updated_at", fifteenMinutesAgo);

    if (staleSessions && staleSessions.length > 0) {
      for (const stale of staleSessions) {
        const shutdownTime = stale.updated_at || stale.check_in_at;
        await admin
          .from("attendance_sessions")
          .update({ check_out_at: shutdownTime })
          .eq("id", stale.id);
      }
    }

    return NextResponse.json({ ok: true, active: !!openSession });
  } catch (err: any) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
