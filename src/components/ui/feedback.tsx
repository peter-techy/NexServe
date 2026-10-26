import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  href,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  href?: string;
  icon?: React.ReactNode;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</span>
        {icon && <span className="text-brand-teal [&_svg]:size-4">{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-brand-navy">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-subtle">{hint}</div>}
    </>
  );
  const base = "card block px-4 py-3.5 hover:shadow-[0_16px_40px_rgba(24,120,144,0.12),inset_0_1px_1px_rgba(255,255,255,0.95)] hover:bg-white/85 hover:border-brand-teal/40 hover:-translate-y-0.5 transition-all duration-200";
  if (href) {
    return (
      <Link href={href} className={cn(base, "hover:border-brand-teal/40 hover:bg-white/90")}>
        {content}
      </Link>
    );
  }
  return <div className={base}>{content}</div>;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-10 text-center", className)}>
      <div className="mb-3 rounded-full bg-white/60 backdrop-blur-md border border-white/70 p-2.5 text-ink-subtle shadow-xs [&_svg]:size-5">{icon ?? <Inbox aria-hidden />}</div>
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, action }: { title?: string; message?: string; action?: React.ReactNode }) {
  return (
    <div role="alert" className="card flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 rounded-full bg-danger-50/80 backdrop-blur-md border border-danger/20 p-2.5 text-danger shadow-xs">
        <AlertTriangle className="size-5" aria-hidden />
      </div>
      <p className="text-sm font-medium text-ink">{title}</p>
      {message && <p className="mt-1 max-w-md text-xs text-ink-muted">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "warning" | "danger" | "success";
  children: React.ReactNode;
  className?: string;
}) {
  const styles = {
    info: "border-brand-teal/30 bg-brand-teal-50/80 backdrop-blur-md text-brand-teal-700 shadow-xs",
    warning: "border-warning/30 bg-warning-50/80 backdrop-blur-md text-warning shadow-xs",
    danger: "border-danger/30 bg-danger-50/80 backdrop-blur-md text-danger shadow-xs",
    success: "border-success/30 bg-success-50/80 backdrop-blur-md text-success shadow-xs",
  }[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-lg border px-3.5 py-2.5 text-sm", styles, className)}>
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-line/70", className)} aria-hidden />;
}
