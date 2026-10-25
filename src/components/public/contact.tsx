"use client";

import * as React from "react";
import { submitContactFormAction } from "@/app/actions/settings";
import { ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function ContactSection({ selectedService }: { selectedService?: string }) {
  const [service, setService] = React.useState(selectedService || "");
  const [isPending, setIsPending] = React.useState(false);
  const [status, setStatus] = React.useState<{ ok: boolean; message: string } | null>(null);

  React.useEffect(() => {
    if (selectedService) {
      setService(selectedService);
    }
  }, [selectedService]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setStatus(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await submitContactFormAction({}, formData);
      setStatus({ ok: Boolean(res.ok), message: res.message || "" });
      if (res.ok) {
        form.reset();
        setService("");
      }
    } catch {
      setStatus({ ok: false, message: "Your enquiry could not be sent. Please try again." });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section id="contact" className="border-t border-[#225789]/20 bg-radial from-[#e1eefb]/40 via-[#f4f8fd] to-[#f4f8fd] px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Left Column: Contact Copy */}
        <div className="lg:col-span-5">
          <p className="text-xs font-bold tracking-widest text-[#185fa5] uppercase">
            HAVE A PROJECT IN MIND?
          </p>

          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#142f4c] sm:text-4xl lg:text-5xl">
            Let's create your
            <br />
            <span className="gradient-text">next possibility.</span>
          </h2>

          <p className="mt-6 text-sm leading-relaxed text-[#52677e]">
            Send us an enquiry so we can understand your business, requirements and project goals.
          </p>

          <div className="mt-8 rounded-xl border border-[#b3cce3] bg-white/80 p-4 text-xs font-medium text-[#185fa5] shadow-xs backdrop-blur-sm">
            ✦ &nbsp; Thoughtful ideas. Clear communication. Creative work.
          </div>
        </div>

        {/* Right Column: Interactive Form */}
        <div className="lg:col-span-7">
          <form
            id="contactForm"
            onSubmit={handleSubmit}
            className="rounded-3xl border border-[#225789]/20 bg-white p-7 shadow-xl sm:p-10"
          >
            <div className="mb-8">
              <p className="text-[11px] font-bold tracking-widest text-[#185fa5] uppercase">
                LET'S TALK BUSINESS
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-[#142f4c] sm:text-3xl">
                Send Us an <span className="gradient-text">Enquiry.</span>
              </h3>
              <p className="mt-2 text-xs text-[#52677e]">
                Please share the following details to help us understand your requirements.
              </p>
            </div>

            {status && (
              <div
                role="status"
                aria-live="polite"
                className={`mb-6 flex items-start gap-3 rounded-xl p-4 text-xs font-medium ${
                  status.ok
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {status.ok ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                )}
                <span>{status.message}</span>
              </div>
            )}

            {/* Row 1: Name & Organization */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-[#334f6d] mb-1.5">
                  Your name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Your full name"
                  required
                  className="w-full rounded-xl border border-[#b7cbde] bg-[#f8fbff] px-3.5 py-3 text-xs text-[#142f4c] transition focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#185fa5]/20"
                />
              </div>

              <div>
                <label htmlFor="organization" className="block text-xs font-semibold text-[#334f6d] mb-1.5">
                  Organization / Company
                </label>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  maxLength={150}
                  autoComplete="organization"
                  placeholder="Company name"
                  className="w-full rounded-xl border border-[#b7cbde] bg-[#f8fbff] px-3.5 py-3 text-xs text-[#142f4c] transition focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#185fa5]/20"
                />
              </div>
            </div>

            {/* Row 2: Email & Phone */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-[#334f6d] mb-1.5">
                  Email address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  maxLength={254}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-[#b7cbde] bg-[#f8fbff] px-3.5 py-3 text-xs text-[#142f4c] transition focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#185fa5]/20"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-[#334f6d] mb-1.5">
                  Phone / WhatsApp
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  maxLength={25}
                  autoComplete="tel"
                  placeholder="Contact number"
                  className="w-full rounded-xl border border-[#b7cbde] bg-[#f8fbff] px-3.5 py-3 text-xs text-[#142f4c] transition focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#185fa5]/20"
                />
              </div>
            </div>

            {/* Service Dropdown */}
            <div className="mt-4">
              <label htmlFor="service" className="block text-xs font-semibold text-[#334f6d] mb-1.5">
                Service you're interested in *
              </label>
              <select
                id="service"
                name="service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                required
                className="w-full rounded-xl border border-[#b7cbde] bg-[#f8fbff] px-3.5 py-3 text-xs text-[#142f4c] transition focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#185fa5]/20"
              >
                <option value="">Select a service</option>
                <option value="Reels, Videography & Content Creation">Reels, Videography & Content Creation</option>
                <option value="Digital Marketing & Social Media">Digital Marketing & Social Media</option>
                <option value="Branding & Graphic Design">Branding & Graphic Design</option>
                <option value="Website & Digital Presence">Website & Digital Presence</option>
                <option value="Multiple Services">Multiple Services</option>
                <option value="Custom Project / Other">Custom Project / Other</option>
              </select>
            </div>

            {/* Project Message */}
            <div className="mt-4">
              <label htmlFor="message" className="block text-xs font-semibold text-[#334f6d] mb-1.5">
                Brief description of your project *
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                maxLength={3000}
                placeholder="Your goals, requirements, ideas and expected deliverables..."
                required
                className="w-full rounded-xl border border-[#b7cbde] bg-[#f8fbff] px-3.5 py-3 text-xs text-[#142f4c] transition focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#185fa5]/20"
              />
            </div>

            {/* Row 3: Timeline & Budget */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="timeline" className="block text-xs font-semibold text-[#334f6d] mb-1.5">
                  Expected timeline
                </label>
                <select
                  id="timeline"
                  name="timeline"
                  className="w-full rounded-xl border border-[#b7cbde] bg-[#f8fbff] px-3.5 py-3 text-xs text-[#142f4c] transition focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#185fa5]/20"
                >
                  <option value="">Choose if known</option>
                  <option value="As soon as possible">As soon as possible</option>
                  <option value="Within 1–2 weeks">Within 1–2 weeks</option>
                  <option value="Within 1 month">Within 1 month</option>
                  <option value="Within 1–3 months">Within 1–3 months</option>
                  <option value="Ongoing / Retainer">Ongoing / Retainer</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label htmlFor="budget" className="block text-xs font-semibold text-[#334f6d] mb-1.5">
                  Estimated budget
                </label>
                <select
                  id="budget"
                  name="budget"
                  className="w-full rounded-xl border border-[#b7cbde] bg-[#f8fbff] px-3.5 py-3 text-xs text-[#142f4c] transition focus:border-[#185fa5] focus:outline-none focus:ring-2 focus:ring-[#185fa5]/20"
                >
                  <option value="">Choose if available</option>
                  <option value="Under ₹5,000">Under ₹5,000</option>
                  <option value="₹5,000–₹15,000">₹5,000–₹15,000</option>
                  <option value="₹15,000–₹30,000">₹15,000–₹30,000</option>
                  <option value="₹30,000–₹50,000">₹30,000–₹50,000</option>
                  <option value="₹50,000–₹1,00,000">₹50,000–₹1,00,000</option>
                  <option value="Above ₹1,00,000">Above ₹1,00,000</option>
                  <option value="Let's discuss">Let's discuss</option>
                </select>
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="mt-5">
              <label htmlFor="consent" className="flex items-start gap-3 text-xs text-[#52677e] cursor-pointer">
                <input
                  id="consent"
                  name="consent"
                  type="checkbox"
                  required
                  className="mt-0.5 size-4 rounded border-line-strong text-[#185fa5] accent-[#185fa5]"
                />
                <span>I agree that NexServe may use these details to respond to my enquiry. *</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="mt-7">
              <button
                type="submit"
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#185fa5] to-[#246fb3] py-4 text-sm font-bold text-white shadow-lg shadow-[#185fa5]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    Send Enquiry <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>

            <p className="mt-4 text-center text-[10px] text-[#52677e]">
              Your details are used to respond to your enquiry.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
