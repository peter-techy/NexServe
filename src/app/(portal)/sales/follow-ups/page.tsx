import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableWrap, Th, Td, Tr } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { CompleteFollowupButton } from "@/components/followups/complete-followup-button";
import { Eye } from "lucide-react";
import type { WorkStatus } from "@/lib/types";

export default async function SalesFollowupsPage() {
  const session = await requireRole(["sales", "super_admin"]);
  const supabase = await createClient();

  let query = supabase
    .from("client_activities")
    .select(`
      id,
      follow_up_at,
      follow_up_notes,
      work_status,
      contact_source,
      client:clients!inner (
        id,
        person_name,
        business_name,
        location,
        client_number
      )
    `)
    .eq("follow_up_required", true)
    .is("follow_up_completed_at", null)
    .neq("work_status", "Cancelled")
    .order("follow_up_at", { ascending: true });

  if (session.profile.role === "sales") {
    query = query.eq("employee_id", session.profile.id);
  }

  const { data: followups } = await query;

  return (
    <div>
      <PageHeader
        title="Pending Follow-ups"
        description="All open actions, next steps, and client follow-ups"
      />

      <Card>
        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Due Date</Th>
                <Th>Business Name</Th>
                <Th>Contact Person</Th>
                <Th>Client Number</Th>
                <Th>Work Status</Th>
                <Th>Follow-up Objective</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </thead>
            <tbody>
              {followups && followups.length > 0 ? (
                followups.map((f: any) => {
                  const isOverdue = f.follow_up_at && new Date(f.follow_up_at).getTime() < Date.now();
                  return (
                    <Tr key={f.id} className={isOverdue ? "bg-danger-50/40" : ""}>
                      <Td className="font-semibold text-xs whitespace-nowrap">
                        <span className={isOverdue ? "text-danger" : "text-brand-teal"}>
                          {f.follow_up_at
                            ? new Date(f.follow_up_at).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Scheduled"}
                          {isOverdue && " (Overdue)"}
                        </span>
                      </Td>
                      <Td className="font-semibold text-brand-navy">{f.client?.business_name}</Td>
                      <Td>{f.client?.person_name}</Td>
                      <Td className="font-mono text-xs">{f.client?.client_number || "—"}</Td>
                      <Td>
                        <StatusBadge status={f.work_status as WorkStatus} />
                      </Td>
                      <Td className="max-w-md text-xs text-ink-muted">
                        {f.follow_up_notes || "—"}
                      </Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <CompleteFollowupButton
                            activityId={f.id}
                            clientName={f.client?.business_name}
                            outcomeStatus="Done"
                          />
                          <Button asChild variant="ghost" size="sm" className="text-xs">
                            <Link href={`/sales/clients/${f.id}`}>
                              <Eye className="size-3.5 mr-1" /> View Details
                            </Link>
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  );
                })
              ) : (
                <Tr>
                  <Td colSpan={7} className="p-0">
                    <EmptyState
                      title="No pending follow-ups"
                      description="All scheduled follow-ups have been addressed."
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
