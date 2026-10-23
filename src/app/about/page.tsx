import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { Logo } from "@/components/brand/logo";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { submitContactFormAction } from "@/app/actions/settings";
import { Mail, Phone, MapPin, CheckCircle2, ArrowRight } from "lucide-react";

export default async function AboutPage() {
  const settings = await getSettings();

  const services = settings.services && settings.services.length > 0 ? settings.services : [
    {
      title: "Digital Marketing",
      description: "Data-driven growth strategies, cross-channel campaign management, SEO optimization, and audience acquisition pipelines.",
    },
    {
      title: "Content Creation",
      description: "High-impact storytelling, brand collateral, editorial design, and engaging multimedia content tailored for enterprise brands.",
    },
    {
      title: "Special Demand Solutions",
      description: "Bespoke operational and technical capabilities designed to solve complex client-specific organizational demands.",
    },
  ];

  const whatWeProvide = settings.what_we_provide && settings.what_we_provide.length > 0 ? settings.what_we_provide : [
    "Dedicated Account Management & SLA Compliance",
    "Real-time Transparent Activity Tracking & Metrics",
    "Omni-channel Execution across Digital Platforms",
    "Custom Reporting and Executive Insights",
  ];

  return (
    <div className="min-h-dvh bg-canvas flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-line bg-surface sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-brand-navy hover:text-brand-teal transition"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="bg-brand-navy text-white py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {settings.company_name}
            </h1>
            <p className="text-brand-teal-50 text-lg font-medium">
              {settings.company_tagline || "One Partner. Every Possibility."}
            </p>
            <p className="text-white/80 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              {settings.company_description}
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-base font-semibold text-brand-navy mb-2">Our Mission</h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                {settings.mission}
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-base font-semibold text-brand-navy mb-2">Our Vision</h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                {settings.vision}
              </p>
            </Card>
          </div>
        </section>

        {/* Core Services */}
        <section className="py-12 bg-white border-y border-line px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-brand-navy">Core Service Offerings</h2>
              <p className="text-sm text-ink-muted mt-1">Enterprise solutions delivered with precision and accountability</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {services.map((svc) => (
                <div key={svc.title} className="card p-5 bg-canvas/40 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-brand-navy text-base mb-2">{svc.title}</h3>
                    <p className="text-sm text-ink-muted leading-relaxed">{svc.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Provide */}
        <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-brand-navy">What We Provide</h2>
            <p className="text-sm text-ink-muted mt-1">Our standard commitment to every client partnership</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {whatWeProvide.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-md bg-white border border-line">
                <CheckCircle2 className="size-5 text-brand-teal shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-ink">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Information & Inquiry Form */}
        <section className="py-16 bg-white border-t border-line px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Contact Info */}
              <div>
                <h2 className="text-2xl font-bold text-brand-navy mb-4">Get In Touch</h2>
                <p className="text-sm text-ink-muted mb-6 leading-relaxed">
                  Have a question regarding our service offerings or wish to schedule an exploratory discussion? Reach out through our corporate channels.
                </p>

                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-3 text-ink">
                    <Mail className="size-5 text-brand-teal shrink-0" />
                    <span>{settings.contact_email || "contact@nexserve.com"}</span>
                  </div>

                  <div className="flex items-center gap-3 text-ink">
                    <Phone className="size-5 text-brand-teal shrink-0" />
                    <span>{settings.contact_phone || "+91 (0) 80 1234 5678"}</span>
                  </div>

                  <div className="flex items-start gap-3 text-ink">
                    <MapPin className="size-5 text-brand-teal shrink-0 mt-0.5" />
                    <span>{settings.contact_address || "Tower B, Central Business Park, Bangalore, KA, India"}</span>
                  </div>
                </div>
              </div>

              {/* Inquiry Form */}
              <Card>
                <CardHeader
                  title="Send Us a Message"
                  description="Your inquiry will be registered in our portal for review"
                />
                <CardBody className="p-5">
                  <form action={submitContactFormAction as any} className="space-y-3">
                    <Field label="Full Name" htmlFor="full_name" required>
                      <Input id="full_name" name="full_name" placeholder="John Doe" required />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Business Email" htmlFor="email" required>
                        <Input id="email" name="email" type="email" placeholder="name@company.com" required />
                      </Field>

                      <Field label="Phone Number" htmlFor="phone">
                        <Input id="phone" name="phone" placeholder="+91 98765 00000" />
                      </Field>
                    </div>

                    <Field label="Inquiry Subject" htmlFor="subject" required>
                      <Input id="subject" name="subject" placeholder="Inquiry regarding digital marketing services" required />
                    </Field>

                    <Field label="Message" htmlFor="message" required>
                      <Textarea id="message" name="message" placeholder="Provide details on your project or question..." rows={4} required />
                    </Field>

                    <div className="pt-2">
                      <SubmitButton className="w-full" pendingText="Submitting Inquiry…">
                        Submit Inquiry
                      </SubmitButton>
                    </div>
                  </form>
                </CardBody>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Corporate Footer */}
      <footer className="border-t border-line bg-surface py-6 px-4 text-center text-xs text-ink-subtle">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} NexServe Corporate Portal. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-ink">Employee Login</Link>
            <Link href="/about" className="hover:text-ink">About Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
