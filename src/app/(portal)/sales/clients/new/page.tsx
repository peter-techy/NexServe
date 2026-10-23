"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Field, Input, Textarea, Select, Checkbox } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { createClientWithActivityAction } from "@/app/actions/clients";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

export default function NewClientPage() {
  const [state, formAction] = useActionState(createClientWithActivityAction, initialState);

  const [contactSource, setContactSource] = React.useState("LinkedIn");
  const [workStatus, setWorkStatus] = React.useState("Followup");
  const [selectedCriteria, setSelectedCriteria] = React.useState<string[]>(["Digital Marketing"]);
  const [followUpRequired, setFollowUpRequired] = React.useState(true);

  const handleCriteriaToggle = (criterion: string) => {
    setSelectedCriteria(prev =>
      prev.includes(criterion) ? prev.filter(c => c !== criterion) : [...prev, criterion]
    );
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setWorkStatus(val);
    if (val === "Followup") {
      setFollowUpRequired(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Add Client & Activity Record"
        description="Log contact information and initial interaction outcomes"
        breadcrumbs={[
          { label: "Dashboard", href: "/sales/dashboard" },
          { label: "Clients", href: "/sales/clients" },
          { label: "New Client Record" },
        ]}
      />

      <form action={formAction}>
        {state?.message && !state.ok && (
          <Alert tone="danger" className="mb-6">{state.message}</Alert>
        )}

        <div className="space-y-6">
          {/* Section A: Contact Information */}
          <Card>
            <CardHeader
              title="A. Contact Information"
              description="Primary point of contact and organisation details"
            />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Person's Name"
                  htmlFor="person_name"
                  required
                  errors={state?.fieldErrors?.person_name}
                >
                  <Input id="person_name" name="person_name" placeholder="e.g. John Doe" required />
                </Field>

                <Field
                  label="Business Name"
                  htmlFor="business_name"
                  required
                  errors={state?.fieldErrors?.business_name}
                >
                  <Input id="business_name" name="business_name" placeholder="e.g. Acme Corp" required />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Location"
                  htmlFor="location"
                  required
                  errors={state?.fieldErrors?.location}
                >
                  <Input id="location" name="location" placeholder="e.g. Bangalore, KA" required />
                </Field>

                <Field
                  label="Client Number / Phone"
                  htmlFor="client_number"
                  errors={state?.fieldErrors?.client_number}
                >
                  <Input id="client_number" name="client_number" placeholder="e.g. +91 98765 43210" />
                </Field>
              </div>
            </CardBody>
          </Card>

          {/* Section B: Contact Source */}
          <Card>
            <CardHeader
              title="B. Source of Contact"
              description="Where was this lead or client acquired?"
            />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Contact Source"
                  htmlFor="contact_source"
                  required
                  errors={state?.fieldErrors?.contact_source}
                >
                  <Select
                    id="contact_source"
                    name="contact_source"
                    value={contactSource}
                    onChange={(e) => setContactSource(e.target.value)}
                    required
                  >
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

                {contactSource === "Other" && (
                  <Field
                    label="Specify Contact Source"
                    htmlFor="contact_source_other"
                    required
                    errors={state?.fieldErrors?.contact_source_other}
                  >
                    <Input
                      id="contact_source_other"
                      name="contact_source_other"
                      placeholder="e.g. Trade Expo, Webinar"
                      required
                    />
                  </Field>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Section C: Client Review & Notes */}
          <Card>
            <CardHeader
              title="C. Client Review & Observations"
              description="Record qualitative feedback, requirements and conversation summary"
            />
            <CardBody className="space-y-4">
              <Field
                label="Review of the Client"
                htmlFor="client_review"
                required
                errors={state?.fieldErrors?.client_review}
                hint="Summarise what the client discussed, their pain points and readiness"
              >
                <Textarea
                  id="client_review"
                  name="client_review"
                  placeholder="Enter detailed client observations..."
                  rows={4}
                  required
                />
              </Field>

              <Field
                label="Internal Notes (Optional)"
                htmlFor="notes"
              >
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Private internal notes or context..."
                  rows={2}
                />
              </Field>
            </CardBody>
          </Card>

          {/* Section D & E: Criteria & Work Status */}
          <Card>
            <CardHeader
              title="D & E. Criteria & Work Status"
              description="Specify the engagement areas and current work status"
            />
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Criteria (Select one or more) <span className="text-danger">*</span>
                </label>
                <div className="flex flex-wrap gap-4">
                  {["Digital Marketing", "Content Creation", "Special Demand"].map((crit) => (
                    <label key={crit} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        name="criteria"
                        value={crit}
                        checked={selectedCriteria.includes(crit)}
                        onChange={() => handleCriteriaToggle(crit)}
                        className="size-4 rounded border-line-strong text-brand-teal accent-[#187890]"
                      />
                      <span>{crit}</span>
                    </label>
                  ))}
                </div>
                {state?.fieldErrors?.criteria && (
                  <p className="text-xs text-danger mt-1">{state.fieldErrors.criteria[0]}</p>
                )}
              </div>

              <Field
                label="General Criteria Description"
                htmlFor="criteria_description"
                hint="Detail the client's expectations for the selected service areas"
              >
                <Textarea
                  id="criteria_description"
                  name="criteria_description"
                  placeholder="Provide scope details for marketing or content creation..."
                  rows={3}
                />
              </Field>

              {selectedCriteria.includes("Special Demand") && (
                <Field
                  label="Special Demand Description"
                  htmlFor="special_demand_description"
                  required
                  errors={state?.fieldErrors?.special_demand_description}
                >
                  <Textarea
                    id="special_demand_description"
                    name="special_demand_description"
                    placeholder="Describe specific custom technical or operational requirements..."
                    rows={3}
                    required
                  />
                </Field>
              )}

              <div className="pt-2 border-t border-line grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Status of the Work"
                  htmlFor="work_status"
                  required
                >
                  <Select
                    id="work_status"
                    name="work_status"
                    value={workStatus}
                    onChange={handleStatusChange}
                    required
                  >
                    <option value="Followup">Followup</option>
                    <option value="Done">Done</option>
                    <option value="Cancelled">Cancelled</option>
                  </Select>
                </Field>

                {workStatus === "Done" && (
                  <Field
                    label="Deal Outcome"
                    htmlFor="deal_outcome"
                    hint="Distinguishes standard activity completion from a closed commercial deal"
                  >
                    <Select id="deal_outcome" name="deal_outcome" defaultValue="won">
                      <option value="won">Deal Won (Closed-Won)</option>
                      <option value="lost">Deal Lost</option>
                    </Select>
                  </Field>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Section F: Follow-up Details */}
          <Card>
            <CardHeader
              title="F. Follow-up Details"
              description="Configure reminders and scheduled next steps"
            />
            <CardBody className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-ink">
                <Checkbox
                  name="follow_up_required"
                  checked={followUpRequired}
                  onChange={(e) => setFollowUpRequired(e.target.checked)}
                />
                <span>Follow-up Required</span>
              </label>

              {followUpRequired && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label="Follow-up Date"
                      htmlFor="follow_up_date"
                      required
                      errors={state?.fieldErrors?.follow_up_date}
                    >
                      <Input
                        id="follow_up_date"
                        name="follow_up_date"
                        type="date"
                        required={followUpRequired}
                      />
                    </Field>

                    <Field
                      label="Follow-up Time"
                      htmlFor="follow_up_time"
                    >
                      <Input
                        id="follow_up_time"
                        name="follow_up_time"
                        type="time"
                        defaultValue="10:00"
                      />
                    </Field>
                  </div>

                  <Field
                    label="Follow-up Notes / Objective"
                    htmlFor="follow_up_notes"
                  >
                    <Input
                      id="follow_up_notes"
                      name="follow_up_notes"
                      placeholder="e.g. Review revised proposal with VP of Marketing"
                    />
                  </Field>
                </div>
              )}
            </CardBody>
          </Card>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button asChild variant="secondary">
              <Link href="/sales/clients">Cancel</Link>
            </Button>
            <SubmitButton pendingText="Saving Record…">
              Save Client Record
            </SubmitButton>
          </div>
        </div>
      </form>
    </div>
  );
}
