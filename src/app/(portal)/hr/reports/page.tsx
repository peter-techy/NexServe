import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Select, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Download, CheckCircle2 } from "lucide-react";

export default async function HRReportsPage() {
  await requireRole(["hr", "super_admin"]);
  const supabase = await createClient();

  const { data: salesEmployees } = await supabase
    .from("profiles")
    .select("id, full_name, employee_id")
    .eq("department", "Sales")
    .order("full_name");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Reports & Excel Export"
        description="Generate and download compliant employee activity spreadsheets (.xlsx)"
      />

      <Card>
        <CardHeader
          title="Export Activity Report"
          description="Downloads real records matching the 16 standard columns specified in company requirements"
        />
        <CardBody className="p-6">
          <form method="GET" action="/api/reports/excel" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wide mb-1.5">
                  Select Employee
                </label>
                <Select name="emp">
                  <option value="">All Employees</option>
                  {salesEmployees?.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name} ({e.employee_id})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wide mb-1.5">
                  From Date
                </label>
                <Input name="from" type="date" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wide mb-1.5">
                  To Date
                </label>
                <Input name="to" type="date" />
              </div>
            </div>

            <div className="p-4 rounded-md bg-canvas border border-line text-xs text-ink-muted space-y-2">
              <p className="font-semibold text-brand-navy flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-brand-teal" /> Verified Excel Structure:
              </p>
              <p>
                The generated XLSX report contains all 16 client-specified columns: Employee ID, Employee Name, Department, Date of Work, Client Name, Business Name, Location, Client Number, Source of Contact, Review of the Client, Status of the Work, Criteria, Clients Contacted, Follow-up Pending, Deals Done, and Work Duration.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" className="gap-2">
                <Download className="size-4" /> Download .XLSX Report
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
