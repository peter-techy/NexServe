import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { generateHRActivityExcel, ActivityReportRow, EmployeeDirectoryRow } from "@/lib/reports/excel-export";
import { getSettings } from "@/lib/settings";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.profile.role !== "hr" && session.profile.role !== "super_admin")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const emp = searchParams.get("emp");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const settings = await getSettings();
  const supabase = await createClient();

  // 1. Query client activities with employee profile including is_active status
  let query = supabase
    .from("client_activities")
    .select(`
      id,
      contact_date,
      contact_source,
      client_review,
      work_status,
      criteria,
      employee:profiles!client_activities_employee_id_fkey (
        id,
        employee_id,
        full_name,
        department,
        is_active
      ),
      client:clients!inner (
        person_name,
        business_name,
        location,
        client_number
      )
    `)
    .order("contact_date", { ascending: false });

  if (emp) {
    query = query.eq("employee_id", emp);
  }
  if (from) {
    query = query.gte("contact_date", `${from}T00:00:00Z`);
  }
  if (to) {
    query = query.lte("contact_date", `${to}T23:59:59Z`);
  }

  const { data: activities, error } = await query;

  if (error) {
    return new NextResponse(`Database error: ${error.message}`, { status: 500 });
  }

  // 2. Query all employee profiles for the Employee Directory & Status worksheet
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, employee_id, full_name, department, role, email, phone, is_active, created_at")
    .order("is_active", { ascending: false })
    .order("employee_id", { ascending: true });

  // Count activities per employee id for directory summary
  const activityCountByEmp: Record<string, number> = {};
  (activities || []).forEach((act: any) => {
    const eId = act.employee?.id;
    if (eId) {
      activityCountByEmp[eId] = (activityCountByEmp[eId] || 0) + 1;
    }
  });

  const directoryRows: EmployeeDirectoryRow[] = (allProfiles || []).map((prof: any) => ({
    employee_id: prof.employee_id || "—",
    full_name: prof.full_name || "—",
    department: prof.department || "Sales",
    role: prof.role || "sales",
    email: prof.email || "—",
    phone: prof.phone || "—",
    is_active: prof.is_active ?? true,
    created_at: prof.created_at,
    total_activities: activityCountByEmp[prof.id] || 0,
  }));

  // 3. Map rows to ActivityReportRow format with employee_is_active flag
  const rows: ActivityReportRow[] = (activities || []).map((act: any) => ({
    employee_id: act.employee?.employee_id || "—",
    employee_name: act.employee?.full_name || "—",
    employee_is_active: act.employee?.is_active ?? true,
    department: act.employee?.department || "Sales",
    work_date: new Date(act.contact_date).toISOString().slice(0, 10),
    client_name: act.client?.person_name || "—",
    business_name: act.client?.business_name || "—",
    location: act.client?.location || "—",
    client_number: act.client?.client_number || "—",
    contact_source: act.contact_source || "—",
    client_review: act.client_review || "—",
    work_status: act.work_status || "—",
    criteria: Array.isArray(act.criteria) ? act.criteria.join(", ") : "—",
    clients_contacted: 1,
    followups_pending: act.work_status === "Followup" ? 1 : 0,
    deals_done: act.work_status === "Done" ? 1 : 0,
    work_duration: 3600 * 2, // Sample attributed session seconds
  }));

  const excelBuffer = await generateHRActivityExcel(rows, {
    dateRangeLabel: from && to ? `${from} to ${to}` : "All Records",
    generatedAt: new Date().toLocaleString(),
    exportedBy: `${session.profile.full_name} (${session.profile.employee_id})`,
    employees: directoryRows,
  });

  const filename = `NexServe_Activity_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(new Uint8Array(excelBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
