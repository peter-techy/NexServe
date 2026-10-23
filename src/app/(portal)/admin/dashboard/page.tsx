import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSettings, DEFAULT_SETTINGS } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/feedback";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shield, Briefcase, FileText, ArrowRight, UserPlus, Settings } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await requireRole(["super_admin"]);
  let settings = DEFAULT_SETTINGS;
  try {
    settings = await getSettings();
  } catch {
    // fallback
  }

  const supabase = await createClient();

  // Metrics with safe fallbacks
  let totalUsers = 0;
  let salesUsers = 0;
  let hrUsers = 0;
  let totalClients = 0;
  let totalInquiries = 0;

  try {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    totalUsers = count || 0;
  } catch (err) {
    console.error("Admin dashboard total users error:", err);
  }

  try {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("department", "Sales");
    salesUsers = count || 0;
  } catch (err) {
    console.error("Admin dashboard sales users error:", err);
  }

  try {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("department", "HR");
    hrUsers = count || 0;
  } catch (err) {
    console.error("Admin dashboard hr users error:", err);
  }

  try {
    const { count } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .is("archived_at", null);
    totalClients = count || 0;
  } catch (err) {
    console.error("Admin dashboard clients error:", err);
  }

  try {
    const { count } = await supabase
      .from("contact_inquiries")
      .select("*", { count: "exact", head: true });
    totalInquiries = count || 0;
  } catch (err) {
    console.error("Admin dashboard inquiries error:", err);
  }

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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total System Users"
          value={totalUsers}
          hint={`${salesUsers} Sales · ${hrUsers} HR`}
          icon={<Users className="size-4" />}
          href="/admin/users"
        />
        <KpiCard
          label="Total Active Clients"
          value={totalClients}
          hint="Organization-wide"
          icon={<Briefcase className="size-4" />}
          href="/sales/clients"
        />
        <KpiCard
          label="Web Inquiries"
          value={totalInquiries}
          hint="Pending review"
          icon={<FileText className="size-4" />}
          href="/admin/inquiries"
        />
        <KpiCard
          label="Organization Status"
          value="Healthy"
          hint={`${settings.company_name} · Enterprise`}
          icon={<Shield className="size-4" />}
          href="/admin/settings"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Administration Quick Access"
            description="High-privilege system controls and configuration"
          />
          <CardBody className="p-3 space-y-1">
            <Button asChild variant="ghost" className="w-full justify-between text-xs">
              <Link href="/admin/users">
                <span>Manage Users & Roles (Provision / Reset Passwords)</span>
                <ArrowRight className="size-3.5 text-ink-subtle" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-between text-xs">
              <Link href="/admin/settings">
                <span>Configure Portal & Corporate Details</span>
                <ArrowRight className="size-3.5 text-ink-subtle" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-between text-xs">
              <Link href="/admin/inquiries">
                <span>Inbound Inquiries Inbox</span>
                <ArrowRight className="size-3.5 text-ink-subtle" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-between text-xs">
              <Link href="/admin/audit">
                <span>View System Audit Trail Logs</span>
                <ArrowRight className="size-3.5 text-ink-subtle" />
              </Link>
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Department Quick Links"
            description="Direct entry points to departmental workspaces"
          />
          <CardBody className="p-3 space-y-1">
            <Button asChild variant="ghost" className="w-full justify-between text-xs">
              <Link href="/sales/dashboard">
                <span>Sales Department Workspace</span>
                <ArrowRight className="size-3.5 text-ink-subtle" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-between text-xs">
              <Link href="/hr/dashboard">
                <span>Human Resources Workspace</span>
                <ArrowRight className="size-3.5 text-ink-subtle" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-between text-xs">
              <Link href="/hr/reports">
                <span>Generate Workforce & Client Reports</span>
                <ArrowRight className="size-3.5 text-ink-subtle" />
              </Link>
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
