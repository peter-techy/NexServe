"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#0c2448]/35 backdrop-blur-md" />
      <DialogPrimitive.Content
        className={cn(
          "card fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/80 shadow-[0_24px_70px_rgba(12,36,72,0.18),inset_0_1px_1px_rgba(255,255,255,0.95)] focus:outline-none",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/60 px-5 py-3.5">
          <div>
            <DialogPrimitive.Title className="text-base font-semibold text-brand-navy">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-0.5 text-sm text-ink-muted">{description}</DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close dialog">
              <X />
            </Button>
          </DialogPrimitive.Close>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** Confirmation dialog for destructive or sensitive actions. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "danger",
  onConfirm,
  open,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [busy, setBusy] = React.useState(false);
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogPrimitive.Trigger asChild>{trigger}</AlertDialogPrimitive.Trigger>}
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#0c2448]/35 backdrop-blur-md" />
        <AlertDialogPrimitive.Content className="card fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 p-6 rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/80 shadow-[0_24px_70px_rgba(12,36,72,0.18),inset_0_1px_1px_rgba(255,255,255,0.95)] focus:outline-none">
          <AlertDialogPrimitive.Title className="text-base font-semibold text-brand-navy">{title}</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description asChild>
            <div className="mt-2 text-sm text-ink-muted">{description}</div>
          </AlertDialogPrimitive.Description>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialogPrimitive.Cancel className={buttonVariants({ variant: "secondary" })} disabled={busy}>
              Cancel
            </AlertDialogPrimitive.Cancel>
            <Button
              variant={tone === "danger" ? "danger" : "primary"}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onConfirm();
                } finally {
                  setBusy(false);
                  onOpenChange?.(false);
                }
              }}
            >
              {busy ? "Working…" : confirmLabel}
            </Button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
