import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form";
import { Table, TableWrap, Th, Td, Tr, Pagination } from "@/components/ui/table";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { ForwardDealButton } from "@/components/deals/forward-deal-button";
import { Plus, Search, Filter, Eye } from "lucide-react";
import type { WorkStatus } from "@/lib/types";

interface Props {
  searchParams: Promise<{
    q?: string;
    status?: string;
    source?: string;
    page?: string;
  }>;
}

export default async function SalesClientsPage({ searchParams }: Props) {
  const session = await requireRole(["sales", "super_admin"]);
  const params = await searchParams;

  const page = Number(params.page) || 1;
  const pageSize = 15;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  // Query client activities with joined client info
  let query = supabase
    .from("client_activities")
    .select(`
      id,
      contact_date,
      contact_source,
      work_status,
      criteria,
      notes,
      follow_up_required,
      follow_up_at,
      created_at,
      client:clients!inner (
        id,
        person_name,
        business_name,
        location,
        client_number,
        archived_at
      )
    `, { count: "exact" })
    .is("client.archived_at", null)
    .order("contact_date", { ascending: false })
    .range(from, to);

  if (session.profile.role === "sales") {
    query = query.eq("employee_id", session.profile.id);
  }

  if (params.status) {
    query = query.eq("work_status", params.status);
  }

  if (params.source) {
    query = query.eq("contact_source", params.source);
  }

  if (params.q) {
    const q = params.q.trim();
    query = query.or(`client.person_name.ilike.%${q}%,client.business_name.ilike.%${q}%,client.client_number.ilike.%${q}%`);
  }

  const { data: records, count, error } = await query;
  const total = count || 0;

  return (
    <div>
      <PageHeader
        title="Client Management"
        description="Directory of client accounts and sales contact activity"
        actions={
          <Button asChild variant="accent">
            <Link href="/sales/clients/new">
              <Plus className="size-4 mr-1" /> Add Client Activity
            </Link>
          </Button>
        }
      />

      {/* Filter / Search Bar */}
      <Card className="mb-6">
        <CardBody className="p-4">
          <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <Input
                name="q"
                placeholder="Search person, business, number…"
                defaultValue={params.q || ""}
              />
            </div>

            <div>
              <Select name="status" defaultValue={params.status || ""}>
                <option value="">All Statuses</option>
                <option value="Followup">Followup</option>
                <option value="Done">Done</option>
                <option value="Cancelled">Cancelled</option>
              </Select>
            </div>

            <div>
              <Select name="source" defaultValue={params.source || ""}>
                <option value="">All Sources</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Referral">Referral</option>
                <option value="Phone Call">Phone Call</option>
                <option value="Email">Email</option>
                <option value="Website">Website</option>
                <option value="Social Media">Social Media</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Other">Other</option>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" variant="secondary" className="w-full">
                <Filter className="size-3.5 mr-1" /> Filter
              </Button>
              {(params.q || params.status || params.source) && (
                <Button asChild variant="ghost">
                  <Link href="/sales/clients">Reset</Link>
                </Button>
              )}
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Clients Table */}
      <Card>
        <TableWrap>
          <Table>
            <thead>
              <Tr>
                <Th>Person's Name</Th>
                <Th>Business Name</Th>
                <Th>Location</Th>
                <Th>Client Number</Th>
                <Th>Contact Source</Th>
                <Th>Criteria</Th>
                <Th>Status</Th>
                <Th>Follow-up Date</Th>
                <Th>Contact Date</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </thead>
            <tbody>
              {records && records.length > 0 ? (
                records.map((row: any) => (
                  <Tr key={row.id}>
                    <Td className="font-medium text-ink">{row.client?.person_name}</Td>
                    <Td className="font-semibold text-brand-navy">{row.client?.business_name}</Td>
                    <Td className="text-ink-muted">{row.client?.location}</Td>
                    <Td className="font-mono text-xs">{row.client?.client_number || "—"}</Td>
                    <Td>{row.contact_source}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {row.criteria?.map((c: string) => (
                          <Badge key={c} tone="neutral" className="text-[10px]">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </Td>
                    <Td>
                      <StatusBadge status={row.work_status as WorkStatus} />
                    </Td>
                    <Td className="text-xs">
                      {row.follow_up_at
                        ? new Date(row.follow_up_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </Td>
                    <Td className="text-xs text-ink-subtle">
                      {new Date(row.contact_date).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <ForwardDealButton
                          activityId={row.id}
                          businessName={row.client?.business_name || ""}
                          personName={row.client?.person_name}
                          isForwarded={row.notes?.includes("[FORWARDED TO HR")}
                          isDone={row.work_status === "Done"}
                        />
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/sales/clients/${row.id}`}>
                            <Eye className="size-3.5 mr-1" /> View / Edit
                          </Link>
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={10} className="p-0">
                    <EmptyState
                      title="No client activity records found"
                      description="No records match your criteria or none have been added yet."
                      action={
                        <Button asChild size="sm" variant="accent">
                          <Link href="/sales/clients/new">Add Client</Link>
                        </Button>
                      }
                    />
                  </Td>
                </Tr>
              )}
            </tbody>
          </Table>
        </TableWrap>

        {total > pageSize && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            base="/sales/clients"
            params={params}
          />
        )}
      </Card>
    </div>
  );
}
