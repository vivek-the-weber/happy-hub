## Trysy connection settings for sellers

Add a **Trysy** section to the seller Dashboard where each seller can connect their Trysy account by pasting their **Trysy Store ID** and **Trysy API Key**, and toggle Trysy on/off for their store. No runtime SDK injection or order forwarding yet — just the credentials UI + storage. Trysy fee is fixed at ₹99 for later use.

### What the seller sees

A new **Trysy** card on the Dashboard (next to Payment Settings / Shiprocket), styled in the existing glassmorphism look:

```text
+--------------------------------------------+
| 🛍  Trysy                                  |
| Try-before-you-buy for your storefront.    |
|                                            |
| [ Enable Trysy ]  ◯ off                    |
|                                            |
| Trysy Store ID                             |
| [ f8cde913-77d3-4544-b9b7-137797797091 ]   |
|                                            |
| Trysy API Key                              |
| [ trysy_live_•••••••••••••  👁 ]           |
|                                            |
| Trysy fee per order: ₹99 (fixed)           |
|                                            |
| [ Save ]    [ Disconnect ]                 |
+--------------------------------------------+
```

- API key is masked by default, with a show/hide eye toggle.
- "Save" stores credentials; "Disconnect" clears them and disables Trysy.
- Small helper text: "Get these from your Trysy dashboard at trysy.lovable.app."

### Data model

New table `trysy_connections` (one per store):

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| store_id | uuid | unique, the store |
| trysy_store_id | text | the UUID from Trysy |
| trysy_api_key | text | sensitive, stored encrypted at rest by Supabase |
| is_enabled | boolean | seller's on/off toggle |
| trysy_fee | numeric | default 99 |
| created_at / updated_at | timestamptz | |

RLS: only the store's owner can view / insert / update / delete their row (same pattern as `shiprocket_connections`).

### Files to add / change

- **Create** `src/components/dashboard/TrysySettings.tsx` — the settings card UI.
- **Create** `src/hooks/useTrysy.tsx` — fetch / save / disconnect hook (mirrors `useShiprocket`).
- **Edit** `src/pages/Dashboard.tsx` — render `<TrysySettings />` in the settings area.
- **Migration** — create `trysy_connections` table with RLS + `updated_at` trigger.

### Out of scope (for later)

- Embedding the Trysy `<script>` SDK on storefronts.
- POSTing orders to `https://trysy.lovable.app/api/public/create-trysy-order` at checkout.
- Showing Trysy status on the order list.

Once this is approved I'll run the migration and build the UI.
