
-- Part 1: Fix the status constraint to include 'pending_payment'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'pending_payment'));

-- Part 2: Create get_order_payment_details RPC (SECURITY DEFINER, anonymous-safe)
CREATE OR REPLACE FUNCTION public.get_order_payment_details(p_order_id UUID)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  total_amount NUMERIC,
  payment_code TEXT,
  code_status TEXT,
  code_expires_at TIMESTAMPTZ,
  seller_upi_id_snapshot TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.store_id,
    o.total_amount,
    o.payment_code,
    o.code_status,
    o.code_expires_at,
    o.seller_upi_id_snapshot,
    o.status
  FROM public.orders o
  WHERE o.id = p_order_id;
END;
$$;
