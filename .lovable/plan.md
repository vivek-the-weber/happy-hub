
## Wire up the real Trysy SDK on checkout

Now that we know the actual Trysy contract, replace the placeholder badge + broken SDK URL with a real working integration on the Cart checkout page.

### What's wrong today

- `TrysyEmbed` loads `https://trysy.lovable.app/sdk.js` → 404. Correct URL is `https://trysy.lovable.app/api/public/sdk.js`.
- `Trysy.init(...)` is called with just `{ storeId, apiKey }` — the real SDK needs `mount` + full `order` payload.
- `TrysyEmbed` is mounted on `StorePage` (product browse), but Trysy belongs on **checkout**, not the storefront.
- `TrysyCheckoutBadge` is just decorative — it doesn't actually render the Trysy try-at-home checkbox or post anything.

### What I'll build

A single real integration on the checkout step in `Cart.tsx`:

```text
+-- Checkout (right column) -----------------+
|                                            |
|  [Order summary card]                      |
|                                            |
|  +-- Trysy mount ------------------------+ |
|  |  ☐  Enable Trysy try-at-home (+₹99)  | |
|  +--------------------------------------+ |
|                                            |
|  [ Place Order ]                           |
+--------------------------------------------+
```

Flow:

1. On entering checkout, fetch the seller's Trysy config via existing `get_trysy_public_config(p_store_id)` RPC. If disabled / missing → render nothing, behave exactly like today.
2. If enabled → load `https://trysy.lovable.app/api/public/sdk.js` once, then call `Trysy.init({ storeId, apiKey, mount: '#trysy-mount', order: {...} })` with a draft order payload derived from the current cart:
   - `external_order_id`: a stable client-generated UUID for this checkout attempt (reused across re-inits so replays hit the 409 idempotency path cleanly).
   - `products`: mapped from `cart` items (`product_name`, `quantity`, `price`, `size` if available — we don't track size today, so omit).
   - `total_order_value`: current `total`.
   - `trysy_fee`: `99` (matches stored `trysy_fee` default).
3. Re-init when cart total / items change so the SDK always has the latest payload (guard with a ref so we don't spam).
4. Listen for `window` event `trysy:order-created` and stash the returned `trysy_order_id` on the order we insert into Supabase (see DB change below) so sellers can later see "this order is a Trysy order" in the dashboard.

### Cleanup

- Delete `src/components/store/TrysyEmbed.tsx` and its usage in `StorePage.tsx` (wrong place, broken URL).
- Delete `src/components/checkout/TrysyCheckoutBadge.tsx` and its usage in `Cart.tsx` (replaced by the real mount).

### Files

- **Create** `src/components/checkout/TrysyCheckout.tsx` — fetches config, loads SDK, renders `<div id="trysy-mount" />`, re-inits on cart changes, listens for `trysy:order-created`, exposes `trysyOrderId` + `onTrysyOrderCreated` via props/callback.
- **Edit** `src/pages/Cart.tsx`:
  - Replace `<TrysyCheckoutBadge />` with `<TrysyCheckout ... />` inside the checkout right column.
  - Generate `externalOrderId` (UUID) once per checkout session via `useRef`.
  - Pass cart-derived order payload down.
  - When placing the order, include `trysy_order_id` (if any) in the `orders` insert.
- **Edit** `src/pages/StorePage.tsx` — remove `<TrysyEmbed />` import + usage.
- **Delete** `src/components/store/TrysyEmbed.tsx`, `src/components/checkout/TrysyCheckoutBadge.tsx`.

### DB change (small)

Add a nullable `trysy_order_id text` column to `orders` so we can persist the ID the SDK returns. No RLS change needed (covered by existing `orders` policies).

### Out of scope

- Server-side fallback POST to `/api/public/create-trysy-order` (the SDK handles it client-side; we'd only need this if we ever want guaranteed creation even when the SDK fails to load).
- Showing Trysy status on the seller's order list UI (we'll store `trysy_order_id`, displaying it can be a follow-up).
- Verifying the API key server-side (Trysy team's gap, not ours).

Approve and I'll run the migration and ship the code.
