"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, Copy, ExternalLink, IndianRupee, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { createPaymentLinkAction } from "@/app/actions/payments";
import { toast } from "sonner";

export function PaymentGeneratorModal({
  salespersonName,
}: {
  salespersonName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [amount, setAmount] = React.useState("");
  const [generatedLink, setGeneratedLink] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      // Reset state on close
      setAmount("");
      setGeneratedLink(null);
      setCopied(false);
    }
  };

  const handleDone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount in ₹ (greater than 0).");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("amount", amount);

      const res = await createPaymentLinkAction({}, formData);
      if (res.ok && res.link) {
        setGeneratedLink(res.link);
        toast.success("Unique shareable payment link generated!");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to generate link.");
      }
    });
  };

  const copyToClipboard = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link. Please manually copy the URL.");
    }
  };

  return (
    <>
      <Button
        variant="accent"
        onClick={() => setOpen(true)}
        className="shadow-sm transition-all"
      >
        <Plus className="size-4 mr-1" /> Payments
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          title="Create Client Payment Link"
          description="Generate a unique shareable onboarding and payment form link tied to the specified amount and your salesperson profile."
          className="sm:max-w-md bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl"
        >
          {!generatedLink ? (
            <form onSubmit={handleDone} className="space-y-5 pt-2">
              <div>
                <label
                  htmlFor="payment-amount"
                  className="block text-xs font-semibold text-[#142f4c] mb-1.5"
                >
                  Amount (in ₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <IndianRupee className="size-4 text-[#185fa5]" />
                  </div>
                  <input
                    id="payment-amount"
                    name="amount"
                    type="number"
                    min="1"
                    step="any"
                    required
                    autoFocus
                    placeholder="e.g. 25000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isPending}
                    className="block w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-[#185fa5] focus:outline-hidden focus:ring-2 focus:ring-[#185fa5]/20"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  {amount && !isNaN(Number(amount)) && Number(amount) > 0 ? (
                    <span className="font-semibold text-[#185fa5]">
                      Amount to be billed: ₹{Number(amount).toLocaleString("en-IN")}
                    </span>
                  ) : (
                    "Enter the total deal or service fee in Indian Rupees (₹)."
                  )}
                </p>
              </div>

              {salespersonName && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-[#185fa5]">
                  <p className="font-semibold">Linked Sales Representative</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{salespersonName}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  disabled={isPending || !amount || parseFloat(amount) <= 0}
                  className="px-6 font-bold shadow-md shadow-[#185fa5]/20"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 mr-1.5 animate-spin" /> Generating...
                    </>
                  ) : (
                    "Done"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 pt-1">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Check className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide">
                      Shareable Link Ready!
                    </h4>
                    <p className="text-[11px] text-emerald-700">
                      Amount locked at <strong className="font-bold">₹{Number(amount).toLocaleString("en-IN")}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Share this onboarding & payment link with client:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-mono text-slate-800 focus:outline-hidden select-all"
                  />
                  <Button
                    type="button"
                    variant={copied ? "secondary" : "accent"}
                    onClick={copyToClipboard}
                    className="shrink-0 text-xs px-3"
                  >
                    {copied ? (
                      <>
                        <Check className="size-3.5 mr-1" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5 mr-1" /> Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <Button
                  asChild
                  variant="secondary"
                  className="text-xs"
                >
                  <a href={generatedLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5 mr-1.5" /> Preview Form
                  </a>
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleOpenChange(false)}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
