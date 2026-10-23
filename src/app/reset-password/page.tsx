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
    <div className="flex min-h-dvh flex-col justify-center bg-canvas px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-block p-2 rounded bg-white shadow-xs mb-4">
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
        <Card className="shadow-pop">
          <CardBody className="p-6 sm:p-8">
            <form action={formAction} className="space-y-4">
              {state?.message && (
                <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>
              )}

              {state.ok ? (
                <div className="pt-2 text-center">
                  <Link
                    href="/login"
                    className="inline-block rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-700"
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
                    <SubmitButton className="w-full" pendingText="Updating password…">
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
