"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authorize, getAvailableHrMembers, type HrMember } from "@/lib/auth";
import {
  uploadProofFile,
  recordProofsInActivity,
  deleteProofFromActivity,
  getProofsForActivity,
  type ProofItem,
  type ProofCategory,
} from "@/lib/proofs";
import type { ActionState, WorkStatus, Criterion, DealOutcome } from "@/lib/types";

export async function getAvailableHrAction(): Promise<HrMember[]> {
  return await getAvailableHrMembers();
}

export async function createClientWithActivityAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await authorize(["sales", "super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized." };
  }

  const person_name = (formData.get("person_name") as string)?.trim() || "";
  const business_name = (formData.get("business_name") as string)?.trim() || "";
  const location = (formData.get("location") as string)?.trim() || "";
  const client_number = (formData.get("client_number") as string)?.trim() || null;

  const contact_source = (formData.get("contact_source") as string)?.trim() || "";
  const contact_source_other = (formData.get("contact_source_other") as string)?.trim() || null;
  const client_review = (formData.get("client_review") as string)?.trim() || "";
  const notes = (formData.get("notes") as string)?.trim() || null;
  const work_status = (formData.get("work_status") as WorkStatus) || "Followup";

  const rawCriteria = formData.getAll("criteria") as Criterion[];
  const criteria = rawCriteria.filter(c => ["Digital Marketing", "Content Creation", "Special Demand"].includes(c));
  const criteria_description = (formData.get("criteria_description") as string)?.trim() || null;
  const special_demand_description = (formData.get("special_demand_description") as string)?.trim() || null;

  const follow_up_required = formData.get("follow_up_required") === "on" || work_status === "Followup";
  const follow_up_date = (formData.get("follow_up_date") as string)?.trim() || "";
  const follow_up_time = (formData.get("follow_up_time") as string)?.trim() || "09:00";
  const follow_up_notes = (formData.get("follow_up_notes") as string)?.trim() || null;

  const deal_outcome = (formData.get("deal_outcome") as DealOutcome) || null;

  // Validation
  const fieldErrors: Record<string, string[]> = {};
  if (!person_name) fieldErrors.person_name = ["Contact person name is required."];
  if (!business_name) fieldErrors.business_name = ["Business name is required."];
  if (!location) fieldErrors.location = ["Location is required."];
  if (!contact_source) fieldErrors.contact_source = ["Source of contact is required."];
  if (contact_source === "Other" && !contact_source_other) {
    fieldErrors.contact_source_other = ["Please specify the contact source."];
  }
  if (!client_review) fieldErrors.client_review = ["Client review / observation is required."];
  if (criteria.length === 0) fieldErrors.criteria = ["Select at least one criterion."];
  if (criteria.includes("Special Demand") && !special_demand_description) {
    fieldErrors.special_demand_description = ["Please describe the special demand."];
  }

  let follow_up_at: string | null = null;
  if (follow_up_required) {
    if (!follow_up_date) {
      fieldErrors.follow_up_date = ["Follow-up date is required when follow-up is scheduled."];
    } else {
      follow_up_at = new Date(`${follow_up_date}T${follow_up_time}:00Z`).toISOString();
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Please correct the errors in the form.",
      fieldErrors,
    };
  }

  const supabase = await createClient();

  // 1. Create or Find existing Client
  let clientId: string | null = null;

  // If client_number is provided, check if client already exists for this user
  if (client_number) {
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("assigned_to", session.profile.id)
      .eq("client_number", client_number)
      .is("archived_at", null)
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;
    }
  }

  if (!clientId) {
    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert({
        person_name,
        business_name,
        location,
        client_number,
        created_by: session.profile.id,
        assigned_to: session.profile.id,
      })
      .select("id")
      .single();

    if (clientError || !newClient) {
      return {
        ok: false,
        message: clientError?.message || "Failed to create client identity.",
      };
    }
    clientId = newClient.id;
  }

  // 2. Insert Client Activity Record
  const { data: newActivity, error: activityError } = await supabase
    .from("client_activities")
    .insert({
      client_id: clientId,
      employee_id: session.profile.id,
      contact_source,
      contact_source_other,
      client_review,
      notes,
      work_status,
      criteria,
      criteria_description,
      special_demand_description,
      follow_up_required,
      follow_up_at,
      follow_up_notes,
      deal_outcome: deal_outcome || (work_status === "Done" ? "won" : null),
    })
    .select("id")
    .single();

  if (activityError || !newActivity) {
    return {
      ok: false,
      message: activityError?.message || "Failed to record client activity.",
    };
  }

  const activityId = newActivity.id;

  // 3. Process any proofs uploaded (Chat Screenshots, Call Recordings)
  const chatPhotoFiles = formData.getAll("chat_photos") as File[];
  const callRecordingFiles = formData.getAll("call_recordings") as File[];
  const uploadedProofs: ProofItem[] = [];

  for (const file of chatPhotoFiles) {
    if (file && file instanceof File && file.size > 0) {
      const p = await uploadProofFile(file, activityId, "chat_photo");
      if (p) uploadedProofs.push(p);
    }
  }

  for (const file of callRecordingFiles) {
    if (file && file instanceof File && file.size > 0) {
      const p = await uploadProofFile(file, activityId, "call_recording");
      if (p) uploadedProofs.push(p);
    }
  }

  if (uploadedProofs.length > 0) {
    await recordProofsInActivity(
      activityId,
      session.profile.id,
      session.profile.full_name,
      uploadedProofs
    );
  }

  revalidatePath("/sales/dashboard");
  revalidatePath("/sales/clients");
  redirect("/sales/clients");
}

