import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function TableWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("w-full overflow-x-auto", className)}>{children}</div>;
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full min-w-max border-collapse text-sm", className)} {...props} />;
}

export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-white/60 bg-white/40 backdrop-blur-md px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted first:pl-5 last:pr-5",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("border-b border-line/50 px-3 py-2.5 align-top text-ink first:pl-5 last:pr-5", className)} {...props} />;
}

export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors duration-150 hover:bg-white/50", className)} {...props} />;
}

/** Builds a URL preserving existing query params. */
export function withParams(base: string, params: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, ...overrides })) if (v) sp.set(k, v);
  const q = sp.toString();
  return q ? `${base}?${q}` : base;
}

export function SortHeader({
  label,
  column,
  base,
  params,
  className,
}: {
  label: string;
  column: string;
  base: string;
  params: Record<string, string | undefined>;
  className?: string;
}) {
  const active = params.sort === column;
  const dir = active && params.dir === "asc" ? "asc" : "desc";
  const nextDir = active ? (dir === "asc" ? "desc" : "asc") : "asc";
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <Th className={className} aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <Link href={withParams(base, params, { sort: column, dir: nextDir, page: undefined })} className="inline-flex items-center gap-1 hover:text-ink">
        {label}
        <Icon className={cn("size-3", !active && "opacity-40")} aria-hidden />
      </Link>
    </Th>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  base,
  params,
}: {
  page: number;
  pageSize: number;
  total: number;
  base: string;
  params: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const linkCls = "inline-flex h-8 items-center gap-1 rounded-md border border-line-strong bg-surface px-2.5 text-xs font-medium text-ink hover:bg-canvas";
  const disabledCls = "pointer-events-none opacity-45";
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs text-ink-muted">
      <span>
        Showing <strong className="font-medium text-ink">{from}</strong>–<strong className="font-medium text-ink">{to}</strong> of{" "}
        <strong className="font-medium text-ink">{total}</strong>
      </span>
      <div className="flex items-center gap-2">
        <Link
          href={withParams(base, params, { page: String(page - 1) })}
          className={cn(linkCls, page <= 1 && disabledCls)}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
        >
          <ChevronLeft className="size-3.5" aria-hidden /> Previous
        </Link>
        <span>
          Page {Math.min(page, pages)} of {pages}
        </span>
        <Link
          href={withParams(base, params, { page: String(page + 1) })}
          className={cn(linkCls, page >= pages && disabledCls)}
          aria-disabled={page >= pages}
          tabIndex={page >= pages ? -1 : undefined}
        >
          Next <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
