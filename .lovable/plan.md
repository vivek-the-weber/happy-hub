

## Fix Order Placement RLS Error

### Problem Analysis

The error `42501` - "new row violates row-level security policy" is occurring because the RLS policy on the `orders` table has an incorrect policy type.

Currently, the policy **"Anyone can create orders"** is configured as:
- **Type: RESTRICTIVE** 
- **Command: INSERT**
- **WITH CHECK: true**

This is the root cause. In PostgreSQL's RLS system:

1. **PERMISSIVE policies** grant access - at least one must pass to allow the operation
2. **RESTRICTIVE policies** only filter/restrict already-granted access - they cannot grant access on their own

Since the INSERT policy is RESTRICTIVE (not PERMISSIVE), it cannot actually allow anyone to insert. The same issue exists for the `order_items` table.

---

### Solution

Drop the existing RESTRICTIVE INSERT policies and recreate them as PERMISSIVE policies.

#### Database Migration Required

```sql
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
```

---

### Why This Fixes the Issue

- `CREATE POLICY` without `AS RESTRICTIVE` creates PERMISSIVE policies by default
- Explicitly granting to both `anon` and `authenticated` roles ensures all users can place orders
- The `WITH CHECK (true)` allows any valid row to be inserted
- No code changes needed in Cart.tsx - the fix is database-side only

---

### Files to Modify

| File | Change |
|------|--------|
| Database migration | Recreate INSERT policies as PERMISSIVE for both `orders` and `order_items` tables |

---

### Technical Note

The existing code in `Cart.tsx` is correct (generates UUID client-side, no `.select()` call). The only issue is the database policy configuration.

