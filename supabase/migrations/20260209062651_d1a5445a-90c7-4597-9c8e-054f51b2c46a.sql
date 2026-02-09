
-- 1. Add new columns to orders table
ALTER TABLE public.orders
  ADD COLUMN payment_code TEXT,
  ADD COLUMN code_status TEXT NOT NULL DEFAULT 'active'
    CHECK (code_status IN ('active', 'used', 'expired')),
  ADD COLUMN code_expires_at TIMESTAMPTZ,
  ADD COLUMN seller_upi_id_snapshot TEXT;

-- 2. Add unique constraint on payment_code
ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_code_unique UNIQUE (payment_code);

-- 3. Generate a random 6-character alphanumeric code
CREATE OR REPLACE FUNCTION public.generate_payment_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT := '';
  i INTEGER;
  attempt INTEGER := 0;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM public.orders WHERE payment_code = code) THEN
      RETURN code;
    END IF;

    attempt := attempt + 1;
    IF attempt >= 100 THEN
      RAISE EXCEPTION 'Could not generate unique payment code after 100 attempts';
    END IF;
  END LOOP;
END;
$$;

-- 4. Trigger function: auto-populate payment fields on insert
CREATE OR REPLACE FUNCTION public.set_order_payment_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate unique payment code
  NEW.payment_code := public.generate_payment_code();
  
  -- Set code lifecycle fields
  NEW.code_status := 'active';
  NEW.code_expires_at := NOW() + INTERVAL '45 minutes';
  
  -- Snapshot seller's current UPI ID
  SELECT upi_id INTO NEW.seller_upi_id_snapshot
  FROM public.seller_payment_settings
  WHERE store_id = NEW.store_id
    AND is_active = true
  LIMIT 1;
  
  -- Override status to pending_payment
  NEW.status := 'pending_payment';
  
  RETURN NEW;
END;
$$;

-- 5. Attach the trigger
CREATE TRIGGER before_insert_order_payment_code
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_payment_code();

-- 6. Expiry function: mark stale active codes as expired
CREATE OR REPLACE FUNCTION public.expire_active_payment_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET code_status = 'expired'
  WHERE code_status = 'active'
    AND code_expires_at < NOW();
END;
$$;

-- 7. Now make payment_code NOT NULL (after trigger is in place)
ALTER TABLE public.orders
  ALTER COLUMN payment_code SET NOT NULL;
