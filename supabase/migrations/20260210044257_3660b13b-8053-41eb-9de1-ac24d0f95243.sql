
-- 1. Add order_access_token column
ALTER TABLE public.orders ADD COLUMN order_access_token TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT;

-- 2. Update trigger function to also set access token
CREATE OR REPLACE FUNCTION public.set_order_payment_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Generate unique payment code
  NEW.payment_code := public.generate_payment_code();
  
  -- Set code lifecycle fields
  NEW.code_status := 'active';
  NEW.code_expires_at := NOW() + INTERVAL '45 minutes';
  
  -- Generate access token for buyer tracking
  NEW.order_access_token := gen_random_uuid()::TEXT;
  
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
$function$;

-- 3. Create get_order_tracking RPC
CREATE OR REPLACE FUNCTION public.get_order_tracking(p_order_id UUID, p_token TEXT)
RETURNS TABLE(
  id UUID,
  store_id UUID,
  total_amount NUMERIC,
  status TEXT,
  payment_code TEXT,
  customer_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT o.id, o.store_id, o.total_amount, o.status, o.payment_code, o.customer_name
  FROM public.orders o
  WHERE o.id = p_order_id AND o.order_access_token = p_token;
END;
$function$;

-- 4. Update confirm_payment_by_code to support action param and return items
CREATE OR REPLACE FUNCTION public.confirm_payment_by_code(p_code TEXT, p_action TEXT DEFAULT 'preview')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_seller_id UUID;
  v_normalized_code TEXT;
  v_order RECORD;
  v_store RECORD;
  v_items JSON;
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
    RETURN json_build_object('success', false, 'error', 'invalid_code');
  END IF;

  -- Check if already processed (not pending_payment)
  IF v_order.status != 'pending_payment' THEN
    RETURN json_build_object('success', false, 'error', 'already_processed');
  END IF;

  -- Fetch order items
  SELECT json_agg(json_build_object(
    'product_name', oi.product_name,
    'product_price', oi.product_price,
    'quantity', oi.quantity
  ))
  INTO v_items
  FROM public.order_items oi
  WHERE oi.order_id = v_order.id;

  -- Preview mode: just return order details without changing anything
  IF p_action = 'preview' THEN
    RETURN json_build_object(
      'success', true,
      'action', 'preview',
      'order_id', v_order.id,
      'customer_name', v_order.customer_name,
      'total_amount', v_order.total_amount,
      'items', COALESCE(v_items, '[]'::json)
    );
  END IF;

  -- Confirm action
  IF p_action = 'confirm' THEN
    UPDATE public.orders
    SET status = 'confirmed', code_status = 'used', confirmed_at = NOW()
    WHERE id = v_order.id;

    RETURN json_build_object(
      'success', true,
      'action', 'confirm',
      'order_id', v_order.id,
      'customer_name', v_order.customer_name,
      'total_amount', v_order.total_amount
    );
  END IF;

  -- Hold action
  IF p_action = 'hold' THEN
    UPDATE public.orders
    SET status = 'on_hold'
    WHERE id = v_order.id;

    RETURN json_build_object(
      'success', true,
      'action', 'hold',
      'order_id', v_order.id
    );
  END IF;

  RETURN json_build_object('success', false, 'error', 'invalid_action');
END;
$function$;

-- 5. Drop expire_active_payment_codes (no longer needed)
DROP FUNCTION IF EXISTS public.expire_active_payment_codes();

-- 6. Backfill existing orders that might have default token
UPDATE public.orders SET order_access_token = gen_random_uuid()::TEXT WHERE order_access_token IS NULL OR order_access_token = '';
