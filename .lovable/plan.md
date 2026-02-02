

## Live Shipping Rate Calculation at Checkout

### Overview

Integrate the Shiprocket Serviceability API to fetch real-time shipping rates during checkout. When a customer enters their postal code, the system will automatically calculate shipping costs based on:
- Seller's pickup postcode (from `shiprocket_connections.pickup_postcode`)
- Customer's delivery postcode
- Package weight (from `shiprocket_connections.default_weight`)

---

### Current State vs Proposed

| Aspect | Current | Proposed |
|--------|---------|----------|
| Shipping Cost | Static (from `stores.shipping_charge`) | Dynamic from Shiprocket API |
| Delivery Time | Static (from `stores.estimated_delivery_time`) | Live ETD from courier data |
| Trigger | None | Customer enters postal code |
| Fallback | N/A | Falls back to manual store settings |

---

### Shiprocket Serviceability API

**Endpoint:** `GET https://apiv2.shiprocket.in/v1/external/courier/serviceability/`

**Query Parameters:**
```text
pickup_postcode    - Seller's pickup pincode (from DB)
delivery_postcode  - Customer's delivery pincode
weight             - Package weight in kg
cod                - 0 for prepaid, 1 for COD
mode               - "Surface" or "Air" (optional)
```

**Response Example:**
```json
{
  "status": 200,
  "data": {
    "available_courier_companies": [
      {
        "courier_company_id": 1,
        "courier_name": "BlueDart",
        "freight_charge": 85.50,
        "cod_charges": 35.00,
        "estimated_delivery_days": "3-5",
        "etd": "2026-02-07",
        "rate": 120.50
      },
      {
        "courier_company_id": 2,
        "courier_name": "Delhivery",
        "freight_charge": 65.00,
        "cod_charges": 30.00,
        "estimated_delivery_days": "4-6",
        "etd": "2026-02-08",
        "rate": 95.00
      }
    ]
  }
}
```

---

### Implementation Plan

#### 1. New Edge Function: `shiprocket-rates`

Create a dedicated edge function for fetching shipping rates (keeping auth logic separate):

**File:** `supabase/functions/shiprocket-rates/index.ts`

**Request:**
```json
{
  "storeId": "uuid",
  "deliveryPostcode": "400001",
  "weight": 0.5,
  "cod": 0
}
```

**Response:**
```json
{
  "success": true,
  "cheapestRate": 65.00,
  "fastestDelivery": "3-5 days",
  "couriers": [
    {
      "name": "Delhivery",
      "rate": 65.00,
      "etd": "4-6 days"
    }
  ],
  "pickupPostcode": "411061"
}
```

**Logic:**
1. Fetch store's Shiprocket connection (token + pickup_postcode + default_weight)
2. Call Shiprocket Serviceability API
3. Return cheapest rate and fastest delivery option
4. Handle token expiry gracefully

---

#### 2. New Hook: `useShippingRates`

Create a hook to fetch live rates from the checkout flow:

**File:** `src/hooks/useShippingRates.tsx`

```typescript
export interface ShippingRate {
  courierName: string;
  rate: number;
  etd: string;
  estimatedDays: string;
}

export interface ShippingRatesResult {
  cheapestRate: number;
  fastestDelivery: string;
  couriers: ShippingRate[];
  pickupPostcode: string;
}

export function useShippingRates(
  storeId: string | undefined,
  deliveryPostcode: string | undefined,
  weight: number
) {
  return useQuery({
    queryKey: ['shipping-rates', storeId, deliveryPostcode, weight],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('shiprocket-rates', {
        body: { storeId, deliveryPostcode, weight, cod: 0 }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as ShippingRatesResult;
    },
    enabled: !!storeId && !!deliveryPostcode && deliveryPostcode.length >= 6,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });
}
```

---

#### 3. Update Checkout Flow

**File:** `src/pages/Cart.tsx`

Modify the checkout section to:
1. Check if store has Shiprocket connected
2. Fetch live rates when customer enters postal code
3. Display dynamic shipping cost and ETD
4. Fall back to manual store settings if no Shiprocket connection

**Flow Diagram:**
```text
Customer enters checkout
        |
        v
+------------------+
| Postal code      |
| entered?         |
+------------------+
    |           |
   No          Yes (6+ digits)
    |           |
    v           v
Use manual    Call shiprocket-rates API
settings              |
    |           +-----+-----+
    |           |           |
    |       Success      Error
    |           |           |
    |           v           v
    |       Display     Fall back to
    |       live rate   manual settings
    |           |           |
    +-----+-----+-----+-----+
          |
          v
    Display in Order Summary
```

---

#### 4. Update CheckoutForm

**File:** `src/components/checkout/CheckoutForm.tsx`

Add a callback to notify parent when postal code changes:

```typescript
interface CheckoutFormProps {
  initialCountry: string;
  isSubmitting: boolean;
  onSubmit: (data: CheckoutFormData) => void;
  onPostalCodeChange?: (postalCode: string) => void;  // NEW
}
```

When postal code input changes (debounced 500ms), call `onPostalCodeChange`.

---

#### 5. Update CheckoutOrderSummary

**File:** `src/components/checkout/CheckoutOrderSummary.tsx`

Enhance to display:
- Live shipping rate when available
- Courier name (e.g., "via Delhivery")
- Dynamic ETD (e.g., "Delivery by Feb 7")
- Loading state while fetching rates
- "Check pincode" prompt if not entered

```typescript
interface CheckoutOrderSummaryProps {
  cart: CartItem[];
  subtotal: number;
  storeCountry: string;
  shippingInfo: StoreShippingInfo | null;
  liveShippingRate?: {
    rate: number;
    etd: string;
    courierName: string;
  } | null;
  isLoadingRates?: boolean;
  shiprocketEnabled?: boolean;
}
```

