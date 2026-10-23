import type { AppRole } from "@/lib/types";

export type NavIcon =
  | "dashboard"
  | "clients"
  | "followups"
  | "attendance"
  | "profile"
  | "employees"
  | "activity"
  | "reports"
  | "users"
  | "settings"
  | "inquiries"
  | "audit";

export interface NavItem {
  label: string;
  href: string;
  icon: NavIcon;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

const salesItems: NavItem[] = [
  { label: "Dashboard", href: "/sales/dashboard", icon: "dashboard" },
  { label: "Clients", href: "/sales/clients", icon: "clients" },
  { label: "Follow-ups", href: "/sales/follow-ups", icon: "followups" },
  { label: "Attendance / Work Sessions", href: "/sales/attendance", icon: "attendance" },
];

const hrItems: NavItem[] = [
  { label: "Dashboard", href: "/hr/dashboard", icon: "dashboard" },
  { label: "Employees", href: "/hr/employees", icon: "employees" },
  { label: "Employee Activity", href: "/hr/activity", icon: "activity" },
  { label: "Reports & Excel Export", href: "/hr/reports", icon: "reports" },
  { label: "Attendance Records", href: "/hr/attendance", icon: "attendance" },
];

export function navFor(role: AppRole): NavGroup[] {
  if (role === "sales") {
    return [{ items: [...salesItems, { label: "My Profile", href: "/profile", icon: "profile" }] }];
  }
  if (role === "hr") {
    return [{ items: hrItems }, { label: "Account", items: [{ label: "My Profile", href: "/profile", icon: "profile" }] }];
  }
  return [
    { items: [{ label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" }] },
    {
      label: "Sales",
      items: [
        { label: "Sales Dashboard", href: "/sales/dashboard", icon: "dashboard" },
        { label: "Clients", href: "/sales/clients", icon: "clients" },
        { label: "Follow-ups", href: "/sales/follow-ups", icon: "followups" },
        { label: "Work Sessions", href: "/sales/attendance", icon: "attendance" },
      ],
    },
    {
      label: "HR",
      items: [
        { label: "HR Dashboard", href: "/hr/dashboard", icon: "dashboard" },
        { label: "Employee Activity", href: "/hr/activity", icon: "activity" },
        { label: "Attendance Records", href: "/hr/attendance", icon: "attendance" },
      ],
    },
    {
      label: "Administration",
      items: [
        { label: "Employees & Users", href: "/admin/users", icon: "users" },
        { label: "Reports", href: "/hr/reports", icon: "reports" },
        { label: "Contact Inquiries", href: "/admin/inquiries", icon: "inquiries" },
        { label: "Audit Log", href: "/admin/audit", icon: "audit" },
        { label: "Settings", href: "/admin/settings", icon: "settings" },
        { label: "My Profile", href: "/profile", icon: "profile" },
      ],
    },
  ];
}
