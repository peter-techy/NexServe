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
 * Fetch all job applications for HR.
 * Uses `job_applications` table with resilient fallback.
 */
export async function getJobApplications(): Promise<JobApplication[]> {
  const admin = createAdminClient();

  try {
    const { data, error } = await admin
      .from("job_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data as JobApplication[];
    }

    if (error) {
      console.warn("[applications] Supabase table query notice:", error.message);
    }
  } catch (err) {
    console.warn("[applications] Database query exception:", err);
  }

  // Fallback: check contact_inquiries for job application submissions
  try {
    const { data: inqs, error: inqError } = await admin
      .from("contact_inquiries")
      .select("*")
      .like("subject", "[Job Application]%")
      .order("created_at", { ascending: false });

    if (!inqError && inqs && inqs.length > 0) {
      const parsed: JobApplication[] = [];
      for (const inq of inqs) {
        try {
          const payload = JSON.parse(inq.message);
          parsed.push({
            id: inq.id,
            full_name: inq.full_name,
            email: inq.email,
            mobile_number: inq.phone || payload.mobile_number || "",
            current_city: payload.current_city || "",
            institution_or_employer: payload.institution_or_employer || "",
            educational_qualification: payload.educational_qualification || "",
            relevant_experience: payload.relevant_experience || "",
            skills: payload.skills || "",
            resume_name: payload.resume_name || null,
            resume_data: payload.resume_data || null,
            position_applied: payload.position_applied || inq.subject.replace("[Job Application] ", ""),
            availability: payload.availability || "",
            linkedin_url: payload.linkedin_url || null,
            why_join: payload.why_join || "",
            status: (payload.status as ApplicationStatus) || "new",
            hr_notes: payload.hr_notes || null,
            created_at: inq.created_at,
            updated_at: inq.updated_at,
          });
        } catch {
          // not JSON, skip
        }
      }
      if (parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[applications] Inquiries fallback exception:", err);
  }

  // Local fallback storage
  return readLocalApplications();
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

  // Try direct table insertion
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
        availability: record.availability || "Not specified",
        linkedin_url: record.linkedin_url || null,
        why_join: record.why_join,
        status: record.status,
        hr_notes: record.hr_notes || null,
      })
      .select()
      .single();

    if (!error && data) {
      savedInDb = true;
    } else if (error) {
      console.warn("[applications] direct insert error, using fallback:", error.message);
    }
  } catch (err) {
    console.warn("[applications] direct insert exception:", err);
  }

  // Fallback to contact_inquiries table if job_applications table not ready in cloud
  if (!savedInDb) {
    try {
      const { error: inqError } = await admin.from("contact_inquiries").insert({
        id: record.id,
        full_name: record.full_name.slice(0, 120),
        email: record.email.slice(0, 200),
        phone: record.mobile_number.slice(0, 30),
        subject: `[Job Application] ${record.position_applied}`.slice(0, 160),
        message: JSON.stringify(record).slice(0, 5000),
        status: "new",
      });
      if (!inqError) {
        savedInDb = true;
      }
    } catch (err) {
      console.warn("[applications] inquiry insert error:", err);
    }
  }

  // Always write to local storage as well for resilience
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

  // Try DB
  try {
    await admin
      .from("job_applications")
      .update({ ...updates, updated_at: now })
      .eq("id", id);
  } catch (err) {
    console.warn("[applications] DB update error:", err);
  }

  // Update in contact_inquiries if stored there
  try {
    const { data } = await admin.from("contact_inquiries").select("*").eq("id", id).single();
    if (data && data.message) {
      try {
        const payload = JSON.parse(data.message);
        const updatedPayload = { ...payload, ...updates, updated_at: now };
        await admin
          .from("contact_inquiries")
          .update({
            message: JSON.stringify(updatedPayload).slice(0, 5000),
            updated_at: now,
          })
          .eq("id", id);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  // Update local file
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

  const localList = readLocalApplications().filter((a) => a.id !== id);
  writeLocalApplications(localList);

  return { ok: true };
}
