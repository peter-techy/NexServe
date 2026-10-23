import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { RoleBadge } from "@/components/ui/badge";

export default async function ProfilePage() {
  const session = await requireRole(["sales", "hr", "super_admin"]);
  const p = session.profile;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="My Profile"
        description="Your corporate account information and access credentials"
      />

      <Card>
        <CardHeader
          title="Employee Profile"
          description="Assigned role, department, and contact information"
        />
        <CardBody className="divide-y divide-line text-sm">
          <div className="py-3 flex justify-between">
            <span className="text-ink-muted">Full Name</span>
            <span className="font-semibold text-ink">{p.full_name}</span>
          </div>
          <div className="py-3 flex justify-between">
            <span className="text-ink-muted">Employee ID</span>
            <span className="font-mono text-ink">{p.employee_id}</span>
          </div>
          <div className="py-3 flex justify-between">
            <span className="text-ink-muted">Corporate Email</span>
            <span className="text-ink">{p.email}</span>
          </div>
          <div className="py-3 flex justify-between">
            <span className="text-ink-muted">Department</span>
            <span className="text-ink">{p.department}</span>
          </div>
          <div className="py-3 flex justify-between items-center">
            <span className="text-ink-muted">Assigned Role</span>
            <RoleBadge role={p.role} />
          </div>
          <div className="py-3 flex justify-between">
            <span className="text-ink-muted">Phone</span>
            <span className="font-mono text-ink">{p.phone || "—"}</span>
          </div>
          <div className="py-3 flex justify-between">
            <span className="text-ink-muted">Account Created</span>
            <span className="text-ink-subtle">{new Date(p.created_at).toLocaleDateString()}</span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
