import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Table, TableWrap, Th, Td, Tr } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState, KpiCard } from "@/components/ui/feedback";
import { updateBugStatusAction } from "@/app/actions/bugs";
import { Bug, AlertTriangle, CheckCircle2, Clock, Globe, ShieldAlert, User } from "lucide-react";

export default async function AdminBugsPage() {
  await requireRole(["super_admin"]);
  const admin = createAdminClient();

  const { data: logs } = await admin
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
    .eq("action", "employee.bug_report")
    .order("created_at", { ascending: false });

  const bugs = logs || [];

  const openCount = bugs.filter((b: any) => b.metadata?.status === "open" || !b.metadata?.status).length;
  const criticalCount = bugs.filter((b: any) => b.metadata?.severity?.includes("Critical")).length;
  const resolvedCount = bugs.filter((b: any) => b.metadata?.status === "resolved").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Bug & Issue Reports"
        description="Monitor, investigate, and resolve issues reported directly by sales, HR, and portal staff."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Total Reported Issues"
          value={bugs.length}
          hint="From all portal staff"
          icon={<Bug className="size-4" />}
        />
        <KpiCard
          label="Open Issues"
          value={openCount}
          hint="Awaiting investigation"
          icon={<Clock className="size-4 text-amber-600" />}
        />
        <KpiCard
          label="Critical / Blockers"
          value={criticalCount}
          hint="High priority attention"
          icon={<AlertTriangle className="size-4 text-rose-600" />}
        />
        <KpiCard
          label="Resolved Issues"
          value={resolvedCount}
          hint="Fixed & verified"
          icon={<CheckCircle2 className="size-4 text-emerald-600" />}
        />
      </div>

      <Card>
        <CardHeader
          title="Staff Bug Reports"
          description="Detailed error reports including route URLs, severity, and reproduction steps"
        />
        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Reported At</Th>
                <Th>Reporter</Th>
                <Th>Issue Title & Category</Th>
                <Th>Severity</Th>
                <Th>Description & Location</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </thead>
            <tbody>
              {bugs.length > 0 ? (
                bugs.map((item: any) => {
                  const meta = item.metadata || {};
                  const status = meta.status || "open";
                  const severity = meta.severity || "Medium";
                  return (
                    <Tr key={item.id}>
                      <Td className="whitespace-nowrap text-xs">
                        {new Date(item.created_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Td>
                      <Td>
                        <p className="font-semibold text-xs text-ink">{meta.reporter_name || item.actor?.full_name}</p>
                        <p className="text-[11px] text-ink-muted">{meta.reporter_email || item.actor?.email}</p>
                        <span className="text-[10px] text-brand-teal font-medium capitalize">
                          {meta.reporter_department || meta.reporter_role || "Employee"}
                        </span>
                      </Td>
                      <Td>
                        <p className="font-bold text-xs text-brand-navy">{meta.title}</p>
                        <Badge tone="neutral" className="mt-1 text-[10px]">
                          {meta.category || "General"}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge
                          tone={
                            severity.includes("Critical")
                              ? "danger"
                              : severity === "High"
                              ? "warning"
                              : "neutral"
                          }
                          className="font-bold text-[11px]"
                        >
                          {severity}
                        </Badge>
                      </Td>
                      <Td className="text-xs text-ink-muted max-w-sm">
                        <p className="bg-white/50 backdrop-blur-xs rounded-lg p-2 border border-white/60">
                          {meta.description}
                        </p>
                        {meta.page_url && (
                          <p className="mt-1 text-[10px] text-ink-subtle flex items-center gap-1 truncate font-mono">
                            <Globe className="size-3 shrink-0" /> {meta.page_url}
                          </p>
                        )}
                        {meta.resolution_note && (
                          <p className="mt-1 text-[10px] text-emerald-700 font-medium">
                            Resolution: {meta.resolution_note}
                          </p>
                        )}
                      </Td>
                      <Td>
                        <Badge
                          tone={
                            status === "resolved"
                              ? "success"
                              : status === "investigating"
                              ? "warning"
                              : "danger"
                          }
                          className="capitalize text-xs font-semibold"
                        >
                          {status}
                        </Badge>
                      </Td>
                      <Td className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {status === "open" && (
                            <form
                              action={async () => {
                                "use server";
                                await updateBugStatusAction(item.id, "investigating");
                              }}
                            >
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition"
                              >
                                <Clock className="size-3" /> Investigate
                              </button>
                            </form>
                          )}

                          {status !== "resolved" && (
                            <form
                              action={async () => {
                                "use server";
                                await updateBugStatusAction(item.id, "resolved", "Fixed and verified in production");
                              }}
                            >
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                              >
                                <CheckCircle2 className="size-3" /> Resolve
                              </button>
                            </form>
                          )}

                          {status === "resolved" && (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="size-3.5" /> Resolved
                            </span>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  );
                })
              ) : (
                <Tr>
                  <Td colSpan={7} className="p-0">
                    <EmptyState
                      title="No bugs reported"
                      description="When employees report bugs or glitches via the 'Report Issue' button, they will appear here."
                    />
                  </Td>
                </Tr>
              )}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </div>
  );
}
