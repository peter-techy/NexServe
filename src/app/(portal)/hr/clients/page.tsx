import { requireRole } from "@/lib/auth";
import { listClientPayments } from "@/lib/payments";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Table, TableWrap, Th, Td, Tr, Pagination } from "@/components/ui/table";
import { PaymentStatusBadge } from "@/components/ui/badge";
import { EmptyState, KpiCard } from "@/components/ui/feedback";
import { CopyPaymentLinkButton } from "@/components/payments/copy-payment-link-button";
import { Search, Users, User, CheckCircle2, Clock } from "lucide-react";

interface Props {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function HrClientsPage({ searchParams }: Props) {
  await requireRole(["hr", "super_admin"]);
  const params = await searchParams;

  const page = Number(params.page) || 1;
  const pageSize = 15;

  const payments = await listClientPayments({
    status: (params.status === "Done" || params.status === "Pending") ? params.status : undefined,
    search: params.q,
  });

  const total = payments.length;
  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  const pagedRecords = payments.slice(from, to);

  const doneCount = payments.filter((p) => p.status === "Done").length;
  const pendingCount = payments.filter((p) => p.status === "Pending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients & Account Directory"
        description="Unified directory of client accounts, contact coordinates, delivery deadlines, and credited salespersons"
      />

      {/* KPI Cards (No financial amounts shown for HR) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total Client Accounts"
          value={total}
          hint="All registered client engagements"
          icon={<Users className="size-4" />}
        />
        <KpiCard
          label="Active / Onboarded"
          value={doneCount}
          hint="Clients with verified onboarding & status Done"
          icon={<CheckCircle2 className="size-4" />}
        />
        <KpiCard
          label="Pending Client Intake"
          value={pendingCount}
          hint="Awaiting client completion"
          icon={<Clock className="size-4" />}
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
                placeholder="Search by client name, business name, phone, or salesperson..."
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
                <option value="Done">Done</option>
                <option value="Pending">Pending</option>
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

      {/* Table with EXACT HR Portal Columns (Excludes Amount) */}
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
                <Th>Status (Done / Pending)</Th>
                <Th>Sales Person's Name</Th>
                <Th className="text-right">Action</Th>
              </Tr>
            </thead>
            <tbody>
              {pagedRecords.length === 0 ? (
                <Tr>
                  <Td colSpan={8} className="py-12">
                    <EmptyState
                      title="No client records found"
                      description="Client onboarding records initiated by the sales team will appear here."
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
                          Awaiting client details
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
                    <Td className="text-slate-700 text-xs">
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

                    {/* 6. Status (Done / Pending) */}
                    <Td>
                      <PaymentStatusBadge status={item.status} />
                    </Td>

                    {/* 7. Sales Person's Name */}
                    <Td className="text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <User className="size-3 text-[#185fa5]" />
                        <span>{item.salesperson_name || "Sales Representative"}</span>
                      </div>
                    </Td>

                    {/* Action */}
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
              base="/hr/clients"
              params={params}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
