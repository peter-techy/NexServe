import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import crypto from "crypto";
import { NextRequest } from "next/server";

vi.mock("@/lib/payments", () => ({
  completePayment: vi.fn().mockResolvedValue({ id: "pay_test_123", status: "Done" }),
}));

describe("Razorpay Webhook API", () => {
  const secret = "ceonexserve2000";

  beforeEach(() => {
    process.env.RAZORPAY_WEBHOOK_SECRET = secret;
    vi.clearAllMocks();
  });

  it("rejects request if x-razorpay-signature header is missing", async () => {
    const payload = JSON.stringify({ event: "payment.captured" });
    const req = new NextRequest("http://localhost:3000/api/payments/webhook", {
      method: "POST",
      body: payload,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain("Missing x-razorpay-signature");
  });

  it("rejects request if x-razorpay-signature does not match", async () => {
    const payload = JSON.stringify({ event: "payment.captured" });
    const req = new NextRequest("http://localhost:3000/api/payments/webhook", {
      method: "POST",
      headers: {
        "x-razorpay-signature": "invalid_signature",
      },
      body: payload,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toContain("Invalid webhook signature");
  });

  it("accepts and processes valid signature for payment.captured", async () => {
    const payload = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: "pay_rzp_live_abc123",
            order_id: "order_123",
            notes: {
              payment_id: "record_test_456",
            },
          },
        },
      },
    });

    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const req = new NextRequest("http://localhost:3000/api/payments/webhook", {
      method: "POST",
      headers: {
        "x-razorpay-signature": validSignature,
      },
      body: payload,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");

    const { completePayment } = await import("@/lib/payments");
    expect(completePayment).toHaveBeenCalledWith("record_test_456", {
      payment_id: "pay_rzp_live_abc123",
      order_id: "order_123",
    });
  });
});
