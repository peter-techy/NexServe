import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Field, Input, Textarea, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateSettingsAction } from "@/app/actions/settings";

export default async function AdminSettingsPage() {
  await requireRole(["super_admin"]);
  const settings = await getSettings();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Application & Organization Settings"
        description="Configure corporate brand details, business timezone, and public About Us content"
      />

      <form action={updateSettingsAction as any}>
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Corporate Identity & Timezone"
              description="Global metadata and timestamp standard"
            />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Company Name" htmlFor="company_name" required>
                  <Input
                    id="company_name"
                    name="company_name"
                    defaultValue={settings.company_name}
                    required
                  />
                </Field>

                <Field label="Company Tagline" htmlFor="company_tagline">
                  <Input
                    id="company_tagline"
                    name="company_tagline"
                    defaultValue={settings.company_tagline}
                  />
                </Field>
              </div>

              <Field label="Business Timezone" htmlFor="business_timezone" required>
                <Select
                  id="business_timezone"
                  name="business_timezone"
                  defaultValue={settings.business_timezone}
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                </Select>
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Corporate Contact Details"
              description="Official contact channels displayed on the public About Us page"
            />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Contact Email" htmlFor="contact_email">
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    placeholder="contact@nexserve.com"
                    defaultValue={settings.contact_email}
                  />
                </Field>

                <Field label="Contact Phone" htmlFor="contact_phone">
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    placeholder="+91 (0) 80 1234 5678"
                    defaultValue={settings.contact_phone}
                  />
                </Field>
              </div>

              <Field label="Physical Headquarters Address" htmlFor="contact_address">
                <Input
                  id="contact_address"
                  name="contact_address"
                  placeholder="Tower B, Central Business Park, Bangalore, KA, India"
                  defaultValue={settings.contact_address}
                />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="About Us Content"
              description="Configurable descriptions for the public About Us portal"
            />
            <CardBody className="space-y-4">
              <Field label="Company Description" htmlFor="company_description">
                <Textarea
                  id="company_description"
                  name="company_description"
                  defaultValue={settings.company_description}
                  rows={3}
                />
              </Field>

              <Field label="Mission Statement" htmlFor="mission">
                <Textarea
                  id="mission"
                  name="mission"
                  defaultValue={settings.mission}
                  rows={2}
                />
              </Field>

              <Field label="Vision Statement" htmlFor="vision">
                <Textarea
                  id="vision"
                  name="vision"
                  defaultValue={settings.vision}
                  rows={2}
                />
              </Field>
            </CardBody>
          </Card>

          <div className="flex justify-end pt-2">
            <SubmitButton pendingText="Saving Settings…">
              Save Application Settings
            </SubmitButton>
          </div>
        </div>
      </form>
    </div>
  );
}
