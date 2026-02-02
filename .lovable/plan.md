
## Fix: Shipping Rates Query Not Triggering After Postal Code Entry

### Problem Analysis

From your screenshot, I can see:
1. The `handlePostalCodeChange` callback IS firing correctly for each keystroke (4, 41, 411, 4110, 41106, 411061)
2. The Shiprocket connection query runs and returns valid data (pickup_postcode: 411061)
3. BUT the `shiprocket-rates` edge function is **NEVER CALLED** (no network request)

This means the `useShippingRates` React Query hook is not triggering despite having valid inputs.

### Root Cause

The issue is a **stale closure problem**. The `useShippingRates` hook is called at the top of the component, but the `customerPostalCode` state is only being logged inside the callback. The state update isn't causing the component to re-render with the new postal code value being passed to the hook.

Looking at the component structure:

```text
Cart Component renders
         |
         v
useShippingRates(firstStoreId, customerPostalCode, weight)
         |
         v
customerPostalCode = '' (initial state)
         |
         v
enabled: '' === '' && ''.length >= 6  →  FALSE (query doesn't run)
         |
         v
User types postal code → handlePostalCodeChange called
         |
         v
setCustomerPostalCode('411061') → triggers re-render
         |
         v
NEW RENDER: useShippingRates should see '411061'
         |
         v
enabled: !!storeId && '411061'.length >= 6 → TRUE
         |
         v
Query SHOULD run... but doesn't?
```

The only explanation is that **React is not re-rendering the checkout section** when `customerPostalCode` changes, OR the query key isn't updating properly.

### Solution: Add Debug Logging and Fix the Query Trigger

#### Step 1: Add Comprehensive Debug Logging in Cart.tsx

Add logging to trace the exact flow of data:

```typescript
// At the top of the checkout render section
console.log('[Cart] Render with:', {
  customerPostalCode,
  firstStoreId,
  shiprocketStatus,
  isLoadingShiprocketStatus,
});

// Log the query state
console.log('[Cart] useShippingRates state:', {
  liveRates,
  isLoadingRates,
  ratesError,
  enabled: !!firstStoreId && !!customerPostalCode && customerPostalCode.length >= 6,
});
```

#### Step 2: Fix Potential Query Key Issue

The `useShippingRates` hook uses this query key:
```typescript
queryKey: ['shipping-rates', storeId, deliveryPostcode, weight],
```

But `weight` depends on `shiprocketStatus?.defaultWeight`, which might be undefined during initial renders, causing the query key to change unexpectedly.

**Fix:** Stabilize the weight value:

```typescript
// In Cart.tsx
const defaultWeight = shiprocketStatus?.defaultWeight ?? 0.5;

const { 
  data: liveRates, 
  isLoading: isLoadingRates,
  error: ratesError,
} = useShippingRates(
  firstStoreId,
  customerPostalCode,
  defaultWeight
);
```

#### Step 3: Add Explicit State Logging in Hook

Add logging inside `useShippingRates` to see exactly what it receives:

```typescript
export function useShippingRates(
  storeId: string | undefined,
  deliveryPostcode: string | undefined,
  weight: number = 0.5
) {
  console.log('[useShippingRates] Called with:', { storeId, deliveryPostcode, weight });
  console.log('[useShippingRates] Enabled:', !!storeId && !!deliveryPostcode && deliveryPostcode.length >= 6);
  
  return useQuery({
    // ... rest of query
  });
}
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Cart.tsx` | Add debug logging, stabilize weight value |
| `src/hooks/useShippingRates.tsx` | Add debug logging to trace query triggering |

---

### Expected Outcome

After these changes:
1. Console will show exactly what values are being passed to the query
2. We can identify if the query is being enabled but not firing, or if it's disabled
3. Once the root cause is confirmed, we can apply the specific fix

---

### Most Likely Fix (Based on Pattern Analysis)

The most probable cause is that the component isn't re-rendering the checkout UI when `customerPostalCode` changes because the derived values are computed inside the `if (isCheckout)` block.

**Alternative Fix:** Move the derived state calculations outside the conditional rendering:

```typescript
// Move OUTSIDE the if (isCheckout) block
const shiprocketEnabled = shiprocketStatus?.hasShiprocket && !!shiprocketStatus?.pickupPostcode;
const hasEnteredPostcode = customerPostalCode.length >= 6;
const shippingError = getShippingError();
const liveShippingRate = getLiveShippingRate();

if (isCheckout) {
  // Use the already-computed values
  return ( ... );
}
```

This ensures these values are recomputed on every render, not just inside the checkout branch.

---

### Summary

1. **Root cause**: State update in `customerPostalCode` may not be causing proper re-render propagation to the query hook
2. **Debug first**: Add comprehensive logging to trace data flow
3. **Primary fix**: Move derived state calculations outside conditional blocks
4. **Secondary fix**: Stabilize the weight value to prevent query key instability
5. **Verification**: Console logs will show if query is enabled and when it fires
