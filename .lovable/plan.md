

## Add Copy Button to "Amount to Pay"

Add a copy-to-clipboard button next to the amount on the buyer payment screen, following the same pattern already used for the Payment Code and UPI ID.

---

### Changes

**File: `src/pages/OrderPayment.tsx`**

1. Extend the `copiedField` state type to include `'amount'`.
2. Wrap the amount text in a flex container with a copy button, same style as the existing ones.
3. Copy the raw numeric amount (not the formatted currency string) so buyers can paste it directly into their UPI app. Use `order.total_amount.toString()` as the copied value.

| Line Range | Change |
|------------|--------|
| ~10 | Update state type: `'code' | 'upi' | null` becomes `'code' | 'upi' | 'amount' | null` |
| ~72-74 (Amount card) | Wrap the formatted price in a flex row with a Copy/Check icon button using `handleCopy(order.total_amount.toString(), 'amount')` |

No new imports or dependencies needed -- reuses existing `Copy`, `Check` icons and `handleCopy` function.

