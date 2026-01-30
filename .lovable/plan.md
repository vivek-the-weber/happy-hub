

## Shiprocket Integration Enablement

### Overview
Add a Shiprocket integration section in the Shipping Settings tab where sellers can connect their Shiprocket account by entering their API email and password. The credentials will be securely stored in the database and verified via a backend function.

---

### Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                     Seller Dashboard                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Shipping Tab                                │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │  Shipping Settings (existing)                   │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │  Shiprocket Integration (NEW)                   │    │    │
│  │  │  - Email input                                  │    │    │
│  │  │  - Password input                               │    │    │
│  │  │  - Connect button                               │    │    │
│  │  │  - Connection status badge                      │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │  Learn Shipping (existing)                      │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Function                              │
│  shiprocket-auth                                                 │
│  - Validates email/password with Shiprocket API                 │
│  - Returns success/failure                                       │
│  - Token is stored securely in database                         │
└─────────────────────────────────────────────────────────────────┘
```

---

### Changes Required

#### 1. Database Migration
Add Shiprocket credential columns to the `stores` table:
- `shiprocket_email` (text, nullable) - Seller's Shiprocket account email
- `shiprocket_token` (text, nullable) - Shiprocket auth token (obtained after login)
- `shiprocket_connected` (boolean, default false) - Connection status

#### 2. Create Backend Function: `shiprocket-auth`
A new backend function that:
- Receives email and password from the seller
- Calls Shiprocket's `/auth/login` API endpoint
- If successful, returns the token
- Stores the token in the database for future API calls
- Never stores the password (only the resulting token)

#### 3. Update `ShippingSettings.tsx`
Add a new "Shiprocket Integration" card section with:
- Email input field
- Password input field (shown only when not connected)
- "Connect to Shiprocket" button
- Connection status indicator (Connected/Not connected)
- "Disconnect" option when connected
- Info text explaining what Shiprocket is

#### 4. Update `useStore.tsx`
Add the new Shiprocket fields to the Store interface:
- `shiprocket_email: string | null`
- `shiprocket_token: string | null`
- `shiprocket_connected: boolean`

#### 5. Create New Hook: `useShiprocket.tsx`
A custom hook to handle:
- Connecting to Shiprocket (calling the edge function)
- Disconnecting from Shiprocket
- Managing loading/error states

---

### User Experience Flow

1. Seller navigates to **Dashboard → Shipping tab**
2. Sees a new "Shiprocket Integration" card below Shipping Settings
3. Enters their Shiprocket API email and password
4. Clicks "Connect to Shiprocket"
5. System validates credentials with Shiprocket API
6. If successful: Shows "Connected" status with green badge
7. If failed: Shows error message asking to check credentials
8. Once connected, seller can disconnect anytime

---

### Security Considerations

- Password is **never stored** in the database - only sent to backend function
- Only the authentication token is stored
- Backend function handles all Shiprocket API communication
- RLS policies ensure sellers can only access their own store's data
- Token can be used for future Shiprocket API calls (creating shipments, tracking, etc.)

---

### Technical Details

**Shiprocket API Authentication Endpoint:**
```text
POST https://apiv2.shiprocket.in/v1/external/auth/login
Content-Type: application/json

{
  "email": "seller@example.com",
  "password": "their_password"
}
```

**Response on success:**
```json
{
  "id": 12345,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "first_name": "John",
  ...
}
```

---

### Files to Create/Modify

| File | Action |
|------|--------|
| Database migration | CREATE - Add shiprocket columns to stores |
| `supabase/functions/shiprocket-auth/index.ts` | CREATE - Backend auth function |
| `src/components/dashboard/ShippingSettings.tsx` | MODIFY - Add Shiprocket card |
| `src/hooks/useStore.tsx` | MODIFY - Add new fields to Store interface |
| `src/hooks/useShiprocket.tsx` | CREATE - Shiprocket connection hook |

