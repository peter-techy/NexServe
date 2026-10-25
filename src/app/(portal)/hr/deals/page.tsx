import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Table, TableWrap, Th, Td, Tr } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState, KpiCard } from "@/components/ui/feedback";
import { updateDealHandoverStatusAction } from "@/app/actions/clients";
import { CheckCircle2, Clock, FileCheck, Send, Building, User, Phone, MapPin } from "lucide-react";

export default async function HrDealsHandoverPage() {
  await requireRole(["hr", "super_admin"]);
  const admin = createAdminClient();

  // Query all deals forwarded to HR from audit logs
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
    .eq("action", "deal.forwarded_to_hr")
    .order("created_at", { ascending: false });

  const handovers = logs || [];

  const pendingCount = handovers.filter((h: any) => h.metadata?.status === "pending_hr_review" || !h.metadata?.status).length;
  const acknowledgedCount = handovers.filter((h: any) => h.metadata?.status === "acknowledged" || h.metadata?.status === "contract_sent").length;
  const onboardedCount = handovers.filter((h: any) => h.metadata?.status === "onboarded").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals Handover from Sales"
        description="Review, acknowledge, and process completed deals forwarded by the sales team for employee crediting and client onboarding."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total Deals Forwarded"
          value={handovers.length}
          hint="From all sales representatives"
          icon={<Building className="size-4" />}
        />
        <KpiCard
          label="Pending HR Review"
          value={pendingCount}
          hint="Awaiting initial HR acknowledgement"
          icon={<Clock className="size-4" />}
        />
        <KpiCard
          label="Onboarded & Processed"
          value={onboardedCount}
          hint="Contract signed and client onboarded"
          icon={<FileCheck className="size-4" />}
        />
      </div>

      {/* Deals Handover Table */}
      <Card>
        <CardHeader
          title="Forwarded Deals Queue"
          description="Detailed client activities and handover notes from closing sales agents"
        />
        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Date Forwarded</Th>
                <Th>Client & Business</Th>
                <Th>Sales Representative</Th>
                <Th>Criteria / Services</Th>
                <Th>Handover Notes</Th>
                <Th>HR Status</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </thead>
            <tbody>
              {handovers.length > 0 ? (
                handovers.map((item: any) => {
                  const meta = item.metadata || {};
                  const status = meta.status || "pending_hr_review";
                  return (
                    <Tr key={item.id}>
                      <Td className="whitespace-nowrap text-xs">
                        {new Date(item.created_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Td>
                      <Td>
                        <p className="font-bold text-xs text-brand-navy">{meta.business_name || "—"}</p>
                        <p className="text-[11px] text-ink-muted flex items-center gap-1 mt-0.5">
                          <User className="size-3" /> {meta.client_name || "Contact Person"}
                        </p>
                        {meta.contact_number && (
                          <p className="text-[10px] font-mono text-ink-subtle flex items-center gap-1 mt-0.5">
                            <Phone className="size-3" /> {meta.contact_number}
                          </p>
                        )}
                        {meta.location && (
                          <p className="text-[10px] text-ink-subtle flex items-center gap-1">
                            <MapPin className="size-3" /> {meta.location}
                          </p>
                        )}
                      </Td>
                      <Td>
                        <p className="font-semibold text-xs text-ink">{meta.sales_rep_name || item.actor?.full_name}</p>
                        <p className="text-[11px] text-ink-muted">{meta.sales_rep_email || item.actor?.email}</p>
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {Array.isArray(meta.criteria) && meta.criteria.length > 0 ? (
                            meta.criteria.map((c: string) => (
                              <Badge key={c} tone="teal" className="text-[10px]">
                                {c}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-ink-subtle">—</span>
                          )}
                        </div>
                        {meta.criteria_description && (
                          <p className="mt-1 text-[11px] text-ink-muted line-clamp-2">
                            {meta.criteria_description}
                          </p>
                        )}
                      </Td>
                      <Td className="text-xs text-ink-muted max-w-xs">
                        <p className="bg-canvas/60 rounded-lg p-2 border border-line/60 italic">
                          "{meta.handover_notes || "Deal marked as Done and forwarded."}"
                        </p>
                        {meta.hr_note && (
                          <p className="mt-1.5 text-[10px] text-brand-teal-700 font-medium">
                            HR Note: {meta.hr_note}
                          </p>
                        )}
                      </Td>
                      <Td>
                        <Badge
                          tone={
                            status === "onboarded"
                              ? "teal"
                              : status === "contract_sent" || status === "acknowledged"
                              ? "neutral"
                              : "warning"
                          }
                          className="capitalize text-xs font-semibold"
                        >
                          {status.replace(/_/g, " ")}
                        </Badge>
                      </Td>
                      <Td className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {status === "pending_hr_review" && (
                            <form
                              action={async () => {
                                "use server";
                                await updateDealHandoverStatusAction(item.id, "acknowledged");
                              }}
                            >
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 rounded-md bg-brand-navy px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-brand-navy-700 transition"
                              >
                                <CheckCircle2 className="size-3" /> Acknowledge
                              </button>
                            </form>
                          )}

                          {status === "acknowledged" && (
                            <form
                              action={async () => {
                                "use server";
                                await updateDealHandoverStatusAction(item.id, "contract_sent");
                              }}
                            >
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 rounded-md bg-brand-teal px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-brand-teal-700 transition"
                              >
                                <Send className="size-3" /> Contract Sent
                              </button>
                            </form>
                          )}

                          {status === "contract_sent" && (
                            <form
                              action={async () => {
                                "use server";
                                await updateDealHandoverStatusAction(item.id, "onboarded");
                              }}
                            >
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                              >
                                <FileCheck className="size-3" /> Complete Onboarding
                              </button>
                            </form>
                          )}

                          {status === "onboarded" && (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="size-3.5" /> Completed
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
                      title="No forwarded deals yet"
                      description="When sales agents close deals and click 'Forward to HR', they will appear here for HR onboarding."
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
