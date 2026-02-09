

## Add Copy-to-Clipboard Buttons on Buyer Payment Screen

Add small copy buttons next to the **Payment Code** and **UPI ID** fields on the `/order/:orderId/pay` page, so buyers can quickly copy values into their UPI app.

---

### Changes

**File: `src/pages/OrderPayment.tsx`**

1. **Import `Copy` and `Check` icons** from `lucide-react` (alongside existing icons).
2. **Add state** to track which value was just copied (`copiedField: 'code' | 'upi' | null`) with a 2-second auto-reset.
3. **Payment Code section** -- add a small icon button next to the code that copies `order.payment_code` to clipboard and briefly shows a checkmark.
4. **UPI ID section** -- add a similar copy button next to `order.seller_upi_id_snapshot`.

Both buttons will use `navigator.clipboard.writeText()` and show a `Check` icon for 2 seconds after copying, then revert to the `Copy` icon. They will be styled subtly (`text-background/40 hover:text-background/60`) to not distract from the main content.

No new files or dependencies needed -- `lucide-react` and React state are sufficient.

