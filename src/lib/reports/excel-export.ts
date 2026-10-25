import ExcelJS from "exceljs";
import { formatDuration } from "@/lib/utils";
import type { Department } from "@/lib/types";

export interface ActivityReportRow {
  employee_id: string;
  employee_name: string;
  employee_is_active?: boolean;
  department: Department;
  work_date: string;
  client_name: string;
  business_name: string;
  location: string;
  client_number: string;
  contact_source: string;
  client_review: string;
  work_status: string;
  criteria: string;
  clients_contacted: number;
  followups_pending: number;
  deals_done: number;
  work_duration: number; // in seconds
}

export interface EmployeeDirectoryRow {
  employee_id: string;
  full_name: string;
  department: Department | string;
  role: string;
  email: string;
  phone?: string | null;
  is_active: boolean;
  created_at?: string;
  total_activities?: number;
}

export async function generateHRActivityExcel(
  records: ActivityReportRow[],
  meta: {
    dateRangeLabel: string;
    generatedAt: string;
    exportedBy: string;
    employees?: EmployeeDirectoryRow[];
  }
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "NexServe Portal";
  workbook.created = new Date();

  // =========================================================================
  // WORKSHEET 1: Activity Report
  // =========================================================================
  const worksheet = workbook.addWorksheet("Activity Report", {
    views: [{ state: "frozen", ySplit: 5, xSplit: 0 }],
  });

  // Title & Metadata rows
  worksheet.addRow(["NexServe Corporate Management Portal — Employee Activity Report"]);
  worksheet.getCell("A1").font = { name: "Arial", size: 14, bold: true, color: { argb: "FF0C2448" } };

  worksheet.addRow([`Report Period: ${meta.dateRangeLabel}`, "", "", `Generated: ${meta.generatedAt}`]);
  worksheet.addRow([`Exported By: ${meta.exportedBy}`, "", "", `Total Records: ${records.length}`]);
  worksheet.addRow([]); // Blank spacer

  // Columns: Standard 16 client columns + Column 17: Employee Status
  const headerRow = worksheet.addRow([
    "Employee ID",
    "Name of the Employee",
    "Department of the Employee",
    "Date of Work",
    "Name of the Client",
    "Business Name",
    "Location",
    "Client Number",
    "Source of Contact",
    "Review of the Client",
    "Status of the Work",
    "Criteria",
    "Clients Contacted",
    "Follow-up Pending",
    "Deals Done",
    "Work Duration",
    "Employee Status",
  ]);

  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0C2448" }, // Navy header
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD1D5DB" } },
      bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
      left: { style: "thin", color: { argb: "FFD1D5DB" } },
      right: { style: "thin", color: { argb: "FFD1D5DB" } },
    };
  });

  // Align numeric and status columns
  [13, 14, 15, 16].forEach((colIdx) => {
    const cell = headerRow.getCell(colIdx);
    cell.alignment = { vertical: "middle", horizontal: "right" };
  });
  headerRow.getCell(17).alignment = { vertical: "middle", horizontal: "center" };

  // Populate data rows
  records.forEach((row, index) => {
    const isDeactivated = row.employee_is_active === false;
    const employeeDisplayName = isDeactivated
      ? `${row.employee_name} [DEACTIVATED]`
      : row.employee_name;
    const employeeStatusLabel = isDeactivated ? "DEACTIVATED" : "Active";

    const dataRow = worksheet.addRow([
      row.employee_id,
      employeeDisplayName,
      row.department,
      row.work_date,
      row.client_name,
      row.business_name,
      row.location,
      row.client_number || "—",
      row.contact_source,
      row.client_review,
      row.work_status,
      row.criteria,
      row.clients_contacted,
      row.followups_pending,
      row.deals_done,
      formatDuration(row.work_duration),
      employeeStatusLabel,
    ]);

    dataRow.height = 20;
    const isEven = index % 2 === 0;

    dataRow.eachCell((cell, colNumber) => {
      cell.font = { name: "Arial", size: 9 };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };

      if (isEven) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF9FAFB" },
        };
      }

      if ([13, 14, 15, 16].includes(colNumber)) {
        cell.alignment = { horizontal: "right", vertical: "middle" };
      } else if (colNumber === 17) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }

      // Special highlight for deactivated employee status column
      if (colNumber === 17) {
        if (isDeactivated) {
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFDC2626" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFEE2E2" }, // Soft red alert
          };
        } else {
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF15803D" } };
        }
      }
    });
  });

  // Enable AutoFilter on header row
  worksheet.autoFilter = {
    from: "A5",
    to: "Q5",
  };

  // Adjust column widths
  worksheet.columns = [
    { width: 14 }, // Employee ID
    { width: 26 }, // Employee Name
    { width: 16 }, // Department
    { width: 14 }, // Date of Work
    { width: 20 }, // Client Name
    { width: 24 }, // Business Name
    { width: 18 }, // Location
    { width: 16 }, // Client Number
    { width: 18 }, // Source of Contact
    { width: 32 }, // Review of Client
    { width: 14 }, // Status of Work
    { width: 24 }, // Criteria
    { width: 16 }, // Clients Contacted
    { width: 16 }, // Follow-up Pending
    { width: 14 }, // Deals Done
    { width: 16 }, // Work Duration
    { width: 18 }, // Employee Status
  ];

  // =========================================================================
  // WORKSHEET 2: Employee Directory & Status
  // =========================================================================
  if (meta.employees && meta.employees.length > 0) {
    const dirSheet = workbook.addWorksheet("Employees & Status", {
      views: [{ state: "frozen", ySplit: 5, xSplit: 0 }],
    });

    dirSheet.addRow(["NexServe Corporate Management Portal — Employee Status Directory"]);
    dirSheet.getCell("A1").font = { name: "Arial", size: 14, bold: true, color: { argb: "FF0C2448" } };

    const activeCount = meta.employees.filter((e) => e.is_active).length;
    const deactivatedCount = meta.employees.length - activeCount;

    dirSheet.addRow([
      `Total Employees: ${meta.employees.length}`,
      `Active: ${activeCount}`,
      `Deactivated: ${deactivatedCount}`,
      `Generated: ${meta.generatedAt}`,
    ]);
    dirSheet.addRow([`Exported By: ${meta.exportedBy}`]);
    dirSheet.addRow([]); // Blank spacer

    const dirHeader = dirSheet.addRow([
      "Employee ID",
      "Full Name",
      "Department",
      "Role",
      "Work Email",
      "Contact Phone",
      "Account Status",
      "Total Activities",
      "Date Added",
    ]);

    dirHeader.height = 24;
    dirHeader.eachCell((cell) => {
      cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF187890" }, // Brand teal header
      };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFD1D5DB" } },
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
        left: { style: "thin", color: { argb: "FFD1D5DB" } },
        right: { style: "thin", color: { argb: "FFD1D5DB" } },
      };
    });

    dirHeader.getCell(7).alignment = { vertical: "middle", horizontal: "center" };
    dirHeader.getCell(8).alignment = { vertical: "middle", horizontal: "right" };

    meta.employees.forEach((emp, index) => {
      const isDeactivated = !emp.is_active;
      const statusLabel = isDeactivated ? "DEACTIVATED" : "ACTIVE";

      const dirRow = dirSheet.addRow([
        emp.employee_id,
        isDeactivated ? `${emp.full_name} [DEACTIVATED]` : emp.full_name,
        emp.department,
        emp.role.toUpperCase(),
        emp.email,
        emp.phone || "—",
        statusLabel,
        emp.total_activities ?? 0,
        emp.created_at ? new Date(emp.created_at).toLocaleDateString() : "—",
      ]);

      dirRow.height = 20;
      const isEven = index % 2 === 0;

      dirRow.eachCell((cell, colNumber) => {
        cell.font = { name: "Arial", size: 9 };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };

        if (isEven) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF9FAFB" },
          };
        }

        if (colNumber === 7) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          if (isDeactivated) {
            cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFDC2626" } };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFEE2E2" }, // Soft red alert
            };
          } else {
            cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF15803D" } };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFDCFCE7" }, // Soft green
            };
          }
        } else if (colNumber === 8) {
          cell.alignment = { horizontal: "right", vertical: "middle" };
        } else {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        }
      });
    });

    dirSheet.autoFilter = {
      from: "A5",
      to: "I5",
    };

    dirSheet.columns = [
      { width: 16 }, // Employee ID
      { width: 26 }, // Full Name
      { width: 16 }, // Department
      { width: 14 }, // Role
      { width: 28 }, // Work Email
      { width: 18 }, // Contact Phone
      { width: 18 }, // Account Status
      { width: 18 }, // Total Activities
      { width: 16 }, // Date Added
    ];
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
