

## Fix: Shipping Rates Not Fetching After Postal Code Entry

### Problem Summary

The checkout is showing manual shipping settings (₹50.00, 5-7 days) instead of live Shiprocket rates (₹35.4 via India Post) even though:

1. Shiprocket IS configured for the store (confirmed in database)
2. The edge function IS working (confirmed via direct API test)
3. The postal code `411061` IS valid and returns live rates

### Root Cause

The debounced postal code callback in `CheckoutForm` isn't reliably updating the parent's state. When React Query checks the `enabled` condition, `customerPostalCode` is still empty or stale.

```text
User types postal code in form
          |
          v
CheckoutForm: updateField('postalCode', '411061')
          |
          v (500ms debounce)
CheckoutForm: onPostalCodeChange('411061')  <-- May not fire reliably
          |
          v
Cart.tsx: setCustomerPostalCode('411061')   <-- State not updating
          |
          v
useShippingRates: enabled = false (postalCode still empty)
          |
          v
Falls back to manual shipping (₹50.00)
```

### Solution

Add console debugging first to identify where the flow breaks, then implement a more reliable state synchronization pattern.

---

### Implementation Plan

#### Step 1: Add Debug Logging

Add console logs to trace the postal code flow:

**CheckoutForm.tsx:**
```typescript
// In updateField function
if (field === 'postalCode' && onPostalCodeChange) {
  console.log('[CheckoutForm] Setting debounce timer for postal code:', value);
  if (debounceRef.current) {
    clearTimeout(debounceRef.current);
  }
  debounceRef.current = setTimeout(() => {
    console.log('[CheckoutForm] Debounce fired, calling onPostalCodeChange:', value);
    onPostalCodeChange(value);
  }, 500);
}
```

**Cart.tsx:**
```typescript
const handlePostalCodeChange = (postalCode: string) => {
  console.log('[Cart] handlePostalCodeChange called with:', postalCode);
  setCustomerPostalCode(postalCode);
};

// Add logging for query state
console.log('[Cart] Shipping state:', {
  customerPostalCode,
  hasEnteredPostcode,
  shiprocketEnabled,
  isLoadingRates,
  liveRates,
});
```

#### Step 2: Add useEffect Debug

Track state changes in Cart.tsx:

```typescript
useEffect(() => {
  console.log('[Cart] customerPostalCode changed to:', customerPostalCode);
}, [customerPostalCode]);
```

#### Step 3: Fix Potential Issues

Based on debugging, the likely fixes are:

**Option A: Ensure callback identity is stable**
```typescript
// In Cart.tsx - use useCallback
const handlePostalCodeChange = useCallback((postalCode: string) => {
  console.log('[Cart] handlePostalCodeChange:', postalCode);
  setCustomerPostalCode(postalCode);
}, []);
```

**Option B: Remove debounce from form, rely on React Query's staleTime**

The 500ms debounce combined with React Query's caching might cause issues. A simpler approach:

```typescript
// CheckoutForm.tsx - call immediately, let React Query handle caching
if (field === 'postalCode' && onPostalCodeChange) {
  onPostalCodeChange(value);
}
```

React Query already has:
- `staleTime: 5 * 60 * 1000` (5 minutes cache)
- `enabled: deliveryPostcode.length >= 6` (only fetches for valid postcodes)

This is safe because:
1. React Query won't re-fetch if data is fresh
2. The query only runs when postcode >= 6 characters
3. Rate limiting protects against abuse

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Cart.tsx` | Add `useCallback` for handler, add debug logging |
| `src/components/checkout/CheckoutForm.tsx` | Simplify postal code callback (remove debounce) |

---

### Alternative: Keep Debounce But Use Stable Reference

If debouncing is preferred for UX reasons (prevents flicker):

```typescript
// CheckoutForm.tsx
const latestOnPostalCodeChange = useRef(onPostalCodeChange);
useEffect(() => {
  latestOnPostalCodeChange.current = onPostalCodeChange;
}, [onPostalCodeChange]);

// Use the ref in the debounce
debounceRef.current = setTimeout(() => {
  latestOnPostalCodeChange.current?.(value);
}, 500);
```

---

### Verification

After implementing:

1. Open checkout with items from store `73894fd7-42dd-4bc2-bc37-cd77b324f867`
2. Enter postal code `411061`
3. Verify console logs show the flow working
4. Confirm shipping updates to "₹35.4 via India Post-Speed Post Air Prepaid"
5. Confirm estimated delivery shows "5 days" instead of "5-7 days"

---

### Technical Summary

1. **Root cause**: Debounced callback not reliably triggering parent state update
2. **Debug first**: Add logging to pinpoint exact failure point
3. **Simplify**: Remove form-level debounce, rely on React Query caching
4. **Stable references**: Use `useCallback` for handler in parent
5. **Fallback works**: Manual settings display correctly when Shiprocket unavailable

