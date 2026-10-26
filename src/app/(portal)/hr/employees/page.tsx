import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Table, TableWrap, Th, Td, Tr } from "@/components/ui/table";
import { RoleBadge, ActiveBadge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/feedback";
import { FileSpreadsheet } from "lucide-react";
import type { AppRole } from "@/lib/types";

interface Props {
  searchParams: Promise<{ q?: string; dept?: string }>;
}

export default async function HREmployeesPage({ searchParams }: Props) {
  await requireRole(["hr", "super_admin"]);
  const params = await searchParams;

  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (params.dept) {
    query = query.eq("department", params.dept);
  }

  if (params.q) {
    const q = params.q.trim();
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,employee_id.ilike.%${q}%`);
  }

  const { data: employees } = await query;

  return (
    <div>
      <PageHeader
        title="Employee Directory"
        description="View corporate employee records, assignments, and roles"
        actions={
          <a
            href="/api/reports/excel"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/70 hover:bg-white/95 text-brand-navy border border-white/75 shadow-xs transition backdrop-blur-md"
            download
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Download Excel (.xlsx)</span>
          </a>
        }
      />

      <Card className="mb-6">
        <CardBody className="p-4">
          <form method="GET" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              name="q"
              placeholder="Search by name, ID or email…"
              defaultValue={params.q || ""}
            />
            <Select name="dept" defaultValue={params.dept || ""}>
              <option value="">All Departments</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="Administration">Administration</option>
            </Select>
            <div className="flex gap-2">
              <button type="submit" className="rounded-md bg-brand-navy px-4 py-2 text-xs font-medium text-white hover:bg-brand-navy-700">
                Search
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
                <Th>Employee ID</Th>
                <Th>Full Name</Th>
                <Th>Department</Th>
                <Th>Role</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Status</Th>
                <Th>Created Date</Th>
              </Tr>
            </thead>
            <tbody>
              {employees && employees.length > 0 ? (
                employees.map((emp) => (
                  <Tr key={emp.id}>
                    <Td className="font-mono text-xs font-semibold text-brand-navy">{emp.employee_id}</Td>
                    <Td className="font-medium text-ink">{emp.full_name}</Td>
                    <Td className="text-ink-muted">{emp.department}</Td>
                    <Td>
                      <RoleBadge role={emp.role as AppRole} />
                    </Td>
                    <Td className="text-xs text-ink-muted">{emp.email}</Td>
                    <Td className="text-xs font-mono">{emp.phone || "—"}</Td>
                    <Td>
                      <ActiveBadge active={emp.is_active} />
                    </Td>
                    <Td className="text-xs text-ink-subtle">
                      {new Date(emp.created_at).toLocaleDateString()}
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={8} className="p-0">
                    <EmptyState
                      title="No employees found"
                      description="No records match your filters."
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
