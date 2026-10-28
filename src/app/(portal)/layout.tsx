import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSettings, DEFAULT_SETTINGS } from "@/lib/settings";
import { navFor } from "@/lib/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getActiveAttendanceSession } from "@/lib/attendance";
import type { AttendanceSession } from "@/lib/types";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || !session.profile.is_active) {
    redirect("/login");
  }

  let settings = DEFAULT_SETTINGS;
  try {
    settings = await getSettings();
  } catch (err) {
    console.error("Layout settings fetch error:", err);
  }

  const groups = navFor(session.profile.role);

  // Fetch open attendance session if sales/super_admin and auto-reconcile stale sleep/shutdown sessions
  let openSession: AttendanceSession | null = null;
  if (session.profile.role === "sales" || session.profile.role === "super_admin") {
    try {
      openSession = await getActiveAttendanceSession(session.profile.id);
    } catch (err) {
      console.error("Layout attendance session fetch error:", err);
    }
  }

  return (
    <AppShell
      user={{
        fullName: session.profile.full_name,
        email: session.profile.email,
        role: session.profile.role,
        employeeId: session.profile.employee_id,
      }}
      groups={groups}
      companyName={settings.company_name}
      openSession={openSession}
      timezone={settings.business_timezone}
    >
      {children}
    </AppShell>
  );
}
