
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
  
  -- Generate access token for buyer tracking only if not provided
  IF NEW.order_access_token IS NULL OR NEW.order_access_token = '' THEN
    NEW.order_access_token := gen_random_uuid()::TEXT;
  END IF;
  
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
