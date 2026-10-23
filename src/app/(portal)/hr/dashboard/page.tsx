import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { resolveRange } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard, EmptyState } from "@/components/ui/feedback";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableWrap, Th, Td, Tr } from "@/components/ui/table";
import { formatDuration } from "@/lib/utils";
import { Users, FileSpreadsheet, Clock, CheckCircle2, CalendarClock, ArrowRight } from "lucide-react";

interface Props {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}

export default async function HRDashboardPage({ searchParams }: Props) {
  const session = await requireRole(["hr", "super_admin"]);
  const params = await searchParams;
  const settings = await getSettings();
  const tz = settings.business_timezone;
  const range = resolveRange(params, tz, "month");

  const supabase = await createClient();

  // Metrics from DB RPC across entire company / sales force
  const { data: metricsData } = await supabase.rpc("get_activity_metrics", {
    p_from: range.from,
    p_to: range.to,
  });

  const metrics = metricsData?.[0] || {
    clients_contacted: 0,
    followups_pending: 0,
    deals_won: 0,
    work_seconds: 0,
  };

  // Total active employees count
  const { count: totalEmployees } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Total active Sales employees
  const { count: salesEmployees } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .eq("department", "Sales");

  // Recent attendance sessions across employees
  const { data: recentSessions } = await supabase
    .from("attendance_sessions")
    .select(`
      id,
      check_in_at,
      check_out_at,
      duration_seconds,
      employee:profiles (
        full_name,
        employee_id,
        department
      )
    `)
    .order("check_in_at", { ascending: false })
    .limit(5);

  return (
    <div>
      <PageHeader
        title="Human Resources Dashboard"
        description="Organisation-wide workforce monitoring, employee activity, and reporting"
        actions={
          <Button asChild variant="primary">
            <Link href="/hr/reports">
              <FileSpreadsheet className="size-4 mr-1.5" /> Reports & Excel Export
            </Link>
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Active Employees"
          value={totalEmployees || 0}
          hint={`${salesEmployees || 0} in Sales department`}
          icon={<Users className="size-4" />}
          href="/hr/employees"
        />
        <KpiCard
          label="Clients Contacted (Period)"
          value={metrics.clients_contacted}
          hint="Distinct client contacts"
          icon={<CheckCircle2 className="size-4" />}
          href="/hr/activity"
        />
        <KpiCard
          label="Open Follow-ups"
          value={metrics.followups_pending}
          hint="Organisation-wide pending"
          icon={<CalendarClock className="size-4" />}
          href="/hr/activity"
        />
        <KpiCard
          label="Total Recorded Hours"
          value={formatDuration(metrics.work_seconds)}
          hint="Completed work sessions"
          icon={<Clock className="size-4" />}
          href="/hr/attendance"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activity Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Recent Workforce Attendance"
              description="Real-time employee check-in and session activity"
              actions={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/hr/attendance">View all</Link>
                </Button>
              }
            />
            <TableWrap>
              <Table>
                <thead>
                  <Tr>
                    <Th>Employee</Th>
                    <Th>Department</Th>
                    <Th>Check In</Th>
                    <Th>Check Out</Th>
                    <Th className="text-right">Duration</Th>
                  </Tr>
                </thead>
                <tbody>
                  {recentSessions && recentSessions.length > 0 ? (
                    recentSessions.map((s: any) => (
                      <Tr key={s.id}>
                        <Td>
                          <p className="font-semibold text-xs text-ink">{s.employee?.full_name}</p>
                          <p className="text-[11px] font-mono text-ink-subtle">{s.employee?.employee_id}</p>
                        </Td>
                        <Td className="text-xs text-ink-muted">{s.employee?.department}</Td>
                        <Td className="text-xs font-mono">
                          {new Date(s.check_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Td>
                        <Td className="text-xs font-mono">
                          {s.check_out_at
                            ? new Date(s.check_out_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "Active"}
                        </Td>
                        <Td className="text-right text-xs font-mono font-medium">
                          {s.duration_seconds ? formatDuration(s.duration_seconds) : "In Progress"}
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={5} className="p-0">
                        <EmptyState
                          title="No recent sessions"
                          description="Attendance records will be displayed once staff check in."
                        />
                      </Td>
                    </Tr>
                  )}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        </div>

        {/* Right Column: Quick HR Navigation */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="HR Quick Links" />
            <CardBody className="p-3 space-y-1">
              <Button asChild variant="ghost" className="w-full justify-between text-xs">
                <Link href="/hr/reports">
                  <span>Generate Excel Activity Export</span>
                  <ArrowRight className="size-3.5 text-ink-subtle" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-between text-xs">
                <Link href="/hr/employees">
                  <span>View Employee Directory</span>
                  <ArrowRight className="size-3.5 text-ink-subtle" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-between text-xs">
                <Link href="/hr/activity">
                  <span>Inspect Employee Sales Activities</span>
                  <ArrowRight className="size-3.5 text-ink-subtle" />
                </Link>
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
