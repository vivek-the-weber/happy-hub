-- Add shipping-related columns to stores table
ALTER TABLE public.stores 
  ADD COLUMN estimated_delivery_time text DEFAULT NULL,
  ADD COLUMN shipping_charge numeric DEFAULT 0,
  ADD COLUMN free_shipping boolean DEFAULT false;