-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Anyone can create order items" ON order_items;

-- Recreate as PERMISSIVE policies (default behavior)
CREATE POLICY "Anyone can create orders" 
  ON orders 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can create order items" 
  ON order_items 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);