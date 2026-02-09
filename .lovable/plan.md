

## Step 3: Buyer Payment Screen + UPI Deep Link

This plan covers the buyer-facing payment screen shown after order placement, including the constraint fix needed for orders to work at all.

---

### Prerequisite Fix: Status Constraint

The existing `orders_status_check` constraint only allows `pending`, `confirmed`, `completed`, `cancelled` -- missing `pending_payment`. This blocks all order creation. The migration will drop and recreate it with the new value included.

---

### The RLS Challenge

Orders can only be read (SELECT) by store owners. Buyers place orders anonymously and cannot read their order back from the database. To power the payment screen without opening up the orders table, a **database function** running as `SECURITY DEFINER` will return only the payment-relevant fields for a given order ID. The UUID itself acts as a secret token (unguessable).

---

### Part 1: Database Migration

A single migration that:

1. **Fixes the status constraint** -- drops `orders_status_check` and recreates it with `pending_payment` included
2. **Creates `get_order_payment_details(order_id UUID)`** -- a SECURITY DEFINER function that returns:
   - `id`, `store_id`, `total_amount`, `payment_code`, `code_status`, `code_expires_at`, `seller_upi_id_snapshot`, `status`
   - Only returns data for the exact order ID provided
   - Anonymous-safe (no RLS bypass on the table itself)

---

### Part 2: New Page -- OrderPayment.tsx

**New file: `src/pages/OrderPayment.tsx`**

A dedicated buyer payment screen at route `/order/:orderId/pay`.

**What it displays:**

- Store name (fetched from public `stores` table using `store_id`)
- Order amount (formatted using the store's currency)
- Payment code -- large, bold, monospaced, prominent
- Seller UPI ID (from `seller_upi_id_snapshot`)
- Validity message: "This payment code is valid for a limited time."
- Buyer instructions near the Pay button

**UPI Pay button:**

- Label: "Pay via UPI"
- On click: opens a UPI deep link:

```text
upi://pay?pa={seller_upi_id_snapshot}&pn={store_name}&am={total_amount}&cu=INR&tn={payment_code}
```

- `am` = exact order total
- `tn` = payment code only (no extra text)
- OS handles UPI app selection

**Expired code handling:**

- If `code_status = 'expired'`: disable the Pay button and show: "The payment code has expired. Your order will be confirmed after manual review."
- Order is NOT cancelled

**Edge cases:**

- If order not found or not in `pending_payment` status: show a generic "Order not found or already processed" message
- Loading state while fetching

---

### Part 3: Add Route

**File: `src/App.tsx`**

Add `/order/:orderId/pay` route in both the main domain routing and the subdomain routing blocks, pointing to the new `OrderPayment` page.

---

### Part 4: Redirect After Order Placement

**File: `src/pages/Cart.tsx`**

After a successful order insert:

- Instead of showing the static "Order Placed!" screen, navigate to `/order/{orderId}/pay`
- Remove the `orderPlaced` state and its associated confirmation UI (it is fully replaced by the new payment page)

---

### Part 5: Add Hook for Fetching Order Payment Details

**File: `src/hooks/useStore.tsx`**

Add a new hook `useOrderPaymentDetails(orderId)` that:

- Calls the `get_order_payment_details` RPC with the order ID
- Also calls `expire_active_payment_codes` before fetching (to ensure stale codes are marked expired)
- Returns the payment-relevant fields
- Also fetches the store name using the returned `store_id` (stores are publicly readable)

---

### Summary of Changes

| Area | File | What Changes |
|------|------|-------------|
| Database | Migration | Fix status constraint + create `get_order_payment_details` RPC |
| New page | `src/pages/OrderPayment.tsx` | Buyer payment screen with UPI deep link |
| Routing | `src/App.tsx` | Add `/order/:orderId/pay` route |
| Checkout | `src/pages/Cart.tsx` | Redirect to payment page after order placement |
| Hook | `src/hooks/useStore.tsx` | Add `useOrderPaymentDetails` hook |

No seller UI, no UTR input, no payment verification, no retry logic.

