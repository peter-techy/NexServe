"use client";

import * as React from "react";
import { CheckCircle, Send, ArrowRight, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { forwardDealToHrAction } from "@/app/actions/clients";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface ForwardDealButtonProps {
  activityId: string;
  businessName: string;
  personName?: string;
  isForwarded?: boolean;
  isDone?: boolean;
  size?: "sm" | "md";
}

export function ForwardDealButton({
  activityId,
  businessName,
  personName,
  isForwarded = false,
  isDone = false,
  size = "sm",
}: ForwardDealButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);

  if (isForwarded) {
    return (
      <Badge tone="teal" className="flex items-center gap-1 font-semibold text-[11px] px-2.5 py-1 shadow-xs">
        <CheckCircle className="size-3 text-brand-teal" /> Forwarded to HR
      </Badge>
    );
  }

  const handleForward = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const res = await forwardDealToHrAction(activityId, notes);
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
          <div className="rounded-xl border border-brand-teal/20 bg-brand-teal-50/60 p-3.5 text-xs text-brand-navy">
            <p className="font-semibold flex items-center gap-1.5 text-brand-teal-700">
              <CheckCircle className="size-4" /> Automated Workflow
            </p>
            <p className="mt-1 text-ink-muted">
              Submitting this will mark the activity as <strong>Done (Deal Won)</strong> and immediately route the client details to the HR Deals Handover portal.
            </p>
          </div>

          <div>
            <label htmlFor="notes" className="block text-xs font-semibold text-ink mb-1.5">
              Handover Notes for HR (Optional)
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
              {isPending ? "Forwarding…" : "Confirm & Forward to HR"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
