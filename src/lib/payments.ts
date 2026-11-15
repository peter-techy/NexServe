import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ClientPayment, PaymentStatus } from "@/lib/types";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const SEED_FALLBACK_FILE = path.join(process.cwd(), ".data", "client_payments.json");
const RUNTIME_FALLBACK_FILE =
  process.env.VERCEL || process.env.NODE_ENV === "production"
    ? path.join("/tmp", "client_payments.json")
    : SEED_FALLBACK_FILE;

function ensureDirectoryExists(filePath: string) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // ignore
  }
}

function readLocalPayments(): ClientPayment[] {
  try {
    if (fs.existsSync(RUNTIME_FALLBACK_FILE)) {
      const data = fs.readFileSync(RUNTIME_FALLBACK_FILE, "utf-8");
      return JSON.parse(data);
    }
    if (fs.existsSync(SEED_FALLBACK_FILE)) {
      const data = fs.readFileSync(SEED_FALLBACK_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("[payments] Notice reading local file:", err);
  }
  return [];
}

function writeLocalPayments(payments: ClientPayment[]) {
  try {
    ensureDirectoryExists(RUNTIME_FALLBACK_FILE);
    fs.writeFileSync(RUNTIME_FALLBACK_FILE, JSON.stringify(payments, null, 2), "utf-8");
    if (RUNTIME_FALLBACK_FILE !== SEED_FALLBACK_FILE) {
      try {
        ensureDirectoryExists(SEED_FALLBACK_FILE);
        fs.writeFileSync(SEED_FALLBACK_FILE, JSON.stringify(payments, null, 2), "utf-8");
      } catch {
        // ignore
      }
    }
  } catch (err) {
    console.warn("[payments] Notice writing local file:", err);
  }
}

/**
 * Creates a new payment link tied to a specific amount and logged-in salesperson.
 */
export async function createPaymentLink(params: {
  salespersonId: string;
  salespersonName: string;
  salespersonEmail?: string;
  amount: number;
}): Promise<ClientPayment> {
  const id = crypto.randomUUID();
  const token = crypto.randomBytes(8).toString("hex");
  const now = new Date().toISOString();

  const newPayment: ClientPayment = {
    id,
    link_token: token,
    salesperson_id: params.salespersonId,
    salesperson_name: params.salespersonName,
    salesperson_email: params.salespersonEmail,
    amount: Math.round(params.amount * 100) / 100,
    client_name: null,
    business_name: null,
    phone: null,
    location: null,
    deadline: null,
    status: "Pending",
    razorpay_payment_id: null,
    razorpay_order_id: null,
    razorpay_signature: null,
    paid_at: null,
    created_at: now,
    updated_at: now,
  };

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("client_payments")
      .insert({
        id: newPayment.id,
        link_token: newPayment.link_token,
        salesperson_id: newPayment.salesperson_id,
        amount: newPayment.amount,
        status: "Pending",
      })
      .select("*, salesperson:profiles!client_payments_salesperson_id_fkey(full_name, email)")
      .single();

    if (!error && data) {
      return {
        ...newPayment,
        salesperson_name: data.salesperson?.full_name || params.salespersonName,
        salesperson_email: data.salesperson?.email || params.salespersonEmail,
      };
    }
  } catch (err) {
    console.warn("[payments] Database insert fallback to local store:", err);
  }

  // Resilient fallback storage
  const current = readLocalPayments();
  current.unshift(newPayment);
  writeLocalPayments(current);

  return newPayment;
}

/**
 * Fetches a single payment record by id or link token.
 */
export async function getPaymentByIdOrToken(idOrToken: string): Promise<ClientPayment | null> {
  try {
    const admin = createAdminClient();
    let query = admin
      .from("client_payments")
      .select("*, salesperson:profiles!client_payments_salesperson_id_fkey(full_name, email)");

    if (idOrToken.includes("-") && idOrToken.length >= 32) {
      query = query.or(`id.eq.${idOrToken},link_token.eq.${idOrToken}`);
    } else {
      query = query.eq("link_token", idOrToken);
    }

    const { data, error } = await query.maybeSingle();
    if (!error && data) {
      return {
        id: data.id,
        link_token: data.link_token,
        salesperson_id: data.salesperson_id,
        salesperson_name: data.salesperson?.full_name || "Sales Representative",
        salesperson_email: data.salesperson?.email || "",
        amount: Number(data.amount),
        client_name: data.client_name,
        business_name: data.business_name,
        phone: data.phone,
        location: data.location,
        deadline: data.deadline,
        status: data.status as PaymentStatus,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_order_id: data.razorpay_order_id,
        razorpay_signature: data.razorpay_signature,
        paid_at: data.paid_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }
  } catch (err) {
    console.warn("[payments] DB query failed, falling back to local file:", err);
  }

  const list = readLocalPayments();
  const match = list.find((p) => p.id === idOrToken || p.link_token === idOrToken);
  return match || null;
}

/**
 * Updates client onboarding details before or during payment.
 */
export async function updateClientOnboarding(
  id: string,
  fields: {
    client_name: string;
    business_name: string;
    phone: string;
    location: string;
    deadline?: string | null;
  }
): Promise<ClientPayment | null> {
  const now = new Date().toISOString();

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("client_payments")
      .update({
        client_name: fields.client_name,
        business_name: fields.business_name,
        phone: fields.phone,
        location: fields.location,
        deadline: fields.deadline ? fields.deadline : null,
        updated_at: now,
      })
      .eq("id", id)
      .select("*, salesperson:profiles!client_payments_salesperson_id_fkey(full_name, email)")
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        link_token: data.link_token,
        salesperson_id: data.salesperson_id,
        salesperson_name: data.salesperson?.full_name,
        salesperson_email: data.salesperson?.email,
        amount: Number(data.amount),
        client_name: data.client_name,
        business_name: data.business_name,
        phone: data.phone,
        location: data.location,
        deadline: data.deadline,
        status: data.status as PaymentStatus,
        razorpay_payment_id: data.razorpay_payment_id,
        paid_at: data.paid_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }
  } catch (err) {
    console.warn("[payments] DB update failed, falling back to local store:", err);
  }

  const list = readLocalPayments();
  const index = list.findIndex((p) => p.id === id || p.link_token === id);
  if (index !== -1) {
    list[index] = {
      ...list[index],
      client_name: fields.client_name,
      business_name: fields.business_name,
      phone: fields.phone,
      location: fields.location,
      deadline: fields.deadline || null,
      updated_at: now,
    };
    writeLocalPayments(list);
    return list[index];
  }

  return null;
}

