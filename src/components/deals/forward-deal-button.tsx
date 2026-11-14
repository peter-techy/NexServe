"use client";

import * as React from "react";
import { CheckCircle, Send, UserCheck, ChevronDown, Loader2 } from "lucide-react";
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
  const [hrList, setHrList] = React.useState<HrMember[]>(
    initialHrList ? initialHrList.filter((m) => m.role === "hr" && m.department === "HR") : []
  );
  const [selectedHrId, setSelectedHrId] = React.useState<string>("");
  const [isLoadingHr, setIsLoadingHr] = React.useState(false);

  // Strictly filter out any administrators / other sector employees (only HR department role=hr)
  const validHrList = React.useMemo(() => {
    return (hrList || []).filter((m) => m.role === "hr" && m.department === "HR");
  }, [hrList]);

  // Fetch fresh HR personnel whenever dialog opens
  React.useEffect(() => {
    if (open) {
      setIsLoadingHr(true);
      getAvailableHrAction()
        .then((members) => {
          const onlyHr = members.filter((m) => m.role === "hr" && m.department === "HR");
          setHrList(onlyHr);
          if (onlyHr.length > 0) {
            setSelectedHrId((prev) =>
              onlyHr.some((h) => h.id === prev) ? prev : onlyHr[0].id
            );
          } else {
            setSelectedHrId("");
          }
        })
        .catch(() => {
          // ignore error
        })
        .finally(() => setIsLoadingHr(false));
    }
  }, [open]);

  // If deal was already forwarded, display confirmation badge
  if (isForwarded) {
    return (
      <Badge tone="teal" className="flex items-center gap-1 font-semibold text-[11px] px-2.5 py-1 shadow-xs">
        <CheckCircle className="size-3 text-brand-teal" />
        <span>{forwardedToName ? `Forwarded to ${forwardedToName}` : "Forwarded to HR"}</span>
      </Badge>
    );
  }

  // Only show the "Forward to HR" option if the deal is Done
  if (!isDone) {
    return null;
  }

  const selectedHr = validHrList.find((h) => h.id === selectedHrId);

  const handleForward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHrId || !selectedHr) {
      toast.error("Please select a concerned HR representative from the dropdown menu.");
      return;
    }

    setIsPending(true);
    try {
      const res = await forwardDealToHrAction(
        activityId,
        notes,
        selectedHr.id,
        selectedHr.fullName
      );
      if (res.ok) {
        toast.success(res.message || "Deal successfully forwarded to concerned HR!");
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
          variant="accent"
          className="h-7 text-xs px-2.5 shadow-sm font-semibold hover:shadow-md transition-all bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Send className="size-3 mr-1.5" />
          Forward to HR
        </Button>
      </DialogTrigger>

      <DialogContent
        title="Forward Deal to Human Resources"
        description={`Hand over closed deal for ${businessName} ${personName ? `(${personName})` : ""} to the concerned HR representative.`}
      >
        <form onSubmit={handleForward} className="space-y-4 pt-2">
          {/* Automated Workflow Notice */}
          <div className="rounded-xl border border-brand-teal/20 bg-brand-teal-50/60 p-3 text-xs text-brand-navy">
            <p className="font-semibold flex items-center gap-1.5 text-brand-teal-700">
              <CheckCircle className="size-4" /> Automated Handover Workflow
            </p>
            <p className="mt-1 text-ink-muted">
              Forwarding routes this completed deal directly to the concerned HR representative for contract generation, onboarding, and compliance.
            </p>
          </div>

          {/* Section: Select Concerned HR Dropdown Menu */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor={`hr_select_${activityId}`}
                className="block text-xs font-bold uppercase tracking-wider text-brand-navy flex items-center gap-1.5"
              >
                <UserCheck className="size-3.5 text-brand-teal" /> Concerned HR Representative <span className="text-danger">*</span>
              </label>
              <span className="text-[11px] text-ink-subtle">
                {validHrList.length > 0 ? `${validHrList.length} Active HR Members` : "Loading..."}
              </span>
            </div>

            {isLoadingHr ? (
              <div className="py-3 px-3 text-xs text-ink-subtle animate-pulse bg-white/50 rounded-xl border border-line flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin text-brand-teal" />
                <span>Loading active HR directory...</span>
              </div>
            ) : validHrList.length > 0 ? (
              <div className="space-y-2.5">
                {/* Dropdown Menu */}
                <div className="relative">
                  <select
                    id={`hr_select_${activityId}`}
                    value={selectedHrId}
                    onChange={(e) => setSelectedHrId(e.target.value)}
                    required
                    className="w-full appearance-none rounded-xl border border-line-strong bg-white px-3.5 py-2.5 pr-10 text-xs font-medium text-ink shadow-2xs transition focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20 cursor-pointer"
                  >
                    <option value="" disabled>-- Select Concerned HR Representative --</option>
                    {validHrList.map((hr) => {
                      const isSapan = hr.fullName.toLowerCase().includes("sapan");
                      const displayName = isSapan ? "Sapan (Vir Sapan Pratap Anand)" : hr.fullName;
                      return (
                        <option key={hr.id} value={hr.id}>
                          {displayName} — {hr.email}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-ink-subtle" />
                </div>

                {/* Selected HR Preview Card */}
                {selectedHr && (
                  <div className="rounded-xl border border-brand-teal/20 bg-brand-teal-50/70 p-3 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-full bg-brand-teal text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {selectedHr.fullName.toLowerCase().includes("sapan")
                          ? "S"
                          : selectedHr.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-brand-navy truncate">
                          {selectedHr.fullName.toLowerCase().includes("sapan")
                            ? "Sapan (Vir Sapan Pratap Anand)"
                            : selectedHr.fullName}
                        </p>
                        <p className="text-[11px] text-ink-muted truncate">
                          HR Representative • {selectedHr.email}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal shrink-0">
                      Concerned HR
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-line bg-white/60 p-3 text-xs text-ink-muted">
                No active HR personnel found in directory.
              </div>
            )}
          </div>

          {/* Handover Notes */}
          <div>
            <label htmlFor={`notes_${activityId}`} className="block text-xs font-semibold text-ink mb-1.5">
              Handover Notes for {selectedHr ? selectedHr.fullName : "HR"} (Optional)
            </label>
            <textarea
              id={`notes_${activityId}`}
              name="notes"
              rows={3}
              placeholder="e.g. Client agreed on package. Needs contract copy sent by Monday."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-line-strong bg-white/80 backdrop-blur-md px-3 py-2 text-xs text-ink transition focus:bg-white focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
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
              disabled={isPending || !selectedHrId}
              className="font-semibold shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
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
