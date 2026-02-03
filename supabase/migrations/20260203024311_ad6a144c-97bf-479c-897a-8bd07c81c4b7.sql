-- Add token_expires_at column to track when Shiprocket tokens expire
ALTER TABLE public.shiprocket_connections 
ADD COLUMN token_expires_at timestamptz;