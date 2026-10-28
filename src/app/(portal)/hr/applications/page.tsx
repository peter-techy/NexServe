import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { getJobApplications } from "@/lib/applications";
import { ApplicationsClient } from "@/components/hr/applications-client";

export default async function HRApplicationsPage() {
  await requireRole(["hr", "super_admin"]);

  const applications = await getJobApplications();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Recruitment & Job Applications"
        description="Review inbound job applicants across all 13 evaluation criteria, manage hiring pipelines, download resumes, and update recruitment status."
      />

      <ApplicationsClient initialApplications={applications} />
    </div>
  );
}
