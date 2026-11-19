import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { completePayment } from "@/lib/payments";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      paymentId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      clientName,
      businessName,
      phone,
      location,
      deadline,
    } = body;

    if (!paymentId) {
      return NextResponse.json({ ok: false, message: "Missing paymentId" }, { status: 400 });
    }

    const updated = await completePayment(paymentId, {
      payment_id: razorpayPaymentId || `pay_${Date.now()}`,
      order_id: razorpayOrderId,
      signature: razorpaySignature,
      client_name: clientName || undefined,
      business_name: businessName || undefined,
      phone: phone || undefined,
      location: location || undefined,
      deadline: deadline || undefined,
    });

    if (!updated) {
      return NextResponse.json({ ok: false, message: "Payment not found" }, { status: 404 });
    }

    try {
      revalidatePath(`/pay/${paymentId}`);
      revalidatePath("/sales/payments");
      revalidatePath("/finance/dashboard");
      revalidatePath("/finance/clients");
      revalidatePath("/hr/clients");
    } catch {
      // ignore revalidation errors in non-request contexts
    }

    return NextResponse.json({
      ok: true,
      status: "Done",
      payment: updated,
      message: "Payment successfully verified and saved",
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || "Internal server error" }, { status: 500 });
  }
}
