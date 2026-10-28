import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Table, TableWrap, Th, Td, Tr } from "@/components/ui/table";
import { AttendanceWidget } from "@/components/attendance/attendance-widget";
import { EmptyState } from "@/components/ui/feedback";
import { formatDuration } from "@/lib/utils";
import { getActiveAttendanceSession } from "@/lib/attendance";
import type { AttendanceSession } from "@/lib/types";

export default async function SalesAttendancePage() {
  const session = await requireRole(["sales", "super_admin"]);
  const settings = await getSettings();
  const tz = settings.business_timezone;

  const supabase = await createClient();

  // Fetch open session (auto-reconciling any stale sleep/shutdown session)
  const openSession = await getActiveAttendanceSession(session.profile.id);

  // Fetch past attendance sessions
  const { data: pastSessions } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("employee_id", session.profile.id)
    .order("check_in_at", { ascending: false })
    .limit(30);

  // Calculate total work duration recorded
  const totalSeconds = pastSessions?.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance & Work Sessions"
        description="Check-in/out records, work session duration, and attendance history"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <AttendanceWidget openSession={openSession} timezone={tz} />
          
          <Card className="mt-4">
            <CardBody className="p-4 text-center">
              <p className="text-xs text-ink-subtle uppercase tracking-wider font-semibold">Total Duration (Recent)</p>
              <p className="text-2xl font-bold font-mono text-brand-navy mt-1 tabular-nums">
                {formatDuration(totalSeconds)}
              </p>
              <p className="text-xs text-ink-muted mt-1">Across last 30 recorded sessions</p>
            </CardBody>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader
              title="Attendance Session History"
              description="Timestamped log of completed work sessions"
            />
            <TableWrap>
              <Table>
                <thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Check In</Th>
                    <Th>Check Out</Th>
                    <Th className="text-right">Session Duration</Th>
                  </Tr>
                </thead>
                <tbody>
                  {pastSessions && pastSessions.length > 0 ? (
                    pastSessions.map((s) => (
                      <Tr key={s.id}>
                        <Td className="font-medium text-xs">
                          {new Date(s.check_in_at).toLocaleDateString([], {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Td>
                        <Td className="text-xs font-mono">
                          {new Date(s.check_in_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Td>
                        <Td className="text-xs font-mono">
                          {s.check_out_at
                            ? new Date(s.check_out_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Active"}
                        </Td>
                        <Td className="text-right font-mono font-medium text-xs">
                          {s.duration_seconds ? formatDuration(s.duration_seconds) : "In Progress"}
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={4} className="p-0">
                        <EmptyState
                          title="No attendance records"
                          description="Your completed work sessions will appear here."
                        />
                      </Td>
                    </Tr>
                  )}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        </div>
      </div>
    </div>
  );
}
