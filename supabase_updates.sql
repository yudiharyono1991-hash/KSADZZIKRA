-- ========================================================================
-- 🕌 UPDATE SKEMA DATABASE SUPABASE UNTUK KSA MART SYARIAH 🕌
-- ========================================================================
-- Salin seluruh perintah SQL di bawah ini dan tempelkan ke "SQL Editor"
-- pada dashboard Supabase Anda, lalu klik "Run" untuk mengeksekusi.
-- Skrip ini akan secara aman mengoreksi/menambah kolom yang kurang tanpa merusak data lama.

-- 1. PILIHAN UNTUK MENAMBAH KOLOM MULTI-TENANT (tenant_id) KE SELURUH TABEL UTAMA
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'tenant_default';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'tenant_default';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'tenant_default';
ALTER TABLE public.zakat_records ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'tenant_default';
ALTER TABLE public.zakat_distributions ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'tenant_default';

-- 2. MENAMBAH KOLOM AKUNTANSI & BOX UNIT PADA TABEL products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS wholesale_min_qty INTEGER;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_box_unit BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS box_barcode TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pcs_per_box INTEGER;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS box_price NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS box_cost_price NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sales_coa_code TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cogs_coa_code TEXT;

-- 3. MENAMBAH KOLOM POIN & DETAIL TRANSAKSI PADA TABEL transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS promo_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS branch_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_voided BOOLEAN DEFAULT false;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS void_reason TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS split_payments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS points_redeemed INTEGER DEFAULT 0;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS points_discount NUMERIC DEFAULT 0;

-- 4. MENAMBAH KOLOM DETAIL USER PADA TABEL ba_users
ALTER TABLE public.ba_users ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'tenant_default';
ALTER TABLE public.ba_users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.ba_users ADD COLUMN IF NOT EXISTS branch_id TEXT;
ALTER TABLE public.ba_users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE public.ba_users ADD COLUMN IF NOT EXISTS is_koperasi_member BOOLEAN DEFAULT false;

-- 5. MEMBUAT TABEL MASING-MASING DATA MASTER BARU (JIKA BELUM ADA)
-- A. TABEL: coa_accounts (Chart of Accounts)
CREATE TABLE IF NOT EXISTS public.coa_accounts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT DEFAULT 'tenant_default',
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.coa_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for coa_accounts" ON public.coa_accounts;
DROP POLICY IF EXISTS "Allow public write access for coa_accounts" ON public.coa_accounts;
CREATE POLICY "Allow public read access for coa_accounts" ON public.coa_accounts FOR SELECT USING (true);
CREATE POLICY "Allow public write access for coa_accounts" ON public.coa_accounts FOR ALL USING (true) WITH CHECK (true);

-- B. TABEL: customers (Master Pelanggan)
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    tenant_id TEXT DEFAULT 'tenant_default',
    name TEXT NOT NULL,
    phone TEXT,
    points INTEGER DEFAULT 0,
    debt_amount NUMERIC DEFAULT 0,
    branch_id TEXT,
    is_koperasi_member BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public write access for customers" ON public.customers;
CREATE POLICY "Allow public read access for customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow public write access for customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

-- C. TABEL: suppliers (Master Supplier)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    tenant_id TEXT DEFAULT 'tenant_default',
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    address TEXT,
    debt_amount NUMERIC DEFAULT 0,
    branch_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow public write access for suppliers" ON public.suppliers;
CREATE POLICY "Allow public read access for suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Allow public write access for suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);

-- D. TABEL: promos (Manajemen Promo)
CREATE TABLE IF NOT EXISTS public.promos (
    id TEXT PRIMARY KEY,
    tenant_id TEXT DEFAULT 'tenant_default',
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'PERCENTAGE' | 'FIXED'
    value NUMERIC DEFAULT 0,
    min_purchase NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    branch_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for promos" ON public.promos;
DROP POLICY IF EXISTS "Allow public write access for promos" ON public.promos;
CREATE POLICY "Allow public read access for promos" ON public.promos FOR SELECT USING (true);
CREATE POLICY "Allow public write access for promos" ON public.promos FOR ALL USING (true) WITH CHECK (true);
