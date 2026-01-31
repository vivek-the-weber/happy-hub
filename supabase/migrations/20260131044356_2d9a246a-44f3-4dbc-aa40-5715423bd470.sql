-- Create table for email subscriptions
CREATE TABLE public.email_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe (insert)
CREATE POLICY "Anyone can subscribe" 
ON public.email_subscriptions 
FOR INSERT 
WITH CHECK (true);

-- Only authenticated admins can view subscriptions (optional, for future admin panel)
CREATE POLICY "Only admins can view subscriptions" 
ON public.email_subscriptions 
FOR SELECT 
USING (false);