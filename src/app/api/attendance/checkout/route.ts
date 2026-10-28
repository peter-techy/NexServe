import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.profile.role !== "sales" && session.profile.role !== "super_admin")) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    let checkOutTime = new Date().toISOString();
    let reason = "manual";

    try {
      const text = await request.text();
      if (text) {
        const body = JSON.parse(text);
        if (body.reason) {
          reason = body.reason;
        }
        if (body.timestamp && !Number.isNaN(new Date(body.timestamp).getTime())) {
          checkOutTime = body.timestamp;
        }
      }
    } catch {
      // fallback to current server timestamp
    }

    const admin = createAdminClient();

    // Find active open session for this employee
    const { data: openSession } = await admin
      .from("attendance_sessions")
      .select("id, check_in_at")
      .eq("employee_id", session.profile.id)
      .is("check_out_at", null)
      .maybeSingle();

    if (!openSession) {
      return NextResponse.json({ ok: true, message: "No active session to checkout" });
    }

    // Ensure checkout timestamp is not before check_in_at and not in the future
    const checkInMs = new Date(openSession.check_in_at).getTime();
    const reqMs = new Date(checkOutTime).getTime();
    const nowMs = Date.now();

    let finalCheckoutTime: string;
    if (reqMs < checkInMs) {
      finalCheckoutTime = openSession.check_in_at;
    } else if (reqMs > nowMs) {
      finalCheckoutTime = new Date(nowMs).toISOString();
    } else {
      finalCheckoutTime = checkOutTime;
    }

    const { error } = await admin
      .from("attendance_sessions")
      .update({
        check_out_at: finalCheckoutTime,
        updated_at: new Date().toISOString(),
      })
      .eq("id", openSession.id);

    if (error) {
      console.error("Checkout route error:", error);
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }

    try {
      await writeAudit(
        session.profile.id,
        "attendance.check_out",
        "attendance_session",
        openSession.id,
        { reason }
      );
    } catch (auditErr) {
      console.error("Audit write checkout failed:", auditErr);
    }

    revalidatePath("/", "layout");

    return NextResponse.json({
      ok: true,
      message: "Checked out successfully",
      checkOutAt: finalCheckoutTime,
    });
  } catch (err: any) {
    console.error("Checkout route error:", err);
    return NextResponse.json({ ok: false, message: err?.message || "Failed" }, { status: 500 });
  }
}
