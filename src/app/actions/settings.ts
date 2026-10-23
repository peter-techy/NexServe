"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { authorize } from "@/lib/auth";
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
  const full_name = (formData.get("full_name") as string)?.trim() || "";
  const email = (formData.get("email") as string)?.trim().toLowerCase() || "";
  const phone = (formData.get("phone") as string)?.trim() || null;
  const subject = (formData.get("subject") as string)?.trim() || "";
  const message = (formData.get("message") as string)?.trim() || "";

  if (!full_name || !email || !subject || !message) {
    return { ok: false, message: "Please complete all required fields." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("contact_inquiries").insert({
    full_name,
    email,
    phone,
    subject,
    message,
    status: "new",
  });

  if (error) {
    return { ok: false, message: "Failed to submit inquiry. Please try again later." };
  }

  return { ok: true, message: "Thank you for reaching out. Our team will review your message shortly." };
}
