-- ========================================================================
-- 🕌 SCHEMAS & TABLES UNTUK BERKAH AMANAH MART (POS & KEUANGAN SYARIAH) 🕌
-- ========================================================================
-- Gunakan skrip ini langsung di "SQL Editor" Supabase Anda untuk membuat 
-- seluruh tabel atau mengoreksi kolom yang hilang/mengalami error.

-- 1. TABEL: products
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    cost_price NUMERIC NOT NULL DEFAULT 0,
    stock NUMERIC NOT NULL DEFAULT 0,
    min_stock NUMERIC NOT NULL DEFAULT 0,
    unit TEXT,
    barcode TEXT,
    is_halal BOOLEAN DEFAULT true,
    is_ppob BOOLEAN DEFAULT false,
    image TEXT,
    expiry_date TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for products" ON public.products;
DROP POLICY IF EXISTS "Allow public write access for products" ON public.products;
CREATE POLICY "Allow public read access for products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public write access for products" ON public.products FOR ALL USING (true) WITH CHECK (true);


-- 14. TABEL: customers (Pelanggan CRM)
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    points NUMERIC DEFAULT 0,
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


-- 2. TABEL: transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    invoice_no TEXT NOT NULL,
    timestamp TEXT,
    cashier_name TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT,
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    change_amount NUMERIC NOT NULL DEFAULT 0,
    zakat_contribution NUMERIC NOT NULL DEFAULT 0,
    margin_contribution NUMERIC NOT NULL DEFAULT 0,
    customer_id TEXT,
    points_earned NUMERIC DEFAULT 0,
    points_redeemed NUMERIC DEFAULT 0,
    points_discount NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public write access for transactions" ON public.transactions;
CREATE POLICY "Allow public read access for transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public write access for transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);


-- 3. TABEL: audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    username TEXT,
    action TEXT,
    category TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow public write access for audit_logs" ON public.audit_logs;
CREATE POLICY "Allow public read access for audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public write access for audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);


