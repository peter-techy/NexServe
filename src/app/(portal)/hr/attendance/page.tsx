import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableWrap, Th, Td, Tr } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/feedback";
import { formatDuration } from "@/lib/utils";

export default async function HRAttendanceRecordsPage() {
  await requireRole(["hr", "super_admin"]);
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select(`
      id,
      check_in_at,
      check_out_at,
      duration_seconds,
      corrected,
      employee:profiles!inner (
        full_name,
        employee_id,
        department
      )
    `)
    .order("check_in_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <PageHeader
        title="Attendance Records"
        description="Employee check-in/out logs, work session durations, and audit flags"
      />

      <Card>
        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Employee ID</Th>
                <Th>Employee Name</Th>
                <Th>Department</Th>
                <Th>Date</Th>
                <Th>Check In</Th>
                <Th>Check Out</Th>
                <Th className="text-right">Total Duration</Th>
              </Tr>
            </thead>
            <tbody>
              {sessions && sessions.length > 0 ? (
                sessions.map((s: any) => (
                  <Tr key={s.id}>
                    <Td className="font-mono text-xs font-semibold text-brand-navy">
                      {s.employee?.employee_id}
                    </Td>
                    <Td className="font-medium text-xs text-ink">{s.employee?.full_name}</Td>
                    <Td className="text-xs text-ink-muted">{s.employee?.department}</Td>
                    <Td className="text-xs">
                      {new Date(s.check_in_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </Td>
                    <Td className="text-xs font-mono">
                      {new Date(s.check_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Td>
                    <Td className="text-xs font-mono">
                      {s.check_out_at
                        ? new Date(s.check_out_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "Active"}
                    </Td>
                    <Td className="text-right text-xs font-mono font-semibold">
                      {s.duration_seconds ? formatDuration(s.duration_seconds) : "In Progress"}
                      {s.corrected && <span className="ml-1 text-[10px] text-warning font-sans">(Corrected)</span>}
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={7} className="p-0">
                    <EmptyState
                      title="No attendance records found"
                      description="Work session history will show here."
                    />
                  </Td>
                </Tr>
              )}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </div>
  );
}
