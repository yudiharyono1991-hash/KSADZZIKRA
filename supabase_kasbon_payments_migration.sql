-- ============================================================
-- MIGRATION: Buat tabel kasbon_payments di Supabase
-- Jalankan script ini di Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.kasbon_payments (
  id               TEXT PRIMARY KEY,
  tenant_id        TEXT NOT NULL,
  customer_id      TEXT NOT NULL,
  customer_name    TEXT NOT NULL,
  payment_date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amount_paid      NUMERIC(15, 2) NOT NULL DEFAULT 0,
  remaining_debt   NUMERIC(15, 2) NOT NULL DEFAULT 0,
  payment_method   TEXT NOT NULL DEFAULT 'CASH',
  cashier_name     TEXT NOT NULL,
  is_fully_paid    BOOLEAN NOT NULL DEFAULT FALSE,
  notes            TEXT,
  target_invoice_nos JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk performa query per tenant
CREATE INDEX IF NOT EXISTS idx_kasbon_payments_tenant
  ON public.kasbon_payments(tenant_id);

CREATE INDEX IF NOT EXISTS idx_kasbon_payments_customer
  ON public.kasbon_payments(customer_id);

CREATE INDEX IF NOT EXISTS idx_kasbon_payments_date
  ON public.kasbon_payments(payment_date DESC);

-- Row Level Security (opsional tapi disarankan)
ALTER TABLE public.kasbon_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON public.kasbon_payments
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Verifikasi tabel berhasil dibuat
SELECT 'Tabel kasbon_payments berhasil dibuat!' AS status;
