-- ============================================================
-- SCRIPT FINAL MASTER SCHEMA KSA MART (SAFE UPDATE)
-- ============================================================
-- Anda dapat melakukan "Copy All" pada script ini dan melakukan
-- "Run" pada SQL Editor di Dashboard Supabase Anda.
-- Script ini aman untuk dijalankan kapan saja karena
-- menggunakan "CREATE TABLE IF NOT EXISTS" dan 
-- "ADD COLUMN IF NOT EXISTS". Tidak akan menghapus data lama.
-- ============================================================

-- 1. Tabel KSA Users (Karyawan, Admin, Pelanggan)
CREATE TABLE IF NOT EXISTS public.ksa_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    tenant_id TEXT,
    branch_id TEXT,
    is_active BOOLEAN DEFAULT true,
    is_approved BOOLEAN DEFAULT true,
    debt_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Cabang (Branches)
CREATE TABLE IF NOT EXISTS public.ksa_branches (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    whatsapp TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Produk (Barang Fisik & PPOB)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    branch_id TEXT,
    barcode TEXT,
    name TEXT NOT NULL,
    category TEXT,
    cost_price NUMERIC NOT NULL,
    sell_price NUMERIC NOT NULL,
    stock INTEGER DEFAULT 0,
    is_ppob BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Pelanggan (Members)
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    branch_id TEXT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabel Transaksi Kasir
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    invoice_no TEXT UNIQUE NOT NULL,
    tenant_id TEXT,
    branch_id TEXT,
    cashier_name TEXT,
    customer_id TEXT,
    total_amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    shipping_fee NUMERIC DEFAULT 0,
    customer_rating TEXT,
    customer_feedback TEXT,
    is_voided BOOLEAN DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabel Pesanan Online
CREATE TABLE IF NOT EXISTS public.online_orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    tenant_id TEXT,
    branch_id TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    delivery_address TEXT,
    total_amount NUMERIC NOT NULL,
    shipping_fee NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabel Chart of Accounts (CoA)
CREATE TABLE IF NOT EXISTS public.coa_accounts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabel Jurnal Entri Akuntansi
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    branch_id TEXT,
    account TEXT NOT NULL,
    debit NUMERIC DEFAULT 0,
    credit NUMERIC DEFAULT 0,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Tabel Pengeluaran Kas Kecil (Expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,
    branch_id TEXT,
    amount NUMERIC NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    coa_id TEXT,
    kas_account_id TEXT
);

-- 10. Tabel Pengaturan Toko (Store Settings)
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY,
    tenant_id TEXT UNIQUE NOT NULL,
    store_name TEXT NOT NULL,
    store_address TEXT,
    tax_rate NUMERIC DEFAULT 0,
    petty_cash_balance NUMERIC DEFAULT 0,
    operational_hours JSONB DEFAULT '{"isOpen": true, "openTime": "07:00", "closeTime": "21:00", "closedMessage": "Maaf, toko sedang tutup."}'::jsonb,
    enable_points BOOLEAN DEFAULT false,
    point_earning_rate NUMERIC DEFAULT 1000,
    point_redemption_value NUMERIC DEFAULT 10,
    store_location_lat NUMERIC,
    store_location_lng NUMERIC,
    max_delivery_radius_km NUMERIC DEFAULT 5,
    attendance_radius_meters NUMERIC DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- PENAMBAHAN KOLOM OTOMATIS (Mencegah kolom hilang jika tabel sudah ada)
-- ============================================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS branch_id TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS branch_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS customer_rating TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS customer_feedback TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS branch_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC DEFAULT 0;
ALTER TABLE public.online_orders ADD COLUMN IF NOT EXISTS branch_id TEXT;
ALTER TABLE public.online_orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC DEFAULT 0;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS branch_id TEXT;
ALTER TABLE public.ksa_branches ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS petty_cash_balance NUMERIC DEFAULT 0;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS operational_hours JSONB DEFAULT '{"isOpen": true, "openTime": "07:00", "closeTime": "21:00", "closedMessage": "Maaf, toko sedang tutup."}'::jsonb;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS enable_points BOOLEAN DEFAULT false;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS point_earning_rate NUMERIC DEFAULT 1000;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS point_redemption_value NUMERIC DEFAULT 10;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS store_location_lat NUMERIC;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS store_location_lng NUMERIC;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS max_delivery_radius_km NUMERIC DEFAULT 5;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS attendance_radius_meters NUMERIC DEFAULT 50;
ALTER TABLE public.ksa_users ADD COLUMN IF NOT EXISTS debt_amount NUMERIC DEFAULT 0;

-- Selesai! Semua tabel dipastikan sudah memiliki kolom terbaru.
