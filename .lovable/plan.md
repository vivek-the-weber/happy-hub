

## Hide Payment Code from Seller's Order List

The payment code is currently displayed in the expanded order card on the Orders tab (lines 156-169). Since the seller should only interact with payment codes through the dedicated "Confirm" tab, showing them in the order list creates a security risk -- the seller could see the code before the buyer sends it, defeating the purpose of the code-based confirmation flow.

---

### What Changes

**File: `src/components/dashboard/OrderList.tsx`**

Remove the entire "Payment Code" section (lines 156-169) from the expanded order card. This block currently renders:
- The payment code in large monospaced text
- The code status badge (active/used/expired)

This section will be deleted entirely. The `codeStatusColors` constant (lines 29-33) will also be removed since it is no longer used anywhere after this change.

No other files need to change -- the code status is still visible through the order status badge (`pending_payment`, `confirmed`, `manual_review`), and sellers confirm payments through the dedicated "Confirm" tab.

---

### Summary

| Area | File | Change |
|------|------|--------|
| Order list | `src/components/dashboard/OrderList.tsx` | Remove payment code display block (lines 156-169) and unused `codeStatusColors` constant (lines 29-33) |

