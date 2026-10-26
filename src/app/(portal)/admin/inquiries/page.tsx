import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Table, TableWrap, Th, Td, Tr } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState, KpiCard } from "@/components/ui/feedback";
import { updateInquiryStatusAction, convertInquiryToClientAction } from "@/app/actions/settings";
import { Mail, CheckCircle2, Clock, UserPlus, Phone, Building, ArrowRight, MessageSquare, AlertCircle } from "lucide-react";

export default async function AdminInquiriesPage() {
  await requireRole(["super_admin", "hr"]);
  const admin = createAdminClient();

  const { data: inquiries } = await admin
    .from("contact_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  const list = inquiries || [];

  const newCount = list.filter((i) => i.status === "new").length;
  const inReviewCount = list.filter((i) => i.status === "in_review").length;
  const resolvedCount = list.filter((i) => i.status === "resolved").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Public Contact & Lead Inquiries"
        description="Review inbound messages from the public website contact form, assign to sales agents, or convert directly into client deals."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Total Inquiries"
          value={list.length}
          hint="From website contact form"
          icon={<Mail className="size-4" />}
        />
        <KpiCard
          label="New Submissions"
          value={newCount}
          hint="Awaiting initial response"
          icon={<Clock className="size-4 text-brand-teal" />}
        />
        <KpiCard
          label="In Review"
          value={inReviewCount}
          hint="Under discussion"
          icon={<MessageSquare className="size-4 text-amber-600" />}
        />
        <KpiCard
          label="Resolved / Converted"
          value={resolvedCount}
          hint="Converted or completed"
          icon={<CheckCircle2 className="size-4 text-emerald-600" />}
        />
      </div>

      <Card>
        <CardHeader
          title="Inbound Messages & Enquiries"
          description="Detailed submissions including client requirements, timeline, and estimated budget"
        />
        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Date</Th>
                <Th>Sender & Contact</Th>
                <Th>Subject & Service</Th>
                <Th>Message & Requirements</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </thead>
            <tbody>
              {list && list.length > 0 ? (
                list.map((inq) => {
                  return (
                    <Tr key={inq.id}>
                      <Td className="text-xs whitespace-nowrap">
                        {new Date(inq.created_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Td>
                      <Td>
                        <p className="font-bold text-xs text-ink">{inq.full_name}</p>
                        <p className="text-[11px] text-ink-muted">{inq.email}</p>
                        {inq.phone && (
                          <p className="text-[10px] font-mono text-ink-subtle flex items-center gap-1 mt-0.5">
                            <Phone className="size-3" /> {inq.phone}
                          </p>
                        )}
                      </Td>
                      <Td>
                        <p className="font-semibold text-xs text-brand-navy">{inq.subject}</p>
                      </Td>
                      <Td className="text-xs text-ink-muted max-w-md">
                        <div className="bg-white/50 backdrop-blur-xs rounded-lg p-2.5 border border-white/60 whitespace-pre-wrap font-sans">
                          {inq.message}
                        </div>
                      </Td>
                      <Td>
                        <Badge
                          tone={
                            inq.status === "new"
                              ? "teal"
                              : inq.status === "in_review"
                              ? "warning"
                              : inq.status === "resolved"
                              ? "success"
                              : "neutral"
                          }
                          className="capitalize text-xs font-semibold"
                        >
                          {inq.status.replace("_", " ")}
                        </Badge>
                      </Td>
                      <Td className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Convert to Sales Client */}
                          {inq.status !== "resolved" && (
                            <form
                              action={async () => {
                                "use server";
                                await convertInquiryToClientAction(inq.id);
                              }}
                            >
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 rounded-md bg-brand-teal px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-brand-teal-700 transition"
                                title="Convert this enquiry into an active Client lead in the Sales pipeline"
                              >
                                <UserPlus className="size-3" /> Convert to Lead
                              </button>
                            </form>
                          )}

                          {inq.status === "new" && (
                            <form
                              action={async () => {
                                "use server";
                                await updateInquiryStatusAction(inq.id, "in_review");
                              }}
                            >
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 rounded-md border border-line-strong bg-white px-2 py-1 text-xs font-medium text-ink hover:bg-canvas transition"
                              >
                                In Review
                              </button>
                            </form>
                          )}

                          {inq.status !== "resolved" && (
                            <form
                              action={async () => {
                                "use server";
                                await updateInquiryStatusAction(inq.id, "resolved");
                              }}
                            >
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition"
                              >
                                <CheckCircle2 className="size-3" /> Mark Resolved
                              </button>
                            </form>
                          )}

                          {inq.status === "resolved" && (
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
                  <Td colSpan={6} className="p-0">
                    <EmptyState
                      title="No inquiries received yet"
                      description="Submissions from the public website contact form will appear here for review and lead conversion."
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
