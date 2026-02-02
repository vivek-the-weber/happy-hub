-- 1. Create the new shiprocket_connections table
CREATE TABLE public.shiprocket_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL,
  pickup_postcode text,
  default_weight numeric DEFAULT 0.5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Migrate existing data from stores
INSERT INTO public.shiprocket_connections (store_id, email, token)
SELECT id, shiprocket_email, shiprocket_token
FROM public.stores
WHERE shiprocket_connected = true 
  AND shiprocket_email IS NOT NULL 
  AND shiprocket_token IS NOT NULL;

-- 3. Enable RLS
ALTER TABLE public.shiprocket_connections ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Store owners can view their connection"
  ON public.shiprocket_connections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = shiprocket_connections.store_id 
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store owners can insert connection"
  ON public.shiprocket_connections FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = shiprocket_connections.store_id 
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store owners can update their connection"
  ON public.shiprocket_connections FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = shiprocket_connections.store_id 
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store owners can delete their connection"
  ON public.shiprocket_connections FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = shiprocket_connections.store_id 
    AND stores.owner_id = auth.uid()
  ));

-- 5. Add updated_at trigger
CREATE TRIGGER update_shiprocket_connections_updated_at
  BEFORE UPDATE ON public.shiprocket_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Remove old columns from stores
ALTER TABLE public.stores 
  DROP COLUMN shiprocket_email,
  DROP COLUMN shiprocket_token,
  DROP COLUMN shiprocket_connected;