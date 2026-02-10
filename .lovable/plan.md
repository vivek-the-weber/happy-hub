

## Buyer Order Tracking + Manual Payment Resolution

This plan replaces the current payment-only page with a unified order tracking page for buyers, and adds a "Raise Issue" action for sellers. Buyers are guests who bookmark their tracking page; sellers are the only authority on payment confirmation.

---

### Overview of Changes

**What changes for buyers:**
- After checkout, buyers land on `/order/{orderId}?token={access_token}` -- a single tracking page
- The page shows order status, amount, shop name, payment code (for reference), and status-specific messaging
- A "bookmark this page" note replaces any WhatsApp/email follow-up
- No actions available to buyers -- read-only

**What changes for sellers:**
- After entering a payment code in the Confirm tab, sellers see full order details (items, buyer, amount)
- Two actions: "Confirm Order" and "Raise Issue"
- "Raise Issue" puts the order `on_hold` with a neutral message
- The generic status dropdown in the Orders tab is simplified to only the 3 valid statuses

**What gets removed:**
- Code expiry logic (no automatic expiration)
- `manual_review` / `pending` / `completed` / `cancelled` statuses
- UPI deep link references (already removed)

---

### Database Changes (Migration)

1. **Add `order_access_token` column** to `orders` table (TEXT, NOT NULL, default `gen_random_uuid()`)
2. **Update the `set_order_payment_code` trigger function** to also set `order_access_token = gen_random_uuid()`
3. **Create new RPC `get_order_tracking`** (SECURITY DEFINER) that takes `p_order_id UUID` and `p_token TEXT`, returns order details (id, store_id, total_amount, status, payment_code, customer_name) only if the token matches
4. **Update `confirm_payment_by_code` RPC** to also return order items as a JSON array, and to accept an `action` parameter: `'confirm'` or `'hold'`
   - `confirm`: sets status to `confirmed`, code_status to `used`, confirmed_at to now()
   - `hold`: sets status to `on_hold`
5. **Remove the `expire_active_payment_codes` RPC** (no longer needed)
6. **Backfill** existing orders with a generated access token

---

### Frontend Changes

**1. New: `src/pages/OrderTracking.tsx`** (replaces OrderPayment.tsx)
- Reads `orderId` from URL params and `token` from query string
- Calls `get_order_tracking` RPC with both values
- Displays status-specific UI:
  - **PENDING_PAYMENT**: "Your order is awaiting payment confirmation from the shop." Shows payment code (read-only with copy), amount, shop name
  - **ON_HOLD**: Warning card with "Order on Hold" message, shop phone number, order ID, payment code. Message: "The shop has raised a payment clarification. Please contact the shop directly to resolve this."
  - **CONFIRMED**: Success card with "Your order has been confirmed by the shop."
- Shows "Please bookmark this page to track your order." note
- No buyer actions

**2. Update: `src/components/dashboard/ConfirmPayment.tsx`**
- After entering code, instead of immediately confirming, show a preview of the order:
  - Order ID, buyer name, amount, order items list
  - Two buttons: "Confirm Order" (green) and "Raise Issue" (amber/warning)
- "Confirm Order" calls the RPC with action `confirm`
- "Raise Issue" calls the RPC with action `hold`, shows neutral message: "Order placed on hold."

**3. Update: `src/components/dashboard/OrderList.tsx`**
- Replace the status dropdown with only: `pending_payment`, `on_hold`, `confirmed`
- Update `statusColors` map to match new statuses
- Remove `pending`, `completed`, `cancelled`, `manual_review`

**4. Update: `src/hooks/useStore.tsx`**
- Update `Order` interface: status type becomes `'pending_payment' | 'on_hold' | 'confirmed'`

**5. Update: `src/pages/Cart.tsx`**
- After placing order, redirect to `/order/${orderId}?token=${accessToken}`
- Fetch the access token from the inserted order (return it from the insert or query it)

**6. Update: `src/App.tsx`**
- Replace `/order/:orderId/pay` route with `/order/:orderId` pointing to OrderTracking
- Remove OrderPayment import

**7. Update: `src/hooks/useOrderPaymentDetails.tsx`**
- Rename/replace with `useOrderTracking` hook that calls `get_order_tracking` with orderId + token
- Remove call to `expire_active_payment_codes`

**8. Delete: `src/pages/OrderPayment.tsx`** (replaced by OrderTracking)

---

### Technical Details

**New RPC: `get_order_tracking`**

```text
Function: get_order_tracking(p_order_id UUID, p_token TEXT)
Returns: TABLE(id, store_id, total_amount, status, payment_code, customer_name)
Security: DEFINER
Logic:
  - SELECT from orders WHERE id = p_order_id AND order_access_token = p_token
  - Returns empty if token doesn't match (no error leakage)
```

**Updated RPC: `confirm_payment_by_code`**

```text
New parameter: p_action TEXT (default 'confirm')
Logic change:
  - If p_action = 'confirm': existing confirm logic (status=confirmed, code_status=used)
  - If p_action = 'hold': UPDATE status='on_hold' (no code_status change)
  - Return order_items as JSON array in the response
```

**Access Token Flow**

```text
Checkout -> INSERT order -> trigger sets access_token
         -> Read back the access_token
         -> Redirect to /order/{id}?token={token}
```

**Seller Confirm Tab Flow**

```text
Enter code -> RPC finds order (returns preview data + items)
           -> Show preview with Confirm / Raise Issue buttons
           -> Seller clicks action -> RPC executes
```

**Store phone number for ON_HOLD**: Fetched from `stores.whatsapp_number` alongside store name in the tracking hook.

---

### UX Copy

| Status | Buyer sees |
|--------|-----------|
| pending_payment | "Your order is awaiting payment confirmation from the shop." |
| on_hold | "The shop has raised a payment clarification. Please contact the shop directly to resolve this." |
| confirmed | "Your order has been confirmed by the shop." |

---

### Files Summary

| File | Action |
|------|--------|
| Migration SQL | Create (DB changes) |
| src/pages/OrderTracking.tsx | Create |
| src/hooks/useOrderTracking.tsx | Create |
| src/pages/OrderPayment.tsx | Delete |
| src/hooks/useOrderPaymentDetails.tsx | Delete |
| src/components/dashboard/ConfirmPayment.tsx | Modify |
| src/components/dashboard/OrderList.tsx | Modify |
| src/hooks/useStore.tsx | Modify |
| src/pages/Cart.tsx | Modify |
| src/App.tsx | Modify |

