"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Select, Checkbox } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/feedback";
import { loginAction } from "@/app/actions/auth";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-canvas px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-block p-2 rounded bg-white shadow-xs mb-4">
          <Logo priority />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-brand-navy">
          Corporate Management Portal
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Sign in to access your departmental workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-pop">
          <CardBody className="p-6 sm:p-8">
            <form action={formAction} className="space-y-4">
              {state?.message && !state.ok && (
                <Alert tone="danger">{state.message}</Alert>
              )}

              <Field label="Department" htmlFor="department" required>
                <Select
                  id="department"
                  name="department"
                  defaultValue={state?.values?.department as string || "Sales"}
                  required
                >
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                </Select>
              </Field>

              <Field label="Corporate Email" htmlFor="email" required>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@nexserve.com"
                  defaultValue={state?.values?.email as string || ""}
                  required
                />
              </Field>

              <Field label="Password" htmlFor="password" required>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                />
              </Field>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-ink-muted select-none">
                  <Checkbox name="remember" defaultChecked />
                  <span>Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="font-medium text-brand-teal hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="pt-2">
                <SubmitButton
                  className="w-full"
                  pendingText="Signing in…"
                >
                  Sign In
                </SubmitButton>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="mt-6 text-center text-xs text-ink-subtle">
          <Link href="/about" className="hover:text-ink underline">About NexServe</Link>
          <span className="mx-2">·</span>
          <span>NexServe Corporate Management Portal</span>
        </div>
      </div>
    </div>
  );
}
