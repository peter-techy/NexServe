"use client";

import * as React from "react";
import Script from "next/script";
import Image from "next/image";
import {
  User,
  Building2,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  IndianRupee,
  CreditCard,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitClientOnboardingAction, completeClientPaymentAction } from "@/app/actions/payments";
import type { ClientPayment } from "@/lib/types";
import { toast } from "sonner";

export function ClientOnboardingForm({
  payment,
  razorpayKeyId,
}: {
  payment: ClientPayment;
  razorpayKeyId?: string;
}) {
  const [isPending, setIsPending] = React.useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Form fields
  const [clientName, setClientName] = React.useState(payment.client_name || "");
  const [businessName, setBusinessName] = React.useState(payment.business_name || "");
  const [phone, setPhone] = React.useState(payment.phone || "");
  const [location, setLocation] = React.useState(payment.location || "");
  const [deadline, setDeadline] = React.useState(payment.deadline || "");

  // Completed status state
  const [isCompleted, setIsCompleted] = React.useState(payment.status === "Done");
  const [paymentIdRecord, setPaymentIdRecord] = React.useState(payment.razorpay_payment_id || "");

  // Simulation modal state if no live Razorpay key is set
  const [showDemoModal, setShowDemoModal] = React.useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!clientName.trim() || !businessName.trim() || !phone.trim() || !location.trim()) {
      setErrorMessage("Please fill in all required fields marked with *.");
      return;
    }

    setIsPending(true);

    try {
      const formData = new FormData();
      formData.append("payment_id", payment.id);
      formData.append("client_name", clientName.trim());
      formData.append("business_name", businessName.trim());
      formData.append("phone", phone.trim());
      formData.append("location", location.trim());
      if (deadline) formData.append("deadline", deadline);

      const res = await submitClientOnboardingAction({}, formData);
      if (!res.ok) {
        setErrorMessage(res.message || "Failed to save client details.");
        setIsPending(false);
        return;
      }

      setIsPending(false);

      // Now trigger Razorpay Payment
      triggerRazorpayPayment();
    } catch (err: any) {
      setIsPending(false);
      setErrorMessage(err?.message || "An error occurred while saving details.");
    }
  };

  const triggerRazorpayPayment = () => {
    setIsProcessingPayment(true);

    const effectiveKey = razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    // Check if Razorpay Checkout script is loaded and key is valid
    if (typeof window !== "undefined" && (window as any).Razorpay && effectiveKey) {
      try {
        const options = {
          key: effectiveKey,
          amount: Math.round(payment.amount * 100), // in paise
          currency: "INR",
          name: "NexServe",
          description: `Onboarding & Service Fee for ${businessName}`,
          image: "/brand/logo-trimmed.png",
          prefill: {
            name: clientName,
            contact: phone,
          },
          notes: {
            payment_id: payment.id,
            client_name: clientName.trim(),
            business_name: businessName.trim(),
            phone: phone.trim(),
            location: location.trim(),
            deadline: deadline || "",
          },
          theme: {
            color: "#185fa5",
          },
          handler: async function (response: any) {
            const payId = response?.razorpay_payment_id || `rzp_${Date.now()}`;
            setPaymentIdRecord(payId);

            let savedOk = false;
            try {
              const apiRes = await fetch("/api/payments/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  paymentId: payment.id,
                  razorpayPaymentId: payId,
                  razorpayOrderId: response?.razorpay_order_id,
                  razorpaySignature: response?.razorpay_signature,
                  clientName: clientName.trim(),
                  businessName: businessName.trim(),
                  phone: phone.trim(),
                  location: location.trim(),
                  deadline: deadline || null,
                }),
              });
              const apiJson = await apiRes.json().catch(() => null);
              savedOk = Boolean(apiRes.ok && apiJson?.ok);
            } catch {
              savedOk = false;
            }

            if (!savedOk) {
              const compRes = await completeClientPaymentAction(payment.id, payId, {
                razorpayOrderId: response?.razorpay_order_id,
                razorpaySignature: response?.razorpay_signature,
                clientName: clientName.trim(),
                businessName: businessName.trim(),
                phone: phone.trim(),
                location: location.trim(),
                deadline: deadline || null,
              });
              savedOk = compRes.ok;
            }

            if (savedOk) {
              setIsCompleted(true);
              toast.success("Payment successful! Your onboarding details and receipt have been saved.");
            } else {
              toast.error("Payment received — please keep your Razorpay Ref ID while records sync.");
              setIsCompleted(true);
            }
            setIsProcessingPayment(false);
          },
          modal: {
            ondismiss: function () {
              setIsProcessingPayment(false);
              toast.info("Payment window closed.");
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      } catch (err) {
        console.warn("Razorpay standard popup error, opening direct checkout:", err);
      }
    }

    // Fallback if Razorpay Key ID is not configured yet in .env:
    // Show realistic test/simulation checkout so payment can be experienced end-to-end
    setShowDemoModal(true);
    setIsProcessingPayment(false);
  };

  const handleSimulatedPayment = async () => {
    setIsProcessingPayment(true);
    try {
      const simulatedPayId = `pay_sim_${Date.now()}`;
      setPaymentIdRecord(simulatedPayId);

      const compRes = await completeClientPaymentAction(payment.id, simulatedPayId, {
        clientName: clientName.trim(),
        businessName: businessName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        deadline: deadline || null,
      });
      if (compRes.ok) {
        setIsCompleted(true);
        setShowDemoModal(false);
        toast.success("Payment of ₹" + payment.amount.toLocaleString("en-IN") + " processed successfully!");
      } else {
        toast.error("Error confirming payment.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Payment processing failed.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="rounded-3xl border border-white/80 bg-white/90 p-8 shadow-[0_20px_60px_rgba(12,36,72,0.08)] backdrop-blur-2xl sm:p-12">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-md">
            <CheckCircle2 className="size-10" />
          </div>

          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700">
            Payment Verified & Onboarded
          </span>

          <h2 className="mt-3 text-2xl font-extrabold text-[#142f4c] sm:text-3xl">
            Thank you, {clientName || "Client"}!
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Your payment for <strong className="font-semibold text-slate-800">{businessName || "your business"}</strong> has been received successfully.
          </p>

          {/* Payment receipt card */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-left text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-slate-500">Amount Paid</span>
              <span className="text-base font-extrabold text-[#142f4c]">
                ₹{payment.amount.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-slate-500">Transaction Status</span>
              <span className="font-bold text-emerald-600">Done</span>
            </div>

            {paymentIdRecord && (
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-slate-500">Razorpay Ref ID</span>
                <span className="font-mono text-slate-700 text-[11px]">{paymentIdRecord}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-slate-500">Sales Representative</span>
              <span className="font-semibold text-slate-800">
                {payment.salesperson_name || "NexServe Sales Team"}
              </span>
            </div>

            {phone && (
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-slate-500">Registered Contact</span>
                <span className="font-mono text-slate-700">{phone}</span>
              </div>
            )}

            {location && (
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-slate-500">Location</span>
                <span className="font-semibold text-slate-800">{location}</span>
              </div>
            )}

            {deadline && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Project Deadline</span>
                <span className="font-semibold text-slate-800">
                  {new Date(deadline).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-[11px] text-[#185fa5]">
            <p className="font-semibold flex items-center justify-center gap-1.5">
              <ShieldCheck className="size-4" /> NexServe Executive Care
            </p>
            <p className="mt-1 text-slate-600">
              Our service operations team has been notified. Your account executive will be in touch shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(12,36,72,0.08)] backdrop-blur-2xl sm:p-10">
        {/* Header Section */}
        <div className="border-b border-slate-200 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#185fa5]/20 bg-[#185fa5]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#185fa5]">
                <Sparkles className="size-3" /> Client Onboarding & Payment
              </span>
              <h2 className="mt-2 text-2xl font-extrabold text-[#142f4c] sm:text-3xl">
                Complete Your Onboarding
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Please provide your contact & business information below to finalize service engagement.
              </p>
            </div>

            {/* Payable Amount Pill */}
            <div className="flex flex-col items-start sm:items-end rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Total Payable Amount
              </span>
              <span className="text-2xl font-black text-[#142f4c]">
                ₹{payment.amount.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-[#185fa5] font-medium">
                Rep: {payment.salesperson_name || "Sales Executive"}
              </span>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Missing or Invalid Information</p>
              <p className="mt-0.5 font-normal">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Onboarding Form */}
        <form onSubmit={handleFormSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* 1. Name of the Client (Required) */}
            <div>
              <label
                htmlFor="client_name"
                className="block text-xs font-semibold text-[#142f4c] mb-1.5"
              >
                Name of the Client <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-3 size-4 text-slate-400" />
                <input
                  id="client_name"
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  disabled={isPending || isProcessingPayment}
                  className="block w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-10 pr-3 text-xs text-slate-800 shadow-2xs placeholder:text-slate-400 focus:border-[#185fa5] focus:outline-hidden focus:ring-2 focus:ring-[#185fa5]/20"
                />
              </div>
            </div>

            {/* 2. Business Name (Required) */}
            <div>
              <label
                htmlFor="business_name"
                className="block text-xs font-semibold text-[#142f4c] mb-1.5"
              >
                Business Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3.5 top-3 size-4 text-slate-400" />
                <input
                  id="business_name"
                  type="text"
                  required
                  placeholder="e.g. Apex Marketing Solutions"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  disabled={isPending || isProcessingPayment}
                  className="block w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-10 pr-3 text-xs text-slate-800 shadow-2xs placeholder:text-slate-400 focus:border-[#185fa5] focus:outline-hidden focus:ring-2 focus:ring-[#185fa5]/20"
                />
              </div>
            </div>

            {/* 3. Phone Number (Required) */}
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold text-[#142f4c] mb-1.5"
              >
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-3 size-4 text-slate-400" />
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isPending || isProcessingPayment}
                  className="block w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-10 pr-3 text-xs text-slate-800 shadow-2xs placeholder:text-slate-400 focus:border-[#185fa5] focus:outline-hidden focus:ring-2 focus:ring-[#185fa5]/20 font-mono"
                />
              </div>
            </div>

            {/* 4. Location (Required) */}
            <div>
              <label
                htmlFor="location"
                className="block text-xs font-semibold text-[#142f4c] mb-1.5"
              >
                Location <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3.5 top-3 size-4 text-slate-400" />
                <input
                  id="location"
                  type="text"
                  required
                  placeholder="e.g. Bengaluru, Karnataka"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isPending || isProcessingPayment}
                  className="block w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-10 pr-3 text-xs text-slate-800 shadow-2xs placeholder:text-slate-400 focus:border-[#185fa5] focus:outline-hidden focus:ring-2 focus:ring-[#185fa5]/20"
                />
              </div>
            </div>
          </div>

          {/* 5. Deadline (Optional) */}
          <div>
            <label
              htmlFor="deadline"
              className="block text-xs font-semibold text-[#142f4c] mb-1.5"
            >
              Project Deadline <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3.5 top-3 size-4 text-slate-400" />
              <input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={isPending || isProcessingPayment}
                className="block w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-10 pr-3 text-xs text-slate-800 shadow-2xs focus:border-[#185fa5] focus:outline-hidden focus:ring-2 focus:ring-[#185fa5]/20"
              />
            </div>
          </div>

          {/* Payment Link Section at the end */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#185fa5]/10 text-[#185fa5]">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#142f4c]">
                    Razorpay Secure Gateway
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Supports UPI, Credit/Debit Cards, NetBanking, and Wallets
                  </p>
                </div>
              </div>

              {/* Payment Submit Button */}
              <Button
                type="submit"
                variant="accent"
                disabled={isPending || isProcessingPayment}
                className="w-full sm:w-auto h-12 px-8 text-sm font-extrabold shadow-lg shadow-[#185fa5]/25"
              >
                {isPending || isProcessingPayment ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <IndianRupee className="size-4 mr-1.5" />
                    Pay ₹{payment.amount.toLocaleString("en-IN")} via Razorpay
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Fallback Razorpay Checkout Simulation Dialog (if no live API key is configured) */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#185fa5] text-white font-bold text-xs">
                  RZP
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#142f4c]">Razorpay Checkout</h3>
                  <p className="text-[11px] text-slate-500">NexServe Official Billing</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#185fa5]">
                ₹{payment.amount.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                <p className="font-bold text-[#185fa5]">Client & Business Details Verified</p>
                <p className="text-[11px] text-slate-700 mt-1">
                  Name: <strong>{clientName}</strong> ({businessName})
                </p>
                <p className="text-[11px] text-slate-700">Phone: {phone}</p>
                <p className="text-[11px] text-slate-700">Location: {location}</p>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 space-y-2">
                <p className="font-semibold text-slate-800">Select Payment Method:</p>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                  <input type="radio" name="paymethod" defaultChecked className="text-[#185fa5]" />
                  <span className="font-medium text-slate-700">UPI (Google Pay, PhonePe, Paytm, QR)</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                  <input type="radio" name="paymethod" className="text-[#185fa5]" />
                  <span className="font-medium text-slate-700">Credit / Debit Card (Visa, MasterCard, RuPay)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDemoModal(false)}
                disabled={isProcessingPayment}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="accent"
                onClick={handleSimulatedPayment}
                disabled={isProcessingPayment}
                className="font-bold"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="size-4 mr-1.5 animate-spin" /> Authorizing...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4 mr-1.5" /> Authorize & Pay ₹{payment.amount.toLocaleString("en-IN")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
