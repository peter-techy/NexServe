import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableWrap, Th, Td, Tr } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/feedback";

export default async function AdminAuditPage() {
  await requireRole(["super_admin"]);
  const admin = createAdminClient();

  const { data: logs } = await admin
    .from("audit_logs")
    .select(`
      id,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at,
      actor:profiles (
        full_name,
        employee_id
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Immutable administrative trail of sensitive system actions and attendance corrections"
      />

      <Card>
        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Timestamp</Th>
                <Th>Actor</Th>
                <Th>Action</Th>
                <Th>Entity</Th>
                <Th>Details / Metadata</Th>
              </Tr>
            </thead>
            <tbody>
              {logs && logs.length > 0 ? (
                logs.map((log: any) => (
                  <Tr key={log.id}>
                    <Td className="text-xs font-mono whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </Td>
                    <Td className="text-xs">
                      {log.actor ? `${log.actor.full_name} (${log.actor.employee_id})` : "System / Trigger"}
                    </Td>
                    <Td className="font-mono text-xs font-semibold text-brand-navy">{log.action}</Td>
                    <Td className="text-xs text-ink-muted">
                      {log.entity_type} {log.entity_id && `[${log.entity_id.slice(0, 8)}…]`}
                    </Td>
                    <Td className="text-xs font-mono text-ink-subtle max-w-sm truncate">
                      {JSON.stringify(log.metadata)}
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={5} className="p-0">
                    <EmptyState
                      title="No audit entries"
                      description="Administrative events will be recorded here."
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
