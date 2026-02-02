

## Fix: Shipping Rates Not Displaying After Postal Code Entry

### Problem Identified

After thorough analysis, I found that the shipping rates **are being fetched successfully** (confirmed by edge function logs and direct API testing). The `shiprocket-rates` edge function returns valid data with rates like ₹35.4 for India Post.

The issue is likely a **React state/query synchronization problem** where:

1. The `useStoreShiprocketStatus` query hasn't completed when the user enters a postal code
2. The `shiprocketEnabled` flag evaluates to `false` because `shiprocketStatus` is still loading
3. As a result, the UI falls back to manual shipping settings instead of showing live rates

### Root Cause Analysis

```text
User enters checkout → isCheckout = true
         |
         v
useStoreShiprocketStatus starts fetching
(shiprocketStatus = undefined initially)
         |
         v
shiprocketEnabled = undefined?.hasShiprocket && !!undefined?.pickupPostcode
                  = false (WRONG - should wait for status to load!)
         |
         v
CheckoutOrderSummary receives shiprocketEnabled = false
         |
         v
Shows manual shipping settings instead of waiting/showing live rates
```

### Solution

Add proper loading state handling so the UI waits for `shiprocketStatus` to load before determining which shipping mode to use.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Cart.tsx` | Pass shiprocket loading state to order summary |
| `src/components/checkout/CheckoutOrderSummary.tsx` | Handle loading state for shiprocket status |

---

### Implementation Details

#### 1. Update Cart.tsx

Pass the loading state from `useStoreShiprocketStatus` to the checkout UI:

```typescript
// Get loading state from the hook
const { data: shiprocketStatus, isLoading: isLoadingShiprocketStatus } = useStoreShiprocketStatus(firstStoreId, isCheckout);

// Pass to CheckoutOrderSummary
<CheckoutOrderSummary 
  ...
  isLoadingShiprocketStatus={isLoadingShiprocketStatus}
  shiprocketEnabled={shiprocketEnabled}
  ...
/>
```

#### 2. Update CheckoutOrderSummary.tsx

Add handling for when shiprocket status is still loading:

```typescript
interface CheckoutOrderSummaryProps {
  // ... existing props
  isLoadingShiprocketStatus?: boolean;
}

// In the component:
if (isLoadingShiprocketStatus) {
  // Show loading state while determining shipping mode
  shippingDisplay = (
    <span className="text-background/40 flex items-center gap-2">
      <Loader2 className="h-3 w-3 animate-spin" />
      Loading...
    </span>
  );
}
```

---

### Alternative Issue: Query Not Re-triggering

If the above doesn't fix it, there might be an issue with React Query not re-fetching when the postal code changes. The current debounce implementation should work, but we can add debugging:

```typescript
// In CheckoutForm.tsx - add console log to verify callback fires
if (field === 'postalCode' && onPostalCodeChange) {
  console.log('Postal code changed, setting debounce timer:', value);
  // ...
}
```

---

### Verification Steps

After implementing the fix:

1. Add item to cart
2. Go to checkout
3. Enter a 6-digit Indian postal code (e.g., `411061`)
4. Verify the shipping rate updates to show live Shiprocket rates (e.g., "₹35.4 via India Post-Speed Post Air Prepaid")
5. Verify the estimated delivery time appears (e.g., "Est. delivery: 5 days")

---

### Technical Summary

1. **Add loading state tracking** for the Shiprocket status query
2. **Pass loading state to UI** so it can show appropriate loading indicators
3. **Prevent premature fallback** to manual settings while shiprocket status is still loading
4. **Add console logging** to debug the postal code change flow if needed

This ensures the UI properly waits for all necessary data before deciding which shipping calculation method to use.

