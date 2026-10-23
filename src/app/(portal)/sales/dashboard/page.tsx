import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { resolveRange, todayYmd } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard, EmptyState } from "@/components/ui/feedback";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttendanceWidget } from "@/components/attendance/attendance-widget";
import { formatDuration } from "@/lib/utils";
import { Users, Clock, CheckCircle2, CalendarClock, Plus, ArrowRight } from "lucide-react";
import type { AttendanceSession, WorkStatus } from "@/lib/types";

interface Props {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}

export default async function SalesDashboardPage({ searchParams }: Props) {
  const session = await requireRole(["sales", "super_admin"]);
  const params = await searchParams;
  const settings = await getSettings();
  const tz = settings.business_timezone;
  const range = resolveRange(params, tz, "today");

  const supabase = await createClient();

  // Call database metric RPC (strictly computed on DB side)
  const { data: metricsData } = await supabase.rpc("get_activity_metrics", {
    p_from: range.from,
    p_to: range.to,
    p_employee: session.profile.role === "sales" ? session.profile.id : null,
  });

  const metrics = metricsData?.[0] || {
    clients_contacted: 0,
    followups_pending: 0,
    deals_won: 0,
    work_seconds: 0,
  };

  // Fetch recent client activities for this sales employee
  let activityQuery = supabase
    .from("client_activities")
    .select(`
      id,
      contact_date,
      contact_source,
      work_status,
      criteria,
      follow_up_required,
      follow_up_at,
      client:clients (
        id,
        person_name,
        business_name,
        location,
        client_number
      )
    `)
    .order("contact_date", { ascending: false })
    .limit(5);

  if (session.profile.role === "sales") {
    activityQuery = activityQuery.eq("employee_id", session.profile.id);
  }

  const { data: recentActivities } = await activityQuery;

  // Fetch upcoming/pending follow-ups
  let followupQuery = supabase
    .from("client_activities")
    .select(`
      id,
      follow_up_at,
      follow_up_notes,
      work_status,
      client:clients (
        id,
        person_name,
        business_name,
        client_number
      )
    `)
    .eq("follow_up_required", true)
    .is("follow_up_completed_at", null)
    .neq("work_status", "Cancelled")
    .order("follow_up_at", { ascending: true })
    .limit(5);

  if (session.profile.role === "sales") {
    followupQuery = followupQuery.eq("employee_id", session.profile.id);
  }

  const { data: pendingFollowups } = await followupQuery;

  // Fetch active attendance session
  const { data: activeSession } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("employee_id", session.profile.id)
    .is("check_out_at", null)
    .maybeSingle<AttendanceSession>();

  return (
    <div>
      <PageHeader
        title="Sales Dashboard"
        description={`Performance & activity overview for ${session.profile.full_name}`}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="accent">
              <Link href="/sales/clients/new">
                <Plus className="size-4 mr-1" /> Add Client Activity
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Clients Contacted"
          value={metrics.clients_contacted}
          hint="Distinct clients contacted"
          icon={<Users className="size-4" />}
          href="/sales/clients"
        />
        <KpiCard
          label="Follow-ups Pending"
          value={metrics.followups_pending}
          hint="Action required"
          icon={<CalendarClock className="size-4" />}
          href="/sales/follow-ups"
        />
        <KpiCard
          label="Deals Won"
          value={metrics.deals_won}
          hint="Successfully closed"
          icon={<CheckCircle2 className="size-4" />}
          href="/sales/clients?status=Done"
        />
        <KpiCard
          label="Work Duration"
          value={formatDuration(metrics.work_seconds)}
          hint="Completed work sessions"
          icon={<Clock className="size-4" />}
          href="/sales/attendance"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activities & Pending Follow-ups */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Recent Client Activity"
              description="Latest logged interactions and updates"
              actions={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/sales/clients">View all</Link>
                </Button>
              }
            />
            <CardBody className="p-0">
              {recentActivities && recentActivities.length > 0 ? (
                <div className="divide-y divide-line">
                  {recentActivities.map((act: any) => (
                    <div key={act.id} className="p-4 flex items-center justify-between hover:bg-canvas/50 transition">
                      <div className="min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-ink truncate">
                            {act.client?.business_name || "Unknown Business"}
                          </p>
                          <StatusBadge status={act.work_status as WorkStatus} />
                        </div>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {act.client?.person_name} · {act.contact_source}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-ink-subtle">
                          {new Date(act.contact_date).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No activity recorded"
                  description="Start logging your client interactions to view metrics here."
                  action={
                    <Button asChild size="sm" variant="accent">
                      <Link href="/sales/clients/new">Add First Record</Link>
                    </Button>
                  }
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Upcoming Follow-ups"
              description="Scheduled actions requiring your attention"
              actions={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/sales/follow-ups">View all</Link>
                </Button>
              }
            />
            <CardBody className="p-0">
              {pendingFollowups && pendingFollowups.length > 0 ? (
                <div className="divide-y divide-line">
                  {pendingFollowups.map((f: any) => (
                    <div key={f.id} className="p-4 flex items-center justify-between hover:bg-canvas/50 transition">
                      <div className="min-w-0 pr-4">
                        <p className="font-semibold text-sm text-ink truncate">
                          {f.client?.business_name}
                        </p>
                        <p className="text-xs text-ink-muted mt-0.5">
                          Contact: {f.client?.person_name} {f.client?.client_number && `(${f.client.client_number})`}
                        </p>
                        {f.follow_up_notes && (
                          <p className="text-xs text-ink-subtle italic mt-1 bg-canvas p-1.5 rounded">
                            "{f.follow_up_notes}"
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-medium text-brand-teal">
                          {f.follow_up_at
                            ? new Date(f.follow_up_at).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Scheduled"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No pending follow-ups"
                  description="You are caught up on all scheduled client follow-ups."
                />
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Attendance & Quick Actions */}
        <div className="space-y-6">
          <AttendanceWidget
            openSession={activeSession}
            timezone={tz}
          />

          <Card>
            <CardHeader title="Quick Links" />
            <CardBody className="p-3 space-y-1">
              <Button asChild variant="ghost" className="w-full justify-between text-xs">
                <Link href="/sales/clients/new">
                  <span>Log New Client</span>
                  <ArrowRight className="size-3.5 text-ink-subtle" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-between text-xs">
                <Link href="/sales/clients">
                  <span>Manage Client Directory</span>
                  <ArrowRight className="size-3.5 text-ink-subtle" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-between text-xs">
                <Link href="/sales/attendance">
                  <span>My Attendance Records</span>
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
