

## Step 4: Seller Global "Confirm Payment" Flow

This plan adds a global payment code confirmation feature to the seller dashboard. The seller enters a 6-character code they see in their UPI transaction notes, and the system automatically finds and confirms the matching order.

---

### Part 1: Database Migration

A single migration that:

1. **Adds `confirmed_at` column** to `orders` (nullable `TIMESTAMPTZ`, defaults to `NULL`)
2. **Updates `orders_status_check` constraint** to include `'manual_review'` as a valid status value
3. **Creates `confirm_payment_by_code(p_code TEXT)` function** -- a `SECURITY DEFINER` function that encapsulates all confirmation logic

**The RPC function logic:**

- Uses `auth.uid()` to identify the current seller (must be authenticated)
- Normalizes the input: `UPPER(TRIM(p_code))`
- Finds the order where `payment_code` matches
- Runs all validations in sequence:
  - Code exists
  - Order belongs to the seller's store
  - Order status is `pending_payment`
  - Code status is `active` (not `used` or `expired`)
  - Code has not expired (`code_expires_at >= NOW()`)
- **If all pass**: sets `status = 'confirmed'`, `code_status = 'used'`, `confirmed_at = NOW()` -- returns success with order details (order ID, customer name, amount)
- **If expired or invalid**: sets `status = 'manual_review'` and `code_status = 'expired'` (if it was an expiry issue) -- returns an error code
- **If code not found or wrong seller**: returns a generic error (no information leakage)
- **If already processed**: returns a distinct error so the UI can show appropriate messaging

**Return format** (JSON):

```text
Success: { success: true, order_id, customer_name, total_amount }
Failure: { success: false, error: 'invalid_code' | 'expired' | 'already_processed' | 'not_authenticated' }
```

---

### Part 2: Frontend -- New Dashboard Tab

**File: `src/pages/Dashboard.tsx`**

Add a fifth tab called "Confirm" (with a shield/check icon) to the dashboard tab bar, positioned after Orders and before Shipping:

```text
Products | Orders | Confirm | Shipping | Settings
```

This tab renders the new `ConfirmPayment` component.

---

### Part 3: Frontend -- ConfirmPayment Component

**New file: `src/components/dashboard/ConfirmPayment.tsx`**

A focused, single-purpose component with three states:

**State 1: Input (default)**
- Heading: "Confirm Payment"
- Subtext: "Enter the 6-character code from the buyer's UPI transaction note."
- Single input field: large, monospaced, uppercase, max 6 characters, auto-uppercase
- Submit button: "Confirm Order" (disabled until exactly 6 alphanumeric characters entered)
- Client-side validation: rejects non-alphanumeric characters, trims whitespace
- Basic rate limiting: 3-second cooldown after each submission to prevent rapid retries

**State 2: Success**
- Green checkmark icon
- "Order confirmed successfully."
- Revealed order details: Order ID (truncated), buyer name, order amount (formatted with store currency)
- "Confirm Another" button to return to input state

**State 3: Error**
- Appropriate message based on error code:
  - `invalid_code`: "This payment code is invalid or has expired. The order will be reviewed manually."
  - `expired`: "This payment code is invalid or has expired. The order will be reviewed manually."
  - `already_processed`: "This order has already been processed."
  - Default: "Something went wrong. Please try again."
- "Try Again" button to return to input state

**Props**: Receives `store` (for currency formatting and store ID)

---

### Part 4: Frontend -- Update Order Type

**File: `src/hooks/useStore.tsx`**

- Add `'manual_review'` to the `Order.status` union type
- Add `confirmed_at: string | null` to the `Order` interface

---

### Part 5: Frontend -- Update OrderList for manual_review

**File: `src/components/dashboard/OrderList.tsx`**

- Add `manual_review` to `statusColors` map (purple/violet theme to distinguish from other statuses)
- Add "Manual Review" as an option in the status update dropdown

---

### Part 6: Buyer Payment Screen -- Handle manual_review

**File: `src/pages/OrderPayment.tsx`**

Currently, the page only shows when `status === 'pending_payment'`. No change needed -- orders moved to `manual_review` will correctly show "Order not found or already processed" since they're no longer in `pending_payment`.

---

### Security Considerations

- The RPC runs as `SECURITY DEFINER` but validates `auth.uid()` internally -- no anonymous access
- The function returns the same generic error for "code not found" and "code belongs to another seller" to prevent information leakage
- Codes are single-use: once `code_status = 'used'`, the code can never be confirmed again
- Client-side 3-second cooldown between submissions reduces rapid brute-force attempts
- The 6-character alphanumeric space (36^6 = ~2.2 billion combinations) combined with single-use makes brute force impractical

---

### Summary of Changes

| Area | File | What Changes |
|------|------|-------------|
| Database | Migration | Add `confirmed_at` column, update status constraint, create `confirm_payment_by_code` RPC |
| New component | `src/components/dashboard/ConfirmPayment.tsx` | Payment code input + confirmation UI |
| Dashboard | `src/pages/Dashboard.tsx` | Add "Confirm" tab |
| Types | `src/hooks/useStore.tsx` | Add `manual_review` to status union, add `confirmed_at` |
| Order list | `src/components/dashboard/OrderList.tsx` | Add `manual_review` status color + dropdown option |

No UTR input, no payment screenshots, no buyer confirmation, no refund UI, no order selection before confirmation.

