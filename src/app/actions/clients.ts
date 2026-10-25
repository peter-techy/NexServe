"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authorize } from "@/lib/auth";
import type { ActionState, WorkStatus, Criterion, DealOutcome } from "@/lib/types";

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
  const { error: activityError } = await supabase
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
    });

  if (activityError) {
    return {
      ok: false,
      message: activityError.message || "Failed to record client activity.",
    };
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
