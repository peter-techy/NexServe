import { NextResponse, type NextRequest } from "next/server";
import { completePayment } from "@/lib/payments";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = body;

    if (!paymentId) {
      return NextResponse.json({ ok: false, message: "Missing paymentId" }, { status: 400 });
    }

    const updated = await completePayment(paymentId, {
      payment_id: razorpayPaymentId || `pay_${Date.now()}`,
      order_id: razorpayOrderId,
      signature: razorpaySignature,
    });

    if (!updated) {
      return NextResponse.json({ ok: false, message: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      status: "Done",
      payment: updated,
      message: "Payment successfully verified and status set to Done",
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "Internal server error" }, { status: 500 });
  }
}
