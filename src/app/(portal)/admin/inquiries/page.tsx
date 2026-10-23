import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableWrap, Th, Td, Tr } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";

export default async function AdminInquiriesPage() {
  await requireRole(["super_admin"]);
  const admin = createAdminClient();

  const { data: inquiries } = await admin
    .from("contact_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Public Contact Inquiries"
        description="Messages received from the About Us public contact form"
      />

      <Card>
        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Date</Th>
                <Th>Sender</Th>
                <Th>Subject</Th>
                <Th>Message</Th>
                <Th>Status</Th>
              </Tr>
            </thead>
            <tbody>
              {inquiries && inquiries.length > 0 ? (
                inquiries.map((inq) => (
                  <Tr key={inq.id}>
                    <Td className="text-xs whitespace-nowrap">
                      {new Date(inq.created_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Td>
                    <Td>
                      <p className="font-semibold text-xs text-ink">{inq.full_name}</p>
                      <p className="text-[11px] text-ink-muted">{inq.email}</p>
                      {inq.phone && <p className="text-[10px] font-mono text-ink-subtle">{inq.phone}</p>}
                    </Td>
                    <Td className="font-medium text-xs text-brand-navy">{inq.subject}</Td>
                    <Td className="text-xs text-ink-muted max-w-md">{inq.message}</Td>
                    <Td>
                      <Badge tone={inq.status === "new" ? "teal" : "neutral"}>
                        {inq.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={5} className="p-0">
                    <EmptyState
                      title="No inquiries received"
                      description="Submissions from the public contact form will appear here."
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
