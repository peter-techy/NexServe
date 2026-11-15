"use client";

import * as React from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CopyPaymentLinkButton({
  paymentId,
  siteUrl,
}: {
  paymentId: string;
  siteUrl?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const getUrl = () => {
    const origin =
      siteUrl || (typeof window !== "undefined" ? window.location.origin : "");
    return `${origin}/pay/${paymentId}`;
  };

  const handleCopy = async () => {
    try {
      const url = getUrl();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Payment link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-7 px-2 text-xs text-[#185fa5] hover:bg-[#185fa5]/10"
        title="Copy shareable payment link"
      >
        {copied ? (
          <>
            <Check className="size-3.5 mr-1 text-emerald-600" />
            <span className="text-[11px] text-emerald-600 font-semibold">Copied</span>
          </>
        ) : (
          <>
            <Copy className="size-3.5 mr-1" />
            <span className="text-[11px]">Copy Link</span>
          </>
        )}
      </Button>
      <a
        href={`/pay/${paymentId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-400 hover:text-[#185fa5] p-1 rounded-md transition"
        title="Open client form"
      >
        <ExternalLink className="size-3.5" />
      </a>
    </div>
  );
}
