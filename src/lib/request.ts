import "server-only";
import { headers } from "next/headers";
import { createHash } from "crypto";

export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
}

/** One-way hash of the client IP (no raw IPs are stored). */
export async function clientFingerprint(): Promise<string> {
  const ip = await clientIp();
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-16) ?? "nexserve";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
