import Link from "next/link";
import { requireRole, getAvailableHrMembers, type HrMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSettings, DEFAULT_SETTINGS } from "@/lib/settings";
import { resolveRange, formatDate, formatTime } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard, EmptyState } from "@/components/ui/feedback";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableWrap, Th, Td, Tr } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import {
  Users,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  CalendarClock,
  ArrowRight,
  UserCheck,
  Building,
  User,
  Phone,
} from "lucide-react";
import { getJobApplications } from "@/lib/applications";
import { DealHrAssignSelector } from "@/components/deals/deal-hr-assign-selector";

interface Props {
  searchParams?: Promise<{ period?: string; from?: string; to?: string }>;
}

export default async function HRDashboardPage({ searchParams }: Props) {
  const session = await requireRole(["hr", "super_admin"]);
  const params = (await searchParams) || {};
  let settings = DEFAULT_SETTINGS;
  try {
    settings = await getSettings();
  } catch {
    // fallback
  }

  const tz = settings.business_timezone;
  const range = resolveRange(params, tz, "month");

  const supabase = await createClient();

  // Metrics from DB RPC across entire company / sales force
  let metrics = {
    clients_contacted: 0,
    followups_pending: 0,
    deals_won: 0,
    work_seconds: 0,
  };

  try {
    const { data: metricsData } = await supabase.rpc("get_activity_metrics", {
      p_from: range.from,
      p_to: range.to,
    });
    if (metricsData?.[0]) {
      metrics = {
        clients_contacted: Number(metricsData[0].clients_contacted || 0),
        followups_pending: Number(metricsData[0].followups_pending || 0),
        deals_won: Number(metricsData[0].deals_won || 0),
        work_seconds: Number(metricsData[0].work_seconds || 0),
      };
    }
  } catch (err) {
    console.error("HR dashboard metrics error:", err);
  }

  // Total active employees count
  let totalEmployees = 0;
  try {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);
    totalEmployees = count || 0;
  } catch (err) {
    console.error("HR dashboard total employees count error:", err);
  }

  // Total active Sales employees
  let salesEmployees = 0;
  try {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("department", "Sales");
    salesEmployees = count || 0;
  } catch (err) {
    console.error("HR dashboard sales employees count error:", err);
  }

  // Recent attendance sessions across employees
  let recentSessions: any[] = [];
  try {
    const { data } = await supabase
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
    recentSessions = data || [];
  } catch (err) {
    console.error("HR dashboard recent sessions error:", err);
  }

  let applicationsCount = 0;
  let newApplicationsCount = 0;
  try {
    const apps = await getJobApplications();
    applicationsCount = apps.length;
    newApplicationsCount = apps.filter((a) => a.status === "new").length;
  } catch {
    // fallback
  }

  // Forwarded deals from sales & available HR members for assignment
  let availableHrList: HrMember[] = [];
  let forwardedDeals: any[] = [];
  let forwardedDealsCount = 0;
  let pendingDealsCount = 0;

  try {
    const admin = createAdminClient();
    const [hrList, logsRes, countRes] = await Promise.all([
      getAvailableHrMembers(),
      admin
        .from("audit_logs")
        .select(`
          id,
          created_at,
          metadata,
          actor:profiles!audit_logs_actor_user_id_fkey (
            id,
            full_name,
            email,
            employee_id
          )
        `)
        .eq("action", "deal.forwarded_to_hr")
        .order("created_at", { ascending: false })
        .limit(6),
      admin
        .from("audit_logs")
        .select("*", { count: "exact", head: true })
        .eq("action", "deal.forwarded_to_hr"),
    ]);

    availableHrList = hrList;
    forwardedDeals = logsRes.data || [];
    forwardedDealsCount = countRes.count || 0;
    pendingDealsCount = forwardedDeals.filter(
      (d: any) => d.metadata?.status === "pending_hr_review" || !d.metadata?.status
    ).length;
  } catch (err) {
    console.error("HR dashboard forwarded deals error:", err);
  }

  return (
    <div>
      <PageHeader
        title="Human Resources Dashboard"
        description="Organisation-wide workforce monitoring, employee activity, and reporting"
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/hr/deals">
                <Building className="size-4 mr-1 text-emerald-600" />
                Deals Handover {forwardedDealsCount > 0 && `(${forwardedDealsCount})`}
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/hr/applications">
                <UserCheck className="size-4 mr-1 text-[#185fa5]" />
                Job Applications {newApplicationsCount > 0 && `(${newApplicationsCount} new)`}
              </Link>
            </Button>
            <Button asChild variant="accent">
              <Link href="/hr/reports">
                <FileSpreadsheet className="size-4 mr-1" /> Generate Excel Report
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard
          label="Active Workforce"
          value={totalEmployees}
          hint={`${salesEmployees} in Sales`}
          icon={<Users className="size-4" />}
          href="/hr/employees"
        />
        <KpiCard
          label="Deals Forwarded"
          value={forwardedDealsCount}
          hint={pendingDealsCount > 0 ? `${pendingDealsCount} pending review` : "All reviewed"}
          icon={<Building className="size-4" />}
          href="/hr/deals"
        />
        <KpiCard
          label="Total Clients Engaged"
          value={metrics.clients_contacted}
          hint="Across all sales reps"
          icon={<Users className="size-4" />}
          href="/hr/activity"
        />
        <KpiCard
          label="Deals Closed"
          value={metrics.deals_won}
          hint="This month"
          icon={<CheckCircle2 className="size-4" />}
          href="/hr/activity"
        />
        <KpiCard
          label="Total Hours Logged"
          value={formatDuration(metrics.work_seconds)}
          hint="This month"
          icon={<Clock className="size-4" />}
          href="/hr/attendance"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Forwarded Deals Queue & Attendance Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Forwarded Deals from Sales with HR Assignment */}
          <Card>
            <CardHeader
              title="Forwarded Deals from Sales"
              description="Closed sales deals forwarded for HR crediting and onboarding. Choose an HR employee to assign ownership."
              actions={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/hr/deals" className="flex items-center gap-1">
                    <span>Manage all ({forwardedDealsCount})</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              }
            />
            <CardBody className="p-0">
              {forwardedDeals && forwardedDeals.length > 0 ? (
                <TableWrap>
                  <Table>
                    <thead>
                      <Tr>
                        <Th>Date</Th>
                        <Th>Client & Business</Th>
                        <Th>Sales Rep</Th>
                        <Th>Assigned HR Employee</Th>
                        <Th>Status</Th>
                        <Th className="text-right">Action</Th>
                      </Tr>
                    </thead>
                    <tbody>
                      {forwardedDeals.map((item: any) => {
                        const meta = item.metadata || {};
                        const status = meta.status || "pending_hr_review";
                        const assignedName = meta.assigned_hr_name || "General HR Pool";
                        const assignedId = meta.assigned_hr_id;

                        return (
                          <Tr key={item.id}>
                            <Td className="whitespace-nowrap text-xs text-ink-muted">
                              {formatDate(item.created_at, tz)}
                            </Td>
                            <Td>
                              <p className="font-semibold text-xs text-brand-navy">
                                {meta.business_name || "—"}
                              </p>
                              <p className="text-[11px] text-ink-muted flex items-center gap-1 mt-0.5">
                                <User className="size-3" /> {meta.client_name || "Client"}
                              </p>
                            </Td>
                            <Td className="text-xs">
                              <span className="font-medium text-ink">
                                {meta.sales_rep_name || item.actor?.full_name || "Sales Rep"}
                              </span>
                            </Td>
                            <Td>
                              <DealHrAssignSelector
                                logId={item.id}
                                currentAssignedName={assignedName}
                                currentAssignedId={assignedId}
                                availableHrList={availableHrList}
                                compact={true}
                              />
                            </Td>
                            <Td>
                              {status === "pending_hr_review" && (
                                <Badge tone="warning" className="text-[10px]">
                                  Pending Review
                                </Badge>
                              )}
                              {status === "acknowledged" && (
                                <Badge tone="teal" className="text-[10px]">
                                  Acknowledged
                                </Badge>
                              )}
                              {status === "contract_sent" && (
                                <Badge tone="navy" className="text-[10px]">
                                  Contract Sent
                                </Badge>
                              )}
                              {status === "onboarded" && (
                                <Badge tone="success" className="text-[10px]">
                                  Onboarded
                                </Badge>
                              )}
                              {status === "cancelled" && (
                                <Badge tone="danger" className="text-[10px]">
                                  Cancelled
                                </Badge>
                              )}
                            </Td>
                            <Td className="text-right">
                              <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2">
                                <Link href="/hr/deals">
                                  Review <ArrowRight className="size-3 ml-1" />
                                </Link>
                              </Button>
                            </Td>
                          </Tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </TableWrap>
              ) : (
                <EmptyState
                  title="No deals forwarded yet"
                  description="When sales agents close and forward deals to HR, they will appear here with an option to assign an HR employee."
                />
              )}
            </CardBody>
          </Card>

          {/* Workforce Check-ins */}
          <Card>
            <CardHeader
              title="Recent Workforce Check-ins"
              description="Live and recent employee shift activity"
              actions={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/hr/attendance">View all</Link>
                </Button>
              }
            />
            <CardBody className="p-0">
              {recentSessions && recentSessions.length > 0 ? (
                <TableWrap>
                  <Table>
                    <thead>
                      <Tr>
                        <Th>Employee</Th>
                        <Th>Department</Th>
                        <Th>Date</Th>
                        <Th>Check In</Th>
                        <Th>Status</Th>
                      </Tr>
                    </thead>
                    <tbody>
                      {recentSessions.map((s: any) => (
                        <Tr key={s.id}>
                          <Td className="font-medium text-ink">
                            {s.employee?.full_name}
                            <span className="block text-xs font-normal text-ink-subtle">
                              {s.employee?.employee_id}
                            </span>
                          </Td>
                          <Td className="text-xs text-ink-muted">{s.employee?.department}</Td>
                          <Td className="text-xs text-ink-muted">{formatDate(s.check_in_at, tz)}</Td>
                          <Td className="text-xs text-ink-muted">{formatTime(s.check_in_at, tz)}</Td>
                          <Td>
                            {s.check_out_at ? (
                              <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                                Completed ({formatDuration(s.duration_seconds)})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                On Duty
                              </span>
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              ) : (
                <EmptyState
                  title="No shifts recorded"
                  description="Attendance activity will appear here once employees check in."
                />
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column: HR Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="HR Quick Actions" />
            <CardBody className="p-3 space-y-1">
              <Button asChild variant="ghost" className="w-full justify-between text-xs">
                <Link href="/hr/deals">
                  <span className="flex items-center gap-2">
                    <Building className="size-4 text-emerald-600" />
                    <span>Deals Handover & Assignment ({forwardedDealsCount})</span>
                  </span>
                  <ArrowRight className="size-3.5 text-ink-subtle" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-between text-xs">
                <Link href="/hr/applications">
                  <span className="flex items-center gap-2">
                    <UserCheck className="size-4 text-[#185fa5]" />
                    <span>Candidate Applications ({newApplicationsCount} new)</span>
                  </span>
                  <ArrowRight className="size-3.5 text-ink-subtle" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-between text-xs">
                <Link href="/hr/reports">
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="size-4 text-brand-teal" />
                    <span>Download Excel Export</span>
                  </span>
                  <ArrowRight className="size-3.5 text-ink-subtle" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-between text-xs">
                <Link href="/hr/employees">
                  <span className="flex items-center gap-2">
                    <Users className="size-4 text-brand-navy" />
                    <span>Employee Directory</span>
                  </span>
                  <ArrowRight className="size-3.5 text-ink-subtle" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-between text-xs">
                <Link href="/hr/attendance">
                  <span className="flex items-center gap-2">
                    <Clock className="size-4 text-brand-teal" />
                    <span>Attendance Inspection</span>
                  </span>
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
