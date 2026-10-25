"use client";

import * as React from "react";
import { Trash2, UserX, UserCheck, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toggleEmployeeStatusAction, deleteEmployeeAction } from "@/app/actions/admin";
import { toast } from "sonner";

interface EmployeeRowActionsProps {
  profileId: string;
  employeeId: string;
  fullName: string;
  isActive: boolean;
  isCurrentUser: boolean;
}

export function EmployeeRowActions({
  profileId,
  employeeId,
  fullName,
  isActive,
  isCurrentUser,
}: EmployeeRowActionsProps) {
  const [isPending, startTransition] = React.useTransition();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deactivateOpen, setDeactivateOpen] = React.useState(false);

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
      } else {
        toast.error(res.message || "Failed to delete employee.");
      }
    } catch {
      toast.error("An unexpected error occurred while deleting.");
    }
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      {/* Deactivate / Activate Button */}
      {isActive ? (
        <ConfirmDialog
          open={deactivateOpen}
          onOpenChange={setDeactivateOpen}
          trigger={
            <button
              type="button"
              disabled={isPending}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded transition text-amber-700 bg-amber-50 hover:bg-amber-100 dark:text-amber-300 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 disabled:opacity-50"
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
          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded transition text-teal-700 bg-teal-50 hover:bg-teal-100 dark:text-teal-300 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 disabled:opacity-50"
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
