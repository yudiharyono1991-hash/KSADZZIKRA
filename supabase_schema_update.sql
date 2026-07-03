-- ========================================================================
-- 🕌 UPDATE SCHEMA V2 (TAMBAHAN TABEL BARU) 🕌
-- ========================================================================
-- Jalankan skrip ini di "SQL Editor" Supabase untuk menambahkan tabel-tabel 
-- baru terkait manajemen keuangan, jurnal, dan pembelian grosir.

-- 10. TABEL: expenses (Pengeluaran/Biaya Operasional)
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow public write access for expenses" ON public.expenses;
CREATE POLICY "Allow public read access for expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow public write access for expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);


-- 11. TABEL: journal_entries (Buku Besar / Jurnal Akuntansi)
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    account TEXT NOT NULL,
    description TEXT,
    debit NUMERIC NOT NULL DEFAULT 0,
    credit NUMERIC NOT NULL DEFAULT 0,
    reference_id TEXT,
    reference_type TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for journal_entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Allow public write access for journal_entries" ON public.journal_entries;
CREATE POLICY "Allow public read access for journal_entries" ON public.journal_entries FOR SELECT USING (true);
CREATE POLICY "Allow public write access for journal_entries" ON public.journal_entries FOR ALL USING (true) WITH CHECK (true);


-- 12. TABEL: purchase_orders (Pembelian Grosir / PO)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id TEXT PRIMARY KEY,
    po_number TEXT NOT NULL,
    date TEXT NOT NULL,
    supplier TEXT NOT NULL,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING',
    items JSONB DEFAULT '[]'::jsonb,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access for purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Allow public write access for purchase_orders" ON public.purchase_orders;
CREATE POLICY "Allow public read access for purchase_orders" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "Allow public write access for purchase_orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);