export async function updateClientActivityAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await authorize(["sales", "super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized." };
  }

  const activityId = formData.get("activity_id") as string;
  if (!activityId) return { ok: false, message: "Activity ID is missing." };

  const contact_source = (formData.get("contact_source") as string)?.trim() || "";
  const contact_source_other = (formData.get("contact_source_other") as string)?.trim() || null;
  const client_review = (formData.get("client_review") as string)?.trim() || "";
  const notes = (formData.get("notes") as string)?.trim() || null;
  const work_status = (formData.get("work_status") as WorkStatus) || "Followup";

  const rawCriteria = formData.getAll("criteria") as Criterion[];
  const criteria = rawCriteria.filter(c => ["Digital Marketing", "Content Creation", "Special Demand"].includes(c));
  const criteria_description = (formData.get("criteria_description") as string)?.trim() || null;
  const special_demand_description = (formData.get("special_demand_description") as string)?.trim() || null;

  const follow_up_required = formData.get("follow_up_required") === "on" || work_status === "Followup";
  const follow_up_date = (formData.get("follow_up_date") as string)?.trim() || "";
  const follow_up_time = (formData.get("follow_up_time") as string)?.trim() || "09:00";
  const follow_up_notes = (formData.get("follow_up_notes") as string)?.trim() || null;
  const follow_up_completed = formData.get("follow_up_completed") === "on";

  const deal_outcome = (formData.get("deal_outcome") as DealOutcome) || null;

  let follow_up_at: string | null = null;
  if (follow_up_required && follow_up_date) {
    follow_up_at = new Date(`${follow_up_date}T${follow_up_time}:00Z`).toISOString();
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("client_activities")
    .update({
      contact_source,
      contact_source_other,
      client_review,
      notes,
      work_status,
      criteria,
      criteria_description,
      special_demand_description,
      follow_up_required,
      follow_up_at,
      follow_up_notes,
      follow_up_completed_at: follow_up_completed ? new Date().toISOString() : null,
      deal_outcome,
      updated_by: session.profile.id,
    })
    .eq("id", activityId);

  if (error) {
    return { ok: false, message: error.message || "Failed to update record." };
  }

  revalidatePath("/sales/dashboard");
  revalidatePath("/sales/clients");
  return { ok: true, message: "Activity record successfully updated." };
}

export async function archiveClientAction(clientId: string): Promise<ActionState> {
  const session = await authorize(["sales", "super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      archived_at: new Date().toISOString(),
      archived_by: session.profile.id,
    })
    .eq("id", clientId);

  if (error) {
    return { ok: false, message: error.message || "Failed to archive client." };
  }

  revalidatePath("/sales/clients");
  return { ok: true, message: "Client successfully archived." };
}

