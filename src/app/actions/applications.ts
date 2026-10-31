"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import {
  createJobApplication,
  updateJobApplication,
  deleteJobApplication,
} from "@/lib/applications";
import {
  JOB_POSITIONS,
  type ActionState,
  type ApplicationStatus,
} from "@/lib/types";

export async function submitJobApplicationAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const full_name = (formData.get("full_name") as string)?.trim() || "";
  const email = (formData.get("email") as string)?.trim().toLowerCase() || "";
  const mobile_number = (formData.get("mobile_number") as string)?.trim() || "";
  const current_city = (formData.get("current_city") as string)?.trim() || "";
  const institution_or_employer = (formData.get("institution_or_employer") as string)?.trim() || "";
  const educational_qualification = (formData.get("educational_qualification") as string)?.trim() || "";
  const relevant_experience = (formData.get("relevant_experience") as string)?.trim() || "";
  const skills = (formData.get("skills") as string)?.trim() || "";
  const position_applied = (formData.get("position_applied") as string)?.trim() || "";
  const availability = (formData.get("availability") as string)?.trim() || "";
  const linkedin_url = (formData.get("linkedin_url") as string)?.trim() || "";
  const why_join = (formData.get("why_join") as string)?.trim() || "";

  // Validation
  if (!full_name || full_name.length < 2) {
    return { ok: false, message: "Please provide your full name (minimum 2 characters)." };
  }
  if (!email || !email.includes("@") || !email.includes(".")) {
    return { ok: false, message: "Please provide a valid email address." };
  }
  if (!mobile_number || mobile_number.length < 8) {
    return { ok: false, message: "Please provide a valid mobile / contact number." };
  }
  if (!current_city || current_city.length < 2) {
    return { ok: false, message: "Please provide your current city of residence." };
  }
  if (!institution_or_employer || institution_or_employer.length < 2) {
    return { ok: false, message: "Please specify your college / university or current employer." };
  }
  if (!educational_qualification) {
    return { ok: false, message: "Please specify your educational qualification." };
  }
  if (!relevant_experience) {
    return { ok: false, message: "Please specify your relevant work experience." };
  }
  if (!skills || skills.length < 2) {
    return { ok: false, message: "Please list your core skills and competencies." };
  }
  if (!position_applied) {
    return { ok: false, message: "Please select the position applied for." };
  }
  if (!(JOB_POSITIONS as readonly string[]).includes(position_applied)) {
    return { ok: false, message: "Invalid position selected. Please choose Sales Executive or Others." };
  }
  if (!availability) {
    return { ok: false, message: "Please specify your availability to join." };
  }
  if (!why_join || why_join.length < 10) {
    return { ok: false, message: "Please share why you want to join NexServe (minimum 10 characters)." };
  }

  // Handle Resume File
  const resumeFile = formData.get("resume") as File | null;
  let resume_name = "";
  let resume_data = "";

  if (resumeFile && resumeFile.size > 0) {
    // 10MB limit
    if (resumeFile.size > 10 * 1024 * 1024) {
      return { ok: false, message: "Resume file exceeds maximum allowed size of 10MB." };
    }

    resume_name = resumeFile.name;
    try {
      const buffer = Buffer.from(await resumeFile.arrayBuffer());
      const mime = resumeFile.type || "application/octet-stream";
      resume_data = `data:${mime};base64,${buffer.toString("base64")}`;
    } catch (fileErr) {
      console.error("[application] resume reading error:", fileErr);
    }
  }

  const result = await createJobApplication({
    full_name,
    email,
    mobile_number,
    current_city,
    institution_or_employer,
    educational_qualification,
    relevant_experience,
    skills,
    resume_name: resume_name || null,
    resume_data: resume_data || null,
    position_applied,
    availability,
    linkedin_url: linkedin_url || null,
    why_join,
    status: "new",
    hr_notes: null,
  });

  if (!result.ok) {
    return { ok: false, message: "Unable to submit your application right now. Please try again." };
  }

  revalidatePath("/hr/applications");
  return {
    ok: true,
    message: "Your application has been received! The NexServe HR team will review your profile shortly.",
  };
}

export async function updateApplicationStatusAction(
  applicationId: string,
  newStatus: ApplicationStatus,
  hrNotes?: string
): Promise<ActionState> {
  const session = await getSession();
  if (!session || (session.profile.role !== "hr" && session.profile.role !== "super_admin")) {
    return { ok: false, message: "Unauthorized. HR or Super Admin access required." };
  }

  const res = await updateJobApplication(applicationId, {
    status: newStatus,
    hr_notes: hrNotes,
  });

  if (!res.ok) {
    return { ok: false, message: res.error || "Failed to update candidate status." };
  }

  await writeAudit(
    session.profile.id,
    "application.status_update",
    "job_applications",
    applicationId,
    { status: newStatus }
  );

  revalidatePath("/hr/applications");
  return { ok: true, message: `Candidate status updated to "${newStatus}".` };
}

export async function deleteApplicationAction(applicationId: string): Promise<ActionState> {
  const session = await getSession();
  if (!session || (session.profile.role !== "hr" && session.profile.role !== "super_admin")) {
    return { ok: false, message: "Unauthorized. HR or Super Admin access required." };
  }

  const res = await deleteJobApplication(applicationId);
  if (!res.ok) {
    return { ok: false, message: res.error || "Failed to delete application." };
  }

  await writeAudit(
    session.profile.id,
    "application.delete",
    "job_applications",
    applicationId,
    {}
  );

  revalidatePath("/hr/applications");
  return { ok: true, message: "Application record deleted." };
}
