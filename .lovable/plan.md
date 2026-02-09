

## Fix: Implement Missing Payment Settings Frontend

The database table `seller_payment_settings` was created successfully, but the frontend code was never written. All three deliverables need to be built from scratch.

---

### 1. Create Hook: `src/hooks/usePaymentSettings.tsx`

Provides three React Query hooks:

- **`usePaymentSettings(storeId)`** -- Fetches the current payment settings row using `.maybeSingle()` (safe when no row exists)
- **`useUpsertPaymentSettings()`** -- Inserts or updates UPI ID via Supabase upsert on `store_id`, invalidates the query cache on success
- **`useHasPendingOrders(storeId)`** -- Checks if the store has any orders with `status = 'pending'`, returns a boolean; used to block UPI edits when pending orders exist

---

### 2. Create Component: `src/components/dashboard/PaymentSettings.tsx`

Two visual states managed by local component state:

**State A -- No UPI ID saved (or adding for the first time):**
- Section header: "Payments" with a `CreditCard` icon
- Helper text: "This UPI ID will be shown to buyers for direct payment."
- UPI ID text input (placeholder: `anything@upi`, max 50 chars)
- Ownership confirmation checkbox (required to save)
- "Save UPI ID" button (disabled until valid input + checkbox checked)
- Disclaimer: "Payments are collected directly to your UPI ID. We do not verify UPI ownership."

**State B -- UPI ID exists (display mode):**
- Masked UPI ID display (e.g., `sho***@upi`)
- "Edit" button switches to edit mode (pre-fills input with current UPI ID)

**Validation (client-side, before save):**
- Must contain `@`
- No spaces allowed
- Max 50 characters
- Converted to lowercase before saving

**Pending orders guard (edit only, not initial add):**
- Query pending orders before allowing an edit save
- If pending orders exist, show an inline warning and block the save button

**UPI Masking Logic:**
- Split on `@`, take local part and domain
- If local part length > 3: show first 3 chars + `***`
- If local part length <= 3: show first 1 char + `***`
- Append `@` + domain

---

### 3. Update Dashboard: `src/pages/Dashboard.tsx`

- Import `PaymentSettings` component
- Render `<PaymentSettings store={store} />` inside the Settings `TabsContent`, placed between the Store Logo card and the Store Information card

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/usePaymentSettings.tsx` | React Query hooks for payment settings CRUD + pending orders check |
| `src/components/dashboard/PaymentSettings.tsx` | Payment settings UI with add/view/edit states |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Import and render PaymentSettings in Settings tab |

