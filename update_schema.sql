-- ============================================================
-- SCRIPT PEMBARUAN AMAN SUPABASE (SAFE UPDATE)
-- Gunakan script ini jika Anda tidak ingin kehilangan data lama.
-- Cukup block (Ctrl+A), Copy, lalu Paste ke SQL Editor Supabase, lalu tekan RUN.
-- ============================================================

-- 1. Tambahkan dukungan Multi-Cabang untuk Produk
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS branch_id TEXT;

-- 2. Tambahkan dukungan Multi-Cabang untuk Pelanggan (Member)
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS branch_id TEXT;

-- 3. Tambahkan Feedback & Rating dari Layar Pelanggan (Customer Display)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS customer_rating TEXT,
ADD COLUMN IF NOT EXISTS customer_feedback TEXT,
ADD COLUMN IF NOT EXISTS branch_id TEXT;

-- 4. Tambahkan alokasi cabang untuk Pesanan Online
ALTER TABLE public.online_orders 
ADD COLUMN IF NOT EXISTS branch_id TEXT;

-- 5. Tambahkan alokasi cabang untuk Jurnal Akuntansi (CoA)
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS branch_id TEXT;

-- 6. Tambahkan jam operasional untuk Store Settings
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS operational_hours JSONB DEFAULT '{"isOpen": true, "openTime": "07:00", "closeTime": "21:00", "closedMessage": "Maaf, toko sedang tutup."}'::jsonb;

-- 7. Tambahkan kolom ongkos kirim pada Transaksi dan Pesanan Online
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC DEFAULT 0;

ALTER TABLE public.online_orders
ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC DEFAULT 0;

-- 8. Tambahkan kolom whatsapp pada ksa_branches
ALTER TABLE public.ksa_branches
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- 9. Tambahkan saldo kas kecil (Petty Cash) pada Store Settings
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS petty_cash_balance NUMERIC DEFAULT 0;

-- 10. Tambahkan Piutang / Kasbon pada ksa_users
ALTER TABLE public.ksa_users
ADD COLUMN IF NOT EXISTS debt_amount NUMERIC DEFAULT 0;

-- 11. Tambahkan titik koordinat dan batas radius untuk Toko
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS store_location_lat NUMERIC,
ADD COLUMN IF NOT EXISTS store_location_lng NUMERIC,
ADD COLUMN IF NOT EXISTS max_delivery_radius_km NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS attendance_radius_meters NUMERIC DEFAULT 50;

-- 12. Tambahkan pengaturan program loyalitas Poin
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS enable_points BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS point_earning_rate NUMERIC DEFAULT 1000,
ADD COLUMN IF NOT EXISTS point_redemption_value NUMERIC DEFAULT 10;

-- Selesai! Script ini aman dijalankan berkali-kali tanpa error.
