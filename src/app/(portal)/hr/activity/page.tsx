import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Table, TableWrap, Th, Td, Tr } from "@/components/ui/table";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Select, Input } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/feedback";
import type { WorkStatus } from "@/lib/types";

interface Props {
  searchParams: Promise<{ emp?: string; from?: string; to?: string }>;
}

export default async function HREmployeeActivityPage({ searchParams }: Props) {
  await requireRole(["hr", "super_admin"]);
  const params = await searchParams;

  const supabase = await createClient();

  // Fetch list of sales employees for the filter dropdown
  const { data: salesEmployees } = await supabase
    .from("profiles")
    .select("id, full_name, employee_id")
    .eq("department", "Sales")
    .order("full_name");

  // Query activities
  let query = supabase
    .from("client_activities")
    .select(`
      id,
      contact_date,
      contact_source,
      work_status,
      criteria,
      criteria_description,
      client_review,
      employee:profiles!client_activities_employee_id_fkey (
        id,
        full_name,
        employee_id
      ),
      client:clients (
        person_name,
        business_name,
        location,
        client_number
      )
    `)
    .order("contact_date", { ascending: false });

  if (params.emp) {
    query = query.eq("employee_id", params.emp);
  }

  if (params.from) {
    query = query.gte("contact_date", `${params.from}T00:00:00Z`);
  }
  if (params.to) {
    query = query.lte("contact_date", `${params.to}T23:59:59Z`);
  }

  const { data: activities } = await query;

  return (
    <div>
      <PageHeader
        title="Employee Sales Activity"
        description="Detailed review of client contact logs, criteria, and outcomes"
      />

      <Card className="mb-6">
        <CardBody className="p-4">
          <form method="GET" className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <Select name="emp" defaultValue={params.emp || ""}>
                <option value="">All Sales Employees</option>
                {salesEmployees?.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name} ({e.employee_id})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Input name="from" type="date" defaultValue={params.from || ""} />
            </div>
            <div>
              <Input name="to" type="date" defaultValue={params.to || ""} />
            </div>
            <div>
              <button type="submit" className="w-full rounded-md bg-brand-navy px-4 py-2 text-xs font-medium text-white hover:bg-brand-navy-700">
                Filter Records
              </button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Date</Th>
                <Th>Employee</Th>
                <Th>Client / Business</Th>
                <Th>Location</Th>
                <Th>Contact Source</Th>
                <Th>Status</Th>
                <Th>Criteria</Th>
                <Th>Review / Observations</Th>
              </Tr>
            </thead>
            <tbody>
              {activities && activities.length > 0 ? (
                activities.map((act: any) => (
                  <Tr key={act.id}>
                    <Td className="text-xs whitespace-nowrap">
                      {new Date(act.contact_date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </Td>
                    <Td>
                      <p className="font-semibold text-xs text-ink">{act.employee?.full_name}</p>
                      <p className="text-[10px] font-mono text-ink-subtle">{act.employee?.employee_id}</p>
                    </Td>
                    <Td>
                      <p className="font-semibold text-xs text-brand-navy">{act.client?.business_name}</p>
                      <p className="text-xs text-ink-muted">{act.client?.person_name}</p>
                    </Td>
                    <Td className="text-xs text-ink-muted">{act.client?.location}</Td>
                    <Td className="text-xs">{act.contact_source}</Td>
                    <Td>
                      <StatusBadge status={act.work_status as WorkStatus} />
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {act.criteria?.map((c: string) => (
                          <Badge key={c} tone="neutral" className="text-[10px]">{c}</Badge>
                        ))}
                      </div>
                    </Td>
                    <Td className="text-xs text-ink-muted max-w-xs truncate">
                      {act.client_review}
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={8} className="p-0">
                    <EmptyState
                      title="No activities recorded"
                      description="No records match your selected filter criteria."
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
