

## Add Collections Tab to Product Section

### Overview

Add a "Collections" feature that allows sellers to group products together. The ProductManager component will have an internal tab switcher (Products | Collections) matching the reference design with pill-style buttons.

---

### What Are Collections?

Collections are groups of products (like "Summer Sale", "Best Sellers", "New Arrivals"). Each collection:
- Has a name and optional description
- Can contain multiple products
- Can display on the storefront to help customers browse

---

### Database Changes Required

**1. Collections Table**
```sql
CREATE TABLE public.collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**2. Product-Collection Junction Table**
```sql
CREATE TABLE public.product_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, collection_id)
);
```

**3. RLS Policies**
- Collections: Store owners can CRUD, public can read visible ones
- Product-Collections: Store owners can manage through their collections

---

### UI Changes

**ProductManager Component Redesign**

The component will include an internal tab switcher at the top:

```text
+--------------------------------------------------+
|  [Products]  Collections     [+ Add Product]     |
+--------------------------------------------------+
|                                                  |
|  Product list (existing UI)...                   |
|                                                  |
+--------------------------------------------------+
```

When "Collections" is active:

```text
+--------------------------------------------------+
|  Products  [Collections]     [+ Add Collection]  |
+--------------------------------------------------+
|                                                  |
|  Collection cards (name, product count, toggle)  |
|                                                  |
+--------------------------------------------------+
```

**Tab Styling (matching reference image)**
- Dark pill-style buttons with rounded corners
- Active state: solid dark background with white text
- Inactive state: transparent with muted text

---

### Files to Create/Modify

| File | Changes |
|------|---------|
| Database migration | Create `collections` and `product_collections` tables with RLS |
| `src/hooks/useStore.tsx` | Add Collection interface and CRUD hooks |
| `src/components/dashboard/ProductManager.tsx` | Add internal Products/Collections tab switcher |
| `src/components/dashboard/CollectionManager.tsx` | New component for collection CRUD with product assignment |

---

### Technical Details

**Collection Interface**
```typescript
interface Collection {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

**New Hooks**
- `useStoreCollections(storeId)` - Fetch collections for a store
- `useCreateCollection()` - Create new collection
- `useUpdateCollection()` - Update collection
- `useDeleteCollection()` - Delete collection
- `useCollectionProducts(collectionId)` - Get products in a collection
- `useUpdateCollectionProducts()` - Add/remove products from collection

**Internal Tab Switcher Design**
```tsx
<div className="inline-flex bg-white/5 rounded-full p-1 border border-white/10">
  <button 
    className={activeTab === 'products' 
      ? 'px-4 py-1.5 rounded-full bg-foreground text-background text-sm font-medium' 
      : 'px-4 py-1.5 rounded-full text-background/60 text-sm font-medium'
    }
    onClick={() => setActiveTab('products')}
  >
    Products
  </button>
  <button 
    className={activeTab === 'collections' 
      ? 'px-4 py-1.5 rounded-full bg-foreground text-background text-sm font-medium' 
      : 'px-4 py-1.5 rounded-full text-background/60 text-sm font-medium'
    }
    onClick={() => setActiveTab('collections')}
  >
    Collections
  </button>
</div>
```

**Collection Card Layout**
- Similar to product cards: horizontal layout with image, name, product count, visibility toggle
- Edit and delete buttons
- Click to open collection editor modal with product assignment

---

### Implementation Steps

1. Run database migration to create tables and RLS policies
2. Add Collection types and hooks to `useStore.tsx`
3. Create `CollectionManager.tsx` component
4. Update `ProductManager.tsx` to include internal tab switcher
5. Conditionally render Products list or Collections list based on active tab

