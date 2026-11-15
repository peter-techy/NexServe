import { NextResponse, type NextRequest } from "next/server";
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
        await completePayment(paymentId, {
          payment_id: payload?.id,
          order_id: payload?.order_id,
        });
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    return NextResponse.json({ status: "error", message: err?.message || "Webhook error" }, { status: 400 });
  }
}
