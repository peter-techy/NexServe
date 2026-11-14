import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { JobApplication, ApplicationStatus } from "@/lib/types";
import fs from "fs";
import path from "path";

const SEED_FALLBACK_FILE = path.join(process.cwd(), ".data", "job_applications.json");
const RUNTIME_FALLBACK_FILE =
  process.env.VERCEL || process.env.NODE_ENV === "production"
    ? path.join("/tmp", "job_applications.json")
    : SEED_FALLBACK_FILE;

function ensureDirectoryExists(filePath: string) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // ignore
  }
}

function readLocalApplications(): JobApplication[] {
  try {
    if (fs.existsSync(RUNTIME_FALLBACK_FILE)) {
      const data = fs.readFileSync(RUNTIME_FALLBACK_FILE, "utf-8");
      return JSON.parse(data);
    }
    if (fs.existsSync(SEED_FALLBACK_FILE)) {
      const data = fs.readFileSync(SEED_FALLBACK_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("[applications] Notice reading local file:", err);
  }
  return [];
}

function writeLocalApplications(apps: JobApplication[]) {
  try {
    ensureDirectoryExists(RUNTIME_FALLBACK_FILE);
    fs.writeFileSync(RUNTIME_FALLBACK_FILE, JSON.stringify(apps, null, 2), "utf-8");
  } catch (err) {
    console.warn("[applications] Notice writing local file:", err);
  }
}

/**
 * Uploads a candidate resume to Supabase Storage.
 */
export async function uploadResumeToStorage(
  file: File,
  applicationId: string
): Promise<{ url: string; name: string } | null> {
  try {
    const admin = createAdminClient();
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `resumes/${applicationId}/${Date.now()}_${cleanName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "application/pdf";

    const { error } = await admin.storage
      .from("nexserve-files")
      .upload(storagePath, buffer, {
        contentType: mime,
        upsert: true,
      });

    if (error) {
      console.warn("[applications] Storage resume upload error:", error.message);
      return null;
    }

    const { data } = admin.storage.from("nexserve-files").getPublicUrl(storagePath);
    return {
      url: data.publicUrl,
      name: file.name,
    };
  } catch (err) {
    console.warn("[applications] Storage upload exception:", err);
    return null;
  }
}

/**
 * Resilient JSON and field extraction for contact_inquiries.message
 */
function parseApplicationMessage(inq: any): Partial<JobApplication> {
  if (!inq.message) {
    return {
      full_name: inq.full_name,
      email: inq.email,
      mobile_number: inq.phone || "",
      position_applied: (inq.subject || "").replace("[Job Application] ", ""),
      status: "new",
    };
  }

  // 1. Try standard JSON parse
  try {
    const parsed = JSON.parse(inq.message);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    // Truncated string, continue to fallback regex extraction
  }

  // 2. Safe regex field extractor for truncated JSON
  const extract = (field: string): string => {
    const regex = new RegExp(`"${field}"\\s*:\\s*"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"`);
    const match = inq.message.match(regex);
    return match ? match[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\") : "";
  };

  return {
    full_name: extract("full_name") || inq.full_name,
    email: extract("email") || inq.email,
    mobile_number: extract("mobile_number") || inq.phone || "",
    current_city: extract("current_city") || "Not specified",
    institution_or_employer: extract("institution_or_employer") || "Not specified",
    educational_qualification: extract("educational_qualification") || "Graduate",
    relevant_experience: extract("relevant_experience") || "Experienced",
    skills: extract("skills") || "General",
    resume_name: extract("resume_name") || null,
    resume_data: extract("resume_data") || null,
    position_applied: extract("position_applied") || (inq.subject || "").replace("[Job Application] ", "").trim() || "Applicant",
    availability: extract("availability") || "Immediate",
    linkedin_url: extract("linkedin_url") || null,
    why_join: extract("why_join") || "Interested in joining NexServe team.",
    status: (extract("status") as ApplicationStatus) || "new",
    hr_notes: extract("hr_notes") || null,
  };
}

/**
 * Fetch all job applications for HR.
 * Uses `job_applications` table, `audit_logs`, `contact_inquiries` and local storage with resilient parsing.
 */
export async function getJobApplications(): Promise<JobApplication[]> {
  const admin = createAdminClient();
  const applicationsMap = new Map<string, JobApplication>();

  // 1. Fetch status updates / audit logs to ensure HR status updates are always preserved
  const statusUpdatesMap = new Map<string, { status?: ApplicationStatus; hr_notes?: string }>();
  try {
    const { data: auditLogs } = await admin
      .from("audit_logs")
      .select("entity_id, metadata, created_at")
      .eq("entity_type", "job_applications")
      .order("created_at", { ascending: true });

    if (auditLogs) {
      for (const log of auditLogs) {
        if (log.entity_id) {
          const meta = (log.metadata as any) || {};
          statusUpdatesMap.set(log.entity_id, {
            status: meta.status,
            hr_notes: meta.hr_notes,
          });
        }
      }
    }
  } catch (err) {
    console.warn("[applications] audit_logs fetch notice:", err);
  }

  // 2. Fetch from contact_inquiries table where subject has [Job Application]
  try {
    const { data: inqs, error: inqError } = await admin
      .from("contact_inquiries")
      .select("*")
      .or("subject.like.[Job Application]%,message.like.%educational_qualification%")
      .order("created_at", { ascending: false });

    if (!inqError && inqs && inqs.length > 0) {
      for (const inq of inqs) {
        const payload = parseApplicationMessage(inq);
        const updates = statusUpdatesMap.get(inq.id) || {};

        const app: JobApplication = {
          id: inq.id,
          full_name: payload.full_name || inq.full_name || "Applicant",
          email: payload.email || inq.email || "",
          mobile_number: payload.mobile_number || inq.phone || "",
          current_city: payload.current_city || "Not specified",
          institution_or_employer: payload.institution_or_employer || "Not specified",
          educational_qualification: payload.educational_qualification || "Graduate",
          relevant_experience: payload.relevant_experience || "Fresher",
          skills: payload.skills || "General",
          resume_name: payload.resume_name || null,
          resume_data: payload.resume_data || null,
          position_applied: payload.position_applied || inq.subject?.replace("[Job Application] ", "") || "Applicant",
          availability: payload.availability || "Immediate",
          linkedin_url: payload.linkedin_url || null,
          why_join: payload.why_join || "Interested in joining NexServe",
          status: updates.status || (payload.status as ApplicationStatus) || "new",
          hr_notes: updates.hr_notes || payload.hr_notes || null,
          created_at: inq.created_at,
          updated_at: inq.updated_at || inq.created_at,
        };

        applicationsMap.set(app.id, app);
      }
    }
  } catch (err) {
    console.warn("[applications] contact_inquiries fetch exception:", err);
  }

  // 3. Check direct job_applications table if available
  try {
    const { data, error } = await admin
      .from("job_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      for (const row of data) {
        const updates = statusUpdatesMap.get(row.id) || {};
        applicationsMap.set(row.id, {
          ...(row as JobApplication),
          status: updates.status || row.status,
          hr_notes: updates.hr_notes || row.hr_notes,
        });
      }
    }
  } catch {
    // ignore
  }

  // 4. Merge any local fallback entries
  const localList = readLocalApplications();
  for (const local of localList) {
    if (!applicationsMap.has(local.id)) {
      const updates = statusUpdatesMap.get(local.id) || {};
      applicationsMap.set(local.id, {
        ...local,
        status: updates.status || local.status,
        hr_notes: updates.hr_notes || local.hr_notes,
      });
    }
  }

  const results = Array.from(applicationsMap.values());
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

/**
 * Get single application by ID
 */
export async function getJobApplicationById(id: string): Promise<JobApplication | null> {
  const all = await getJobApplications();
  return all.find((a) => a.id === id) || null;
}

/**
 * Create a new job application (from public apply form or HR manual entry)
 */
export async function createJobApplication(
  app: Omit<JobApplication, "id" | "created_at" | "updated_at">
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const admin = createAdminClient();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const record: JobApplication = {
    ...app,
    id,
    created_at: now,
    updated_at: now,
  };

  let savedInDb = false;

  // 1. Try direct table insertion
  try {
    const { data, error } = await admin
      .from("job_applications")
      .insert({
        id: record.id,
        full_name: record.full_name,
        email: record.email,
        mobile_number: record.mobile_number,
        current_city: record.current_city,
        institution_or_employer: record.institution_or_employer,
        educational_qualification: record.educational_qualification,
        relevant_experience: record.relevant_experience,
        skills: record.skills,
        resume_name: record.resume_name || null,
        resume_data: record.resume_data || null,
        position_applied: record.position_applied,
        availability: record.availability || "Immediate",
        linkedin_url: record.linkedin_url || null,
        why_join: record.why_join,
        status: record.status,
        hr_notes: record.hr_notes || null,
      })
      .select()
      .single();

    if (!error && data) {
      savedInDb = true;
    }
  } catch {
    // table might not exist
  }

  // 2. Persist in contact_inquiries table with safe serialization
  try {
    // Strip giant base64 from inquiry message if larger than 3000 chars to avoid DB constraint violation
    const safePayload = {
      ...record,
      resume_data:
        record.resume_data && record.resume_data.startsWith("data:") && record.resume_data.length > 2500
          ? "[Resume Stored in Storage / Attachment]"
          : record.resume_data,
    };

    const { error: inqError } = await admin.from("contact_inquiries").insert({
      id: record.id,
      full_name: record.full_name.slice(0, 120),
      email: record.email.slice(0, 200),
      phone: record.mobile_number.slice(0, 30),
      subject: `[Job Application] ${record.position_applied}`.slice(0, 160),
      message: JSON.stringify(safePayload).slice(0, 4800),
      status: "new",
    });

    if (!inqError) {
      savedInDb = true;
    }
  } catch (err) {
    console.warn("[applications] inquiry insert error:", err);
  }

  // 3. Persist in audit_logs for permanent record
  try {
    await admin.from("audit_logs").insert({
      action: "job_application.submitted",
      entity_type: "job_applications",
      entity_id: record.id,
      metadata: record,
    });
  } catch {
    // ignore
  }

  // 4. Save to local fallback storage
  const localList = readLocalApplications();
  localList.unshift(record);
  writeLocalApplications(localList);

  return { ok: true, id };
}

/**
 * Update candidate application status or notes
 */
export async function updateJobApplication(
  id: string,
  updates: { status?: ApplicationStatus; hr_notes?: string }
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  // 1. Update in audit_logs so the state is immediately persisted
  try {
    await admin.from("audit_logs").insert({
      action: "application.status_update",
      entity_type: "job_applications",
      entity_id: id,
      metadata: {
        ...updates,
        updated_at: now,
      },
    });
  } catch {
    // ignore
  }

  // 2. Try direct table update
  try {
    await admin
      .from("job_applications")
      .update({ ...updates, updated_at: now })
      .eq("id", id);
  } catch {
    // ignore
  }

  // 3. Update in contact_inquiries if stored there
  try {
    const { data } = await admin.from("contact_inquiries").select("*").eq("id", id).single();
    if (data && data.message) {
      const payload = parseApplicationMessage(data);
      const updatedPayload = { ...payload, ...updates, updated_at: now };
      await admin
        .from("contact_inquiries")
        .update({
          message: JSON.stringify(updatedPayload).slice(0, 4800),
          updated_at: now,
        })
        .eq("id", id);
    }
  } catch {
    // ignore
  }

  // 4. Update local file
  const localList = readLocalApplications();
  const index = localList.findIndex((a) => a.id === id);
  if (index !== -1) {
    localList[index] = {
      ...localList[index],
      ...updates,
      updated_at: now,
    };
    writeLocalApplications(localList);
  }

  return { ok: true };
}

/**
 * Delete a candidate application
 */
export async function deleteJobApplication(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();

  try {
    await admin.from("job_applications").delete().eq("id", id);
  } catch {
    // ignore
  }

  try {
    await admin.from("contact_inquiries").delete().eq("id", id);
  } catch {
    // ignore
  }

  try {
    await admin
      .from("audit_logs")
      .delete()
      .eq("entity_type", "job_applications")
      .eq("entity_id", id);
  } catch {
    // ignore
  }

  const localList = readLocalApplications().filter((a) => a.id !== id);
  writeLocalApplications(localList);

  return { ok: true };
}
