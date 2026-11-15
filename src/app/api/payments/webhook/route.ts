import { NextResponse, type NextRequest } from "next/server";
import { completePayment } from "@/lib/payments";

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

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
    return NextResponse.json({ status: "error", message: err?.message }, { status: 400 });
  }
}
