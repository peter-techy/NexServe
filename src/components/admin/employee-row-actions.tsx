"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserX, UserCheck, Pencil, Loader2, Save } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, ConfirmDialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  toggleEmployeeStatusAction,
  deleteEmployeeAction,
  updateEmployeeAction,
} from "@/app/actions/admin";
import { toast } from "sonner";
import type { AppRole, Department } from "@/lib/types";

interface EmployeeRowActionsProps {
  profileId: string;
  employeeId: string;
  fullName: string;
  email?: string;
  phone?: string | null;
  department?: string;
  role?: string;
  isActive: boolean;
  isCurrentUser: boolean;
}

export function EmployeeRowActions({
  profileId,
  employeeId,
  fullName,
  email = "",
  phone = "",
  department: initialDept = "Sales",
  role: initialRole = "sales",
  isActive,
  isCurrentUser,
}: EmployeeRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deactivateOpen, setDeactivateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);

  // Edit form state
  const [editRole, setEditRole] = React.useState<AppRole>(
    (initialRole as AppRole) || "sales"
  );
  const [editDept, setEditDept] = React.useState<Department>(
    (initialDept as Department) || "Sales"
  );

  React.useEffect(() => {
    setEditRole((initialRole as AppRole) || "sales");
    setEditDept((initialDept as Department) || "Sales");
  }, [initialRole, initialDept, editOpen]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRole = e.target.value as AppRole;
    setEditRole(nextRole);
    if (nextRole === "hr") {
      setEditDept("HR");
    } else if (nextRole === "sales") {
      setEditDept("Sales");
    } else if (nextRole === "super_admin") {
      setEditDept("Administration");
    }
  };

  if (isCurrentUser) {
    return (
      <span className="text-[11px] font-medium text-ink-subtle italic px-2 py-1">
        Current Account
      </span>
    );
  }

  const handleToggleStatus = async () => {
    startTransition(async () => {
      try {
        const res = await toggleEmployeeStatusAction(profileId, isActive);
        if (res.ok) {
          toast.success(res.message || "Status updated.");
          router.refresh();
        } else {
          toast.error(res.message || "Failed to update status.");
        }
      } catch {
        toast.error("Failed to update employee status.");
      }
    });
  };

  const handleDelete = async () => {
    try {
      const res = await deleteEmployeeAction(profileId);
      if (res.ok) {
        toast.success(res.message || "Employee deleted successfully.");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to delete employee.");
      }
    } catch {
      toast.error("An unexpected error occurred while deleting.");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await updateEmployeeAction(profileId, formData);
        if (res.ok) {
          toast.success(res.message || "Employee details updated.");
          setEditOpen(false);
          router.refresh();
        } else {
          toast.error(res.message || "Failed to update employee.");
        }
      } catch (err: any) {
        toast.error(err?.message || "An unexpected error occurred while updating.");
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      {/* Edit Employee Button & Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            disabled={isPending}
            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition text-brand-navy hover:text-brand-navy-700 bg-brand-navy/5 hover:bg-brand-navy/15 dark:text-blue-300 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 disabled:opacity-50"
            title="Edit employee details"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="sr-only sm:not-sr-only">Edit</span>
          </button>
        </DialogTrigger>
        <DialogContent
          title={`Edit Employee: ${fullName}`}
          description={`Update credentials, role, department, or contact information for ${employeeId}.`}
        >
          <form onSubmit={handleUpdate} className="space-y-3.5 pt-1">
            <Field label="Employee ID" htmlFor={`edit_emp_id_${profileId}`}>
              <Input
                id={`edit_emp_id_${profileId}`}
                value={employeeId}
                disabled
                className="bg-slate-100/70 dark:bg-slate-800/50 cursor-not-allowed font-mono text-ink-muted"
              />
            </Field>

            <Field label="Full Name" htmlFor={`edit_fn_${profileId}`} required>
              <Input
                id={`edit_fn_${profileId}`}
                name="full_name"
                defaultValue={fullName}
                required
                disabled={isPending}
              />
            </Field>

            <Field label="Work Email" htmlFor={`edit_email_${profileId}`} required>
              <Input
                id={`edit_email_${profileId}`}
                name="email"
                type="email"
                defaultValue={email}
                required
                disabled={isPending}
              />
            </Field>

            <Field label="Contact Phone" htmlFor={`edit_phone_${profileId}`}>
              <Input
                id={`edit_phone_${profileId}`}
                name="phone"
                defaultValue={phone || ""}
                placeholder="+91 98765 00000"
                disabled={isPending}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Role" htmlFor={`edit_role_${profileId}`} required>
                <Select
                  id={`edit_role_${profileId}`}
                  name="role"
                  value={editRole}
                  onChange={handleRoleChange}
                  required
                  disabled={isPending}
                >
                  <option value="sales">Sales</option>
                  <option value="hr">HR</option>
                  <option value="super_admin">Super Admin</option>
                </Select>
              </Field>

              <Field label="Department" htmlFor={`edit_dept_${profileId}`} required>
                <Select
                  id={`edit_dept_${profileId}`}
                  name="department"
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value as Department)}
                  required
                  disabled={isPending}
                >
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                  <option value="Administration">Administration</option>
                </Select>
              </Field>
            </div>

            <Field
              label="Reset Password"
              htmlFor={`edit_pw_${profileId}`}
              hint="Leave empty to keep existing password"
            >
              <Input
                id={`edit_pw_${profileId}`}
                name="password"
                type="password"
                placeholder="New password (min 6 characters)"
                disabled={isPending}
              />
            </Field>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/60">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="flex items-center gap-1.5">
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes…</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate / Activate Button */}
      {isActive ? (
        <ConfirmDialog
          open={deactivateOpen}
          onOpenChange={setDeactivateOpen}
          trigger={
            <button
              type="button"
              disabled={isPending}
              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition text-amber-700 bg-amber-50 hover:bg-amber-100 dark:text-amber-300 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 disabled:opacity-50"
              title="Deactivate employee access"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserX className="w-3.5 h-3.5" />
              )}
              <span>Deactivate</span>
            </button>
          }
          title={`Deactivate ${fullName}?`}
          description={
            <p>
              Are you sure you want to deactivate <strong>{fullName} ({employeeId})</strong>?
              They will be unable to log in and will be prominently marked as{" "}
              <strong className="text-danger">DEACTIVATED</strong> in employee directories and all generated Excel spreadsheets.
            </p>
          }
          confirmLabel="Deactivate Account"
          tone="danger"
          onConfirm={handleToggleStatus}
        />
      ) : (
        <button
          type="button"
          onClick={handleToggleStatus}
          disabled={isPending}
          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition text-teal-700 bg-teal-50 hover:bg-teal-100 dark:text-teal-300 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 disabled:opacity-50"
          title="Reactivate employee access"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <UserCheck className="w-3.5 h-3.5" />
          )}
          <span>Activate</span>
        </button>
      )}

      {/* Delete Employee Button */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        trigger={
          <button
            type="button"
            disabled={isPending}
            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition text-danger-700 bg-danger-50 hover:bg-danger-100 dark:text-danger-300 dark:bg-danger-950/40 dark:hover:bg-danger-900/40 disabled:opacity-50"
            title="Permanently delete employee"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="sr-only sm:not-sr-only">Delete</span>
          </button>
        }
        title="Delete Employee Account"
        description={
          <div className="space-y-2">
            <p>
              Are you sure you want to permanently delete{" "}
              <strong>{fullName} ({employeeId})</strong>?
            </p>
            <p className="text-xs text-ink-subtle">
              This will permanently revoke their access, delete authentication credentials,
              and reassign their clients and activity history to Super Admin to protect business integrity.
            </p>
          </div>
        }
        confirmLabel="Permanently Delete"
        tone="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
