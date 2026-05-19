
CREATE TABLE public.trysy_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL UNIQUE,
  trysy_store_id TEXT NOT NULL,
  trysy_api_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  trysy_fee NUMERIC NOT NULL DEFAULT 99,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trysy_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view their trysy connection"
ON public.trysy_connections FOR SELECT
USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = trysy_connections.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "Store owners can insert their trysy connection"
ON public.trysy_connections FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = trysy_connections.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "Store owners can update their trysy connection"
ON public.trysy_connections FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = trysy_connections.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "Store owners can delete their trysy connection"
ON public.trysy_connections FOR DELETE
USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = trysy_connections.store_id AND stores.owner_id = auth.uid()));

CREATE TRIGGER update_trysy_connections_updated_at
BEFORE UPDATE ON public.trysy_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
