"use client";

import * as React from "react";
import { Clock, Play, Square, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatClock, formatDuration } from "@/lib/utils";
import { checkInAction, checkOutAction } from "@/app/actions/attendance";
import type { AttendanceSession } from "@/lib/types";
import { toast } from "sonner";

export function AttendanceWidget({
  openSession,
  timezone,
  compact = false,
}: {
  openSession: AttendanceSession | null;
  timezone: string;
  compact?: boolean;
}) {
  const [elapsed, setElapsed] = React.useState<number>(0);
  const [isPending, setIsPending] = React.useState(false);

  React.useEffect(() => {
    if (!openSession) {
      setElapsed(0);
      return;
    }

    const checkInTime = new Date(openSession.check_in_at).getTime();

    const updateTimer = () => {
      const now = Date.now();
      setElapsed(Math.max(0, Math.floor((now - checkInTime) / 1000)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [openSession]);

  const handleCheckIn = async () => {
    setIsPending(true);
    try {
      const res = await checkInAction();
      if (!res.ok) {
        toast.error(res.message || "Failed to check in");
      } else {
        toast.success(res.message || "Checked in successfully");
      }
    } catch {
      toast.error("Failed to check in");
    } finally {
      setIsPending(false);
    }
  };

  const handleCheckOut = async () => {
    setIsPending(true);
    try {
      const res = await checkOutAction();
      if (!res.ok) {
        toast.error(res.message || "Failed to check out");
      } else {
        toast.success(res.message || "Checked out successfully");
      }
    } catch {
      toast.error("Failed to check out");
    } finally {
      setIsPending(false);
    }
  };

  if (compact) {
    if (openSession) {
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded bg-brand-teal-50 px-2 py-1 text-xs font-semibold text-brand-teal-700">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-teal opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-brand-teal"></span>
            </span>
            <span className="tabular-nums font-mono">{formatClock(elapsed)}</span>
          </div>
          <Button
            size="sm"
            variant="danger-outline"
            className="h-7 text-xs px-2"
            disabled={isPending}
            onClick={handleCheckOut}
          >
            <Square className="size-3 mr-1 fill-current" /> Check Out
          </Button>
        </div>
      );
    }

    return (
      <Button
        size="sm"
        variant="accent"
        className="h-7 text-xs px-2"
        disabled={isPending}
        onClick={handleCheckIn}
      >
        <Play className="size-3 mr-1 fill-current" /> Check In
      </Button>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
          <Clock className="size-4 text-brand-teal" /> Work Session
        </h3>
        <span className="text-xs text-ink-subtle">{timezone}</span>
      </div>

      {openSession ? (
        <div>
          <div className="rounded-md bg-brand-teal-50 border border-brand-teal/20 p-3 text-center mb-3">
            <p className="text-xs text-brand-teal-700 font-medium uppercase tracking-wider">Active Session</p>
            <div className="text-2xl font-bold font-mono text-brand-navy my-1 tabular-nums">
              {formatClock(elapsed)}
            </div>
            <p className="text-xs text-ink-muted">
              Started at {new Date(openSession.check_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <Button
            variant="danger"
            className="w-full"
            disabled={isPending}
            onClick={handleCheckOut}
          >
            <Square className="size-4 mr-1.5 fill-current" /> Check Out
          </Button>
        </div>
      ) : (
        <div>
          <p className="text-xs text-ink-muted mb-3">
            You are currently checked out. Click Check In to start recording your work hours.
          </p>
          <Button
            variant="accent"
            className="w-full"
            disabled={isPending}
            onClick={handleCheckIn}
          >
            <Play className="size-4 mr-1.5 fill-current" /> Check In
          </Button>
        </div>
      )}
    </div>
  );
}
