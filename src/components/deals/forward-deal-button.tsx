"use client";

import * as React from "react";
import { CheckCircle, Send, UserCheck, Shield, Users, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { forwardDealToHrAction, getAvailableHrAction } from "@/app/actions/clients";
import type { HrMember } from "@/lib/auth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ForwardDealButtonProps {
  activityId: string;
  businessName: string;
  personName?: string;
  isForwarded?: boolean;
  forwardedToName?: string;
  isDone?: boolean;
  size?: "sm" | "md";
  availableHrList?: HrMember[];
}

export function ForwardDealButton({
  activityId,
  businessName,
  personName,
  isForwarded = false,
  forwardedToName,
  isDone = false,
  size = "sm",
  availableHrList: initialHrList,
}: ForwardDealButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [hrList, setHrList] = React.useState<HrMember[]>(initialHrList || []);
  const [selectedHrId, setSelectedHrId] = React.useState<string>("");
  const [isLoadingHr, setIsLoadingHr] = React.useState(false);

  // Fetch available HR personnel when dialog opens if not already loaded
  React.useEffect(() => {
    if (open && hrList.length === 0) {
      setIsLoadingHr(true);
      getAvailableHrAction()
        .then((members) => {
          setHrList(members);
          if (members.length > 0 && !selectedHrId) {
            // Default to first HR role, or first member
            const hrFirst = members.find((m) => m.role === "hr") || members[0];
            setSelectedHrId(hrFirst.id);
          }
        })
        .catch(() => {
          // ignore error
        })
        .finally(() => setIsLoadingHr(false));
    } else if (open && hrList.length > 0 && !selectedHrId) {
      const hrFirst = hrList.find((m) => m.role === "hr") || hrList[0];
      setSelectedHrId(hrFirst.id);
    }
  }, [open, hrList, selectedHrId]);

  if (isForwarded) {
    return (
      <Badge tone="teal" className="flex items-center gap-1 font-semibold text-[11px] px-2.5 py-1 shadow-xs">
        <CheckCircle className="size-3 text-brand-teal" />
        <span>{forwardedToName ? `Forwarded to ${forwardedToName}` : "Forwarded to HR"}</span>
      </Badge>
    );
  }

  const selectedHr = hrList.find((h) => h.id === selectedHrId);

  const handleForward = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const res = await forwardDealToHrAction(
        activityId,
        notes,
        selectedHr?.id,
        selectedHr?.fullName
      );
      if (res.ok) {
        toast.success(res.message || "Deal marked as Done and forwarded to HR!");
        setOpen(false);
      } else {
        toast.error(res.message || "Failed to forward deal to HR.");
      }
    } catch {
      toast.error("An unexpected error occurred while forwarding.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size={size}
          variant={isDone ? "secondary" : "accent"}
          className="h-7 text-xs px-2.5 shadow-sm font-semibold hover:shadow-md transition-all"
        >
          <Send className="size-3 mr-1.5" />
          {isDone ? "Forward to HR" : "Deal Done · Forward to HR"}
        </Button>
      </DialogTrigger>

      <DialogContent
        title="Forward Deal to Human Resources"
        description={`Hand over ${businessName} ${personName ? `(${personName})` : ""} to HR for contract, onboarding & commissioning.`}
      >
        <form onSubmit={handleForward} className="space-y-4 pt-2">
          {/* Automated Workflow Notice */}
          <div className="rounded-xl border border-brand-teal/20 bg-brand-teal-50/60 p-3 text-xs text-brand-navy">
            <p className="font-semibold flex items-center gap-1.5 text-brand-teal-700">
              <CheckCircle className="size-4" /> Automated Handover Workflow
            </p>
            <p className="mt-1 text-ink-muted">
              Submitting this will mark the activity as <strong>Done (Deal Won)</strong> and immediately route the client details to your chosen HR representative.
            </p>
          </div>

          {/* Section: Select Available HR */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy flex items-center gap-1.5">
                <UserCheck className="size-3.5 text-brand-teal" /> Available HR Representatives <span className="text-danger">*</span>
              </label>
              <span className="text-[11px] text-ink-subtle">
                {hrList.length > 0 ? `${hrList.length} Active HR Members` : "Loading..."}
              </span>
            </div>

            {isLoadingHr ? (
              <div className="py-4 text-center text-xs text-ink-subtle animate-pulse bg-white/50 rounded-xl border border-line">
                Fetching available HR team members...
              </div>
            ) : hrList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {hrList.map((hr) => {
                  const isSelected = selectedHrId === hr.id;
                  return (
                    <div
                      key={hr.id}
                      onClick={() => setSelectedHrId(hr.id)}
                      className={`cursor-pointer rounded-xl border p-2.5 transition flex items-center justify-between ${
                        isSelected
                          ? "border-brand-teal bg-brand-teal-50/80 shadow-xs ring-2 ring-brand-teal/20"
                          : "border-line bg-white/70 hover:bg-white/95 hover:border-line-strong"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected
                              ? "bg-brand-teal text-white"
                              : "bg-brand-navy/10 text-brand-navy"
                          }`}
                        >
                          {hr.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-ink truncate">{hr.fullName}</p>
                          <div className="flex items-center gap-1 text-[10px] text-ink-muted">
                            <span className="capitalize">{hr.role === "super_admin" ? "Admin" : "HR"}</span>
                            <span>•</span>
                            <span className="truncate">{hr.email}</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`size-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                          isSelected
                            ? "border-brand-teal bg-brand-teal text-white"
                            : "border-line-strong bg-white"
                        }`}
                      >
                        {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-white/60 p-3 text-xs text-ink-muted">
                No active HR personnel found in directory. Deal will be routed to General HR pool.
              </div>
            )}
          </div>

          {/* Handover Notes */}
          <div>
            <label htmlFor="notes" className="block text-xs font-semibold text-ink mb-1.5">
              Handover Notes for {selectedHr ? selectedHr.fullName : "HR"} (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="e.g. Client agreed on package. Needs contract copy sent by Monday."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-white/70 bg-white/70 backdrop-blur-md px-3 py-2 text-xs text-ink transition focus:bg-white/95 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/60">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="sm"
              disabled={isPending}
              className="font-semibold shadow-sm"
            >
              <Send className="size-3 mr-1.5" />
              {isPending
                ? "Forwarding…"
                : selectedHr
                ? `Confirm & Forward to ${selectedHr.fullName.split(" ")[0]}`
                : "Confirm & Forward to HR"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
