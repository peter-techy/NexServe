import { notFound } from "next/navigation";
import { requireRole, getAvailableHrMembers } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Field, Input, Textarea, Select, Checkbox } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { updateClientActivityAction, archiveClientAction } from "@/app/actions/clients";
import { getProofsForActivity } from "@/lib/proofs";
import { ProofsSection } from "@/components/clients/proofs-section";
import { ForwardDealButton } from "@/components/deals/forward-deal-button";
import { CheckCircle2, Sparkles } from "lucide-react";
import type { WorkStatus } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const session = await requireRole(["sales", "hr", "super_admin"]);
  const { id } = await params;

  const supabase = await createClient();

  // Fetch client activity, client record, proofs, and available HR members in parallel
  const [{ data: activity, error }, availableHrList] = await Promise.all([
    supabase
      .from("client_activities")
      .select(`
        *,
        client:clients (*)
      `)
      .eq("id", id)
      .single(),
    getAvailableHrMembers(),
  ]);

  if (error || !activity) {
    notFound();
  }

  // Authorization check: Sales role can only access records they own
  if (session.profile.role === "sales" && activity.employee_id !== session.profile.id) {
    notFound();
  }

  const client = activity.client;
  const proofs = await getProofsForActivity(activity.id);

  const isForwarded = activity.notes?.includes("[FORWARDED TO HR");
  const forwardMatch = activity.notes?.match(/\[FORWARDED TO HR \((?:to )?([^)]+)\)/);
  const forwardedToName = forwardMatch ? forwardMatch[1] : undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={`${client.business_name}`}
        description={`Contact: ${client.person_name} · ${client.location}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/sales/dashboard" },
          { label: "Clients", href: "/sales/clients" },
          { label: client.business_name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <ForwardDealButton
              activityId={activity.id}
              businessName={client.business_name}
              personName={client.person_name}
              isForwarded={isForwarded}
              forwardedToName={forwardedToName}
              isDone={activity.work_status === "Done"}
              availableHrList={availableHrList}
            />
          </div>
        }
      />

      {/* Deal Forwarded Notice Banner */}
      {isForwarded && (
        <div className="rounded-xl border border-brand-teal/30 bg-brand-teal-50/70 p-3.5 text-xs text-brand-navy flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-brand-teal shrink-0" />
            <div>
              <p className="font-semibold text-brand-navy">
                Deal Won &amp; Forwarded to HR {forwardedToName ? `(${forwardedToName})` : ""}
              </p>
              <p className="text-ink-muted text-[11px] mt-0.5">
                This account is currently in HR review for employee crediting and contract onboarding.
              </p>
            </div>
          </div>
          <Badge tone="teal" className="text-[11px]">
            In HR Queue
          </Badge>
        </div>
      )}

      {/* Deal Done but Not Forwarded Callout */}
      {!isForwarded && activity.work_status === "Done" && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 text-xs text-amber-950 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold text-amber-950">
                Deal Closed! Ready to Forward to HR
              </p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Click &quot;Deal Done · Forward to HR&quot; above to choose an available HR representative.
              </p>
            </div>
          </div>
        </div>
      )}

      <form action={updateClientActivityAction as any}>
        <input type="hidden" name="activity_id" value={activity.id} />

        <div className="space-y-6">
          {/* Client Details (Read-only reference) */}
          <Card>
            <CardHeader
              title="Client Identity & Contact Information"
              description="Core contact record associated with this account"
            />
            <CardBody className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-ink-subtle">Person&apos;s Name</p>
                <p className="font-medium text-ink mt-0.5">{client.person_name}</p>
              </div>
              <div>
                <p className="text-xs text-ink-subtle">Business Name</p>
                <p className="font-semibold text-brand-navy mt-0.5">{client.business_name}</p>
              </div>
              <div>
                <p className="text-xs text-ink-subtle">Location</p>
                <p className="text-ink mt-0.5">{client.location}</p>
              </div>
              <div>
                <p className="text-xs text-ink-subtle">Client Number</p>
                <p className="font-mono text-ink mt-0.5">{client.client_number || "—"}</p>
              </div>
            </CardBody>
          </Card>

          {/* Activity Record Updates */}
          <Card>
            <CardHeader
              title="Interaction Details & Status"
              description="Update conversation outcomes, review, and follow-up flags"
            />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Contact Source" htmlFor="contact_source" required>
                  <Select id="contact_source" name="contact_source" defaultValue={activity.contact_source}>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Referral">Referral</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Email">Email</option>
                    <option value="Website">Website</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Other">Other</option>
                  </Select>
                </Field>

                <Field label="Status of Work" htmlFor="work_status" required>
                  <Select id="work_status" name="work_status" defaultValue={activity.work_status}>
                    <option value="Followup">Followup</option>
                    <option value="Done">Done</option>
                    <option value="Cancelled">Cancelled</option>
                  </Select>
                </Field>
              </div>

              <Field label="Review of the Client" htmlFor="client_review" required>
                <Textarea
                  id="client_review"
                  name="client_review"
                  defaultValue={activity.client_review}
                  rows={4}
                  required
                />
              </Field>

              <Field label="Internal Notes" htmlFor="notes">
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={activity.notes || ""}
                  rows={2}
                />
              </Field>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Criteria
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    "Outsourcing",
                    "Offshoring",
                    "Dedicated Hiring",
                    "Project-Based Delivery",
                    "Custom Staffing",
                    "Technical Support",
                    "Consulting",
                  ].map((criterion) => {
                    const isChecked = activity.criteria?.includes(criterion);
                    return (
                      <label
                        key={criterion}
                        className="flex items-center gap-2 p-2 rounded-lg border border-line hover:bg-white/60 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          name="criteria"
                          value={criterion}
                          defaultChecked={isChecked}
                          className="rounded text-brand-teal focus:ring-brand-teal"
                        />
                        <span className="text-ink">{criterion}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <Field label="Criteria Description" htmlFor="criteria_description">
                <Textarea
                  id="criteria_description"
                  name="criteria_description"
                  defaultValue={activity.criteria_description || ""}
                  rows={2}
                />
              </Field>

              <Field label="Special Demand Description" htmlFor="special_demand_description">
                <Textarea
                  id="special_demand_description"
                  name="special_demand_description"
                  defaultValue={activity.special_demand_description || ""}
                  rows={2}
                />
              </Field>

              <div className="pt-4 border-t border-line space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-ink">
                    <Checkbox
                      name="follow_up_required"
                      defaultChecked={activity.follow_up_required}
                    />
                    <span>Follow-up Required</span>
                  </label>

                  {activity.follow_up_required && !activity.follow_up_completed_at && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-brand-teal">
                      <Checkbox name="follow_up_completed" />
                      <span>Mark Follow-up as Completed</span>
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Follow-up Date" htmlFor="follow_up_date">
                    <Input
                      id="follow_up_date"
                      name="follow_up_date"
                      type="date"
                      defaultValue={activity.follow_up_at ? activity.follow_up_at.slice(0, 10) : ""}
                    />
                  </Field>

                  <Field label="Follow-up Notes" htmlFor="follow_up_notes">
                    <Input
                      id="follow_up_notes"
                      name="follow_up_notes"
                      defaultValue={activity.follow_up_notes || ""}
                    />
                  </Field>
                </div>
              </div>

              <div className="pt-4 border-t border-line flex justify-between items-center">
                <div className="text-xs text-ink-subtle">
                  Record Created: {new Date(activity.created_at).toLocaleString()}
                </div>
                <SubmitButton pendingText="Updating Record…">
                  Update Activity
                </SubmitButton>
              </div>
            </CardBody>
          </Card>
        </div>
      </form>

      {/* Interaction Proofs & Call Recordings Section (Independent from parent form) */}
      <ProofsSection activityId={activity.id} initialProofs={proofs} />
    </div>
  );
}
