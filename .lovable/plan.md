

## Enhanced Checkout Form with Detailed Address Fields

### Overview

Redesign the checkout form to match the reference design with structured address fields and an improved order summary showing product images, variant details, and shipping information.

---

### Current vs New Form Fields

| Current Fields | New Fields |
|----------------|------------|
| Your name | Full Name |
| Phone number | Email + Phone (side by side) |
| Delivery address (textarea) | Address Line 1 |
| Order notes (optional) | Address Line 2 (optional) |
| - | City + State (side by side) |
| - | Postal Code + Country (side by side) |
| - | Order notes (optional) - keep this |

---

### Database Changes Required

The `orders` table needs new columns to store structured address data:

```sql
ALTER TABLE public.orders
ADD COLUMN customer_email TEXT,
ADD COLUMN customer_address_line1 TEXT,
ADD COLUMN customer_address_line2 TEXT,
ADD COLUMN customer_city TEXT,
ADD COLUMN customer_state TEXT,
ADD COLUMN customer_postal_code TEXT,
ADD COLUMN customer_country TEXT;
```

Note: Keep existing `customer_address` column for backward compatibility and as a formatted summary.

---

### Enhanced Order Summary Design

Based on the reference screenshots, the order summary will show:

1. **Product rows with images** - Small thumbnail, product name (truncated), variant (if any), quantity badge, and price
2. **Subtotal line**
3. **Shipping line** - Shows "Calculating..." initially, then updates with cost and delivery method
4. **Total line** - Subtotal + Shipping

---

### Layout Structure

```text
Checkout Form (Two-Column Layout on Desktop)
├── Left Column: Customer Details
│   ├── Full Name * (full width)
│   ├── Row: [Email *] [Phone *]
│   ├── Address Line 1 * (full width)
│   ├── Address Line 2 (optional, full width)
│   ├── Row: [City *] [State *]
│   └── Row: [Postal Code *] [Country (read-only)]
│
└── Right Column: Order Summary
    ├── Product list with images
    │   ├── [Image] Name (truncated) | Qty: X | Price
    │   └── Variant info below name
    ├── Subtotal
    ├── Shipping (with delivery method when available)
    └── Total
```

---

### Shipping Calculation Logic

The shipping cost can come from:
1. **Store's fixed shipping charge** - If set by seller
2. **Free shipping** - If enabled by seller
3. **Shiprocket API** (future) - Calculate based on postal code and weight

For now, implement using the store's configured `shipping_charge` and `free_shipping` settings.

---

### Files to Modify

| File | Changes |
|------|---------|
| Database migration | Add structured address columns to `orders` table |
| `src/pages/Cart.tsx` | Redesign checkout form with new fields, enhanced order summary with images, two-column layout on desktop |
| `src/lib/cart.ts` | No changes needed |

---

### Technical Implementation Details

1. **Form State**: Add new state variables for email, address line 1, address line 2, city, state, postal code
2. **Country Field**: Auto-populated from the store's country (read-only display)
3. **Validation**: Require full name, email, phone, address line 1, city, state, postal code
4. **Order Summary**:
   - Display product thumbnails (48x48px)
   - Truncate long product names with ellipsis
   - Show quantity as "Qty: X"
   - Calculate and display shipping from store settings
5. **Database Insert**: Format `customer_address` as a combined string for backward compatibility while also saving individual fields

---

### Responsive Behavior

- **Mobile**: Single column, order summary above customer details form
- **Desktop**: Two columns side-by-side, customer details on left, order summary on right

