"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { authorize } from "@/lib/auth";
import type { ActionState } from "@/lib/types";

export async function checkInAction(): Promise<ActionState> {
  const session = await authorize(["sales", "super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("check_in");

  if (error) {
    if (error.message.includes("ALREADY_CHECKED_IN")) {
      return { ok: false, message: "You already have an active work session." };
    }
    return { ok: false, message: error.message || "Failed to check in." };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Successfully checked in." };
}

export async function checkOutAction(): Promise<ActionState> {
  const session = await authorize(["sales", "super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_out");

  if (error) {
    if (error.message.includes("NOT_CHECKED_IN")) {
      return { ok: false, message: "No active check-in session found." };
    }
    return { ok: false, message: error.message || "Failed to check out." };
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

  const supabase = await createClient();
  const { error } = await supabase.rpc("correct_attendance_session", {
    p_session_id: sessionId,
    p_check_in_at: checkInAt,
    p_check_out_at: checkOutAt || null,
    p_reason: reason.trim(),
  });

  if (error) {
    return { ok: false, message: error.message || "Failed to update attendance session." };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Attendance record corrected and audited." };
}
