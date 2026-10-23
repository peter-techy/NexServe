"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  BarChart3,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  Clock,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Settings,
  UserCircle,
  Users,
  UserCog,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { RoleBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttendanceWidget } from "@/components/attendance/attendance-widget";
import { logoutAction } from "@/app/actions/auth";
import type { NavGroup, NavIcon } from "@/lib/navigation";
import type { AppRole, AttendanceSession } from "@/lib/types";
import { cn, firstName, initials } from "@/lib/utils";

const ICONS: Record<NavIcon, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  clients: ClipboardList,
  followups: CalendarClock,
  attendance: Clock,
  profile: UserCircle,
  employees: Users,
  activity: BarChart3,
  reports: FileSpreadsheet,
  users: UserCog,
  settings: Settings,
  inquiries: Mail,
  audit: History,
};

export interface ShellUser {
  fullName: string;
  email: string;
  role: AppRole;
  employeeId: string;
}

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function SidebarNav({ groups = [], onNavigate }: { groups?: NavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname() || "";
  // Pick the most specific matching href so only one item is active.
  const allHrefs = (groups || []).flatMap((g) => (g?.items || []).map((i) => i.href));
  const activeHref = allHrefs.filter((h) => isActive(pathname, h)).sort((a, b) => b.length - a.length)[0];
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-5 px-3 py-4">
      {(groups || []).map((group, gi) => (
        <div key={group.label ?? gi}>
          {group.label && (
            <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/45">{group.label}</p>
          )}
          <ul className="flex flex-col gap-0.5">
            {(group.items || []).map((item) => {
              const Icon = ICONS[item.icon] || LayoutDashboard;
              const active = item.href === activeHref;
              return (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors duration-150",
                      active
                        ? "bg-white/10 font-medium text-white shadow-[inset_2px_0_0_0_#5fb3c7]"
                        : "text-white/70 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserMenu({ user }: { user: ShellUser }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-md px-1.5 py-1 text-left transition-colors duration-150 hover:bg-canvas"
          aria-label={`Account menu for ${user.fullName}`}
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-navy text-xs font-semibold text-white">
            {initials(user.fullName)}
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-medium text-ink">{user.fullName}</span>
            <span className="text-xs text-ink-subtle">{user.employeeId}</span>
          </span>
          <ChevronDown className="size-4 text-ink-subtle" aria-hidden />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} className="card z-50 min-w-56 p-1 shadow-pop">
          <div className="px-2.5 py-2">
            <p className="text-sm font-medium text-ink">{user.fullName}</p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
            <RoleBadge role={user.role} className="mt-1.5" />
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item asChild>
            <Link href="/profile" className="flex items-center gap-2 rounded px-2.5 py-1.5 text-sm text-ink outline-none data-[highlighted]:bg-canvas">
              <UserCircle className="size-4" aria-hidden /> My profile
            </Link>
          </DropdownMenu.Item>
          {user.role === "super_admin" && (
            <>
              <DropdownMenu.Item asChild>
                <Link href="/sales/dashboard" className="flex items-center gap-2 rounded px-2.5 py-1.5 text-sm text-ink outline-none data-[highlighted]:bg-canvas">
                  <ClipboardList className="size-4" aria-hidden /> Switch to Sales portal
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link href="/hr/dashboard" className="flex items-center gap-2 rounded px-2.5 py-1.5 text-sm text-ink outline-none data-[highlighted]:bg-canvas">
                  <Users className="size-4" aria-hidden /> Switch to HR portal
                </Link>
              </DropdownMenu.Item>
            </>
          )}
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item
            className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-sm text-danger outline-none cursor-pointer data-[highlighted]:bg-danger-50"
            onSelect={async (e) => {
              e.preventDefault();
              await logoutAction();
            }}
          >
            <LogOut className="size-4" aria-hidden /> Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function AppShell({
  user,
  groups = [],
  companyName = "NexServe",
  openSession = null,
  timezone = "Asia/Kolkata",
  children,
}: {
  user?: ShellUser | null;
  groups?: NavGroup[];
  companyName?: string;
  openSession?: AttendanceSession | null;
  timezone?: string;
  children: React.ReactNode;
}) {
  const safeUser: ShellUser = {
    fullName: user?.fullName || "Employee",
    email: user?.email || "",
    role: user?.role || "sales",
    employeeId: user?.employeeId || "",
  };
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname() || "";
  React.useEffect(() => setMobileOpen(false), [pathname]);

  const portal = pathname.startsWith("/admin")
    ? "Administration"
    : pathname.startsWith("/hr")
      ? "HR Portal"
      : pathname.startsWith("/sales")
        ? "Sales Portal"
        : "Account";

  return (
    <div className="min-h-dvh lg:pl-64">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand-navy lg:flex">
        <div className="flex h-14 items-center border-b border-white/10 px-5">
          <span className="rounded bg-white px-2 py-1">
            <LogoMark name={companyName} />
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav groups={groups} />
        </div>
        <div className="border-t border-white/10 px-5 py-3 text-[11px] text-white/45">One Partner. Every Possibility.</div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-brand-navy/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-brand-navy">
            <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
              <span className="rounded bg-white px-2 py-1">
                <LogoMark name={companyName} />
              </span>
              <Button variant="ghost" size="icon-sm" className="text-white hover:bg-white/10 hover:text-white" aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
                <X />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarNav groups={groups} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-surface px-3 sm:px-5">
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>
          <Menu />
        </Button>
        <span className="lg:hidden">
          <LogoMark name={companyName} />
        </span>
        <div className="hidden min-w-0 items-center gap-2 lg:flex">
          <span className="text-sm font-medium text-ink">Hi, {firstName(safeUser.fullName)}</span>
          <span className="text-line-strong" aria-hidden>
            |
          </span>
          <span className="text-sm text-ink-muted">{portal}</span>
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {safeUser.role === "sales" && <AttendanceWidget openSession={openSession} timezone={timezone} compact />}
          <RoleBadge role={safeUser.role} className="hidden sm:inline-flex" />
          <UserMenu user={safeUser} />
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[1400px] px-3 py-5 sm:px-5 lg:px-7 lg:py-6">
        {children}
      </main>
    </div>
  );
}
