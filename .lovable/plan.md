

## Change Product Images to Vertical Format

### Current State
The product images were just changed to horizontal 4:3 aspect ratio, but vertical/portrait format was intended.

### Proposed Change
Switch to a vertical/portrait aspect ratio. Common vertical ratios are:
- **3:4** - Portrait format, taller than wide (inverse of 4:3)
- **4:5** - Instagram-style portrait, slightly taller
- **2:3** - Classic portrait photography ratio

I'll use **aspect-[3/4]** as it provides a nice vertical look that works well for product images, especially clothing and fashion items.

### Technical Changes

#### 1. ProductCard.tsx (Store Page)
Change the image container from horizontal to vertical:

```tsx
// Current (horizontal)
<div className="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-800 relative">

// Updated (vertical)
<div className="aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-800 relative">
```

#### 2. ProductDetailModal.tsx (Product Detail Page)
Update both the carousel images and the fallback placeholder:

```tsx
// Current (horizontal)
<div className="aspect-[4/3]">

// Updated (vertical)
<div className="aspect-[3/4]">
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ProductCard.tsx` | Change `aspect-[4/3]` to `aspect-[3/4]` |
| `src/components/ProductDetailModal.tsx` | Change `aspect-[4/3]` to `aspect-[3/4]` in carousel and fallback |

---

### Visual Comparison

```text
Current (Horizontal 4:3):      New (Vertical 3:4):
┌─────────────────┐            ┌───────────┐
│                 │            │           │
│    Product      │            │           │
│     Image       │            │  Product  │
│                 │            │   Image   │
└─────────────────┘            │           │
Product Name                   │           │
₹Price                         └───────────┘
                               Product Name
                               ₹Price
```

The vertical format is ideal for:
- Clothing and fashion items
- Portraits and lifestyle products
- Mobile-first shopping experiences
- Showcasing full product height

