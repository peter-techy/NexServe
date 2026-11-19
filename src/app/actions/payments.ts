"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  createPaymentLink,
  getPaymentByIdOrToken,
  updateClientOnboarding,
  completePayment,
} from "@/lib/payments";
import { env } from "@/lib/env";
import type { ActionState } from "@/lib/types";

/**
 * Sales representative creates a new shareable payment link with a specific Amount (in ₹).
 */
export async function createPaymentLinkAction(
  _prevState: any,
  formData: FormData
): Promise<ActionState & { link?: string; amount?: number; paymentId?: string }> {
  const session = await getSession();
  if (!session || !session.profile.is_active) {
    return { ok: false, message: "Authentication required. Please log in." };
  }

  if (session.profile.role !== "sales" && session.profile.role !== "super_admin") {
    return { ok: false, message: "Only sales representatives and administrators can generate payment links." };
  }

  const rawAmount = (formData.get("amount") as string)?.trim() || "";
  const numericAmount = parseFloat(rawAmount.replace(/[^0-9.]/g, ""));

  if (isNaN(numericAmount) || numericAmount <= 0) {
    return {
      ok: false,
      message: "Please enter a valid positive Amount (in ₹).",
      fieldErrors: { amount: ["Amount must be greater than 0"] },
    };
  }

  try {
    const payment = await createPaymentLink({
      salespersonId: session.profile.id,
      salespersonName: session.profile.full_name,
      salespersonEmail: session.profile.email,
      amount: numericAmount,
    });

    const origin = env.siteUrl();
    const shareableUrl = `${origin}/pay/${payment.id}`;

    revalidatePath("/sales/payments");
    revalidatePath("/finance/dashboard");
    revalidatePath("/finance/clients");
    revalidatePath("/hr/clients");

    return {
      ok: true,
      message: "Shareable payment link generated successfully!",
      link: shareableUrl,
      amount: payment.amount,
      paymentId: payment.id,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.message || "Failed to generate payment link. Please try again.",
    };
  }
}

/**
 * Public action: Client submits onboarding details.
 */
export async function submitClientOnboardingAction(
  _prevState: any,
  formData: FormData
): Promise<ActionState & { paymentId?: string }> {
  const paymentId = (formData.get("payment_id") as string)?.trim() || "";
  const clientName = (formData.get("client_name") as string)?.trim() || "";
  const businessName = (formData.get("business_name") as string)?.trim() || "";
  const phone = (formData.get("phone") as string)?.trim() || "";
  const location = (formData.get("location") as string)?.trim() || "";
  const deadline = (formData.get("deadline") as string)?.trim() || null;

  if (!paymentId) {
    return { ok: false, message: "Invalid or missing payment link identifier." };
  }

  const errors: Record<string, string[]> = {};
  if (!clientName) errors.client_name = ["Client name is required."];
  if (!businessName) errors.business_name = ["Business name is required."];
  if (!phone) errors.phone = ["Phone number is required."];
  if (!location) errors.location = ["Location is required."];

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: "Please complete all required fields.",
      fieldErrors: errors,
    };
  }

  try {
    const updated = await updateClientOnboarding(paymentId, {
      client_name: clientName,
      business_name: businessName,
      phone,
      location,
      deadline,
    });

    if (!updated) {
      return { ok: false, message: "Payment link not found or expired." };
    }

    revalidatePath(`/pay/${paymentId}`);
    revalidatePath("/sales/payments");
    revalidatePath("/finance/clients");
    revalidatePath("/hr/clients");

    return {
      ok: true,
      message: "Onboarding information saved successfully.",
      paymentId: updated.id,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.message || "Failed to save client details. Please try again.",
    };
  }
}

/**
 * Marks payment as 'Done' once Razorpay payment succeeds.
 */
export async function completeClientPaymentAction(
  paymentId: string,
  razorpayPaymentId?: string,
  details?: {
    razorpayOrderId?: string;
    razorpaySignature?: string;
    clientName?: string;
    businessName?: string;
    phone?: string;
    location?: string;
    deadline?: string | null;
  }
): Promise<{ ok: boolean; message: string; payment?: any }> {
  if (!paymentId) {
    return { ok: false, message: "Missing payment reference identifier." };
  }

  try {
    const payment = await completePayment(paymentId, {
      payment_id: razorpayPaymentId,
      order_id: details?.razorpayOrderId,
      signature: details?.razorpaySignature,
      client_name: details?.clientName,
      business_name: details?.businessName,
      phone: details?.phone,
      location: details?.location,
      deadline: details?.deadline,
    });

    if (!payment) {
      return { ok: false, message: "Payment record not found." };
    }

    revalidatePath(`/pay/${paymentId}`);
    revalidatePath("/sales/payments");
    revalidatePath("/finance/dashboard");
    revalidatePath("/finance/clients");
    revalidatePath("/hr/clients");

    return {
      ok: true,
      message: "Payment processed successfully! Status updated to Done.",
      payment,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.message || "Error completing payment.",
    };
  }
}
