import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/feedback";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";
import { Users, Shield, Briefcase, FileText, ArrowRight, UserPlus, Settings } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await requireRole(["super_admin"]);
  const settings = await getSettings();

  const supabase = await createClient();

  // Metrics
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: salesUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("department", "Sales");

  const { count: hrUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("department", "HR");

  const { count: totalClients } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .is("archived_at", null);

  const { count: totalInquiries } = await supabase
    .from("contact_inquiries")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin Overview"
        description="Global system administration, role assignments, audit logs, and settings"
        actions={
          <div className="flex gap-2">
            <Button asChild variant="primary">
              <Link href="/admin/users">
                <UserPlus className="size-4 mr-1.5" /> Manage Employees
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/admin/settings">
                <Settings className="size-4 mr-1.5" /> Portal Settings
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Employees"
          value={totalUsers || 0}
          hint={`${salesUsers || 0} Sales · ${hrUsers || 0} HR`}
          icon={<Users className="size-4" />}
          href="/admin/users"
        />
        <KpiCard
          label="Active Clients"
          value={totalClients || 0}
          hint="Across all sales executives"
          icon={<Briefcase className="size-4" />}
          href="/sales/clients"
        />
        <KpiCard
          label="Inquiries Received"
          value={totalInquiries || 0}
          hint="From public About Us form"
          icon={<FileText className="size-4" />}
          href="/admin/inquiries"
        />
        <KpiCard
          label="Role Mode"
          value="Super Admin"
          hint="Full multi-department privileges"
          icon={<Shield className="size-4" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Department Portals"
            description="Super Admins have direct access to both operational modules"
          />
          <CardBody className="p-4 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-md bg-canvas border border-line">
              <div>
                <p className="font-semibold text-sm text-brand-navy">Sales Portal</p>
                <p className="text-xs text-ink-muted">Manage clients, work sessions, pipeline, follow-ups</p>
              </div>
              <Button asChild size="sm" variant="accent">
                <Link href="/sales/dashboard">Access Sales</Link>
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-canvas border border-line">
              <div>
                <p className="font-semibold text-sm text-brand-navy">Human Resources Portal</p>
                <p className="text-xs text-ink-muted">Review attendance, employee directory, generate Excel reports</p>
              </div>
              <Button asChild size="sm" variant="primary">
                <Link href="/hr/dashboard">Access HR</Link>
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="System Administration"
            description="Configuration, user provisioning, and audit logs"
          />
          <CardBody className="p-4 space-y-2">
            <Button asChild variant="ghost" className="w-full justify-between text-xs">
              <Link href="/admin/users">
                <span>Employee Account Provisioning & Roles</span>
                <ArrowRight className="size-3.5 text-ink-subtle" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-between text-xs">
              <Link href="/admin/settings">
                <span>Configure Company Branding & About Us Content</span>
                <ArrowRight className="size-3.5 text-ink-subtle" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-between text-xs">
              <Link href="/admin/inquiries">
                <span>Review Public Inquiries & Messages</span>
                <ArrowRight className="size-3.5 text-ink-subtle" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-between text-xs">
              <Link href="/admin/audit">
                <span>Audit Logs & Security Trail</span>
                <ArrowRight className="size-3.5 text-ink-subtle" />
              </Link>
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
