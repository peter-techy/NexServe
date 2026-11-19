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

const AUDIT_ENTITY_TYPE = "client_payment_record";

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

function mapDbRowToPayment(data: any): ClientPayment {
  return {
    id: data.id,
    link_token: data.link_token,
    salesperson_id: data.salesperson_id,
    salesperson_name: data.salesperson?.full_name || data.salesperson_name || "Sales Representative",
    salesperson_email: data.salesperson?.email || data.salesperson_email || "",
    amount: Number(data.amount),
    client_name: data.client_name ?? null,
    business_name: data.business_name ?? null,
    phone: data.phone ?? null,
    location: data.location ?? null,
    deadline: data.deadline ?? null,
    status: (data.status || "Pending") as PaymentStatus,
    razorpay_payment_id: data.razorpay_payment_id ?? null,
    razorpay_order_id: data.razorpay_order_id ?? null,
    razorpay_signature: data.razorpay_signature ?? null,
    paid_at: data.paid_at ?? null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Syncs a completed client payment into public.clients for unified CRM visibility,
 * respecting all column check constraints.
 */
async function syncClientToCrm(
  admin: ReturnType<typeof createAdminClient>,
  payment: ClientPayment
) {
  if (!payment.client_name || !payment.business_name || !payment.salesperson_id) return;
  try {
    const personName = payment.client_name.trim().slice(0, 120);
    const businessName = payment.business_name.trim().slice(0, 160);
    const location = (payment.location || "Remote").trim().slice(0, 160);
    if (personName.length < 2 || businessName.length < 2 || location.length < 2) return;

    const cleanPhone = payment.phone
      ? payment.phone.replace(/[^0-9+ ()-]/g, "").trim().slice(0, 20)
      : null;
    const validPhone =
      cleanPhone && /^\+?[0-9 ()-]{6,20}$/.test(cleanPhone) ? cleanPhone : null;

    await admin.from("clients").insert({
      person_name: personName,
      business_name: businessName,
      location,
      client_number: validPhone,
      created_by: payment.salesperson_id,
      assigned_to: payment.salesperson_id,
    });
  } catch {
    // Ignore duplicate client constraint or non-critical CRM sync errors
  }
}

/**
 * Persistent Supabase fallback using private audit_logs table when client_payments
 * migration has not yet been applied. Survives serverless restarts across Vercel containers.
 */
async function saveToAuditStore(
  admin: ReturnType<typeof createAdminClient>,
  payment: ClientPayment,
  action: string
): Promise<boolean> {
  try {
    const { data: existing } = await admin
      .from("audit_logs")
      .select("id")
      .eq("entity_type", AUDIT_ENTITY_TYPE)
      .eq("entity_id", payment.id)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await admin
        .from("audit_logs")
        .update({
          action,
          metadata: payment as unknown as Record<string, unknown>,
        })
        .eq("id", existing.id);
      return !error;
    }

    const { error } = await admin.from("audit_logs").insert({
      actor_user_id: payment.salesperson_id || null,
      action,
      entity_type: AUDIT_ENTITY_TYPE,
      entity_id: payment.id,
      metadata: payment as unknown as Record<string, unknown>,
    });
    return !error;
  } catch (err) {
    console.warn("[payments] Supabase persistent fallback error:", err);
    return false;
  }
}

async function getFromAuditStore(
  admin: ReturnType<typeof createAdminClient>,
  idOrToken: string
): Promise<ClientPayment | null> {
  try {
    // First look up by exact entity_id (payment.id)
    const { data: byId } = await admin
      .from("audit_logs")
      .select("metadata")
      .eq("entity_type", AUDIT_ENTITY_TYPE)
      .eq("entity_id", idOrToken)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (byId?.metadata && typeof byId.metadata === "object") {
      return mapDbRowToPayment(byId.metadata);
    }

    // Fallback: look up by link_token inside metadata
    const { data: byToken } = await admin
      .from("audit_logs")
      .select("metadata")
      .eq("entity_type", AUDIT_ENTITY_TYPE)
      .contains("metadata", { link_token: idOrToken })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (byToken?.metadata && typeof byToken.metadata === "object") {
      return mapDbRowToPayment(byToken.metadata);
    }
  } catch (err) {
    console.warn("[payments] Supabase audit store get error:", err);
  }
  return null;
}

async function listFromAuditStore(
  admin: ReturnType<typeof createAdminClient>
): Promise<ClientPayment[]> {
  try {
    const { data, error } = await admin
      .from("audit_logs")
      .select("entity_id, metadata")
      .eq("entity_type", AUDIT_ENTITY_TYPE)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error || !data) return [];

    // Deduplicate by entity_id keeping the latest row
    const seen = new Set<string>();
    const results: ClientPayment[] = [];
    for (const row of data) {
      if (!row.metadata || typeof row.metadata !== "object") continue;
      const key = row.entity_id || (row.metadata as any).id;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      results.push(mapDbRowToPayment(row.metadata));
    }
    return results;
  } catch (err) {
    console.warn("[payments] Supabase audit store list error:", err);
    return [];
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

    // Persistent Supabase fallback (audit_logs)
    const saved = await saveToAuditStore(admin, newPayment, "payment.link_created");
    if (saved) return newPayment;
  } catch (err) {
    console.warn("[payments] Database insert fallback to local store:", err);
  }

  // Offline local fallback
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
      return mapDbRowToPayment(data);
    }

    // Persistent Supabase fallback (audit_logs)
    const fromAudit = await getFromAuditStore(admin, idOrToken);
    if (fromAudit) return fromAudit;
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
      return mapDbRowToPayment(data);
    }

    // Persistent Supabase fallback (audit_logs)
    const existing = await getFromAuditStore(admin, id);
    if (existing) {
      const updated: ClientPayment = {
        ...existing,
        client_name: fields.client_name,
        business_name: fields.business_name,
        phone: fields.phone,
        location: fields.location,
        deadline: fields.deadline || null,
        updated_at: now,
      };
      const saved = await saveToAuditStore(admin, updated, "payment.onboarding_saved");
      if (saved) return updated;
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
 * Persists both Razorpay transaction details and any client onboarding fields provided,
 * and synchronizes the client into the public.clients CRM table.
 */
export async function completePayment(
  id: string,
  razorpayDetails?: {
    payment_id?: string;
    order_id?: string;
    signature?: string;
    client_name?: string | null;
    business_name?: string | null;
    phone?: string | null;
    location?: string | null;
    deadline?: string | null;
  }
): Promise<ClientPayment | null> {
  const now = new Date().toISOString();
  const paymentId = razorpayDetails?.payment_id || `rzp_${Date.now()}`;

  try {
    const admin = createAdminClient();
    const updatePayload: Record<string, unknown> = {
      status: "Done",
      razorpay_payment_id: paymentId,
      razorpay_order_id: razorpayDetails?.order_id || null,
      razorpay_signature: razorpayDetails?.signature || null,
      paid_at: now,
      updated_at: now,
    };

    if (razorpayDetails?.client_name) updatePayload.client_name = razorpayDetails.client_name;
    if (razorpayDetails?.business_name) updatePayload.business_name = razorpayDetails.business_name;
    if (razorpayDetails?.phone) updatePayload.phone = razorpayDetails.phone;
    if (razorpayDetails?.location) updatePayload.location = razorpayDetails.location;
    if (razorpayDetails?.deadline !== undefined && razorpayDetails.deadline !== "") {
      updatePayload.deadline = razorpayDetails.deadline;
    }

    const { data, error } = await admin
      .from("client_payments")
      .update(updatePayload)
      .eq("id", id)
      .select("*, salesperson:profiles!client_payments_salesperson_id_fkey(full_name, email)")
      .maybeSingle();

    if (!error && data) {
      const mapped = mapDbRowToPayment(data);
      await syncClientToCrm(admin, mapped);
      return mapped;
    }

    // Persistent Supabase fallback (audit_logs)
    const existing = await getFromAuditStore(admin, id);
    if (existing) {
      const updated: ClientPayment = {
        ...existing,
        client_name: razorpayDetails?.client_name || existing.client_name,
        business_name: razorpayDetails?.business_name || existing.business_name,
        phone: razorpayDetails?.phone || existing.phone,
        location: razorpayDetails?.location || existing.location,
        deadline:
          razorpayDetails?.deadline && razorpayDetails.deadline !== ""
            ? razorpayDetails.deadline
            : existing.deadline,
        status: "Done",
        razorpay_payment_id: paymentId,
        razorpay_order_id: razorpayDetails?.order_id || existing.razorpay_order_id || null,
        razorpay_signature: razorpayDetails?.signature || existing.razorpay_signature || null,
        paid_at: existing.paid_at || now,
        updated_at: now,
      };
      const saved = await saveToAuditStore(admin, updated, "payment.completed");
      await syncClientToCrm(admin, updated);
      if (saved) return updated;
    }
  } catch (err) {
    console.warn("[payments] DB completePayment fallback to local store:", err);
  }

  const list = readLocalPayments();
  const index = list.findIndex((p) => p.id === id || p.link_token === id);
  if (index !== -1) {
    list[index] = {
      ...list[index],
      client_name: razorpayDetails?.client_name || list[index].client_name,
      business_name: razorpayDetails?.business_name || list[index].business_name,
      phone: razorpayDetails?.phone || list[index].phone,
      location: razorpayDetails?.location || list[index].location,
      deadline:
        razorpayDetails?.deadline && razorpayDetails.deadline !== ""
          ? razorpayDetails.deadline
          : list[index].deadline,
      status: "Done",
      razorpay_payment_id: paymentId,
      razorpay_order_id: razorpayDetails?.order_id || null,
      razorpay_signature: razorpayDetails?.signature || null,
      paid_at: list[index].paid_at || now,
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
  let loadedFromDb = false;

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
      payments = data.map(mapDbRowToPayment);
      loadedFromDb = true;
    } else {
      // Persistent Supabase fallback (audit_logs)
      const auditPayments = await listFromAuditStore(admin);
      if (auditPayments.length > 0) {
        payments = auditPayments;
        loadedFromDb = true;
      }
    }
  } catch (err) {
    console.warn("[payments] DB list failed, using local file store:", err);
  }

  if (!loadedFromDb && payments.length === 0) {
    payments = readLocalPayments();
  }

  if (filters?.salespersonId) {
    payments = payments.filter((p) => p.salesperson_id === filters.salespersonId);
  }
  if (filters?.status) {
    payments = payments.filter((p) => p.status === filters.status);
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    payments = payments.filter(
      (p) =>
        (p.client_name && p.client_name.toLowerCase().includes(q)) ||
        (p.business_name && p.business_name.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.salesperson_name && p.salesperson_name.toLowerCase().includes(q)) ||
        (p.razorpay_payment_id && p.razorpay_payment_id.toLowerCase().includes(q))
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
