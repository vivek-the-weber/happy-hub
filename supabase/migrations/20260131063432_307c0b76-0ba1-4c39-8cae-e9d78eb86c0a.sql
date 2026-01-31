-- Create collections table
CREATE TABLE public.collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create product-collection junction table
CREATE TABLE public.product_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, collection_id)
);

-- Enable RLS on both tables
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;

-- Collections RLS policies
CREATE POLICY "Anyone can view visible collections"
ON public.collections
FOR SELECT
USING (is_visible = true);

CREATE POLICY "Store owners can view all their collections"
ON public.collections
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = collections.store_id AND stores.owner_id = auth.uid()
));

CREATE POLICY "Store owners can create collections"
ON public.collections
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = collections.store_id AND stores.owner_id = auth.uid()
));

CREATE POLICY "Store owners can update their collections"
ON public.collections
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = collections.store_id AND stores.owner_id = auth.uid()
));

CREATE POLICY "Store owners can delete their collections"
ON public.collections
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = collections.store_id AND stores.owner_id = auth.uid()
));

-- Product-collections RLS policies
CREATE POLICY "Anyone can view product-collection links for visible collections"
ON public.product_collections
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM collections WHERE collections.id = product_collections.collection_id AND collections.is_visible = true
));

CREATE POLICY "Store owners can view all their product-collection links"
ON public.product_collections
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM collections c
  JOIN stores s ON s.id = c.store_id
  WHERE c.id = product_collections.collection_id AND s.owner_id = auth.uid()
));

CREATE POLICY "Store owners can create product-collection links"
ON public.product_collections
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM collections c
  JOIN stores s ON s.id = c.store_id
  WHERE c.id = product_collections.collection_id AND s.owner_id = auth.uid()
));

CREATE POLICY "Store owners can delete product-collection links"
ON public.product_collections
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM collections c
  JOIN stores s ON s.id = c.store_id
  WHERE c.id = product_collections.collection_id AND s.owner_id = auth.uid()
));

-- Add updated_at trigger for collections
CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();