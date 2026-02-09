

## Seller Payment Settings (UPI ID Setup)

### Overview
Add a new "Payments" section within the Settings tab of the seller dashboard where sellers can add, view, and update their UPI ID for receiving payments.

---

### 1. Database Changes

Create a new `seller_payment_settings` table:

| Column | Type | Details |
|--------|------|---------|
| id | uuid | Primary key, auto-generated |
| store_id | uuid | Foreign key to stores, unique (one per store) |
| upi_id | text | Stored in lowercase, max 50 chars |
| is_active | boolean | Default true |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now(), auto-updated via trigger |

RLS Policies:
- Store owners can SELECT, INSERT, UPDATE, and DELETE their own payment settings (matched via `stores.owner_id = auth.uid()`)

The existing `update_updated_at_column` trigger function will be reused for auto-updating `updated_at`.

---

### 2. New Component: `PaymentSettings.tsx`

Located at `src/components/dashboard/PaymentSettings.tsx`, this component handles two UI states:

**State A -- No UPI ID saved:**
- Header: "Payments" with a credit-card-style icon
- Helper text explaining the purpose
- UPI ID text input with placeholder `anything@upi`
- Ownership confirmation checkbox
- "Save UPI ID" button
- Disclaimer text at the bottom

**State B -- UPI ID exists:**
- Shows masked UPI ID (e.g., `sho***@upi`)
- "Edit" button to switch to edit mode
- Edit mode shows the same form pre-filled with the current UPI ID

**Validation (client-side):**
- Must contain `@`
- No spaces allowed
- Max 50 characters
- Converted to lowercase before saving
- Checkbox must be checked to save

**Pending orders check:**
- Before allowing an update (not initial add), query orders with status `pending` for the store
- If pending orders exist, show an inline warning and block the save

---

### 3. New Hook: `usePaymentSettings.tsx`

Located at `src/hooks/usePaymentSettings.tsx`, provides:
- `usePaymentSettings(storeId)` -- fetches the current payment settings
- `useUpsertPaymentSettings()` -- creates or updates the UPI ID
- `useHasPendingOrders(storeId)` -- checks if store has pending orders (used to block UPI updates)

---

### 4. Dashboard Integration

Update `src/pages/Dashboard.tsx` to add the PaymentSettings card inside the Settings tab, placed between the "Store Logo" and "Store Information" sections. This follows the existing card pattern (`bg-white/5 border border-white/10 rounded-2xl p-6`).

---

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/dashboard/PaymentSettings.tsx` | Payment settings UI component |
| `src/hooks/usePaymentSettings.tsx` | Data hooks for payment settings |

### Files to Modify
| File | Changes |
|------|---------|
| `src/pages/Dashboard.tsx` | Import and render PaymentSettings in Settings tab |

### Database Migration
| Action | Details |
|--------|---------|
| Create table | `seller_payment_settings` with columns listed above |
| Add RLS policies | Owner-based SELECT, INSERT, UPDATE, DELETE |
| Add trigger | `update_updated_at_column` on the new table |
| Add unique constraint | One payment setting per store (`store_id` unique) |

---

### UPI Masking Logic

```text
Input:  shopname@upi
Output: sho***@upi

Rule: Show first 3 chars of local part, mask rest with ***, keep @ and domain intact.
If local part is 3 chars or fewer, mask all but the first char.
```

---

### Validation Summary

| Rule | Implementation |
|------|----------------|
| Must contain `@` | Client-side check before save |
| No spaces | Client-side regex / check |
| Max 50 chars | `maxLength` on input + client-side check |
| Lowercase | `toLowerCase()` before saving |
| Checkbox required | Button disabled until checked |
| Block update with pending orders | Query check before allowing edit save |

