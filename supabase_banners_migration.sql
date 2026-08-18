-- Create banners table
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  image_url text NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  target_url text,
  tenant_id text DEFAULT 'tenant_default',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Create policies for banners
CREATE POLICY "Enable read access for all users on banners" ON public.banners
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only on banners" ON public.banners
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only on banners" ON public.banners
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only on banners" ON public.banners
  FOR DELETE USING (true);

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_tenant_id ON public.banners(tenant_id);

-- Storage bucket
-- We assume `store-assets` already exists or we should use it. 
-- Ensure store-assets bucket is public
-- INSERT INTO storage.buckets (id, name, public) VALUES ('store-assets', 'store-assets', true) ON CONFLICT (id) DO NOTHING;