-- 4. TABEL: zakat_records
CREATE TABLE IF NOT EXISTS public.zakat_records (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    gold_price NUMERIC DEFAULT 0,
    nisab_value NUMERIC DEFAULT 0,
    liquid_assets NUMERIC DEFAULT 0,
    inventory_value NUMERIC DEFAULT 0,
    receivables NUMERIC DEFAULT 0,
    liabilities NUMERIC DEFAULT 0,
    net_wealth NUMERIC DEFAULT 0,
    is_eligible BOOLEAN DEFAULT true,
    zakat_due NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.zakat_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for zakat_records" ON public.zakat_records;
DROP POLICY IF EXISTS "Allow public write access for zakat_records" ON public.zakat_records;
CREATE POLICY "Allow public read access for zakat_records" ON public.zakat_records FOR SELECT USING (true);
CREATE POLICY "Allow public write access for zakat_records" ON public.zakat_records FOR ALL USING (true) WITH CHECK (true);


-- 5. TABEL: zakat_distributions
CREATE TABLE IF NOT EXISTS public.zakat_distributions (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    amount NUMERIC DEFAULT 0,
    recipient TEXT,
    esg_category TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.zakat_distributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for zakat_distributions" ON public.zakat_distributions;
DROP POLICY IF EXISTS "Allow public write access for zakat_distributions" ON public.zakat_distributions;
CREATE POLICY "Allow public read access for zakat_distributions" ON public.zakat_distributions FOR SELECT USING (true);
CREATE POLICY "Allow public write access for zakat_distributions" ON public.zakat_distributions FOR ALL USING (true) WITH CHECK (true);


-- 6. TABEL: ba_users
CREATE TABLE IF NOT EXISTS public.ba_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'CASHIER',
    created_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    is_approved BOOLEAN DEFAULT false,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    phone TEXT,
    branch_id TEXT
);

ALTER TABLE public.ba_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for ba_users" ON public.ba_users;
DROP POLICY IF EXISTS "Allow public write access for ba_users" ON public.ba_users;
CREATE POLICY "Allow public read access for ba_users" ON public.ba_users FOR SELECT USING (true);
CREATE POLICY "Allow public write access for ba_users" ON public.ba_users FOR ALL USING (true) WITH CHECK (true);


-- 7. TABEL: ba_branches
CREATE TABLE IF NOT EXISTS public.ba_branches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ba_branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for ba_branches" ON public.ba_branches;
DROP POLICY IF EXISTS "Allow public write access for ba_branches" ON public.ba_branches;
CREATE POLICY "Allow public read access for ba_branches" ON public.ba_branches FOR SELECT USING (true);
CREATE POLICY "Allow public write access for ba_branches" ON public.ba_branches FOR ALL USING (true) WITH CHECK (true);


-- 8. TABEL: attendance (Absensi Karyawan)
CREATE TABLE IF NOT EXISTS public.attendance (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    date TEXT NOT NULL,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    status TEXT,
    branch_id TEXT,
    photo_url TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow public write access for attendance" ON public.attendance;
CREATE POLICY "Allow public read access for attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Allow public write access for attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);


-- 9. TABEL: shifts (Tutup Shift Kasir)
CREATE TABLE IF NOT EXISTS public.shifts (
    id TEXT PRIMARY KEY,
    cashier_name TEXT,
    branch_id TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    break_start TIMESTAMPTZ,
    break_end TIMESTAMPTZ,
    expected_cash NUMERIC,
    actual_cash NUMERIC,
    status TEXT
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for shifts" ON public.shifts;
DROP POLICY IF EXISTS "Allow public write access for shifts" ON public.shifts;
CREATE POLICY "Allow public read access for shifts" ON public.shifts FOR SELECT USING (true);
CREATE POLICY "Allow public write access for shifts" ON public.shifts FOR ALL USING (true) WITH CHECK (true);

-- ========================================================================
-- TAMBAHAN: DUMMY DATA PRODUK PPOB
-- ========================================================================
-- Jalankan insert di bawah ini jika Mimin butuh produk PPOB default.
-- Jangan lupa sesuaikan 'tenant_default' jika menggunakan fitur multi-tenant.

INSERT INTO public.products (id, sku, name, category, price, cost_price, stock, min_stock, unit, is_halal, is_ppob)
VALUES 
('ppob_1', 'PPOB-PLS-50', 'Pulsa Telkomsel 50.000', 'Pulsa', 51500, 50000, 9999, 0, 'Trx', true, true),
('ppob_2', 'PPOB-PLN-100', 'Token PLN 100.000', 'Token Listrik', 102500, 100000, 9999, 0, 'Trx', true, true),
('ppob_3', 'PPOB-PDAM', 'Tagihan PDAM (Admin)', 'PDAM', 2500, 1000, 9999, 0, 'Trx', true, true),
('ppob_4', 'PPOB-BPJS', 'Bayar BPJS (Admin)', 'BPJS', 2500, 1000, 9999, 0, 'Trx', true, true)
ON CONFLICT (id) DO NOTHING;

-- ========================================================================
-- TAMBAHAN TABEL BARU (Fitur Jurnal Umum, CoA, Pesanan Online, Pengaturan)
-- ========================================================================

-- 10. TABEL: coa_accounts (Chart of Accounts)
CREATE TABLE IF NOT EXISTS public.coa_accounts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.coa_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for coa_accounts" ON public.coa_accounts;
DROP POLICY IF EXISTS "Allow public write access for coa_accounts" ON public.coa_accounts;
CREATE POLICY "Allow public read access for coa_accounts" ON public.coa_accounts FOR SELECT USING (true);
CREATE POLICY "Allow public write access for coa_accounts" ON public.coa_accounts FOR ALL USING (true) WITH CHECK (true);


-- 11. TABEL: journal_entries (Jurnal Umum)
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    date TEXT,
    account TEXT,
    description TEXT,
    debit NUMERIC DEFAULT 0,
    credit NUMERIC DEFAULT 0,
    reference_id TEXT,
    reference_type TEXT,
    created_by TEXT,
    branch_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for journal_entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Allow public write access for journal_entries" ON public.journal_entries;
CREATE POLICY "Allow public read access for journal_entries" ON public.journal_entries FOR SELECT USING (true);
CREATE POLICY "Allow public write access for journal_entries" ON public.journal_entries FOR ALL USING (true) WITH CHECK (true);


-- 12. TABEL: online_orders (Pesanan Online)
CREATE TABLE IF NOT EXISTS public.online_orders (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    order_no TEXT NOT NULL,
    customer_id TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'PENDING',
    branch_id TEXT,
    notes TEXT,
    payment_code TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.online_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for online_orders" ON public.online_orders;
DROP POLICY IF EXISTS "Allow public write access for online_orders" ON public.online_orders;
CREATE POLICY "Allow public read access for online_orders" ON public.online_orders FOR SELECT USING (true);
CREATE POLICY "Allow public write access for online_orders" ON public.online_orders FOR ALL USING (true) WITH CHECK (true);


-- 13. TABEL: store_settings (Pengaturan Toko & Radius)
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    is_tax_enabled BOOLEAN DEFAULT false,
    tax_rate NUMERIC DEFAULT 0,
    store_name TEXT,
    store_address TEXT,
    store_phone TEXT,
    business_type TEXT,
    owner_whatsapp TEXT,
    payment_timeout_minutes INTEGER DEFAULT 60,
    store_location_lat NUMERIC,
    store_location_lng NUMERIC,
    max_delivery_radius_km NUMERIC DEFAULT 5,
    qris_enabled BOOLEAN DEFAULT true,
    qris_image_url TEXT,
    maintenance_mode BOOLEAN DEFAULT false,
    minimum_cash_balance NUMERIC DEFAULT 1000000,
    zakat_rate NUMERIC DEFAULT 2.5,
    auto_approve_transactions BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Allow public write access for store_settings" ON public.store_settings;
CREATE POLICY "Allow public read access for store_settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Allow public write access for store_settings" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);