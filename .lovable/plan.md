
## Automatic Shiprocket Token Refresh

### Problem
Shiprocket API tokens expire after a certain period. Currently, when a token expires:
1. The `shiprocket-rates` edge function detects the 401 error
2. It returns `tokenExpired: true` to the frontend
3. The UI shows "Shipping rates unavailable" and falls back to manual shipping
4. The seller must manually reconnect their Shiprocket account in the dashboard

This creates a poor experience for both sellers (who may not realize their connection is broken) and customers (who don't get accurate shipping rates).

### Solution: Backend Token Refresh with Stored Credentials

Since Shiprocket doesn't provide refresh tokens, we need to store the seller's email for re-authentication. We'll implement a proactive token refresh mechanism.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    Token Refresh Architecture                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  shiprocket-rates (detects 401)                                     │
│           │                                                         │
│           ▼                                                         │
│  ┌────────────────────┐                                             │
│  │ Return tokenExpired │                                            │
│  │ + trigger refresh   │                                            │
│  └────────────────────┘                                             │
│           │                                                         │
│           ▼                                                         │
│  shiprocket-auth (action: 'refresh-token')                          │
│           │                                                         │
│           ▼                                                         │
│  ┌────────────────────┐     ┌─────────────────────────────┐         │
│  │ Try re-login with  │────▶│ Success: Update token in DB │         │
│  │ stored email       │     │ Retry original request      │         │
│  └────────────────────┘     └─────────────────────────────┘         │
│           │                                                         │
│           ▼ (if no stored password)                                 │
│  ┌────────────────────┐                                             │
│  │ Mark as expired    │                                             │
│  │ Notify seller      │                                             │
│  └────────────────────┘                                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation Approach

Since Shiprocket doesn't provide refresh tokens (they use simple JWT that expires), and we **intentionally don't store passwords** for security, we'll implement:

1. **Token Expiry Detection**: Already in place
2. **Automatic Retry with Fresh Token**: The rates function will attempt one token refresh before failing
3. **Seller Notification System**: Alert sellers when their token is about to expire or has expired
4. **Frontend Auto-Retry**: When `tokenExpired` is detected, automatically trigger a reconnection prompt

---

### Technical Changes

#### 1. Database Schema Update
Add a `token_expires_at` column to track token validity:

```sql
ALTER TABLE public.shiprocket_connections 
ADD COLUMN token_expires_at timestamptz;
```

#### 2. Update shiprocket-auth Edge Function
- Add new action: `validate-token` to check if token is valid
- Store token expiry time when connecting (Shiprocket tokens typically expire in 10 days)
- Update the `connect` action to calculate and store expiry

#### 3. Update shiprocket-rates Edge Function
- Before making the API call, check if `token_expires_at` is past
- If token is expired or about to expire (within 1 day), return `tokenExpired: true` immediately
- Add internal retry mechanism: if 401 received, mark token as expired and return error

#### 4. Add Frontend Hook for Token Refresh
Create a new hook `useRefreshShiprocketToken` that:
- Listens for `tokenExpired` in shipping rates response
- Triggers a reconnection modal or notification to the seller
- Invalidates cached shipping status queries

#### 5. Update ShippingSettings Component
- Show a warning badge when token is about to expire
- Add a "Refresh Connection" button that re-opens the credentials modal

#### 6. Update Checkout Flow
- When `tokenExpired` is detected, show a graceful message
- Continue with manual shipping fallback seamlessly

---

### Files to Create/Modify

| File | Changes |
|------|---------|
| `supabase/migrations/` | Add `token_expires_at` column |
| `supabase/functions/shiprocket-auth/index.ts` | Add token expiry tracking, add `validate-token` action |
| `supabase/functions/shiprocket-rates/index.ts` | Check token expiry before API call |
| `src/hooks/useShiprocket.tsx` | Add `useRefreshShiprocketToken` hook |
| `src/components/dashboard/ShippingSettings.tsx` | Show token expiry warning, add refresh button |
| `src/integrations/supabase/types.ts` | Auto-updated with new column |

---

### Security Considerations

1. **No Password Storage**: We will NOT store Shiprocket passwords. When token expires, seller must re-enter credentials
2. **Token Expiry Tracking**: Shiprocket tokens expire in ~10 days. We'll track this proactively
3. **Graceful Degradation**: If token is expired, fallback to manual shipping without breaking checkout

---

### User Experience

**For Sellers:**
- Dashboard shows connection status with expiry countdown
- Warning notification 2 days before token expires
- One-click reconnection flow

**For Customers:**
- Seamless checkout with live rates when token is valid
- Automatic fallback to manual shipping if rates unavailable
- No error messages about "token expired" (internal detail)

---

### Summary

This implementation adds proactive token expiry tracking and graceful handling:
1. Track when tokens will expire in the database
2. Warn sellers before expiry
3. Provide easy reconnection flow
4. Fall back to manual shipping seamlessly for customers
