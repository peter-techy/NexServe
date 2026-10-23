import ExcelJS from "exceljs";
import { formatDuration, secondsToHours } from "@/lib/utils";
import type { Department } from "@/lib/types";

export interface ActivityReportRow {
  employee_id: string;
  employee_name: string;
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

export async function generateHRActivityExcel(
  records: ActivityReportRow[],
  meta: {
    dateRangeLabel: string;
    generatedAt: string;
    exportedBy: string;
  }
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "NexServe Portal";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Activity Report", {
    views: [{ state: "frozen", ySplit: 5, xSplit: 0 }],
  });

  // Title & Metadata rows
  worksheet.addRow(["NexServe Corporate Management Portal — Employee Activity Report"]);
  worksheet.getCell("A1").font = { name: "Arial", size: 14, bold: true, color: { argb: "FF0C2448" } };

  worksheet.addRow([`Report Period: ${meta.dateRangeLabel}`, "", "", `Generated: ${meta.generatedAt}`]);
  worksheet.addRow([`Exported By: ${meta.exportedBy}`, "", "", `Total Records: ${records.length}`]);
  worksheet.addRow([]); // Blank spacer

  // Required 16 columns matching client specifications in exact order:
  // 1. Employee ID
  // 2. Name of the Employee
  // 3. Department of the Employee
  // 4. Date of Work
  // 5. Name of the Client
  // 6. Business Name
  // 7. Location
  // 8. Client Number
  // 9. Source of Contact
  // 10. Review of the Client
  // 11. Status of the Work
  // 12. Criteria
  // 13. Clients Contacted
  // 14. Follow-up Pending
  // 15. Deals Done
  // 16. Work Duration
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

  // Numeric column alignments
  [13, 14, 15, 16].forEach((colIdx) => {
    const cell = headerRow.getCell(colIdx);
    cell.alignment = { vertical: "middle", horizontal: "right" };
  });

  // Populate data rows
  records.forEach((row, index) => {
    const dataRow = worksheet.addRow([
      row.employee_id,
      row.employee_name,
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
      } else {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
    });
  });

  // Enable AutoFilter on header row
  worksheet.autoFilter = {
    from: "A5",
    to: "P5",
  };

  // Adjust column widths
  worksheet.columns = [
    { width: 14 }, // Employee ID
    { width: 22 }, // Employee Name
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
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
