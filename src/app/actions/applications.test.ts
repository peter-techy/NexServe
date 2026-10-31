import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitJobApplicationAction } from "./applications";
import { createJobApplication } from "@/lib/applications";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/applications", () => ({
  createJobApplication: vi.fn().mockResolvedValue({ ok: true, id: "mock-id-123" }),
  updateJobApplication: vi.fn().mockResolvedValue({ ok: true }),
  deleteJobApplication: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  writeAudit: vi.fn(),
}));

function createValidBaseFormData() {
  const formData = new FormData();
  formData.set("full_name", "Priya Sharma");
  formData.set("email", "priya.sharma@example.com");
  formData.set("mobile_number", "+91 98765 43210");
  formData.set("current_city", "Bengaluru");
  formData.set("institution_or_employer", "Delhi University");
  formData.set("educational_qualification", "B.Tech");
  formData.set("relevant_experience", "1 - 2 Years");
  formData.set("skills", "Sales, Negotiation, CRM, Communication");
  formData.set("position_applied", "Sales Executive");
  formData.set("why_join", "I am passionate about corporate sales and client relationship management at NexServe.");
  return formData;
}

function createDummyResumeFile() {
  const content = "Dummy Resume Content for Testing";
  return new File([content], "priya_resume.pdf", { type: "application/pdf" });
}

describe("Candidate Job Application - Mandatory LinkedIn and CV/Resume Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Scenario 1: Neither field provided → Submission blocked", async () => {
    const formData = createValidBaseFormData();
    // No linkedin_url and no resume

    const result = await submitJobApplicationAction({}, formData);

    expect(result.ok).toBe(false);
    expect(result.message).toBe("LinkedIn profile is required.");
    expect(createJobApplication).not.toHaveBeenCalled();
  });

  it("Scenario 2: LinkedIn provided but CV missing → Submission blocked", async () => {
    const formData = createValidBaseFormData();
    formData.set("linkedin_url", "https://www.linkedin.com/in/priyasharma");
    // No resume attached

    const result = await submitJobApplicationAction({}, formData);

    expect(result.ok).toBe(false);
    expect(result.message).toBe("Please upload your CV/Resume.");
    expect(createJobApplication).not.toHaveBeenCalled();
  });

  it("Scenario 3: CV uploaded but LinkedIn missing → Submission blocked", async () => {
    const formData = createValidBaseFormData();
    formData.set("resume", createDummyResumeFile());
    // No linkedin_url

    const result = await submitJobApplicationAction({}, formData);

    expect(result.ok).toBe(false);
    expect(result.message).toBe("LinkedIn profile is required.");
    expect(createJobApplication).not.toHaveBeenCalled();
  });

  it("Scenario 3b: CV uploaded but invalid LinkedIn URL → Submission blocked", async () => {
    const formData = createValidBaseFormData();
    formData.set("linkedin_url", "https://not-linkedin.com/myprofile");
    formData.set("resume", createDummyResumeFile());

    const result = await submitJobApplicationAction({}, formData);

    expect(result.ok).toBe(false);
    expect(result.message).toContain("Please provide a valid LinkedIn profile URL");
    expect(createJobApplication).not.toHaveBeenCalled();
  });

  it("Scenario 4: Both provided correctly → Application can be submitted", async () => {
    const formData = createValidBaseFormData();
    formData.set("linkedin_url", "https://www.linkedin.com/in/priyasharma");
    formData.set("resume", createDummyResumeFile());

    const result = await submitJobApplicationAction({}, formData);

    expect(result.ok).toBe(true);
    expect(result.message).toContain("received");
    expect(createJobApplication).toHaveBeenCalledTimes(1);

    const callArg = vi.mocked(createJobApplication).mock.calls[0][0];
    expect(callArg.linkedin_url).toBe("https://www.linkedin.com/in/priyasharma");
    expect(callArg.resume_name).toBe("priya_resume.pdf");
    expect(callArg.resume_data).toBeTruthy();
    expect(callArg.position_applied).toBe("Sales Executive");
  });
});
