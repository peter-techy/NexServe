import * as React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPaymentByIdOrToken } from "@/lib/payments";
import { ClientOnboardingForm } from "@/components/payments/client-onboarding-form";
import { env } from "@/lib/env";
import { AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const payment = await getPaymentByIdOrToken(id);

  if (!payment) {
    return {
      title: "Payment Link Not Found — NexServe",
    };
  }

  return {
    title: `Payment & Onboarding (₹${payment.amount.toLocaleString("en-IN")}) — NexServe`,
    description: "Complete your client onboarding details and payment with NexServe.",
  };
}

export default async function ClientPaymentPage({ params }: Props) {
  const { id } = await params;
  const payment = await getPaymentByIdOrToken(id);

  if (!payment) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] text-[#142f4c] flex flex-col justify-between">
        <header className="border-b border-white/60 bg-white/70 backdrop-blur-xl px-6 py-4">
          <div className="mx-auto max-w-5xl flex items-center justify-between">
            <Link href="/" className="relative h-12 w-40">
              <Image
                src="/brand/logo-trimmed.png"
                alt="NexServe"
                fill
                className="object-contain"
                priority
              />
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-md px-6 py-20 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <AlertCircle className="size-8" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[#142f4c]">
            Payment Link Not Found
          </h1>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            This onboarding and payment link does not exist, has expired, or is invalid. Please contact your NexServe representative for a new link.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#185fa5] hover:underline"
            >
              <ArrowLeft className="size-3.5" /> Return to Homepage
            </Link>
          </div>
        </main>

        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} NexServe. All rights reserved.
        </footer>
      </div>
    );
  }

  const razorpayKeyId = env.razorpayKeyId() || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

  return (
    <div className="min-h-screen bg-[#f4f7fb]/70 text-[#142f4c] selection:bg-[#185fa5]/15 relative flex flex-col justify-between">
      {/* Floating ambient glow orbs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 right-10 size-[550px] rounded-full bg-brand-teal/15 blur-3xl" />
        <div className="absolute top-1/4 -left-40 size-[600px] rounded-full bg-brand-navy/10 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 size-[550px] rounded-full bg-[#185fa5]/10 blur-3xl" />
      </div>

      {/* Top Navbar */}
      <header className="border-b border-white/60 bg-white/75 backdrop-blur-xl px-6 py-4 shadow-2xs">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link href="/" className="relative h-12 w-44">
            <Image
              src="/brand/logo-trimmed.png"
              alt="NexServe"
              fill
              className="object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="size-3.5" /> 256-Bit SSL Encrypted
          </div>
        </div>
      </header>

      {/* Form Container */}
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <ClientOnboardingForm
          payment={payment}
          razorpayKeyId={razorpayKeyId}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-md py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-4xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NexServe Corporate Management Portal — Client Billing Division</span>
          <span>© {new Date().getFullYear()} NexServe. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
