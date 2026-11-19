import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { listClientPayments } from "@/lib/payments";

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !session.profile.is_active) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const allowedRoles = ["sales", "finance", "hr", "super_admin"];
  if (!allowedRoles.includes(session.profile.role)) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const status = statusParam === "Done" || statusParam === "Pending" ? statusParam : undefined;
  const search = searchParams.get("q") || undefined;
  const format = (searchParams.get("format") || "json").toLowerCase();

  const salespersonId =
    session.profile.role === "sales" ? session.profile.id : undefined;

  const payments = await listClientPayments({
    salespersonId,
    status,
    search,
  });

  if (format === "csv") {
    const headers = [
      "Payment ID",
      "Client Name",
      "Business Name",
      "Phone",
      "Location",
      "Deadline",
      "Amount (INR)",
      "Status",
      "Razorpay Payment ID",
      "Paid At",
      "Salesperson",
      "Created At",
    ];

    const lines = [
      headers.map(csvEscape).join(","),
      ...payments.map((p) =>
        [
          p.id,
          p.client_name || "",
          p.business_name || "",
          p.phone || "",
          p.location || "",
          p.deadline || "",
          p.amount,
          p.status,
          p.razorpay_payment_id || "",
          p.paid_at || "",
          p.salesperson_name || "",
          p.created_at,
        ]
          .map(csvEscape)
          .join(",")
      ),
    ];

    const today = new Date().toISOString().slice(0, 10);
    return new NextResponse(lines.join("\r\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nexserve-payments-history-${today}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  let totalCollected = 0;
  let totalPending = 0;
  let countDone = 0;
  let countPending = 0;
  for (const p of payments) {
    if (p.status === "Done") {
      totalCollected += p.amount;
      countDone += 1;
    } else {
      totalPending += p.amount;
      countPending += 1;
    }
  }

  return NextResponse.json(
    {
      ok: true,
      summary: {
        totalCollected,
        totalPending,
        countDone,
        countPending,
        totalRecords: payments.length,
      },
      payments,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
