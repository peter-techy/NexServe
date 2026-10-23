import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Table, TableWrap, Th, Td, Tr } from "@/components/ui/table";
import { RoleBadge, ActiveBadge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { createEmployeeAction, toggleEmployeeStatusAction } from "@/app/actions/admin";
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
          <Card>
            <CardHeader
              title="Create Employee Account"
              description="Add a new member to HR or Sales"
            />
            <CardBody className="p-4">
              <form action={createEmployeeAction as any} className="space-y-3">
                <Field label="Employee ID" htmlFor="employee_id" required>
                  <Input id="employee_id" name="employee_id" placeholder="e.g. EMP-010" required />
                </Field>

                <Field label="Full Name" htmlFor="full_name" required>
                  <Input id="full_name" name="full_name" placeholder="e.g. Sarah Miller" required />
                </Field>

                <Field label="Work Email" htmlFor="email" required>
                  <Input id="email" name="email" type="email" placeholder="name@nexserve.com" required />
                </Field>

                <Field label="Contact Phone" htmlFor="phone">
                  <Input id="phone" name="phone" placeholder="+91 98765 00000" />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Department" htmlFor="department" required>
                    <Select id="department" name="department" defaultValue="Sales" required>
                      <option value="Sales">Sales</option>
                      <option value="HR">HR</option>
                      <option value="Administration">Administration</option>
                    </Select>
                  </Field>

                  <Field label="Role" htmlFor="role" required>
                    <Select id="role" name="role" defaultValue="sales" required>
                      <option value="sales">Sales</option>
                      <option value="hr">HR</option>
                      <option value="super_admin">Super Admin</option>
                    </Select>
                  </Field>
                </div>

                <Field label="Temporary Password" htmlFor="password" required>
                  <Input id="password" name="password" defaultValue="NexServe@2026" required />
                </Field>

                <div className="pt-2">
                  <SubmitButton className="w-full" pendingText="Provisioning Account…">
                    Provision Account
                  </SubmitButton>
                </div>
              </form>
            </CardBody>
          </Card>
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