**Updated UI:**
```text
+------------------------------------------------+
| Order Summary                                   |
+------------------------------------------------+
| [Product thumbnail] Product Name         ₹299  |
| [Product thumbnail] Another Product      ₹199  |
+------------------------------------------------+
| Subtotal                                 ₹498  |
| Shipping (via Delhivery)                  ₹65  |
| Est. delivery: 4-6 days                        |
+------------------------------------------------+
| Total                                    ₹563  |
+------------------------------------------------+
```

---

### Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| `supabase/functions/shiprocket-rates/index.ts` | **Create** | New edge function for rates API |
| `supabase/config.toml` | **Modify** | Add `shiprocket-rates` function config |
| `src/hooks/useShippingRates.tsx` | **Create** | New hook for fetching rates |
| `src/pages/Cart.tsx` | **Modify** | Integrate live rates in checkout |
| `src/components/checkout/CheckoutForm.tsx` | **Modify** | Add postal code change callback |
| `src/components/checkout/CheckoutOrderSummary.tsx` | **Modify** | Display live rates |

---

### Edge Function Logic

```typescript
// shiprocket-rates/index.ts
serve(async (req) => {
  // 1. Get storeId, deliveryPostcode, weight from request
  const { storeId, deliveryPostcode, weight, cod } = await req.json();

  // 2. Fetch Shiprocket connection for this store (public, no auth needed)
  const { data: connection } = await supabase
    .from('shiprocket_connections')
    .select('token, pickup_postcode, default_weight')
    .eq('store_id', storeId)
    .maybeSingle();

  if (!connection?.token || !connection?.pickup_postcode) {
    return Response({ error: 'Shiprocket not configured for this store' });
  }

  // 3. Call Shiprocket Serviceability API
  const params = new URLSearchParams({
    pickup_postcode: connection.pickup_postcode,
    delivery_postcode: deliveryPostcode,
    weight: String(weight || connection.default_weight || 0.5),
    cod: String(cod || 0),
  });

  const response = await fetch(
    `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${connection.token}`,
        'Content-Type': 'application/json',
      }
    }
  );

  // 4. Parse and return cheapest/fastest options
  const data = await response.json();
  const couriers = data.data?.available_courier_companies || [];
  
  // Sort by rate to find cheapest
  const sorted = couriers.sort((a, b) => a.rate - b.rate);
  
  return Response({
    success: true,
    cheapestRate: sorted[0]?.rate || null,
    fastestDelivery: sorted[0]?.estimated_delivery_days || null,
    courierName: sorted[0]?.courier_name || null,
    couriers: sorted.slice(0, 3).map(c => ({
      name: c.courier_name,
      rate: c.rate,
      etd: c.estimated_delivery_days,
    })),
    pickupPostcode: connection.pickup_postcode,
  });
});
```

---

### Checkout Integration Flow

**In Cart.tsx checkout section:**

```typescript
// State for live rates
const [customerPostalCode, setCustomerPostalCode] = useState('');

// Check if store has Shiprocket connected
const { data: shiprocketConnection } = useQuery({
  queryKey: ['shiprocket-connection-checkout', firstStoreId],
  queryFn: async () => {
    const { data } = await supabase
      .from('shiprocket_connections')
      .select('pickup_postcode, default_weight')
      .eq('store_id', firstStoreId)
      .maybeSingle();
    return data;
  },
  enabled: isCheckout && !!firstStoreId,
});

// Fetch live rates when postal code is entered
const { data: liveRates, isLoading: isLoadingRates } = useShippingRates(
  firstStoreId,
  customerPostalCode,
  shiprocketConnection?.default_weight || 0.5
);
```

---

### Fallback Strategy

| Scenario | Behavior |
|----------|----------|
| Store has Shiprocket + valid postcode | Show live Shiprocket rates |
| Store has Shiprocket + no pickup postcode | Fall back to manual settings |
| Store has no Shiprocket connection | Use manual `shipping_charge` from store |
| Shiprocket API fails | Fall back to manual settings with error toast |
| Customer hasn't entered postcode | Show "Enter pincode for shipping estimate" |
| Postcode not serviceable | Show "Delivery not available to this area" |

---

### Error Handling

**Token Expiry:**
- Shiprocket tokens expire after 10 days
- If API returns 401, show message: "Shipping rates unavailable. Contact seller."
- Seller sees notification in dashboard to reconnect

**Non-Serviceable Areas:**
- Some pincodes may not have courier coverage
- Show friendly message: "Delivery not available to [pincode]"
- Allow order placement with manual shipping settings

---

### Security Considerations

- The `shiprocket-rates` endpoint is **public** (no JWT verification needed)
- Only reads `pickup_postcode`, `default_weight`, and `token` from DB
- Token is never exposed to frontend - only used server-side
- Rate limiting should be considered for production

---

### User Experience

**Before entering pincode:**
```text
Shipping: Enter pincode for estimate
```

**While loading:**
```text
Shipping: Calculating...
```

**After rates fetched:**
```text
Shipping (via Delhivery): ₹65
Est. delivery: 4-6 days
```

**If not serviceable:**
```text
Shipping: Not available to this area
[Contact seller for alternatives]
```

---

### Technical Summary

1. **New Edge Function** (`shiprocket-rates`) handles Shiprocket API calls server-side
2. **New Hook** (`useShippingRates`) provides React Query integration with caching
3. **Checkout Form** reports postal code changes to parent
4. **Order Summary** displays live rates with loading states
5. **Cart Page** orchestrates the flow with proper fallbacks

This provides customers with accurate, real-time shipping costs while maintaining graceful degradation when Shiprocket isn't configured.

