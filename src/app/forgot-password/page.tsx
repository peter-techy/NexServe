"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/feedback";
import { forgotPasswordAction } from "@/app/actions/auth";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-canvas px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-block p-2 rounded bg-white shadow-xs mb-4">
          <Logo priority />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-brand-navy">
          Password Recovery
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Enter your email to receive recovery instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-pop">
          <CardBody className="p-6 sm:p-8">
            <form action={formAction} className="space-y-4">
              {state?.message && (
                <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>
              )}

              <Field label="Registered Email" htmlFor="email" required>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@nexserve.com"
                  required
                />
              </Field>

              <div className="pt-2">
                <SubmitButton className="w-full" pendingText="Sending instructions…">
                  Send Recovery Link
                </SubmitButton>
              </div>

              <div className="text-center pt-2">
                <Link href="/login" className="text-xs font-medium text-brand-teal hover:underline">
                  Back to login
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
