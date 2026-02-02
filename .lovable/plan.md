

## Separate Shiprocket from Store in Database

### Overview

Extract Shiprocket-specific data from the `stores` table into a dedicated `shiprocket_connections` table. This improves database architecture by:
- Separating concerns (store identity vs shipping provider)
- Making it easier to add more shipping providers in the future
- Cleaner `stores` table focused on store metadata
- Better encapsulation of sensitive API credentials

---

### Current State

The `stores` table currently contains these Shiprocket fields:

| Column | Type | Purpose |
|--------|------|---------|
| `shiprocket_email` | text | Shiprocket account email |
| `shiprocket_token` | text | JWT token for API calls |
| `shiprocket_connected` | boolean | Connection status |

---

### Proposed Schema

#### New Table: `shiprocket_connections`

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `store_id` | uuid | No | - | FK to stores (unique) |
| `email` | text | No | - | Shiprocket account email |
| `token` | text | No | - | JWT token for API |
| `pickup_postcode` | text | Yes | - | Warehouse pickup pincode |
| `default_weight` | numeric | Yes | 0.5 | Default package weight (kg) |
| `created_at` | timestamptz | No | `now()` | Creation timestamp |
| `updated_at` | timestamptz | No | `now()` | Last update timestamp |

**Constraints:**
- `store_id` has a UNIQUE constraint (one connection per store)
- Foreign key to `stores(id)` with ON DELETE CASCADE

---

### Database Migration

```sql
-- 1. Create the new shiprocket_connections table
CREATE TABLE public.shiprocket_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL,
  pickup_postcode text,
  default_weight numeric DEFAULT 0.5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Migrate existing data from stores
INSERT INTO public.shiprocket_connections (store_id, email, token)
SELECT id, shiprocket_email, shiprocket_token
FROM public.stores
WHERE shiprocket_connected = true 
  AND shiprocket_email IS NOT NULL 
  AND shiprocket_token IS NOT NULL;

-- 3. Enable RLS
ALTER TABLE public.shiprocket_connections ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Store owners can view their connection"
  ON public.shiprocket_connections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = shiprocket_connections.store_id 
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store owners can insert connection"
  ON public.shiprocket_connections FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = shiprocket_connections.store_id 
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store owners can update their connection"
  ON public.shiprocket_connections FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = shiprocket_connections.store_id 
    AND stores.owner_id = auth.uid()
  ));

CREATE POLICY "Store owners can delete their connection"
  ON public.shiprocket_connections FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = shiprocket_connections.store_id 
    AND stores.owner_id = auth.uid()
  ));

-- 5. Add updated_at trigger
CREATE TRIGGER update_shiprocket_connections_updated_at
  BEFORE UPDATE ON public.shiprocket_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Remove old columns from stores (after confirming migration success)
ALTER TABLE public.stores 
  DROP COLUMN shiprocket_email,
  DROP COLUMN shiprocket_token,
  DROP COLUMN shiprocket_connected;
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useStore.tsx` | Remove shiprocket fields from Store interface |
| `src/hooks/useShiprocket.tsx` | Create new hook `useShiprocketConnection` to fetch/manage connection |
| `supabase/functions/shiprocket-auth/index.ts` | Update to insert/delete from new table |
| `src/components/dashboard/ShippingSettings.tsx` | Use new hook, add pickup postcode field |
| `src/components/dashboard/ShiprocketConnectModal.tsx` | No changes needed (uses hook) |

---

### Updated Hook: `useShiprocket.tsx`

Add new queries and types:

```typescript
// New interface
export interface ShiprocketConnection {
  id: string;
  store_id: string;
  email: string;
  token: string;
  pickup_postcode: string | null;
  default_weight: number;
  created_at: string;
  updated_at: string;
}

// New query hook
export function useShiprocketConnection(storeId: string | undefined) {
  return useQuery({
    queryKey: ['shiprocket-connection', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const { data, error } = await supabase
        .from('shiprocket_connections')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();
      if (error) throw error;
      return data as ShiprocketConnection | null;
    },
    enabled: !!storeId,
  });
}

// New mutation for updating pickup settings
export function useUpdateShiprocketConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ storeId, pickup_postcode, default_weight }: {
      storeId: string;
      pickup_postcode?: string;
      default_weight?: number;
    }) => {
      const { data, error } = await supabase
        .from('shiprocket_connections')
        .update({ pickup_postcode, default_weight })
        .eq('store_id', storeId)
        .select()
        .single();
      if (error) throw error;
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

### Updated Edge Function Logic

**Connect action:**
```typescript
// Instead of updating stores table:
const { error: insertError } = await supabase
  .from('shiprocket_connections')
  .insert({
    store_id: storeId,
    email: email,
    token: shiprocketData.token,
  });
```

**Disconnect action:**
```typescript
// Instead of clearing stores fields:
const { error: deleteError } = await supabase
  .from('shiprocket_connections')
  .delete()
  .eq('store_id', storeId);
```

---

### UI Updates

**ShippingSettings.tsx:**
- Fetch connection status using `useShiprocketConnection(store.id)`
- Show toggle based on `connection !== null` instead of `store.shiprocket_connected`
- Display connected email from `connection.email`
- Add pickup postcode input field (new)
- Add default weight input field (new)

---

### Data Flow Diagram

```text
+------------------+          +------------------------+
|     stores       |          | shiprocket_connections |
+------------------+          +------------------------+
| id (PK)          |<---------| store_id (FK, UNIQUE)  |
| owner_id         |          | email                  |
| name             |          | token                  |
| slug             |          | pickup_postcode        |
| ...store fields  |          | default_weight         |
+------------------+          +------------------------+
        |
        | 1:1 relationship
        v
  Store has 0 or 1 
  Shiprocket connection
```

---

### Benefits

| Aspect | Before | After |
|--------|--------|-------|
| Schema clarity | Shipping mixed with store data | Clean separation |
| Token security | Token in widely-queried stores table | Token in dedicated, restricted table |
| Extensibility | Hard to add new providers | Can add `delhivery_connections`, etc. |
| Data integrity | Nullable fields could be inconsistent | Connection exists = connected |
| Query efficiency | Always fetch shiprocket fields | Only fetch when needed |

---

### Migration Strategy

1. Create new table with data migration
2. Update edge function to use new table
3. Update frontend hooks to query new table
4. Update UI components to use new hooks
5. Drop old columns from stores table

All done in a single coordinated release.

