-- Fix security issues identified in Supabase dashboard

-- 1. Create categories table if missing and enable RLS
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (allowing all users to read, but only authenticated users to manage)
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- 2. Fix function search_path issues (prevents schema manipulation attacks)
-- Drop and recreate functions with secure search_path

-- Fix snapshots.create_snapshot (if exists)
DROP FUNCTION IF EXISTS snapshots.create_snapshot CASCADE;
-- Note: If you use snapshots extension, recreate it with SET search_path = ''

-- Fix snapshots.restore_snapshot (if exists)
DROP FUNCTION IF EXISTS snapshots.restore_snapshot CASCADE;
-- Note: If you use snapshots extension, recreate it with SET search_path = ''

-- Fix public.update_updated_at_column (if exists)
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add index for categories
CREATE INDEX IF NOT EXISTS idx_categories_label ON public.categories(label);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);
