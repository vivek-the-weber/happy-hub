-- Add city column to stores table
ALTER TABLE public.stores ADD COLUMN city text;

-- Add unique constraint on slug for username validation
ALTER TABLE public.stores ADD CONSTRAINT stores_slug_unique UNIQUE (slug);