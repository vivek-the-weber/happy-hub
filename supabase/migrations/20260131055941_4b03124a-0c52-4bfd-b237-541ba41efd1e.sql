-- Add structured address columns to orders table
ALTER TABLE public.orders 
ADD COLUMN customer_email TEXT,
ADD COLUMN customer_address_line1 TEXT,
ADD COLUMN customer_address_line2 TEXT,
ADD COLUMN customer_city TEXT,
ADD COLUMN customer_state TEXT,
ADD COLUMN customer_postal_code TEXT,
ADD COLUMN customer_country TEXT;