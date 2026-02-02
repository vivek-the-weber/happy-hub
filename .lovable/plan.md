

## Enhance Shipping Rate Checks with Rate Limiting

### Current State (Already Working)

The implementation already supports:
- **User enters pincode**: The `CheckoutForm` has a postal code input field
- **Shipping checked on change**: The `onPostalCodeChange` callback with 500ms debounce triggers rate fetching
- **React Query caching**: Results are cached for 5 minutes to prevent duplicate requests

### What Needs to Be Added

Add **rate limiting** to the `shiprocket-rates` edge function to prevent abuse from malicious users or bots.

---

### Rate Limiting Strategy

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Rate limit | 10 requests per minute per IP | Generous for legitimate users (typically 1-3 rate checks per checkout) |
| Window | 60 seconds (sliding) | Prevents burst abuse while allowing normal usage |
| Storage | In-memory Map | Simple, no external dependencies, sufficient for edge function |
| Identifier | Client IP address | Works for anonymous checkout flow |

---

### Implementation Plan

#### 1. Update Edge Function: `shiprocket-rates`

Add IP-based rate limiting at the beginning of the request handler:

```text
Request comes in
       |
       v
+------------------+
| Extract client   |
| IP from headers  |
+------------------+
       |
       v
+------------------+
| Check rate limit |
| (10 req/min/IP)  |
+------------------+
    |         |
  Under     Over
  limit     limit
    |         |
    v         v
Continue   Return 429
processing "Too Many Requests"
```

**Rate limiter logic:**
```typescript
// In-memory store for rate limiting
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetAt) {
    // First request or window expired
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false; // Rate limited
  }
  
  record.count++;
  return true;
}
```

**Extract IP address:**
```typescript
function getClientIP(req: Request): string {
  // Check common proxy headers
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a generic identifier
  return 'unknown';
}
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/shiprocket-rates/index.ts` | Add rate limiting logic with IP extraction |

---

### Updated Edge Function Structure

```typescript
// Rate limit configuration
const RATE_LIMIT_MAX = 10;      // Max requests per window
const RATE_LIMIT_WINDOW = 60000; // 60 seconds

// In-memory rate limit store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Helper functions
function getClientIP(req: Request): string { ... }
function checkRateLimit(ip: string): boolean { ... }

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Rate limiting check (FIRST thing after CORS)
  const clientIP = getClientIP(req);
  if (!checkRateLimit(clientIP)) {
    console.log(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ 
        error: 'Too many requests. Please try again in a minute.',
        rateLimited: true 
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        } 
      }
    );
  }

  // Continue with existing logic...
});
```

---

### Frontend Handling

Update `useShippingRates` hook to handle 429 responses gracefully:

```typescript
export function useShippingRates(...) {
  return useQuery({
    queryKey: ['shipping-rates', storeId, deliveryPostcode, weight],
    queryFn: async (): Promise<ShippingRatesResult> => {
      const { data, error } = await supabase.functions.invoke('shiprocket-rates', {
        body: { storeId, deliveryPostcode, weight, cod: 0 },
      });

      // Handle rate limiting
      if (data?.rateLimited) {
        return {
          success: false,
          error: 'Too many requests. Please wait a moment.',
          rateLimited: true,
        } as ShippingRatesResult;
      }

      if (error) throw new Error(error.message);
      return data as ShippingRatesResult;
    },
    // ... rest of options
  });
}
```

Update `ShippingRatesResult` interface:
```typescript
export interface ShippingRatesResult {
  // ... existing fields
  rateLimited?: boolean;
}
```

---

### Memory Cleanup

Add periodic cleanup to prevent memory leaks in long-running edge functions:

```typescript
// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);
```

---

### User Experience

| Scenario | User Experience |
|----------|-----------------|
| Normal usage | No change - rates load instantly |
| Rapid checking (>10/min) | "Too many requests. Please wait a moment." |
| After waiting 60s | Normal operation resumes |

---

### Technical Summary

1. **Rate Limiter**: IP-based, 10 requests per minute per IP
2. **Storage**: In-memory Map (edge function scope)
3. **Response**: 429 status with `Retry-After: 60` header
4. **Frontend**: Graceful handling with user-friendly message
5. **Cleanup**: Periodic removal of expired entries

This protects the Shiprocket API from abuse while ensuring legitimate customers have a smooth checkout experience.

