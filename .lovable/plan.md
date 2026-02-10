

## Fix: Database Trigger Overwrites Client-Provided Access Token

### Root Cause
The `set_order_payment_code` trigger function **always** sets `order_access_token := gen_random_uuid()::TEXT`, overwriting the value the client sends during INSERT. So the token in the redirect URL never matches the one in the database, causing "Order not found".

### Solution
Update the trigger function to only generate a token when one is not already provided by the client. Add a conditional check: if `NEW.order_access_token` is NULL or empty, generate one; otherwise, keep the client-provided value.

### Changes

**Database Migration (1 file)**

Update the `set_order_payment_code()` trigger function. Change the unconditional assignment:

```text
-- Before (always overwrites):
NEW.order_access_token := gen_random_uuid()::TEXT;

-- After (only if not provided):
IF NEW.order_access_token IS NULL OR NEW.order_access_token = '' THEN
  NEW.order_access_token := gen_random_uuid()::TEXT;
END IF;
```

No frontend changes needed -- the client-side code in Cart.tsx is already correct (generates token and sends it with the INSERT).

### Why This Fixes It
1. Client generates `accessToken = crypto.randomUUID()`
2. Client sends it in the INSERT payload
3. Trigger sees the token is already set and leaves it alone
4. Client redirects to `/order/{id}?token={accessToken}`
5. The RPC `get_order_tracking` finds the order because the tokens match

