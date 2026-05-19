
CREATE OR REPLACE FUNCTION public.get_trysy_public_config(p_store_id uuid)
RETURNS TABLE(trysy_store_id text, trysy_api_key text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.trysy_store_id, t.trysy_api_key
  FROM public.trysy_connections t
  WHERE t.store_id = p_store_id AND t.is_enabled = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_trysy_public_config(uuid) TO anon, authenticated;
