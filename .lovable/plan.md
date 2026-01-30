

## Fix Order Placement RLS Error

### Problem

When customers place an order, the code uses `.select().single()` after the insert to get the order ID back:

```typescript
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({...})
  .select()   // <-- Requires SELECT permission
  .single();
```

However, the SELECT policy on the `orders` table only allows **store owners** to view orders. Anonymous customers don't have SELECT permission, so the operation fails with error code `42501` (RLS violation).

---

### Solution

Modify the insert logic in `Cart.tsx` to:
1. Insert the order **without** `.select()`
2. Get the order ID using Postgres `RETURNING` clause by adding `{ returning: 'representation' }` option - but this also requires SELECT
3. **Better approach**: Use a separate insert query for order_items that doesn't depend on the order ID, OR add an RLS policy allowing the anon role to read orders they just created

Since orders don't track a `customer_id`, the cleanest solution is to:
1. Add a temporary workaround by generating the order UUID client-side before insert
2. Use that UUID for both the order and order_items inserts

---

### Changes Required

#### Update `src/pages/Cart.tsx`

Generate a UUID client-side for each order, then use it in both the order and order_items inserts:

**Current approach (lines 45-58):**
```typescript
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    store_id: storeId,
    customer_name: customerName,
    // ...
  })
  .select()
  .single();

if (orderError) throw orderError;

const orderItems = items.map(item => ({
  order_id: order.id,  // Uses order.id from select
  // ...
}));
```

**New approach:**
```typescript
// Generate UUID client-side
const orderId = crypto.randomUUID();

const { error: orderError } = await supabase
  .from('orders')
  .insert({
    id: orderId,  // Use client-generated UUID
    store_id: storeId,
    customer_name: customerName,
    // ...
  });

if (orderError) throw orderError;

const orderItems = items.map(item => ({
  order_id: orderId,  // Use the same UUID
  // ...
}));
```

---

### Why This Works

- The `orders` table has `id` with a default of `gen_random_uuid()`, but we can override it with our own UUID
- The INSERT policy `WITH CHECK (true)` allows anyone to insert
- We no longer need SELECT permission since we're not reading back the inserted row
- The order_items INSERT also has `WITH CHECK (true)` so it will work

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Cart.tsx` | Generate order UUID client-side, remove `.select().single()` from insert |

