"use client";

import * as React from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeFollowupAction } from "@/app/actions/clients";
import { toast } from "sonner";
import type { WorkStatus } from "@/lib/types";

export function CompleteFollowupButton({
  activityId,
  clientName,
  outcomeStatus = "Done",
  size = "sm",
  variant = "accent",
}: {
  activityId: string;
  clientName?: string;
  outcomeStatus?: WorkStatus;
  size?: "sm" | "md" | "lg" | "icon" | "icon-sm";
  variant?: "accent" | "secondary" | "primary" | "ghost";
}) {
  const [isPending, setIsPending] = React.useState(false);

  const handleComplete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Mark follow-up for ${clientName || "this client"} as completed?`)) {
      return;
    }

    setIsPending(true);
    try {
      const res = await completeFollowupAction(activityId, outcomeStatus);
      if (res.ok) {
        toast.success(res.message || "Follow-up marked as completed.");
      } else {
        toast.error(res.message || "Failed to complete follow-up.");
      }
    } catch {
      toast.error("Failed to complete follow-up.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      disabled={isPending}
      onClick={handleComplete}
      className="text-xs"
      title="Complete Follow-up"
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin mr-1" />
      ) : (
        <CheckCircle className="size-3.5 mr-1 text-emerald-600" />
      )}
      Mark Done
    </Button>
  );
}
