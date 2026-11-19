import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { listClientPayments, getFinanceMetrics } from "@/lib/payments";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Table, TableWrap, Th, Td, Tr } from "@/components/ui/table";
import { PaymentStatusBadge } from "@/components/ui/badge";
import { KpiCard, EmptyState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { CopyPaymentLinkButton } from "@/components/payments/copy-payment-link-button";
import {
  IndianRupee,
  Clock,
  CheckCircle2,
  Users,
  ArrowRight,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FinanceDashboardPage() {
  const session = await requireRole(["finance", "super_admin"]);

  const [metrics, payments] = await Promise.all([
    getFinanceMetrics(),
    listClientPayments(),
  ]);

  const recentTransactions = payments.slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Dashboard"
        description="Corporate revenue overview, collections, and client billing lifecycle"
        actions={
          <Button asChild variant="secondary">
            <Link href="/finance/clients">
              View All Clients <ArrowRight className="size-4 ml-1" />
            </Link>
          </Button>
        }
      />

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Total Revenue Collected"
          value={`₹${metrics.totalCollected.toLocaleString("en-IN")}`}
          hint={`${metrics.countDone} paid invoice${metrics.countDone === 1 ? "" : "s"}`}
          icon={<IndianRupee className="size-4" />}
        />
        <KpiCard
          label="Pending Receivables"
          value={`₹${metrics.totalPending.toLocaleString("en-IN")}`}
          hint={`${metrics.countPending} client invoice${metrics.countPending === 1 ? "" : "s"} outstanding`}
          icon={<Clock className="size-4" />}
        />
        <KpiCard
          label="Settled Invoices"
          value={metrics.countDone}
          hint="Transactions marked as Done"
          icon={<CheckCircle2 className="size-4" />}
        />
        <KpiCard
          label="Total Onboarding Accounts"
          value={metrics.totalRecords}
          hint="Total client payment engagements"
          icon={<Users className="size-4" />}
        />
      </div>

      {/* Quick Financial Health Banner */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader
              title="Recent Client Invoices & Payments"
              description="Latest client billing records synchronized live across Sales and Finance"
            />
            <TableWrap>
              <Table>
                <thead>
                  <Tr>
                    <Th>Client & Business</Th>
                    <Th>Salesperson</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                    <Th>Date</Th>
                    <Th className="text-right">Action</Th>
                  </Tr>
                </thead>
                <tbody>
                  {recentTransactions.length === 0 ? (
                    <Tr>
                      <Td colSpan={6} className="py-8">
                        <EmptyState
                          title="No transactions yet"
                          description="When sales agents generate links and clients pay, records appear here automatically."
                        />
                      </Td>
                    </Tr>
                  ) : (
                    recentTransactions.map((tx) => (
                      <Tr key={tx.id}>
                        <Td>
                          <div className="font-medium text-[#142f4c]">
                            {tx.client_name || <span className="text-slate-400 italic">Awaiting details</span>}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {tx.business_name || "-"}
                          </div>
                        </Td>
                        <Td className="text-xs text-slate-700">
                          {tx.salesperson_name || "Sales Executive"}
                        </Td>
                        <Td className="font-bold text-[#142f4c]">
                          ₹{tx.amount.toLocaleString("en-IN")}
                        </Td>
                        <Td>
                          <PaymentStatusBadge status={tx.status} />
                        </Td>
                        <Td className="text-xs text-slate-500">
                          {new Date(tx.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </Td>
                        <Td className="text-right">
                          <CopyPaymentLinkButton paymentId={tx.id} />
                        </Td>
                      </Tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        </div>

        {/* Right Column: Financial Highlights Card */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader
              title="Collections Summary"
              description="Breakdown of settled vs. outstanding billing"
            />
            <CardBody className="space-y-4 text-xs">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-800">Settled Collections</span>
                  <span className="font-extrabold text-emerald-900">
                    ₹{metrics.totalCollected.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-emerald-200">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all"
                    style={{
                      width: `${
                        metrics.totalCollected + metrics.totalPending > 0
                          ? Math.round(
                              (metrics.totalCollected /
                                (metrics.totalCollected + metrics.totalPending)) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-emerald-700">
                  {metrics.totalCollected + metrics.totalPending > 0
                    ? Math.round(
                        (metrics.totalCollected /
                          (metrics.totalCollected + metrics.totalPending)) *
                          100
                      )
                    : 0}
                  % total volume realized
                </p>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-800">Pending Receivables</span>
                  <span className="font-extrabold text-amber-900">
                    ₹{metrics.totalPending.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-amber-700">
                  {metrics.countPending} client link{metrics.countPending === 1 ? "" : "s"} awaiting client completion
                </p>
              </div>

              <div className="pt-2">
                <Button asChild variant="secondary" className="w-full justify-center text-xs">
                  <Link href="/finance/clients">
                    View Complete Client Directory
                  </Link>
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
