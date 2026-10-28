"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { createEmployeeAction } from "@/app/actions/admin";
import { toast } from "sonner";
import type { AppRole, Department } from "@/lib/types";

export function CreateEmployeeForm() {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = React.useTransition();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = React.useState<{
    email: string;
    password: string;
    department: string;
  } | null>(null);

  const [role, setRole] = React.useState<AppRole>("sales");
  const [department, setDepartment] = React.useState<Department>("Sales");

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRole = e.target.value as AppRole;
    setRole(nextRole);
    if (nextRole === "hr") {
      setDepartment("HR");
    } else if (nextRole === "sales") {
      setDepartment("Sales");
    } else if (nextRole === "super_admin") {
      setDepartment("Administration");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setCreatedCredentials(null);

    const formData = new FormData(e.currentTarget);
    const enteredEmail = (formData.get("email") as string)?.trim().toLowerCase() || "";
    const enteredPassword = (formData.get("password") as string)?.trim() || "NexServe@2026";
    const enteredDept = (formData.get("department") as string) || department;

    startTransition(async () => {
      try {
        const result = await createEmployeeAction(formData);
        if (result.ok) {
          toast.success(result.message || "Account created successfully!");
          setSuccessMsg(result.message || "Account created successfully!");
          setCreatedCredentials({
            email: enteredEmail,
            password: enteredPassword,
            department: enteredDept,
          });
          formRef.current?.reset();
          // Reset default role and department
          setRole("sales");
          setDepartment("Sales");
          router.refresh();
        } else {
          toast.error(result.message || "Failed to create account.");
          setErrorMsg(result.message || "Failed to create account.");
        }
      } catch (err: any) {
        const errText = err?.message || "An unexpected error occurred.";
        toast.error(errText);
        setErrorMsg(errText);
      }
    });
  };

  return (
    <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-lg">
      <CardHeader
        title="Create Employee Account"
        description="Add a new member to HR, Sales, or Administration"
      />
      <CardBody className="p-4 space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-danger-500/10 border border-danger-500/20 text-danger-700 dark:text-danger-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {createdCredentials && (
          <div className="p-3 text-xs rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-800 dark:text-teal-300 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-teal-700 dark:text-teal-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg || "Account Created Successfully!"}</span>
            </div>
            <div className="bg-white/90 dark:bg-slate-950/70 p-2.5 rounded-lg border border-teal-500/20 font-mono text-[11px] space-y-1 text-ink">
              <div className="flex justify-between">
                <span className="text-ink-muted">Work Email:</span>
                <span className="font-semibold select-all">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Password:</span>
                <span className="font-semibold select-all text-brand-navy dark:text-teal-300">{createdCredentials.password}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Department:</span>
                <span className="font-medium">{createdCredentials.department}</span>
              </div>
            </div>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
          <Field label="Employee ID" htmlFor="employee_id" required>
            <Input
              id="employee_id"
              name="employee_id"
              placeholder="e.g. EMP-010"
              required
              disabled={isPending}
            />
          </Field>

          <Field label="Full Name" htmlFor="full_name" required>
            <Input
              id="full_name"
              name="full_name"
              placeholder="e.g. Sarah Miller"
              required
              disabled={isPending}
            />
          </Field>

          <Field label="Work Email" htmlFor="email" required>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@nexserve.com"
              required
              disabled={isPending}
            />
          </Field>

          <Field label="Contact Phone" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              placeholder="+91 98765 00000"
              disabled={isPending}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Role" htmlFor="role" required>
              <Select
                id="role"
                name="role"
                value={role}
                onChange={handleRoleChange}
                required
                disabled={isPending}
              >
                <option value="sales">Sales</option>
                <option value="hr">HR</option>
                <option value="super_admin">Super Admin</option>
              </Select>
            </Field>

            <Field label="Department" htmlFor="department" required>
              <Select
                id="department"
                name="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                required
                disabled={isPending}
              >
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
                <option value="Administration">Administration</option>
              </Select>
            </Field>
          </div>

          <Field label="Temporary Password" htmlFor="password" required>
            <Input
              id="password"
              name="password"
              defaultValue="NexServe@2026"
              required
              disabled={isPending}
            />
          </Field>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Provisioning Account…</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Provision Account</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
