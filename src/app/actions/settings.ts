"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { authorize, getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import type { ActionState } from "@/lib/types";

export async function updateSettingsAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await authorize(["super_admin"]);
  if (!session) {
    return { ok: false, message: "Unauthorized. Super Admin access required." };
  }

  const company_name = (formData.get("company_name") as string)?.trim() || "NexServe";
  const company_tagline = (formData.get("company_tagline") as string)?.trim() || "";
  const business_timezone = (formData.get("business_timezone") as string)?.trim() || "Asia/Kolkata";
  const contact_email = (formData.get("contact_email") as string)?.trim() || "";
  const contact_phone = (formData.get("contact_phone") as string)?.trim() || "";
  const contact_address = (formData.get("contact_address") as string)?.trim() || "";
  const company_description = (formData.get("company_description") as string)?.trim() || "";
  const mission = (formData.get("mission") as string)?.trim() || "";
  const vision = (formData.get("vision") as string)?.trim() || "";

  const admin = createAdminClient();

  const settingsToUpdate = [
    { key: "company_name", value: company_name },
    { key: "company_tagline", value: company_tagline },
    { key: "business_timezone", value: business_timezone },
    { key: "contact_email", value: contact_email },
    { key: "contact_phone", value: contact_phone },
    { key: "contact_address", value: contact_address },
    { key: "company_description", value: company_description },
    { key: "mission", value: mission },
    { key: "vision", value: vision },
  ];

  for (const s of settingsToUpdate) {
    await admin.from("app_settings").upsert({
      key: s.key,
      value: JSON.stringify(s.value),
      updated_by: session.profile.id,
    });
  }

  await writeAudit(session.profile.id, "settings.update", "app_settings", null);

  revalidatePath("/", "layout");
  return { ok: true, message: "Settings updated successfully." };
}

export async function submitContactFormAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const full_name = ((formData.get("name") || formData.get("full_name")) as string)?.trim() || "";
  const organization = (formData.get("organization") as string)?.trim() || "";
  const email = (formData.get("email") as string)?.trim().toLowerCase() || "";
  const phone = (formData.get("phone") as string)?.trim() || null;
  const service = ((formData.get("service") || formData.get("subject")) as string)?.trim() || "General Enquiry";
  const rawMessage = (formData.get("message") as string)?.trim() || "";
  const timeline = (formData.get("timeline") as string)?.trim() || "";
  const budget = (formData.get("budget") as string)?.trim() || "";
  const consent = formData.get("consent");

  if (!full_name || full_name.length < 2) {
    return { ok: false, message: "Please provide your full name." };
  }
  if (!email || !email.includes("@")) {
    return { ok: false, message: "Please provide a valid email address." };
  }
  if (!service) {
    return { ok: false, message: "Please select the service you are interested in." };
  }
  if (!rawMessage || rawMessage.length < 5) {
    return { ok: false, message: "Please provide a brief description of your project." };
  }
  if (!consent && formData.has("consent")) {
    return { ok: false, message: "Please agree to the enquiry consent." };
  }

  let fullMessage = rawMessage;
  const meta: string[] = [];
  if (organization) meta.push(`Organization: ${organization}`);
  if (timeline) meta.push(`Timeline: ${timeline}`);
  if (budget) meta.push(`Budget: ${budget}`);
  if (meta.length > 0) {
    fullMessage += `\n\n--- Project Details ---\n${meta.join("\n")}`;
  }

  const subject = organization ? `[${organization}] ${service}` : service;

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("contact_inquiries").insert({
      full_name: full_name.slice(0, 120),
      email: email.slice(0, 200),
      phone: phone ? phone.slice(0, 30) : null,
      subject: subject.slice(0, 160),
      message: fullMessage.slice(0, 5000),
      status: "new",
    });

    if (error) {
      console.error("[inquiry] error saving inquiry:", error);
      return { ok: false, message: "Failed to submit enquiry. Please try again." };
    }

    return { ok: true, message: "Thank you! Your enquiry has been sent to NexServe." };
  } catch (err) {
    console.error("[inquiry] unexpected error:", err);
    return { ok: false, message: "Failed to submit enquiry. Please try again." };
  }
}

export async function updateInquiryStatusAction(
  inquiryId: string,
  newStatus: "new" | "in_review" | "resolved" | "spam"
): Promise<ActionState> {
  const session = await getSession();
  if (!session || (session.profile.role !== "super_admin" && session.profile.role !== "hr")) {
    return { ok: false, message: "Unauthorized." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("contact_inquiries")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", inquiryId);

  if (error) {
    return { ok: false, message: error.message || "Failed to update inquiry status." };
  }

  revalidatePath("/admin/inquiries");
  return { ok: true, message: `Inquiry marked as ${newStatus.replace("_", " ")}.` };
}

export async function convertInquiryToClientAction(inquiryId: string): Promise<ActionState> {
  const session = await getSession();
  if (!session || (session.profile.role !== "super_admin" && session.profile.role !== "hr" && session.profile.role !== "sales")) {
    return { ok: false, message: "Unauthorized." };
  }

  const admin = createAdminClient();

  // 1. Fetch inquiry
  const { data: inq, error: fetchErr } = await admin
    .from("contact_inquiries")
    .select("*")
    .eq("id", inquiryId)
    .single();

  if (fetchErr || !inq) {
    return { ok: false, message: "Inquiry not found." };
  }

  // 2. Pick a sales rep to assign (current user if sales, otherwise pick active sales rep)
  let salesRepId = session.profile.id;
  if (session.profile.role !== "sales") {
    const { data: salesUser } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "sales")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (salesUser) {
      salesRepId = salesUser.id;
    }
  }

  // 3. Extract business name from subject or default
  let businessName = inq.full_name + " Business";
  const orgMatch = inq.subject.match(/\[(.*?)\]/);
  if (orgMatch && orgMatch[1]) {
    businessName = orgMatch[1];
  }

  // 4. Create client entry
  const { data: client, error: clientErr } = await admin
    .from("clients")
    .insert({
      person_name: inq.full_name,
      business_name: businessName,
      location: "India / Inbound",
      client_number: inq.phone || null,
      created_by: session.profile.id,
      assigned_to: salesRepId,
    })
    .select("id")
    .single();

  if (clientErr || !client) {
    return { ok: false, message: clientErr?.message || "Failed to convert inquiry to client." };
  }

  // 5. Create initial activity record in sales pipeline
  await admin.from("client_activities").insert({
    client_id: client.id,
    employee_id: salesRepId,
    contact_source: "Website",
    client_review: `Inbound website enquiry: ${inq.subject}. Message: ${inq.message.slice(0, 300)}`,
    work_status: "Followup",
    criteria: ["Digital Marketing"],
    criteria_description: inq.subject,
    follow_up_required: true,
    follow_up_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    follow_up_notes: "Initial outreach for website enquiry.",
  });

  // 6. Mark inquiry as resolved
  await admin
    .from("contact_inquiries")
    .update({ status: "resolved", updated_at: new Date().toISOString() })
    .eq("id", inquiryId);

  revalidatePath("/admin/inquiries");
  revalidatePath("/sales/clients");
  revalidatePath("/sales/follow-ups");
  return { ok: true, message: `Inquiry successfully converted to client '${businessName}' in Sales pipeline!` };
}
