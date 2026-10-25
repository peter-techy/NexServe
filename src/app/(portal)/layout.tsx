import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSettings, DEFAULT_SETTINGS } from "@/lib/settings";
import { navFor } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppShell } from "@/components/layout/app-shell";
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

  // Fetch open attendance session if sales/super_admin and auto-reconcile stale shutdown sessions
  let openSession: AttendanceSession | null = null;
  if (session.profile.role === "sales" || session.profile.role === "super_admin") {
    try {
      const admin = createAdminClient();

      // Check if there is an abandoned open session older than 15 minutes without heartbeat
      // (e.g. employee previously shut down laptop without explicit manual checkout)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: staleSessions } = await admin
        .from("attendance_sessions")
        .select("id, check_in_at, updated_at")
        .eq("employee_id", session.profile.id)
        .is("check_out_at", null)
        .lt("updated_at", fifteenMinutesAgo);

      if (staleSessions && staleSessions.length > 0) {
        for (const stale of staleSessions) {
          const shutdownTime = stale.updated_at || stale.check_in_at;
          await admin
            .from("attendance_sessions")
            .update({ check_out_at: shutdownTime })
            .eq("id", stale.id);
        }
      }

      const { data } = await admin
        .from("attendance_sessions")
        .select("*")
        .eq("employee_id", session.profile.id)
        .is("check_out_at", null)
        .maybeSingle<AttendanceSession>();
      openSession = data;
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
