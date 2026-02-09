
-- Add confirmed_at column to orders
ALTER TABLE public.orders ADD COLUMN confirmed_at TIMESTAMPTZ DEFAULT NULL;

-- Update status constraint to include manual_review
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'pending_payment', 'manual_review'));

-- Create confirm_payment_by_code RPC
CREATE OR REPLACE FUNCTION public.confirm_payment_by_code(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_seller_id UUID;
  v_normalized_code TEXT;
  v_order RECORD;
  v_store RECORD;
BEGIN
  -- Check authentication
  v_seller_id := auth.uid();
  IF v_seller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  -- Normalize input
  v_normalized_code := UPPER(TRIM(p_code));

  -- Find the order by payment code
  SELECT o.id, o.store_id, o.customer_name, o.total_amount, o.status, o.code_status, o.code_expires_at
  INTO v_order
  FROM public.orders o
  WHERE o.payment_code = v_normalized_code;

  -- Code not found
  IF v_order IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'invalid_code');
  END IF;

  -- Check order belongs to seller's store
  SELECT s.id INTO v_store
  FROM public.stores s
  WHERE s.id = v_order.store_id AND s.owner_id = v_seller_id;

  IF v_store IS NULL THEN
    -- Return same generic error to prevent information leakage
    RETURN json_build_object('success', false, 'error', 'invalid_code');
  END IF;

  -- Check if already processed (not pending_payment)
  IF v_order.status != 'pending_payment' THEN
    RETURN json_build_object('success', false, 'error', 'already_processed');
  END IF;

  -- Check if code is already used
  IF v_order.code_status = 'used' THEN
    RETURN json_build_object('success', false, 'error', 'already_processed');
  END IF;

  -- Check if code is expired (by status or by time)
  IF v_order.code_status = 'expired' OR v_order.code_expires_at < NOW() THEN
    -- Move to manual review
    UPDATE public.orders
    SET status = 'manual_review', code_status = 'expired'
    WHERE id = v_order.id;

    RETURN json_build_object('success', false, 'error', 'expired');
  END IF;

  -- Check code_status is active
  IF v_order.code_status != 'active' THEN
    RETURN json_build_object('success', false, 'error', 'invalid_code');
  END IF;

  -- All validations passed — confirm the order
  UPDATE public.orders
  SET status = 'confirmed', code_status = 'used', confirmed_at = NOW()
  WHERE id = v_order.id;

  RETURN json_build_object(
    'success', true,
    'order_id', v_order.id,
    'customer_name', v_order.customer_name,
    'total_amount', v_order.total_amount
  );
END;
$$;
