import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Field, Input, Textarea, Select, Checkbox } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { updateClientActivityAction, archiveClientAction } from "@/app/actions/clients";
import type { WorkStatus } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const session = await requireRole(["sales", "super_admin"]);
  const { id } = await params;

  const supabase = await createClient();

  // Fetch client activity and client record
  const { data: activity, error } = await supabase
    .from("client_activities")
    .select(`
      *,
      client:clients (*)
    `)
    .eq("id", id)
    .single();

  if (error || !activity) {
    notFound();
  }

  // Authorization check: Sales role can only access records they own
  if (session.profile.role === "sales" && activity.employee_id !== session.profile.id) {
    notFound();
  }

  const client = activity.client;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={`${client.business_name}`}
        description={`Contact: ${client.person_name} · ${client.location}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/sales/dashboard" },
          { label: "Clients", href: "/sales/clients" },
          { label: client.business_name },
        ]}
      />

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
                <p className="text-xs text-ink-subtle">Person's Name</p>
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
                <div className="flex flex-wrap gap-4">
                  {["Digital Marketing", "Content Creation", "Special Demand"].map((crit) => (
                    <label key={crit} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        name="criteria"
                        value={crit}
                        defaultChecked={activity.criteria?.includes(crit)}
                        className="size-4 rounded border-line-strong text-brand-teal accent-[#187890]"
                      />
                      <span>{crit}</span>
                    </label>
                  ))}
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
    </div>
  );
}
