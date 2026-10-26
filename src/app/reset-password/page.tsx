"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/feedback";
import { resetPasswordAction } from "@/app/actions/auth";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  return (
    <div className="flex min-h-dvh flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic ambient background glow for authentic glassmorphism */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -right-32 size-[520px] rounded-full bg-brand-teal/25 blur-[120px] animate-orb-1" />
        <div className="absolute top-1/3 -left-32 size-[550px] rounded-full bg-brand-navy/20 blur-[130px] animate-orb-2" />
        <div className="absolute -bottom-32 right-1/4 size-[520px] rounded-full bg-sky-400/20 blur-[120px] animate-orb-3" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-block p-2.5 rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-[0_8px_24px_rgba(12,36,72,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)] mb-4">
          <Logo priority />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-brand-navy">
          Create New Password
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Enter your new account password below
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-[0_24px_70px_rgba(12,36,72,0.14),inset_0_1px_1px_1px_rgba(255,255,255,0.95)] border-white/80 bg-white/70 backdrop-blur-2xl rounded-2xl overflow-hidden">
          <CardBody className="p-6 sm:p-8">
            <form action={formAction} className="space-y-4">
              {state?.message && (
                <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>
              )}

              {state.ok ? (
                <div className="pt-2 text-center">
                  <Link
                    href="/login"
                    className="inline-block rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white shadow-[0_4px_16px_rgba(12,36,72,0.2)] hover:bg-brand-navy-700 hover:shadow-[0_8px_24px_rgba(12,36,72,0.3)] transition-all"
                  >
                    Proceed to Login
                  </Link>
                </div>
              ) : (
                <>
                  <Field label="New Password" htmlFor="password" required>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="At least 8 characters"
                      required
                    />
                  </Field>

                  <Field label="Confirm Password" htmlFor="confirm_password" required>
                    <Input
                      id="confirm_password"
                      name="confirm_password"
                      type="password"
                      placeholder="Repeat new password"
                      required
                    />
                  </Field>

                  <div className="pt-2">
                    <SubmitButton
                      className="w-full shadow-[0_4px_16px_rgba(12,36,72,0.2)] hover:shadow-[0_8px_24px_rgba(12,36,72,0.3)] transition-all"
                      pendingText="Updating password…"
                    >
                      Update Password
                    </SubmitButton>
                  </div>
                </>
              )}
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
