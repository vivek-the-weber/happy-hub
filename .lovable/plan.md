

## Change Product Images to Horizontal Format

### Current State
Both the store page product cards and product detail modal use square images (`aspect-square` = 1:1 ratio).

### Proposed Change
Switch to a horizontal/landscape aspect ratio for product images. The most common horizontal ratios are:
- **4:3** - Traditional photo format, slightly wider than square
- **16:9** - Widescreen format, very wide
- **3:2** - Photography standard, good balance

I'll use **aspect-[4/3]** as it provides a nice horizontal look without being too wide, which works well for product images.

### Technical Changes

#### 1. ProductCard.tsx (Store Page)
Change the image container from square to horizontal:

```tsx
// Current
<div className="aspect-square rounded-2xl overflow-hidden bg-neutral-800 relative">

// Updated
<div className="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-800 relative">
```

#### 2. ProductDetailModal.tsx (Product Detail Page)
Update both the carousel images and the fallback placeholder:

```tsx
// Current (carousel items)
<div className="aspect-square">

// Updated
<div className="aspect-[4/3]">
```

```tsx
// Current (no image fallback)
<div className="aspect-square bg-neutral-100 flex items-center justify-center text-neutral-400">

// Updated
<div className="aspect-[4/3] bg-neutral-100 flex items-center justify-center text-neutral-400">
```

#### 3. StorePage.tsx Grid Adjustment (Optional)
The current grid uses 2 columns on mobile. With horizontal images, this still works well but we may want to consider single column on very small screens. For now, the 2-column layout will work fine with horizontal images.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ProductCard.tsx` | Change `aspect-square` to `aspect-[4/3]` |
| `src/components/ProductDetailModal.tsx` | Change `aspect-square` to `aspect-[4/3]` in carousel and fallback |

---

### Visual Comparison

```text
Current (Square 1:1):          New (Horizontal 4:3):
┌─────────────┐                ┌─────────────────┐
│             │                │                 │
│             │                │                 │
│   Product   │                │    Product      │
│    Image    │                │     Image       │
│             │                │                 │
│             │                └─────────────────┘
└─────────────┘                Product Name
Product Name                   ₹Price
₹Price
```

The horizontal format gives products a more cinematic, premium look and works especially well for clothing, accessories, and lifestyle products.

