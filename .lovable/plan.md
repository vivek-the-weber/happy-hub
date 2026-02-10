

## Fix: Guest Buyer Can't Read Order Access Token After Checkout

### Problem
After placing an order on a subdomain, the buyer is redirected to the order tracking page but sees "Order not found". This happens because:

1. The buyer (guest/anonymous) inserts the order successfully (INSERT policy allows anyone)
2. The code then tries to SELECT `order_access_token` back from the `orders` table
3. RLS blocks this -- only store owners can SELECT from orders
4. The token is null, so the tracking page can't find the order

### Solution
Generate the `order_access_token` on the client side (using `crypto.randomUUID()`) and include it in the INSERT -- the same pattern already used for the order ID. This eliminates the need to read the token back from the database.

### Changes

**File: `src/pages/Cart.tsx`**

1. Generate the access token client-side: `const accessToken = crypto.randomUUID();`
2. Include `order_access_token: accessToken` in the INSERT payload
3. Remove the SELECT query that tries to read the token back (lines 178-182)
4. Use the local `accessToken` variable directly in the redirect URL

**File: Database trigger (`set_order_payment_code`)**

No change needed -- the trigger sets `order_access_token` only if it's null/empty. Since we're now providing it in the INSERT, the trigger will leave it as-is.

### Why This Works
This mirrors the existing pattern for `orderId` (line 140: `const orderId = crypto.randomUUID()`). The client generates a UUID, sends it with the INSERT, and uses it immediately without needing a follow-up query. RLS is not a factor since no SELECT is required.