/**
 * Transitions payment status to 'Done' upon successful Razorpay payment.
 * Also synchronizes client into clients CRM table if needed.
 */
export async function completePayment(
  id: string,
  razorpayDetails?: {
    payment_id?: string;
    order_id?: string;
    signature?: string;
  }
): Promise<ClientPayment | null> {
  const now = new Date().toISOString();
  const paymentId = razorpayDetails?.payment_id || `rzp_${Date.now()}`;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("client_payments")
      .update({
        status: "Done",
        razorpay_payment_id: paymentId,
        razorpay_order_id: razorpayDetails?.order_id || null,
        razorpay_signature: razorpayDetails?.signature || null,
        paid_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .select("*, salesperson:profiles!client_payments_salesperson_id_fkey(full_name, email)")
      .maybeSingle();

    if (!error && data) {
      // Also ensure client record exists in public.clients for unified CRM visibility
      try {
        if (data.client_name && data.business_name) {
          await admin.from("clients").insert({
            person_name: data.client_name,
            business_name: data.business_name,
            location: data.location || "Remote",
            client_number: data.phone || null,
            created_by: data.salesperson_id,
            assigned_to: data.salesperson_id,
          });
        }
      } catch {
        // ignore duplicate client constraint
      }

      return {
        id: data.id,
        link_token: data.link_token,
        salesperson_id: data.salesperson_id,
        salesperson_name: data.salesperson?.full_name,
        salesperson_email: data.salesperson?.email,
        amount: Number(data.amount),
        client_name: data.client_name,
        business_name: data.business_name,
        phone: data.phone,
        location: data.location,
        deadline: data.deadline,
        status: "Done",
        razorpay_payment_id: data.razorpay_payment_id,
        paid_at: data.paid_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }
  } catch (err) {
    console.warn("[payments] DB completePayment fallback to local store:", err);
  }

  const list = readLocalPayments();
  const index = list.findIndex((p) => p.id === id || p.link_token === id);
  if (index !== -1) {
    list[index] = {
      ...list[index],
      status: "Done",
      razorpay_payment_id: paymentId,
      razorpay_order_id: razorpayDetails?.order_id || null,
      razorpay_signature: razorpayDetails?.signature || null,
      paid_at: now,
      updated_at: now,
    };
    writeLocalPayments(list);
    return list[index];
  }

  return null;
}

/**
 * Lists all client payments, unified across Sales, Finance, and HR.
 */
export async function listClientPayments(filters?: {
  salespersonId?: string;
  status?: "Pending" | "Done";
  search?: string;
}): Promise<ClientPayment[]> {
  let payments: ClientPayment[] = [];

  try {
    const admin = createAdminClient();
    let query = admin
      .from("client_payments")
      .select("*, salesperson:profiles!client_payments_salesperson_id_fkey(full_name, email)")
      .order("created_at", { ascending: false });

    if (filters?.salespersonId) {
      query = query.eq("salesperson_id", filters.salespersonId);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;
    if (!error && data) {
      payments = data.map((d: any) => ({
        id: d.id,
        link_token: d.link_token,
        salesperson_id: d.salesperson_id,
        salesperson_name: d.salesperson?.full_name || "Sales Representative",
        salesperson_email: d.salesperson?.email || "",
        amount: Number(d.amount),
        client_name: d.client_name,
        business_name: d.business_name,
        phone: d.phone,
        location: d.location,
        deadline: d.deadline,
        status: d.status as PaymentStatus,
        razorpay_payment_id: d.razorpay_payment_id,
        paid_at: d.paid_at,
        created_at: d.created_at,
        updated_at: d.updated_at,
      }));
    }
  } catch (err) {
    console.warn("[payments] DB list failed, using local file store:", err);
  }

  if (payments.length === 0) {
    payments = readLocalPayments();
    if (filters?.salespersonId) {
      payments = payments.filter((p) => p.salesperson_id === filters.salespersonId);
    }
    if (filters?.status) {
      payments = payments.filter((p) => p.status === filters.status);
    }
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    payments = payments.filter(
      (p) =>
        (p.client_name && p.client_name.toLowerCase().includes(q)) ||
        (p.business_name && p.business_name.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.salesperson_name && p.salesperson_name.toLowerCase().includes(q))
    );
  }

  return payments;
}

/**
 * Calculates finance metrics across all client payment records.
 */
export async function getFinanceMetrics(): Promise<{
  totalCollected: number;
  totalPending: number;
  countDone: number;
  countPending: number;
  totalRecords: number;
}> {
  const all = await listClientPayments();
  let totalCollected = 0;
  let totalPending = 0;
  let countDone = 0;
  let countPending = 0;

  for (const item of all) {
    if (item.status === "Done") {
      totalCollected += item.amount;
      countDone += 1;
    } else {
      totalPending += item.amount;
      countPending += 1;
    }
  }

  return {
    totalCollected,
    totalPending,
    countDone,
    countPending,
    totalRecords: all.length,
  };
}
