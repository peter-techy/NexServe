import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Table, TableWrap, Th, Td, Tr } from "@/components/ui/table";
import { RoleBadge, ActiveBadge } from "@/components/ui/badge";
import { CreateEmployeeForm } from "@/components/admin/create-employee-form";
import { toggleEmployeeStatusAction } from "@/app/actions/admin";
import type { AppRole } from "@/lib/types";

export default async function AdminUsersPage() {
  await requireRole(["super_admin"]);
  const admin = createAdminClient();

  const { data: users } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee & User Management"
        description="Provision enterprise employee credentials, assign departments, and manage access"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Provisioning Form */}
        <div className="lg:col-span-1">
          <CreateEmployeeForm />
        </div>

        {/* Existing Accounts Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Active Directory"
              description="All configured corporate accounts and statuses"
            />
            <TableWrap>
              <Table>
                <thead>
                  <Tr>
                    <Th>Employee</Th>
                    <Th>Department</Th>
                    <Th>Role</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Actions</Th>
                  </Tr>
                </thead>
                <tbody>
                  {users?.map((u) => (
                    <Tr key={u.id}>
                      <Td>
                        <p className="font-semibold text-xs text-ink">{u.full_name}</p>
                        <p className="text-[11px] font-mono text-ink-subtle">{u.employee_id} · {u.email}</p>
                      </Td>
                      <Td className="text-xs text-ink-muted">{u.department}</Td>
                      <Td>
                        <RoleBadge role={u.role as AppRole} />
                      </Td>
                      <Td>
                        <ActiveBadge active={u.is_active} />
                      </Td>
                      <Td className="text-right">
                        <form action={async () => {
                          "use server";
                          await toggleEmployeeStatusAction(u.id, u.is_active);
                        }}>
                          <button
                            type="submit"
                            className={`text-xs font-medium px-2 py-1 rounded transition ${
                              u.is_active
                                ? "text-danger hover:bg-danger-50"
                                : "text-brand-teal hover:bg-brand-teal-50"
                            }`}
                          >
                            {u.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </form>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        </div>
      </div>
    </div>
  );
}
