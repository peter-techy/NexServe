import * as React from "react";
import { Ban, CheckCircle2, Clock3, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppRole, WorkStatus } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

type Tone = "neutral" | "navy" | "teal" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-canvas text-ink-muted border-line",
  navy: "bg-brand-navy-50 text-brand-navy border-brand-navy/15",
  teal: "bg-brand-teal-50 text-brand-teal-700 border-brand-teal/20",
  success: "bg-success-50 text-success border-success/20",
  warning: "bg-warning-50 text-warning border-warning/25",
  danger: "bg-danger-50 text-danger border-danger/20",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  icon,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-xs font-medium [&_svg]:size-3",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Work status badge — icon + text so status never relies on colour alone. */
export function StatusBadge({ status }: { status: WorkStatus }) {
  if (status === "Done")
    return (
      <Badge tone="success" icon={<CheckCircle2 aria-hidden />}>
        Done
      </Badge>
    );
  if (status === "Cancelled")
    return (
      <Badge tone="danger" icon={<Ban aria-hidden />}>
        Cancelled
      </Badge>
    );
  return (
    <Badge tone="warning" icon={<Clock3 aria-hidden />}>
      Followup
    </Badge>
  );
}

export function RoleBadge({ role, className }: { role: AppRole; className?: string }) {
  const tone: Tone = role === "super_admin" ? "navy" : role === "hr" ? "teal" : "neutral";
  return (
    <Badge tone={tone} className={className}>
      {ROLE_LABELS[role]}
    </Badge>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge tone="success" icon={<Circle className="fill-current" aria-hidden />}>
      Active
    </Badge>
  ) : (
    <Badge tone="neutral" icon={<Circle aria-hidden />}>
      Inactive
    </Badge>
  );
}
