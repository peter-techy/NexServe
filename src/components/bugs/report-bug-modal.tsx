"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Bug, Send, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { reportBugAction, BugReportInput } from "@/app/actions/bugs";
import { toast } from "sonner";

export function ReportBugModal({
  userEmail,
  userName,
  userRole,
}: {
  userEmail?: string;
  userName?: string;
  userRole?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<BugReportInput["category"]>("Error / Exception");
  const [severity, setSeverity] = React.useState<BugReportInput["severity"]>("Medium");
  const [description, setDescription] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);

  const pathname = usePathname() || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in both title and description.");
      return;
    }

    setIsPending(true);
    try {
      const res = await reportBugAction({
        title: title.trim(),
        category,
        severity,
        description: description.trim(),
        pageUrl: typeof window !== "undefined" ? window.location.href : pathname,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      });

      if (res.ok) {
        toast.success(res.message || "Bug report submitted successfully!");
        setOpen(false);
        setTitle("");
        setDescription("");
      } else {
        toast.error(res.message || "Failed to submit bug report.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-white/60 bg-white/70 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-rose-700 shadow-xs hover:bg-rose-50/80 hover:border-rose-300 transition-all"
          title="Report an error or system issue to administration"
        >
          <Bug className="size-3.5 text-rose-600" />
          <span className="hidden md:inline">Report Issue</span>
        </button>
      </DialogTrigger>

      <DialogContent
        title="Report an Error / Issue"
        description="Encountered an issue, error, or glitch? Send a detailed report directly to administration."
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Reporter details preview */}
          <div className="rounded-xl border border-white/70 bg-white/50 backdrop-blur-md p-3 text-xs text-ink-muted flex items-center justify-between">
            <div>
              <p className="font-semibold text-ink">{userName || "Employee"}</p>
              <p className="text-[11px] text-ink-subtle">{userEmail} · Role: {userRole || "Staff"}</p>
            </div>
            <div className="text-right text-[11px] font-mono text-ink-subtle">
              Route: {pathname || "/"}
            </div>
          </div>

          <div>
            <label htmlFor="bug_title" className="block text-xs font-semibold text-ink mb-1.5">
              Issue Summary / Title *
            </label>
            <input
              id="bug_title"
              type="text"
              required
              placeholder="e.g. Error when saving client activity or Excel download fails"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-white/70 bg-white/70 backdrop-blur-md px-3 py-2 text-xs text-ink transition focus:bg-white/95 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="bug_category" className="block text-xs font-semibold text-ink mb-1.5">
                Category
              </label>
              <select
                id="bug_category"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full rounded-lg border border-white/70 bg-white/70 backdrop-blur-md px-3 py-2 text-xs text-ink transition focus:bg-white/95 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
              >
                <option value="Error / Exception">Error / Exception</option>
                <option value="UI Glitch">UI Glitch</option>
                <option value="Data Mismatch">Data Mismatch</option>
                <option value="Performance">Performance</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="bug_severity" className="block text-xs font-semibold text-ink mb-1.5">
                Severity Level
              </label>
              <select
                id="bug_severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full rounded-lg border border-white/70 bg-white/70 backdrop-blur-md px-3 py-2 text-xs text-ink transition focus:bg-white/95 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
              >
                <option value="Low">Low (Cosmetic / Minor)</option>
                <option value="Medium">Medium (Normal)</option>
                <option value="High">High (Impacting workflow)</option>
                <option value="Critical / Blocker">Critical (Blocker / System Down)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="bug_desc" className="block text-xs font-semibold text-ink mb-1.5">
              Description & Steps to Reproduce *
            </label>
            <textarea
              id="bug_desc"
              rows={4}
              required
              placeholder="What were you trying to do? What happened instead? If an error digest or message appeared, please paste it here."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              {isPending ? "Submitting…" : "Submit Bug Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
