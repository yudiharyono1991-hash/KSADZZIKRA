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

-- Selesai! Script ini aman dijalankan berkali-kali tanpa error.
