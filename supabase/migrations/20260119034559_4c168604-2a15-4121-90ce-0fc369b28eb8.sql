-- Add image_urls array column to products table
ALTER TABLE public.products 
  ADD COLUMN image_urls text[] DEFAULT '{}';

-- Migrate existing image_url data to image_urls array
UPDATE public.products 
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url != '';