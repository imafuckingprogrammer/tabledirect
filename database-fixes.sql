-- TableDirect Database Schema Fixes
-- Run this in your Supabase SQL Editor

-- Add missing columns to restaurant_tables
ALTER TABLE public.restaurant_tables 
ADD COLUMN IF NOT EXISTS seats integer DEFAULT 4,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS token text;

-- Update existing tables to have token = qr_token for compatibility
UPDATE public.restaurant_tables 
SET token = qr_token 
WHERE token IS NULL;

-- Add missing columns to menu_items
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS allergens jsonb;

-- Add missing columns to menu_categories
ALTER TABLE public.menu_categories 
ADD COLUMN IF NOT EXISTS description text;

-- Create the claim_order function
CREATE OR REPLACE FUNCTION public.claim_order(order_uuid uuid, session_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if order exists and is not already claimed
  IF EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_uuid 
    AND (claimed_by IS NULL OR claimed_by = session_uuid)
    AND status = 'pending'
  ) THEN
    -- Claim the order
    UPDATE public.orders 
    SET claimed_by = session_uuid, 
        claimed_at = now(),
        status = 'preparing'
    WHERE id = order_uuid;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Create the release_order function
CREATE OR REPLACE FUNCTION public.release_order(order_uuid uuid, session_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if order is claimed by this session
  IF EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_uuid 
    AND claimed_by = session_uuid
  ) THEN
    -- Release the order
    UPDATE public.orders 
    SET claimed_by = NULL, 
        claimed_at = NULL,
        status = 'pending'
    WHERE id = order_uuid;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.claim_order(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_order(uuid, uuid) TO authenticated;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'restaurant_tables' 
  AND table_schema = 'public'
ORDER BY ordinal_position; 