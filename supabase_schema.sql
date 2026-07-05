-- ============================================================
-- KSA MART SYARIAH - KSADZZIKRA
-- Supabase Schema Lengkap (Versi Final)
-- Jalankan SELURUH script ini di SQL Editor Supabase KSADZZIKRA
-- Project ID: stiatomaelzrptazayml
-- ============================================================

-- ============================================================
-- 1. TABEL: products (Produk & Inventaris)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    sku TEXT NOT NULL,
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
    wholesale_price NUMERIC,
    wholesale_min_qty NUMERIC,
    has_box_unit BOOLEAN DEFAULT false,
    box_barcode TEXT,
    pcs_per_box NUMERIC,
    box_price NUMERIC,
    box_cost_price NUMERIC,
    sales_coa_code TEXT,
    cogs_coa_code TEXT,
    branch_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_select" ON public.products;
DROP POLICY IF EXISTS "products_all" ON public.products;
CREATE POLICY "products_select" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_all" ON public.products FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 2. TABEL: customers (Pelanggan CRM & Loyalitas)
-- ============================================================
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
DROP POLICY IF EXISTS "customers_select" ON public.customers;
DROP POLICY IF EXISTS "customers_all" ON public.customers;
CREATE POLICY "customers_select" ON public.customers FOR SELECT USING (true);
CREATE POLICY "customers_all" ON public.customers FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 3. TABEL: transactions (Transaksi Penjualan / POS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
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
    branch_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_all" ON public.transactions;
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "transactions_all" ON public.transactions FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 4. TABEL: online_orders (Pesanan Online Pelanggan & Umum)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.online_orders (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    order_no TEXT NOT NULL,
    customer_id TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    distance_km NUMERIC,
    items JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'PENDING',
    branch_id TEXT,
    notes TEXT,
    payment_code TEXT,
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.online_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "online_orders_select" ON public.online_orders;
DROP POLICY IF EXISTS "online_orders_all" ON public.online_orders;
CREATE POLICY "online_orders_select" ON public.online_orders FOR SELECT USING (true);
CREATE POLICY "online_orders_all" ON public.online_orders FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 5. TABEL: store_settings (Pengaturan Toko)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    store_name TEXT,
    store_address TEXT,
    store_phone TEXT,
    business_type TEXT,
    owner_whatsapp TEXT,
    is_tax_enabled BOOLEAN DEFAULT false,
    tax_rate NUMERIC DEFAULT 0,
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
    owner_bank_name TEXT,
    owner_bank_account TEXT,
    payment_methods JSONB DEFAULT '{"bankTransfer": [], "ewallet": []}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "store_settings_select" ON public.store_settings;
DROP POLICY IF EXISTS "store_settings_all" ON public.store_settings;
CREATE POLICY "store_settings_select" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "store_settings_all" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 6. TABEL: coa_accounts (Chart of Accounts / Akun Akuntansi)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coa_accounts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    normal_balance TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.coa_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coa_accounts_select" ON public.coa_accounts;
DROP POLICY IF EXISTS "coa_accounts_all" ON public.coa_accounts;
CREATE POLICY "coa_accounts_select" ON public.coa_accounts FOR SELECT USING (true);
CREATE POLICY "coa_accounts_all" ON public.coa_accounts FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 7. TABEL: journal_entries (Jurnal Umum Akuntansi)
-- ============================================================
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
DROP POLICY IF EXISTS "journal_entries_select" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entries_all" ON public.journal_entries;
CREATE POLICY "journal_entries_select" ON public.journal_entries FOR SELECT USING (true);
CREATE POLICY "journal_entries_all" ON public.journal_entries FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 8. TABEL: audit_logs (Log Aktivitas Sistem)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    timestamp TEXT,
    username TEXT,
    action TEXT,
    category TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_all" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "audit_logs_all" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 9. TABEL: zakat_records (Rekaman Perhitungan Zakat)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.zakat_records (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
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
DROP POLICY IF EXISTS "zakat_records_select" ON public.zakat_records;
DROP POLICY IF EXISTS "zakat_records_all" ON public.zakat_records;
CREATE POLICY "zakat_records_select" ON public.zakat_records FOR SELECT USING (true);
CREATE POLICY "zakat_records_all" ON public.zakat_records FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 10. TABEL: zakat_distributions (Distribusi Zakat)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.zakat_distributions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    timestamp TEXT,
    amount NUMERIC DEFAULT 0,
    recipient TEXT,
    esg_category TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.zakat_distributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "zakat_distributions_select" ON public.zakat_distributions;
DROP POLICY IF EXISTS "zakat_distributions_all" ON public.zakat_distributions;
CREATE POLICY "zakat_distributions_select" ON public.zakat_distributions FOR SELECT USING (true);
CREATE POLICY "zakat_distributions_all" ON public.zakat_distributions FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 11. TABEL: ksa_users (Akun Pengguna Aplikasi)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ksa_users (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'KASIR',
    phone TEXT,
    branch_id TEXT,
    is_active BOOLEAN DEFAULT true,
    is_approved BOOLEAN DEFAULT false,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ksa_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ksa_users_select" ON public.ksa_users;
DROP POLICY IF EXISTS "ksa_users_all" ON public.ksa_users;
CREATE POLICY "ksa_users_select" ON public.ksa_users FOR SELECT USING (true);
CREATE POLICY "ksa_users_all" ON public.ksa_users FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 12. TABEL: ksa_branches (Cabang / Toko)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ksa_branches (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ksa_branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ksa_branches_select" ON public.ksa_branches;
DROP POLICY IF EXISTS "ksa_branches_all" ON public.ksa_branches;
CREATE POLICY "ksa_branches_select" ON public.ksa_branches FOR SELECT USING (true);
CREATE POLICY "ksa_branches_all" ON public.ksa_branches FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 13. TABEL: attendance (Absensi Karyawan)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
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
DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
DROP POLICY IF EXISTS "attendance_all" ON public.attendance;
CREATE POLICY "attendance_select" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "attendance_all" ON public.attendance FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- 14. TABEL: shifts (Shift & Tutup Kasir)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shifts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    cashier_name TEXT,
    branch_id TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    break_start TIMESTAMPTZ,
    break_end TIMESTAMPTZ,
    expected_cash NUMERIC,
    actual_cash NUMERIC,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shifts_select" ON public.shifts;
DROP POLICY IF EXISTS "shifts_all" ON public.shifts;
CREATE POLICY "shifts_select" ON public.shifts FOR SELECT USING (true);
CREATE POLICY "shifts_all" ON public.shifts FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- DATA AWAL: Produk PPOB Default
-- ============================================================
INSERT INTO public.products (id, sku, name, category, price, cost_price, stock, min_stock, unit, is_halal, is_ppob)
VALUES
    ('ppob_1', 'PPOB-PLS-50', 'Pulsa Telkomsel 50.000', 'Pulsa', 51500, 50000, 9999, 0, 'Trx', true, true),
    ('ppob_2', 'PPOB-PLN-100', 'Token PLN 100.000', 'Token Listrik', 102500, 100000, 9999, 0, 'Trx', true, true),
    ('ppob_3', 'PPOB-PDAM', 'Tagihan PDAM (Admin)', 'PDAM', 2500, 1000, 9999, 0, 'Trx', true, true),
    ('ppob_4', 'PPOB-BPJS', 'Bayar BPJS (Admin)', 'BPJS', 2500, 1000, 9999, 0, 'Trx', true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SELESAI! Semua tabel KSA Mart - KSADZZIKRA sudah siap.
-- ============================================================