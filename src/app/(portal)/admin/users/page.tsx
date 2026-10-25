import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Table, TableWrap, Th, Td, Tr } from "@/components/ui/table";
import { RoleBadge, ActiveBadge } from "@/components/ui/badge";
import { CreateEmployeeForm } from "@/components/admin/create-employee-form";
import { EmployeeRowActions } from "@/components/admin/employee-row-actions";
import { FileSpreadsheet } from "lucide-react";
import type { AppRole } from "@/lib/types";

export default async function AdminUsersPage() {
  const session = await requireRole(["super_admin"]);
  const admin = createAdminClient();

  const { data: users } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee & User Management"
        description="Provision enterprise employee credentials, manage access, deactivate accounts, or delete employees"
        actions={
          <a
            href="/api/reports/excel"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/80 dark:bg-slate-900/80 hover:bg-white text-brand-navy dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 shadow-sm transition backdrop-blur-md"
            download
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export to Excel (.xlsx)</span>
          </a>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Provisioning Form */}
        <div className="lg:col-span-1">
          <CreateEmployeeForm />
        </div>

        {/* Existing Accounts Table */}
        <div className="lg:col-span-2">
          <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-lg">
            <CardHeader
              title="Active Directory"
              description="All configured corporate accounts with live activation controls and removal options"
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
                  {users?.map((u) => {
                    const isCurrentUser = session.profile.id === u.id;
                    const isDeactivated = !u.is_active;

                    return (
                      <Tr
                        key={u.id}
                        className={isDeactivated ? "opacity-75 bg-slate-50/50 dark:bg-slate-900/30" : undefined}
                      >
                        <Td>
                          <div className="flex items-center gap-2">
                            <p
                              className={`font-semibold text-xs ${
                                isDeactivated ? "text-ink-muted line-through" : "text-ink"
                              }`}
                            >
                              {u.full_name}
                            </p>
                            {isCurrentUser && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-navy/10 text-brand-navy font-semibold">
                                You
                              </span>
                            )}
                            {isDeactivated && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger-500/10 text-danger-600 font-semibold border border-danger-500/20">
                                DEACTIVATED
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-ink-subtle">
                            {u.employee_id} · {u.email}
                          </p>
                        </Td>
                        <Td className="text-xs text-ink-muted">{u.department}</Td>
                        <Td>
                          <RoleBadge role={u.role as AppRole} />
                        </Td>
                        <Td>
                          <ActiveBadge active={u.is_active} />
                        </Td>
                        <Td className="text-right">
                          <EmployeeRowActions
                            profileId={u.id}
                            employeeId={u.employee_id}
                            fullName={u.full_name}
                            isActive={u.is_active}
                            isCurrentUser={isCurrentUser}
                          />
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        </div>
      </div>
    </div>
  );
}
