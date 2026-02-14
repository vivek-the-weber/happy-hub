

## Custom Website for "storemy.happy2buy.in"

Build a completely unique, hand-crafted page for the `storemy` subdomain that replaces the standard store template with a full branded website experience.

### What You'll Get

Instead of the generic product grid, visitors to `storemy.happy2buy.in` will see a polished, scroll-based website with:

1. **Hero Section** -- Full-width banner with the store's name, tagline, and a "Shop Now" call-to-action that scrolls to products
2. **Product Showcase** -- A curated, visually rich product display (larger cards, featured layout) pulling real products from the database
3. **About Section** -- A brand story/mission section with text content (editable later)
4. **Testimonials** -- Customer review cards with quotes, names, and ratings
5. **Standard footer and WhatsApp contact** -- Reuses existing components

The cart, checkout, and order tracking flows remain unchanged.

---

### Technical Details

**New file: `src/pages/StoreMyPage.tsx`**
- A standalone page component with all four sections
- Fetches store and product data using existing `useStoreBySlug` and `useStoreProducts` hooks
- Dark theme (pure black) consistent with the project's aesthetic
- Scroll-triggered reveal animations matching the landing page style
- Includes the existing `StoreHeader`, `WhatsAppBar`, and `StoreFooter` components
- Testimonials will be hardcoded initially (can be made dynamic later)

**Modified file: `src/App.tsx`**
- Add a conditional check in the subdomain branch: if `subdomainSlug === 'storemy'`, render `StoreMyPage` instead of `StorePage`
- All other subdomains continue using the standard template

**No database changes required** -- the page reads from the existing `stores` and `products` tables using the same hooks.

### Page Structure

```text
+----------------------------------+
|  StoreHeader (black, sticky)     |
+----------------------------------+
|                                  |
|  HERO SECTION                    |
|  Store name + tagline            |
|  [Shop Now] button               |
|                                  |
+----------------------------------+
|                                  |
|  PRODUCT SHOWCASE                |
|  Featured products in a          |
|  larger, editorial layout        |
|                                  |
+----------------------------------+
|                                  |
|  ABOUT SECTION                   |
|  Brand story / mission text      |
|                                  |
+----------------------------------+
|                                  |
|  TESTIMONIALS                    |
|  3 customer review cards         |
|                                  |
+----------------------------------+
|  WhatsAppBar                     |
+----------------------------------+
|  StoreFooter                     |
+----------------------------------+
```

### Files Changed
- **Create**: `src/pages/StoreMyPage.tsx` (the full custom page)
- **Edit**: `src/App.tsx` (route the `storemy` subdomain to the new page)

