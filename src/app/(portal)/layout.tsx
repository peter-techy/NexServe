import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { navFor } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const settings = await getSettings();
  const groups = navFor(session.profile.role);

  // Fetch open attendance session if sales/super_admin
  let openSession: AttendanceSession | null = null;
  if (session.profile.role === "sales" || session.profile.role === "super_admin") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("employee_id", session.profile.id)
      .is("check_out_at", null)
      .maybeSingle<AttendanceSession>();
    openSession = data;
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
