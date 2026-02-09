

## Step 2: Order Creation + Payment Code Generation (Complete Implementation)

This is the full, combined plan covering the database migration (with tightened constraints) and all frontend updates.

---

### What This Does

When a buyer places an order, the database automatically:
1. Generates a unique 6-character alphanumeric code (e.g., `H2B9K7`)
2. Sets a 45-minute validity window
3. Snapshots the seller's current UPI ID (frozen forever on that order)
4. Sets the order status to `pending_payment`

No buyer or seller payment UI is built in this step -- only the data foundation.

---

### Part 1: Database Migration

A single migration that adds columns, functions, and a trigger to the `orders` table.

**New columns on `orders`:**

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `payment_code` | TEXT | NOT NULL | (set by trigger) | UNIQUE |
| `code_status` | TEXT | NOT NULL | `'active'` | CHECK: `active`, `used`, `expired` |
| `code_expires_at` | TIMESTAMPTZ | YES | (set by trigger) | -- |
| `seller_upi_id_snapshot` | TEXT | YES | (set by trigger) | -- |

**Important:** Since the table currently has no rows (we cleared them), adding `payment_code` as `NOT NULL` with a trigger is safe -- there are no existing rows that would violate the constraint.

**Database function: `generate_payment_code()`**
- Produces a random 6-character string from `A-Z, 0-9`
- Loops and retries if the code already exists (max 100 attempts)
- Called only by the trigger, never by client code

**Trigger function: `set_order_payment_code()`**
- Fires `BEFORE INSERT` on every new order
- Sets `payment_code` to a unique generated code
- Sets `code_status` to `'active'`
- Sets `code_expires_at` to `NOW() + 45 minutes`
- Looks up the seller's active UPI ID from `seller_payment_settings` and stores it in `seller_upi_id_snapshot`
- Overrides `status` to `'pending_payment'`

**Expiry function: `expire_active_payment_codes()`**
- Bulk-updates all rows where `code_status = 'active'` AND `code_expires_at < NOW()`
- Sets `code_status = 'expired'`
- Does NOT change the order status (remains `pending_payment`)
- Callable via RPC from the frontend

---

### Part 2: Frontend -- Update Order Type

**File: `src/hooks/useStore.tsx`**

Update the `Order` interface to include new fields:

```text
status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'pending_payment'
payment_code: string | null
code_status: string | null
code_expires_at: string | null
seller_upi_id_snapshot: string | null
```

Update `useStoreOrders` to call the `expire_active_payment_codes` RPC before fetching orders, ensuring stale codes are marked expired on every dashboard visit.

---

### Part 3: Frontend -- Update Order Creation (Cart.tsx)

**File: `src/pages/Cart.tsx`**

- Remove the explicit `status` field from the order insert (the trigger sets it to `pending_payment`)
- Everything else stays the same -- the trigger handles `payment_code`, `code_status`, `code_expires_at`, and `seller_upi_id_snapshot` automatically

---

### Part 4: Frontend -- Update Order List Display

**File: `src/components/dashboard/OrderList.tsx`**

- Add `pending_payment` to the `statusColors` map (orange/amber theme)
- Add `Pending Payment` as an option in the status update dropdown
- Display the payment code and its status in the expanded order details section (a small info row showing the 6-character code and whether it's active/used/expired)

---

### Part 5: Fix Duplicate Store Logo Section

**File: `src/pages/Dashboard.tsx`**

Lines 304-353 are an exact duplicate of the Store Logo card (lines 251-300). This duplicate block will be removed.

---

### Summary of Changes

| Area | File | What Changes |
|------|------|-------------|
| Database | Migration | Add 4 columns, 2 functions, 1 trigger to `orders` |
| Types | `src/hooks/useStore.tsx` | Extend `Order` interface, add RPC call in `useStoreOrders` |
| Checkout | `src/pages/Cart.tsx` | Remove explicit `status` from insert |
| Dashboard | `src/components/dashboard/OrderList.tsx` | Add `pending_payment` display + payment code info |
| Dashboard | `src/pages/Dashboard.tsx` | Remove duplicate Store Logo card |

No new files are created. No buyer payment UI or seller confirmation UI is built.

