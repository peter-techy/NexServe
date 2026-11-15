-- =============================================================================
-- NexServe — Client Payments, Payment Links & Finance Role Migration
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'finance') THEN
    ALTER TYPE public.app_role ADD VALUE 'finance';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'department' AND e.enumlabel = 'Finance') THEN
    ALTER TYPE public.department ADD VALUE 'Finance';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Client Payments Table (Unified backend across Sales, Finance, and HR)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_token          TEXT NOT NULL UNIQUE,
  salesperson_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount              NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  client_name         TEXT,
  business_name       TEXT,
  phone               TEXT,
  location            TEXT,
  deadline            DATE,
  status              TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Done')),
  razorpay_payment_id TEXT,
  razorpay_order_id   TEXT,
  razorpay_signature  TEXT,
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_payments_status_idx ON public.client_payments (status);
CREATE INDEX IF NOT EXISTS client_payments_salesperson_idx ON public.client_payments (salesperson_id);
CREATE INDEX IF NOT EXISTS client_payments_created_idx ON public.client_payments (created_at DESC);
CREATE INDEX IF NOT EXISTS client_payments_token_idx ON public.client_payments (link_token);

CREATE OR REPLACE TRIGGER client_payments_updated_at BEFORE UPDATE ON public.client_payments
  FOR EACH ROW EXECUTE FUNCTION public.ns_set_updated_at();

ALTER TABLE public.client_payments ENABLE ROW LEVEL SECURITY;

-- Allow public read of payment links by token/id so clients can open onboarding form
DROP POLICY IF EXISTS "Public read payment links" ON public.client_payments;
CREATE POLICY "Public read payment links" ON public.client_payments
  FOR SELECT TO anon, authenticated USING (true);

-- Allow public update of client details & payment status upon client form submission
DROP POLICY IF EXISTS "Public update payment links" ON public.client_payments;
CREATE POLICY "Public update payment links" ON public.client_payments
  FOR UPDATE TO anon, authenticated USING (true);

-- Allow authenticated sales & admin to insert payment links
DROP POLICY IF EXISTS "Staff insert payment links" ON public.client_payments;
CREATE POLICY "Staff insert payment links" ON public.client_payments
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated staff to update payment links
DROP POLICY IF EXISTS "Staff update payment links" ON public.client_payments;
CREATE POLICY "Staff update payment links" ON public.client_payments
  FOR UPDATE TO authenticated USING (true);
