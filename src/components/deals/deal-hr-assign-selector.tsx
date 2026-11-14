"use client";

import * as React from "react";
import { UserCheck, ChevronDown, Check, Loader2, Users } from "lucide-react";
import type { HrMember } from "@/lib/auth";
import { assignDealToHrAction } from "@/app/actions/clients";
import { toast } from "sonner";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface DealHrAssignSelectorProps {
  logId: number;
  currentAssignedName?: string;
  currentAssignedId?: string;
  availableHrList: HrMember[];
  compact?: boolean;
}

export function DealHrAssignSelector({
  logId,
  currentAssignedName = "Unassigned HR",
  currentAssignedId,
  availableHrList = [],
  compact = false,
}: DealHrAssignSelectorProps) {
  const filteredHrList = React.useMemo(
    () => availableHrList.filter((m) => m.role === "hr" && m.department === "HR"),
    [availableHrList]
  );
  const [assignedName, setAssignedName] = React.useState(currentAssignedName);
  const [assignedId, setAssignedId] = React.useState(currentAssignedId);
  const [isPending, setIsPending] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const handleSelect = async (member: HrMember) => {
    if (member.id === assignedId) {
      setOpen(false);
      return;
    }

    const prevName = assignedName;
    const prevId = assignedId;

    // Optimistic update
    setAssignedName(member.fullName);
    setAssignedId(member.id);
    setIsPending(true);
    setOpen(false);

    try {
      const res = await assignDealToHrAction(logId, member.id, member.fullName);
      if (res.ok) {
        toast.success(res.message || `Deal assigned to ${member.fullName}`);
      } else {
        // Rollback
        setAssignedName(prevName);
        setAssignedId(prevId);
        toast.error(res.message || "Failed to update HR assignment.");
      }
    } catch {
      setAssignedName(prevName);
      setAssignedId(prevId);
      toast.error("An error occurred while reassigning.");
    } finally {
      setIsPending(false);
    }
  };

  const isAssigned = assignedName && assignedName !== "General HR Pool" && assignedName !== "Unassigned";

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          disabled={isPending}
          className={`inline-flex items-center gap-1.5 rounded-lg border transition font-medium text-left ${
            compact
              ? "px-2 py-1 text-[11px]"
              : "px-2.5 py-1.5 text-xs"
          } ${
            isAssigned
              ? "border-brand-teal/30 bg-brand-teal-50/70 text-brand-navy hover:bg-brand-teal-100/70"
              : "border-amber-300 bg-amber-50/80 text-amber-900 hover:bg-amber-100/80"
          } shadow-2xs hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/30`}
          title="Click to assign or change HR employee"
        >
          {isPending ? (
            <Loader2 className="size-3 animate-spin text-brand-teal shrink-0" />
          ) : (
            <UserCheck className={`size-3 shrink-0 ${isAssigned ? "text-brand-teal" : "text-amber-600"}`} />
          )}
          <span className="font-semibold truncate max-w-[130px]">
            {assignedName || "Choose HR..."}
          </span>
          <ChevronDown className="size-3 opacity-60 shrink-0" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          className="z-50 min-w-56 rounded-xl border border-white/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2.5 py-1.5 border-b border-line text-[11px] font-bold uppercase tracking-wider text-ink-subtle flex items-center justify-between">
            <span>Assign HR Employee</span>
            <span className="font-normal text-[10px] text-brand-teal">{filteredHrList.length} Available</span>
          </div>

          <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
            {filteredHrList.length > 0 ? (
              filteredHrList.map((member) => {
                const isSelected = member.id === assignedId || member.fullName === assignedName;
                return (
                  <DropdownMenu.Item
                    key={member.id}
                    onSelect={(e) => {
                      e.preventDefault();
                      handleSelect(member);
                    }}
                    className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs cursor-pointer outline-none transition ${
                      isSelected
                        ? "bg-brand-teal-50 text-brand-navy font-semibold"
                        : "text-ink hover:bg-slate-100/80 hover:text-brand-navy"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isSelected
                            ? "bg-brand-teal text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {member.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs">
                          {member.fullName.toLowerCase().includes("sapan")
                            ? "Sapan (Vir Sapan Pratap Anand)"
                            : member.fullName}
                        </p>
                        <p className="text-[10px] text-ink-subtle truncate">
                          HR Department • {member.employeeId || member.email}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="size-3.5 text-brand-teal shrink-0 ml-1.5" />
                    )}
                  </DropdownMenu.Item>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-ink-subtle">
                No active HR personnel found.
              </div>
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
