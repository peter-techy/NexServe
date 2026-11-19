import { requireRole } from "@/lib/auth";
import { listClientPayments } from "@/lib/payments";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Table, TableWrap, Th, Td, Tr, Pagination } from "@/components/ui/table";
import { PaymentStatusBadge } from "@/components/ui/badge";
import { KpiCard, EmptyState } from "@/components/ui/feedback";
import { PaymentGeneratorModal } from "@/components/payments/payment-generator-modal";
import { CopyPaymentLinkButton } from "@/components/payments/copy-payment-link-button";
import { Search, IndianRupee, Clock, CheckCircle2, Link2, Download } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function SalesPaymentsPage({ searchParams }: Props) {
  const session = await requireRole(["sales", "super_admin"]);
  const params = await searchParams;

  const page = Number(params.page) || 1;
  const pageSize = 15;

  const isSalesOnly = session.profile.role === "sales";
  const salespersonFilter = isSalesOnly ? session.profile.id : undefined;

  const payments = await listClientPayments({
    salespersonId: salespersonFilter,
    status: (params.status === "Done" || params.status === "Pending") ? params.status : undefined,
    search: params.q,
  });

  const total = payments.length;
  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  const pagedRecords = payments.slice(from, to);

  // Compute metrics
  const donePayments = payments.filter((p) => p.status === "Done");
  const pendingPayments = payments.filter((p) => p.status === "Pending");
  const totalCollected = donePayments.reduce((acc, p) => acc + p.amount, 0);
  const totalPendingAmount = pendingPayments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Links & Onboarding"
        description="Generate unique shareable payment links for clients and track payment status"
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/api/payments/history?format=csv"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              <Download className="size-3.5" /> Export CSV
            </a>
            <PaymentGeneratorModal salespersonName={session.profile.full_name} />
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Total Collected"
          value={`₹${totalCollected.toLocaleString("en-IN")}`}
          hint={`${donePayments.length} successful payment${donePayments.length === 1 ? "" : "s"}`}
          icon={<IndianRupee className="size-4" />}
        />
        <KpiCard
          label="Pending Collections"
          value={`₹${totalPendingAmount.toLocaleString("en-IN")}`}
          hint={`${pendingPayments.length} link${pendingPayments.length === 1 ? "" : "s"} awaiting payment`}
          icon={<Clock className="size-4" />}
        />
        <KpiCard
          label="Completed Deals"
          value={donePayments.length}
          hint="Onboarded & paid clients"
          icon={<CheckCircle2 className="size-4" />}
        />
        <KpiCard
          label="Total Links"
          value={total}
          hint="Generated payment links"
          icon={<Link2 className="size-4" />}
        />
      </div>

      {/* Filter / Search Bar */}
      <Card>
        <CardBody className="p-4">
          <form method="GET" className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-8 relative">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={params.q || ""}
                placeholder="Search by client name, business name, phone, or location..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#185fa5] focus:outline-hidden focus:ring-1 focus:ring-[#185fa5]"
              />
            </div>

            <div className="md:col-span-3">
              <select
                name="status"
                defaultValue={params.status || ""}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-[#185fa5] focus:outline-hidden focus:ring-1 focus:ring-[#185fa5]"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div className="md:col-span-1 flex items-center justify-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-[#185fa5] py-2 px-3 text-xs font-semibold text-white shadow-xs hover:bg-[#185fa5]/90 transition"
              >
                Filter
              </button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Client Payments Table with Sales Portal Columns */}
      <Card>
        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Name of the Client</Th>
                <Th>Business Name</Th>
                <Th>Phone Number</Th>
                <Th>Location</Th>
                <Th>Deadline</Th>
                <Th>Amount</Th>
                <Th>Status (Done / Pending)</Th>
                <Th className="text-right">Shareable Link</Th>
              </Tr>
            </thead>
            <tbody>
              {pagedRecords.length === 0 ? (
                <Tr>
                  <Td colSpan={8} className="py-12">
                    <EmptyState
                      title="No payment links found"
                      description="Click '+ Payments' above to generate your first client onboarding and payment link."
                    />
                  </Td>
                </Tr>
              ) : (
                pagedRecords.map((item) => (
                  <Tr key={item.id}>
                    {/* 1. Name of the Client */}
                    <Td className="font-medium text-[#142f4c]">
                      {item.client_name ? (
                        item.client_name
                      ) : (
                        <span className="italic text-slate-400 text-xs">
                          Awaiting client input
                        </span>
                      )}
                    </Td>

                    {/* 2. Business Name */}
                    <Td className="text-slate-700">
                      {item.business_name || <span className="text-slate-400">-</span>}
                    </Td>

                    {/* 3. Phone Number */}
                    <Td className="text-slate-700 font-mono text-xs">
                      {item.phone || <span className="text-slate-400 font-sans">-</span>}
                    </Td>

                    {/* 4. Location */}
                    <Td className="text-slate-700">
                      {item.location || <span className="text-slate-400">-</span>}
                    </Td>

                    {/* 5. Deadline */}
                    <Td className="text-slate-700">
                      {item.deadline ? (
                        new Date(item.deadline).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </Td>

                    {/* 6. Amount */}
                    <Td className="font-bold text-[#142f4c]">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </Td>

                    {/* 7. Status (Done / Pending) + Payment Ref & Date */}
                    <Td>
                      <div className="flex flex-col gap-1">
                        <div>
                          <PaymentStatusBadge status={item.status} />
                        </div>
                        {item.razorpay_payment_id && (
                          <span className="font-mono text-[10px] text-slate-500">
                            {item.razorpay_payment_id}
                          </span>
                        )}
                        {item.paid_at && (
                          <span className="text-[10px] text-slate-400">
                            {new Date(item.paid_at).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    </Td>

                    {/* Actions: Copy Link */}
                    <Td className="text-right">
                      <CopyPaymentLinkButton paymentId={item.id} />
                    </Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </TableWrap>

        {total > pageSize && (
          <div className="border-t border-slate-100 p-4">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              base="/sales/payments"
              params={params}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