export async function completeFollowupAction(activityId: string, outcomeStatus: WorkStatus = "Done"): Promise<ActionState> {
  const session = await authorize(["sales", "super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized." };
  }

  if (!activityId) {
    return { ok: false, message: "Activity ID is required." };
  }

  const supabase = await createClient();

  let query = supabase
    .from("client_activities")
    .update({
      follow_up_completed_at: new Date().toISOString(),
      work_status: outcomeStatus,
      deal_outcome: outcomeStatus === "Done" ? "won" : null,
      updated_by: session.profile.id,
    })
    .eq("id", activityId);

  if (session.profile.role === "sales") {
    query = query.eq("employee_id", session.profile.id);
  }

  const { error } = await query;

  if (error) {
    return { ok: false, message: error.message || "Failed to complete follow-up." };
  }

  revalidatePath("/sales/follow-ups");
  revalidatePath("/sales/dashboard");
  revalidatePath("/sales/clients");
  return { ok: true, message: "Follow-up marked as completed." };
}

export async function forwardDealToHrAction(
  activityId: string,
  handoverNotes?: string,
  assignedHrId?: string,
  assignedHrName?: string
): Promise<ActionState> {
  const session = await authorize(["sales", "super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized." };
  }

  if (!activityId) {
    return { ok: false, message: "Activity ID is required." };
  }

  const supabase = await createClient();

  // 1. Fetch current activity with client info
  const { data: activity, error: fetchErr } = await supabase
    .from("client_activities")
    .select(`
      id,
      notes,
      criteria,
      criteria_description,
      client:clients (
        id,
        person_name,
        business_name,
        location,
        client_number
      )
    `)
    .eq("id", activityId)
    .single();

  if (fetchErr || !activity) {
    return { ok: false, message: "Activity record not found." };
  }

  const client = (activity as any).client;
  const existingNotes = activity.notes || "";
  const hrTargetStr = assignedHrName ? `to ${assignedHrName}` : "to HR Department";
  const forwardStamp = `[FORWARDED TO HR (${hrTargetStr}) on ${new Date().toLocaleDateString()}: ${handoverNotes || "Deal Done. Handed over to HR."}]`;
  const updatedNotes = existingNotes ? `${existingNotes}\n\n${forwardStamp}` : forwardStamp;

  // 2. Mark work_status = 'Done', deal_outcome = 'won', and append forward stamp
  const { error: updateErr } = await supabase
    .from("client_activities")
    .update({
      work_status: "Done",
      deal_outcome: "won",
      notes: updatedNotes,
      updated_by: session.profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", activityId);

  if (updateErr) {
    return { ok: false, message: updateErr.message || "Failed to update activity status." };
  }

  // 3. Log formal handover in audit_logs for HR and Super Admin inspection
  const { error: auditErr } = await supabase
    .from("audit_logs")
    .insert({
      actor_user_id: session.profile.id,
      action: "deal.forwarded_to_hr",
      entity_type: "client_activity",
      entity_id: activityId,
      metadata: {
        client_id: client?.id,
        client_name: client?.person_name,
        business_name: client?.business_name,
        contact_number: client?.client_number,
        location: client?.location,
        criteria: activity.criteria,
        criteria_description: activity.criteria_description,
        sales_rep_id: session.profile.id,
        sales_rep_name: session.profile.full_name,
        sales_rep_email: session.profile.email,
        assigned_hr_id: assignedHrId || null,
        assigned_hr_name: assignedHrName || "General HR Pool",
        handover_notes: handoverNotes || "Deal successfully closed. Handed over to HR for contract, onboarding & compliance.",
        status: "pending_hr_review",
        forwarded_at: new Date().toISOString(),
      },
    });

  if (auditErr) {
    console.error("Audit log error for deal handover:", auditErr);
  }

  revalidatePath("/sales/clients");
  revalidatePath("/sales/dashboard");
  revalidatePath("/hr/deals");
  revalidatePath("/hr/dashboard");
  revalidatePath("/hr/activity");
  return {
    ok: true,
    message: assignedHrName
      ? `Deal marked as Done and successfully forwarded to ${assignedHrName} in HR!`
      : "Deal marked as Done and successfully forwarded to HR!",
  };
}

export async function updateDealHandoverStatusAction(
  logId: number,
  status: "acknowledged" | "contract_sent" | "onboarded" | "cancelled",
  hrNote?: string
): Promise<ActionState> {
  const session = await authorize(["hr", "super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized. HR credentials required." };
  }

  const supabase = await createClient();

  const { data: log, error: fetchErr } = await supabase
    .from("audit_logs")
    .select("metadata")
    .eq("id", logId)
    .single();

  if (fetchErr || !log) {
    return { ok: false, message: "Handover record not found." };
  }

  const existingMeta = (log.metadata as Record<string, any>) || {};
  const updatedMeta = {
    ...existingMeta,
    status,
    hr_note: hrNote || existingMeta.hr_note || null,
    hr_handled_by: session.profile.full_name,
    hr_updated_at: new Date().toISOString(),
  };

  const { error: updateErr } = await supabase
    .from("audit_logs")
    .update({ metadata: updatedMeta })
    .eq("id", logId);

  if (updateErr) {
    return { ok: false, message: "Failed to update handover status." };
  }

  revalidatePath("/hr/deals");
  revalidatePath("/hr/dashboard");
  return { ok: true, message: `Deal handover status updated to ${status}.` };
}

export async function assignDealToHrAction(
  logId: number,
  assignedHrId: string,
  assignedHrName: string,
  reassignReason?: string
): Promise<ActionState> {
  const session = await authorize(["hr", "super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized. HR credentials required." };
  }

  const supabase = await createClient();

  const { data: log, error: fetchErr } = await supabase
    .from("audit_logs")
    .select("metadata")
    .eq("id", logId)
    .single();

  if (fetchErr || !log) {
    return { ok: false, message: "Handover record not found." };
  }

  const existingMeta = (log.metadata as Record<string, any>) || {};
  const updatedMeta = {
    ...existingMeta,
    assigned_hr_id: assignedHrId,
    assigned_hr_name: assignedHrName,
    hr_reassigned_by: session.profile.full_name,
    hr_reassigned_at: new Date().toISOString(),
    reassign_reason: reassignReason || existingMeta.reassign_reason || null,
  };

  const { error: updateErr } = await supabase
    .from("audit_logs")
    .update({ metadata: updatedMeta })
    .eq("id", logId);

  if (updateErr) {
    return { ok: false, message: "Failed to update assigned HR." };
  }

  revalidatePath("/hr/deals");
  revalidatePath("/hr/dashboard");
  return { ok: true, message: `Deal successfully assigned to ${assignedHrName}.` };
}

export async function uploadClientProofAction(
  activityId: string,
  formData: FormData
): Promise<ActionState & { proof?: ProofItem }> {
  const session = await authorize(["sales", "hr", "super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized." };
  }

  if (!activityId) {
    return { ok: false, message: "Activity ID is required." };
  }

  const file = formData.get("proof_file") as File;
  const category = (formData.get("category") as ProofCategory) || "other";

  if (!file || file.size === 0) {
    return { ok: false, message: "Please select a valid file to upload." };
  }

  if (file.size > 25 * 1024 * 1024) {
    return { ok: false, message: "File exceeds maximum allowed size of 25MB." };
  }

  const proof = await uploadProofFile(file, activityId, category);
  if (!proof) {
    return { ok: false, message: "Failed to upload file to storage." };
  }

  const saved = await recordProofsInActivity(
    activityId,
    session.profile.id,
    session.profile.full_name,
    [proof]
  );

  if (!saved) {
    return { ok: false, message: "File uploaded but failed to link proof record." };
  }

  revalidatePath(`/sales/clients/${activityId}`);
  revalidatePath("/sales/clients");
  return { ok: true, message: "Proof uploaded successfully.", proof };
}

export async function deleteClientProofAction(
  activityId: string,
  proofId: string
): Promise<ActionState> {
  const session = await authorize(["sales", "hr", "super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized." };
  }

  if (!activityId || !proofId) {
    return { ok: false, message: "Activity ID and Proof ID are required." };
  }

  const success = await deleteProofFromActivity(activityId, session.profile.id, proofId);
  if (!success) {
    return { ok: false, message: "Failed to delete proof." };
  }

  revalidatePath(`/sales/clients/${activityId}`);
  return { ok: true, message: "Proof removed successfully." };
}

export async function getProofsForActivityAction(activityId: string): Promise<ProofItem[]> {
  return await getProofsForActivity(activityId);
}
