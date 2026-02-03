

## Replicate Dark Store Design

### Reference Design Analysis
Based on the uploaded image, the target design has these key characteristics:

1. **Dark Theme**: Pure black background (#000) for the entire store page
2. **Minimal Header**: Store name on left, cart icon with badge on right (no avatar)
3. **Collection Tabs**: Horizontal scrolling tabs (All, T-shirts, Shirts, etc.) for filtering products
4. **Clean Product Cards**:
   - Square images with rounded corners (no Card border/shadow)
   - Dark gray placeholder for products without images (says "COMING SOON")
   - Product name below image (white text)
   - Price in green below name
   - **No "Add to cart" button** visible on cards (tapping opens detail modal)
5. **Fixed Bottom Bar**: WhatsApp contact button
6. **Store Footer**: Store name with copyright year
7. **Theme Toggle**: Floating button in bottom-right corner

### Technical Changes

---

#### 1. Store Page Layout (`src/pages/StorePage.tsx`)

**Changes:**
- Add forced dark theme class to store pages
- Remove the current "Store Header" section with bio/badges
- Add horizontal collection tabs for filtering
- Add fixed bottom bar with WhatsApp button
- Add store-specific footer with store name
- Add floating theme toggle button

**New layout structure:**
```
┌─────────────────────────────────────┐
│ Store Name              🛒 (badge)  │  ← Minimal header
├─────────────────────────────────────┤
│ [All] [T-shirts] [Shirts] [...]     │  ← Scrollable collection tabs
├─────────────────────────────────────┤
│  ┌───────┐  ┌───────┐               │
│  │       │  │       │               │
│  │ Image │  │ Image │               │
│  │       │  │       │               │
│  └───────┘  └───────┘               │
│  Name       Name                    │
│  ₹Price     ₹Price                  │  ← Product grid
│                                     │
│  ┌───────┐  ┌───────┐               │
│  │       │  │       │               │
│  ... more products ...              │
├─────────────────────────────────────┤
│ © STORE NAME 2026                   │  ← Store footer
├─────────────────────────────────────┤
│   [📱 Contact on WhatsApp]          │  ← Fixed bottom bar
└─────────────────────────────────────┘
                               [☀️]    ← Theme toggle (floating)
```

---

#### 2. Store Header Update (`src/components/StoreHeader.tsx`)

**Changes:**
- Remove the avatar/logo circle
- Keep just the store name text and cart icon
- Apply dark theme styling (black background, white text)
- Remove `border-b` for cleaner look

---

#### 3. Product Card Redesign (`src/components/ProductCard.tsx`)

**Current:**
- Card with shadow/border
- "Add to cart" button visible
- "No image" text placeholder

**New Design:**
- No Card wrapper (just the content)
- Image with rounded corners directly
- Dark gray placeholder with "COMING SOON" text and icon
- Product name and price only (no button)
- Clicking anywhere opens detail modal

---

#### 4. New Component: Collection Tabs (`src/components/store/CollectionTabs.tsx`)

**Purpose:** Horizontal scrolling tabs to filter products by collection

**Features:**
- "All" tab always first (shows all products)
- Other tabs from visible collections
- Active tab has different styling
- Smooth horizontal scroll on mobile
- Filter products based on selected collection

---

#### 5. New Component: Store Footer (`src/components/store/StoreFooter.tsx`)

**Design:**
- Store name in uppercase with copyright year
- Muted gray text
- Centered alignment

---

#### 6. New Component: Fixed WhatsApp Bar (`src/components/store/WhatsAppBar.tsx`)

**Design:**
- Fixed to bottom of screen
- Black/dark background with padding
- Full-width button with WhatsApp icon
- Only shows if store has WhatsApp number configured

---

#### 7. Theme Toggle (Optional Enhancement)

Add a floating theme toggle button in the bottom-right corner to let customers switch between dark and light modes.

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/store/CollectionTabs.tsx` | Horizontal scrollable collection filter tabs |
| `src/components/store/StoreFooter.tsx` | Store-specific footer with copyright |
| `src/components/store/WhatsAppBar.tsx` | Fixed bottom WhatsApp contact button |
| `src/components/store/ThemeToggle.tsx` | Floating theme toggle button |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/StorePage.tsx` | Add dark theme, collection filtering, new layout |
| `src/components/StoreHeader.tsx` | Remove avatar, simplify to name + cart only |
| `src/components/ProductCard.tsx` | Remove Card wrapper, remove Add to Cart button, new placeholder |
| `src/index.css` | Add store-specific dark theme class |

---

### Implementation Details

#### Product Card New Design

```tsx
// Simplified structure (no Card wrapper)
<div className="cursor-pointer" onClick={onClick}>
  <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-800">
    {displayImage ? (
      <img ... />
    ) : (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500">
        <ImageIcon className="h-8 w-8 mb-2" />
        <span className="text-xs uppercase tracking-wider">Coming Soon</span>
      </div>
    )}
  </div>
  <h3 className="text-white text-sm mt-3 line-clamp-1">{product.name}</h3>
  <p className="text-primary font-medium">₹{price}</p>
</div>
```

#### Collection Tabs Design

```tsx
<div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
  <button 
    className={cn(
      "px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
      active ? "bg-white text-black" : "text-white/70 hover:text-white"
    )}
  >
    All
  </button>
  {collections.map(c => (
    <button key={c.id} ...>{c.name}</button>
  ))}
</div>
```

#### Store Page Dark Theme

The store pages will use a dedicated dark theme by applying specific classes:
- `bg-black` or `bg-neutral-950` for pure black background
- `text-white` for all text
- Override card/muted colors for dark appearance

---

### Summary

This redesign transforms the store pages to match the reference:
1. **Dark minimal aesthetic** with pure black backgrounds
2. **Cleaner product cards** without buttons (tap to view details)
3. **Collection-based filtering** with horizontal tabs
4. **Fixed WhatsApp bar** for easy contact
5. **Store-branded footer** with copyright
6. **Optional theme toggle** for user preference

The changes maintain existing functionality (cart, product details modal) while updating the visual design to match the reference.

