"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { authorize } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { reconcileStaleAttendanceSessions } from "@/lib/attendance";
import type { ActionState } from "@/lib/types";

export async function checkInAction(): Promise<ActionState> {
  const session = await authorize(["sales", "super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized." };
  }

  // First reconcile any stale sessions from earlier sleep/shutdown
  await reconcileStaleAttendanceSessions(session.profile.id);

  const admin = createAdminClient();

  // Check if user already has an active open session
  const { data: openSession } = await admin
    .from("attendance_sessions")
    .select("id")
    .eq("employee_id", session.profile.id)
    .is("check_out_at", null)
    .maybeSingle();

  if (openSession) {
    return { ok: false, message: "You already have an active work session." };
  }

  const nowIso = new Date().toISOString();
  const { data: newSession, error: insertError } = await admin
    .from("attendance_sessions")
    .insert({
      employee_id: session.profile.id,
      check_in_at: nowIso,
      updated_at: nowIso,
    })
    .select()
    .single();

  if (insertError) {
    if (
      insertError.code === "23P01" ||
      insertError.message?.toLowerCase().includes("attendance_no_overlap") ||
      insertError.message?.toLowerCase().includes("duplicate")
    ) {
      return { ok: false, message: "You already have an active work session." };
    }
    return { ok: false, message: insertError.message || "Failed to check in." };
  }

  try {
    await writeAudit(session.profile.id, "attendance.check_in", "attendance_session", newSession.id);
  } catch (auditErr) {
    console.error("Audit log check-in failed:", auditErr);
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Successfully checked in." };
}

export async function checkOutAction(): Promise<ActionState> {
  const session = await authorize(["sales", "super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized." };
  }

  await reconcileStaleAttendanceSessions(session.profile.id);

  const admin = createAdminClient();

  const { data: openSession } = await admin
    .from("attendance_sessions")
    .select("id, check_in_at")
    .eq("employee_id", session.profile.id)
    .is("check_out_at", null)
    .order("check_in_at", { ascending: false })
    .maybeSingle();

  if (!openSession) {
    return { ok: false, message: "No active check-in session found." };
  }

  const nowIso = new Date().toISOString();
  const finalCheckout =
    new Date(nowIso) >= new Date(openSession.check_in_at) ? nowIso : openSession.check_in_at;

  const { error: updateError } = await admin
    .from("attendance_sessions")
    .update({
      check_out_at: finalCheckout,
      updated_at: nowIso,
    })
    .eq("id", openSession.id);

  if (updateError) {
    return { ok: false, message: updateError.message || "Failed to check out." };
  }

  try {
    await writeAudit(session.profile.id, "attendance.check_out", "attendance_session", openSession.id);
  } catch (auditErr) {
    console.error("Audit log check-out failed:", auditErr);
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Successfully checked out." };
}

export async function correctAttendanceAction(
  sessionId: string,
  checkInAt: string,
  checkOutAt: string | null,
  reason: string
): Promise<ActionState> {
  const session = await authorize(["super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized. Admin privileges required." };
  }

  if (!reason || reason.trim().length < 5) {
    return { ok: false, message: "A detailed reason for the correction is required." };
  }

  const admin = createAdminClient();

  const { data: oldSession } = await admin
    .from("attendance_sessions")
    .select("check_in_at, check_out_at")
    .eq("id", sessionId)
    .single();

  const { error } = await admin
    .from("attendance_sessions")
    .update({
      check_in_at: checkInAt,
      check_out_at: checkOutAt || null,
      corrected: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) {
    return { ok: false, message: error.message || "Failed to update attendance session." };
  }

  try {
    await writeAudit(session.profile.id, "attendance.correct", "attendance_session", sessionId, {
      reason: reason.trim(),
      old_check_in_at: oldSession?.check_in_at,
      old_check_out_at: oldSession?.check_out_at,
      new_check_in_at: checkInAt,
      new_check_out_at: checkOutAt,
    });
  } catch {}

  revalidatePath("/", "layout");
  return { ok: true, message: "Attendance record corrected and audited." };
}
