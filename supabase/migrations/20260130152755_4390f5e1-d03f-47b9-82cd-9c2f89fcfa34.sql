-- Add Shiprocket integration columns to stores table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS shiprocket_email text,
ADD COLUMN IF NOT EXISTS shiprocket_token text,
ADD COLUMN IF NOT EXISTS shiprocket_connected boolean DEFAULT false;