

## Auto-Fetch Shiprocket Pickup Locations

### Overview

Enhance the Shiprocket integration to automatically fetch the seller's pickup locations from their Shiprocket account immediately after connecting. This removes the need for sellers to manually enter their pickup postcode - the system will retrieve it directly from their Shiprocket dashboard.

---

### Current State vs Proposed

| Aspect | Current | Proposed |
|--------|---------|----------|
| Pickup Postcode | Seller enters manually | Auto-fetched from Shiprocket |
| User Experience | Extra step after connecting | Zero-config after authentication |
| Data Source | User input (error-prone) | Shiprocket API (accurate) |

---

### Shiprocket API: Get Pickup Locations

**Endpoint:** `GET https://apiv2.shiprocket.in/v1/external/settings/company/pickup`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Response Example:**
```json
{
  "data": {
    "shipping_address": [
      {
        "id": 12345,
        "pickup_location": "Primary Warehouse",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "9876543210",
        "address": "123 Main Street",
        "address_2": "",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "pin_code": "400001",
        "lat": null,
        "long": null,
        "is_primary_location": 1,
        "status": 1
      }
    ]
  }
}
```

---

### Implementation Plan

#### 1. Update Edge Function: `shiprocket-auth`

After successful authentication, immediately fetch pickup locations and store the primary location's postcode:

```text
+------------------+     +-------------------+     +-------------------+
|  Connect Modal   | --> | shiprocket-auth   | --> | Shiprocket Login  |
|  (credentials)   |     | Edge Function     |     | API               |
+------------------+     +-------------------+     +-------------------+
                                |                          |
                                v                          v
                         Get token              Fetch pickup locations
                                |                          |
                                v                          v
                         +-------------------+     +-------------------+
                         | Save to DB with   | <-- | Return pin_code   |
                         | pickup_postcode   |     | from primary addr |
                         +-------------------+     +-------------------+
```

**Connect action changes:**
1. Authenticate with Shiprocket (existing)
2. **NEW:** Call `/settings/company/pickup` to get pickup locations
3. Extract `pin_code` from primary location (or first location)
4. Insert/update `shiprocket_connections` with `pickup_postcode` pre-filled

---

#### 2. Database Schema

No changes needed. The `shiprocket_connections` table already has:
- `pickup_postcode` (text, nullable)
- `default_weight` (numeric, default 0.5)

The postcode will now be auto-populated instead of manually entered.

---

#### 3. Update Shipping Settings UI

Change the pickup postcode field to be:
- **Read-only** (display only, fetched from Shiprocket)
- Show a "Refresh" button to re-fetch from Shiprocket if needed
- Add visual indication that it's synced from Shiprocket

**Updated UI Section:**
```text
+------------------------------------------------+
| SHIPROCKET SETTINGS                             |
+------------------------------------------------+
| Pickup Location                                 |
| [Primary Warehouse - 400001] 🔄 Refresh         |
| ↳ Synced from your Shiprocket account          |
|                                                 |
| Default Package Weight (kg)                     |
| [0.5________________________]                   |
| ↳ Average weight for shipping estimates        |
+------------------------------------------------+
```

---

#### 4. New Edge Function Action: `refresh-pickup`

Add a new action to the `shiprocket-auth` function to allow re-fetching pickup locations:

**Request:**
```json
{
  "action": "refresh-pickup",
  "storeId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "pickup_location": "Primary Warehouse",
  "pickup_postcode": "400001"
}
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/shiprocket-auth/index.ts` | Add pickup location fetch on connect, add refresh-pickup action |
| `src/hooks/useShiprocket.tsx` | Add `useRefreshPickupLocation` hook |
| `src/components/dashboard/ShippingSettings.tsx` | Make postcode read-only, add refresh button |

---

### Edge Function Logic Updates

**In the `connect` action, after getting token:**

```typescript
// After successful authentication, fetch pickup locations
console.log('Fetching pickup locations from Shiprocket...');
const pickupResponse = await fetch(
  'https://apiv2.shiprocket.in/v1/external/settings/company/pickup',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${shiprocketData.token}`,
      'Content-Type': 'application/json',
    },
  }
);

let pickupPostcode = null;
if (pickupResponse.ok) {
  const pickupData = await pickupResponse.json();
  const addresses = pickupData.data?.shipping_address || [];
  
  // Find primary location or use first one
  const primaryAddress = addresses.find(a => a.is_primary_location === 1) 
    || addresses[0];
  
  if (primaryAddress) {
    pickupPostcode = primaryAddress.pin_code;
    console.log('Found pickup postcode:', pickupPostcode);
  }
}

// Insert with auto-fetched postcode
const { error: insertError } = await supabase
  .from('shiprocket_connections')
  .insert({
    store_id: storeId,
    email: email,
    token: shiprocketData.token,
    pickup_postcode: pickupPostcode, // Auto-filled!
  });
```

---

### New Hook: `useRefreshPickupLocation`

```typescript
export function useRefreshPickupLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId }: { storeId: string }) => {
      const { data, error } = await supabase.functions.invoke('shiprocket-auth', {
        body: {
          action: 'refresh-pickup',
          storeId,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['shiprocket-connection', variables.storeId] 
      });
    },
  });
}
```

---

### Updated UI Component

```tsx
{/* Shiprocket Settings - Only show when connected */}
{isConnected && (
  <div className="space-y-4">
    {/* Pickup Location - Read-only, synced from Shiprocket */}
    <div className="space-y-2">
      <Label className="text-background/80">Pickup Location</Label>
      <div className="flex gap-2">
        <Input
          readOnly
          value={shiprocketConnection.pickup_postcode || 'Not available'}
          className="bg-white/5 border-white/10 text-background h-12 rounded-xl flex-1"
        />
        <Button
          variant="outline"
          onClick={handleRefreshPickup}
          disabled={refreshPickup.isPending}
          className="h-12 rounded-xl"
        >
          {refreshPickup.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        </Button>
      </div>
      <p className="text-xs text-green-400">
        ✓ Synced from your Shiprocket account
      </p>
    </div>

    {/* Default Weight - Still editable */}
    <div className="space-y-2">
      <Label htmlFor="defaultWeight" className="text-background/80">
        Default Package Weight (kg)
      </Label>
      <Input
        id="defaultWeight"
        type="number"
        min="0.1"
        step="0.1"
        value={defaultWeight}
        onChange={(e) => setDefaultWeight(e.target.value)}
        className="bg-white/5 border-white/10 text-background h-12 rounded-xl"
      />
    </div>
  </div>
)}
```

---

### Error Handling

| Scenario | Behavior |
|----------|----------|
| Pickup API fails | Connection still succeeds, postcode remains null |
| No pickup locations | Show message "No pickup location configured in Shiprocket" |
| Token expired on refresh | Show error, suggest reconnecting |
| Multiple locations | Use primary, or first available |

---

### User Flow After Implementation

1. **Seller clicks "Connect Shiprocket"**
2. **Enters email/password** in modal
3. **System authenticates** with Shiprocket
4. **System auto-fetches** pickup locations
5. **Connection saved** with postcode pre-filled
6. **Seller sees** their pickup postcode already populated
7. **Optional:** Seller can click "Refresh" to re-sync

This provides a seamless, zero-configuration experience after connecting to Shiprocket.

---

### Technical Details

**Shiprocket API Reference:**
- Endpoint: `GET /v1/external/settings/company/pickup`
- Auth: Bearer token (same token from login)
- Returns array of pickup locations with `pin_code` field

**Primary Location Detection:**
- Check `is_primary_location === 1` flag
- Fallback to first address in the array
- Store the `pickup_location` name for display (optional enhancement)

