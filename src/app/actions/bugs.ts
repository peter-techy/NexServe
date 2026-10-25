"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/types";

export interface BugReportInput {
  title: string;
  category: "Error / Exception" | "UI Glitch" | "Data Mismatch" | "Performance" | "Feature Request" | "Other";
  severity: "Low" | "Medium" | "High" | "Critical / Blocker";
  description: string;
  pageUrl?: string;
  userAgent?: string;
  errorStack?: string;
}

export async function reportBugAction(data: BugReportInput): Promise<ActionState> {
  const session = await getSession();
  if (!session) {
    return { ok: false, message: "You must be signed in to submit a bug report." };
  }

  if (!data.title || data.title.trim().length < 3) {
    return { ok: false, message: "Please provide a clear title for the issue." };
  }

  if (!data.description || data.description.trim().length < 5) {
    return { ok: false, message: "Please provide a description of the error or issue." };
  }

  const admin = createAdminClient();

  const metadata = {
    title: data.title.trim(),
    category: data.category || "Error / Exception",
    severity: data.severity || "Medium",
    description: data.description.trim(),
    page_url: data.pageUrl || "",
    user_agent: data.userAgent || "",
    error_stack: data.errorStack || "",
    status: "open", // open, investigating, resolved, closed
    reporter_id: session.profile.id,
    reporter_name: session.profile.full_name,
    reporter_email: session.profile.email,
    reporter_role: session.profile.role,
    reporter_department: session.profile.department,
    created_at: new Date().toISOString(),
  };

  const { error } = await admin.from("audit_logs").insert({
    actor_user_id: session.profile.id,
    action: "employee.bug_report",
    entity_type: "bug_report",
    entity_id: `bug_${Date.now()}`,
    metadata,
  });

  if (error) {
    console.error("Failed to insert bug report:", error);
    return { ok: false, message: error.message || "Failed to submit bug report." };
  }

  revalidatePath("/admin/bugs");
  revalidatePath("/admin/dashboard");
  return { ok: true, message: "Bug report submitted to administration. Thank you!" };
}

export async function updateBugStatusAction(
  logId: number,
  newStatus: "open" | "investigating" | "resolved" | "closed",
  resolutionNote?: string
): Promise<ActionState> {
  const session = await getSession();
  if (!session || session.profile.role !== "super_admin") {
    return { ok: false, message: "Unauthorized. Admin privileges required." };
  }

  const admin = createAdminClient();

  const { data: log, error: fetchErr } = await admin
    .from("audit_logs")
    .select("metadata")
    .eq("id", logId)
    .single();

  if (fetchErr || !log) {
    return { ok: false, message: "Bug record not found." };
  }

  const existingMeta = (log.metadata as Record<string, any>) || {};
  const updatedMeta = {
    ...existingMeta,
    status: newStatus,
    resolution_note: resolutionNote || existingMeta.resolution_note || null,
    resolved_by: session.profile.full_name,
    resolved_at: newStatus === "resolved" ? new Date().toISOString() : existingMeta.resolved_at,
    updated_at: new Date().toISOString(),
  };

  const { error: updateErr } = await admin
    .from("audit_logs")
    .update({ metadata: updatedMeta })
    .eq("id", logId);

  if (updateErr) {
    return { ok: false, message: "Failed to update bug status." };
  }

  revalidatePath("/admin/bugs");
  return { ok: true, message: `Bug status updated to ${newStatus}.` };
}
