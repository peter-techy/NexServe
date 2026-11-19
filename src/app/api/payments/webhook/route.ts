import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { completePayment } from "@/lib/payments";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const webhookSecret = env.razorpayWebhookSecret();

    // Verify signature if secret is configured
    if (webhookSecret) {
      const signature = request.headers.get("x-razorpay-signature");
      if (!signature) {
        return NextResponse.json({ status: "error", message: "Missing x-razorpay-signature header" }, { status: 400 });
      }

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (signature !== expectedSignature) {
        return NextResponse.json({ status: "error", message: "Invalid webhook signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);

    // Check if event is payment.captured or order.paid
    if (event?.event === "payment.captured" || event?.event === "order.paid") {
      const payload = event?.payload?.payment?.entity;
      const notes = payload?.notes || {};
      const paymentId = notes?.payment_id || notes?.id;

      if (paymentId) {
        const details: {
          payment_id?: string;
          order_id?: string;
          client_name?: string;
          business_name?: string;
          phone?: string;
          location?: string;
          deadline?: string;
        } = {
          payment_id: payload?.id,
          order_id: payload?.order_id,
        };

        if (notes.client_name) details.client_name = String(notes.client_name);
        if (notes.business_name) details.business_name = String(notes.business_name);
        if (notes.phone || payload?.contact) details.phone = String(notes.phone || payload?.contact);
        if (notes.location) details.location = String(notes.location);
        if (notes.deadline) details.deadline = String(notes.deadline);

        await completePayment(paymentId, details);

        try {
          revalidatePath(`/pay/${paymentId}`);
          revalidatePath("/sales/payments");
          revalidatePath("/finance/dashboard");
          revalidatePath("/finance/clients");
          revalidatePath("/hr/clients");
        } catch {
          // ignore revalidation errors in unit test or non-request contexts
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    return NextResponse.json({ status: "error", message: err?.message || "Webhook error" }, { status: 400 });
  }
}
