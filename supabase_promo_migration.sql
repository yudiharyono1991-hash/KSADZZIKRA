-- Migration: Add Product Promo fields and Global Promo table

-- 1. Add Promo fields to products table
ALTER TABLE IF EXISTS public.products 
ADD COLUMN IF NOT EXISTS is_promo_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS promo_price NUMERIC DEFAULT 0;

-- 2. Create promos table for Transaction/Global Promos
CREATE TABLE IF NOT EXISTS public.promos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'PERCENTAGE' or 'FIXED'
    value NUMERIC NOT NULL,
    min_purchase NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    branch_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for promos
CREATE INDEX IF NOT EXISTS idx_promos_tenant_id ON public.promos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_promos_is_active ON public.promos(is_active);

-- Enable RLS
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;

-- Create Policy for promos (assuming same basic tenant access as others)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.promos;
CREATE POLICY "Enable read access for all users" ON public.promos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON public.promos;
CREATE POLICY "Enable insert access for all users" ON public.promos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON public.promos;
CREATE POLICY "Enable update access for all users" ON public.promos FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON public.promos;
CREATE POLICY "Enable delete access for all users" ON public.promos FOR DELETE USING (true);

-- Enable realtime for promos table if not already
ALTER PUBLICATION supabase_realtime ADD TABLE public.promos;
