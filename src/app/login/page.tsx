"use client";

import * as React from "react";
import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase, Users, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Checkbox } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/feedback";
import { loginAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

type PortalKey = "Sales" | "HR" | "Administration";

const PORTALS = [
  {
    id: "Sales" as PortalKey,
    label: "Sales",
    icon: Briefcase,
    hint: "Pipeline, client entries & follow-ups",
    placeholder: "sales@nexserve.com",
  },
  {
    id: "HR" as PortalKey,
    label: "HR",
    icon: Users,
    hint: "Workforce directory & Excel reporting",
    placeholder: "hr@nexserve.com",
  },
  {
    id: "Administration" as PortalKey,
    label: "Super Admin",
    icon: ShieldCheck,
    hint: "Full administration, cross-portal oversight",
    placeholder: "admin@nexserve.com",
  },
];

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [selectedDept, setSelectedDept] = useState<PortalKey>("Sales");

  useEffect(() => {
    // Check URL query parameters for default portal
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const portalParam = (params.get("portal") || params.get("role") || "").toLowerCase();
      if (portalParam.includes("admin")) {
        setSelectedDept("Administration");
      } else if (portalParam.includes("hr")) {
        setSelectedDept("HR");
      } else if (portalParam.includes("sale")) {
        setSelectedDept("Sales");
      }
    }
  }, []);

  useEffect(() => {
    if (state?.values?.department) {
      const d = state.values.department as string;
      if (d === "Administration" || d === "Super Admin") setSelectedDept("Administration");
      else if (d === "HR") setSelectedDept("HR");
      else if (d === "Sales") setSelectedDept("Sales");
    }
  }, [state?.values?.department]);

  const activePortal = PORTALS.find((p) => p.id === selectedDept) || PORTALS[0];

  return (
    <div className="flex min-h-dvh flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic ambient background glow for authentic glassmorphism */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -right-32 size-[520px] rounded-full bg-brand-teal/25 blur-[120px] animate-orb-1" />
        <div className="absolute top-1/3 -left-32 size-[550px] rounded-full bg-brand-navy/20 blur-[130px] animate-orb-2" />
        <div className="absolute -bottom-32 right-1/4 size-[520px] rounded-full bg-sky-400/20 blur-[120px] animate-orb-3" />
        <div className="absolute top-2/3 right-10 size-[360px] rounded-full bg-brand-teal/15 blur-[100px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-block p-2.5 rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-[0_8px_24px_rgba(12,36,72,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)] mb-4">
          <Logo priority />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-brand-navy">
          Corporate Management Portal
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Sign in to access your designated workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-[0_24px_70px_rgba(12,36,72,0.14),inset_0_1px_1px_1px_rgba(255,255,255,0.95)] border-white/80 bg-white/70 backdrop-blur-2xl rounded-2xl overflow-hidden">
          <CardBody className="p-6 sm:p-8">
            {/* Separate Portal / Department Switcher */}
            <div className="mb-5">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                Select Portal
              </label>
              <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100/60 backdrop-blur-xl p-1.5 border border-white/75 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
                {PORTALS.map((portal) => {
                  const Icon = portal.icon;
                  const active = selectedDept === portal.id;
                  return (
                    <button
                      key={portal.id}
                      type="button"
                      onClick={() => setSelectedDept(portal.id)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 rounded-lg py-2.5 px-2 text-xs font-semibold transition-all duration-200",
                        active
                          ? "bg-white/95 text-brand-navy shadow-md ring-1 ring-brand-teal/30 backdrop-blur-2xl border border-white/90 scale-[1.02]"
                          : "text-ink-muted hover:text-ink hover:bg-white/60",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 transition-colors",
                          active ? "text-brand-teal" : "text-ink-subtle",
                        )}
                      />
                      <span>{portal.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-center text-xs text-ink-subtle">
                {activePortal.hint}
              </p>
            </div>

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="department" value={selectedDept} />

              {state?.message && !state.ok && (
                <Alert tone="danger">{state.message}</Alert>
              )}

              <Field label="Corporate Email" htmlFor="email" required>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={activePortal.placeholder}
                  defaultValue={(state?.values?.email as string) || ""}
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
                  className="w-full shadow-[0_4px_16px_rgba(12,36,72,0.2)] hover:shadow-[0_8px_24px_rgba(12,36,72,0.3)] transition-all"
                  pendingText="Signing in…"
                >
                  Sign in to {activePortal.label}
                </SubmitButton>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/60 backdrop-blur-xl border border-white/75 text-xs text-ink-subtle shadow-xs">
            <Link href="/about" className="hover:text-ink underline">About NexServe</Link>
            <span className="opacity-40">·</span>
            <span>Corporate Management Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
