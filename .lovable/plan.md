

## Redesign Product Detail Modal

### Reference Design Analysis

Based on the uploaded image, the product detail page should have:

1. **Full-screen dark page** (not a centered dialog modal)
2. **Header with navigation**: Back arrow (left), Cart icon with badge (right)
3. **Large product image**: White/light background with rounded corners
4. **Product name**: Large white text, bold
5. **Price**: Green primary color below name
6. **Collapsible description section**: "Description" label with chevron, expands to show text
7. **Add to cart button**: Full-width, green/primary, rounded, fixed at bottom with plus icon

### Current vs. Target Design

| Aspect | Current | Target |
|--------|---------|--------|
| Layout | Centered Dialog popup | Full-screen overlay page |
| Background | Default card background | Pure black (#000) |
| Header | None (just dialog close) | Back arrow + Cart icon |
| Image | Carousel in modal | Large image with white bg, rounded corners |
| Description | Plain text always visible | Collapsible accordion section |
| Button | In flow, default style | Fixed at bottom, full green, rounded-full |

### Technical Implementation

---

#### Convert from Dialog to Full-Screen Overlay

Instead of using the `Dialog` component, we'll create a full-screen overlay that slides in, similar to the reference design. This provides a more app-like experience.

**New structure:**
```
┌─────────────────────────────────────┐
│ ← (back)                    🛒 (1)  │  ← Header
├─────────────────────────────────────┤
│                                     │
│   ┌───────────────────────────┐     │
│   │                           │     │
│   │     Product Image         │     │  ← White bg, rounded
│   │     (with carousel)       │     │
│   │                           │     │
│   └───────────────────────────┘     │
│                                     │
│   Product Name                      │  ← Large, white, bold
│   ₹Price                            │  ← Green primary
│   ─────────────────────────────     │  ← Separator
│   Description                    ▼  │  ← Collapsible trigger
│   Description text...               │  ← Collapsible content
│                                     │
├─────────────────────────────────────┤
│   [+ Add to cart]                   │  ← Fixed bottom button
└─────────────────────────────────────┘
```

---

#### Component Changes

**1. Convert to full-screen overlay:**
- Remove `Dialog`, `DialogContent`, `DialogHeader` components
- Use a fixed full-screen div with `inset-0` positioning
- Add animation for slide-up entrance

**2. Add custom header:**
- Back arrow button (ArrowLeft icon) that calls `onOpenChange(false)`
- Cart icon with badge (same as StoreHeader)
- Black background, sticky positioning

**3. Redesign image section:**
- White/light gray background on the image container
- Larger rounded corners (`rounded-2xl`)
- Keep carousel functionality for multiple images
- Swipe indicator dots instead of arrow buttons on mobile

**4. Add collapsible description:**
- Use `Collapsible` component from Radix UI
- "Description" label with ChevronDown icon
- Smooth expand/collapse animation
- Separator line above description section

**5. Redesign Add to Cart button:**
- Fixed at bottom of screen
- Full-width with padding
- Green primary color
- Fully rounded (`rounded-full`)
- Plus icon with text
- Safe area padding for mobile

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ProductDetailModal.tsx` | Complete redesign to full-screen overlay with new layout |

---

### Code Structure

```tsx
// New ProductDetailModal structure
export function ProductDetailModal({ ... }) {
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  
  if (!open || !product) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black flex items-center justify-between px-4 h-14">
        <button onClick={() => onOpenChange(false)}>
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <Link to="/cart" className="relative">
          <ShoppingBag className="h-5 w-5 text-white" />
          {/* Badge */}
        </Link>
      </header>
      
      {/* Scrollable content */}
      <div className="overflow-y-auto pb-24">
        {/* Image with white bg */}
        <div className="px-4 pt-4">
          <div className="bg-white rounded-2xl overflow-hidden">
            <Carousel>...</Carousel>
          </div>
        </div>
        
        {/* Product info */}
        <div className="px-4 pt-6 space-y-4">
          <h1 className="text-2xl font-bold text-white">{product.name}</h1>
          <p className="text-xl font-semibold text-primary">{formatPrice(...)}</p>
          
          <Separator className="bg-neutral-800" />
          
          {/* Collapsible description */}
          <Collapsible open={descriptionOpen} onOpenChange={setDescriptionOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <span className="text-white">Description</span>
              <ChevronDown className={cn("transition-transform", descriptionOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="text-neutral-400 pt-3">{product.description}</p>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
      
      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black">
        <Button onClick={handleAddToCart} className="w-full rounded-full" size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Add to cart
        </Button>
      </div>
    </div>
  );
}
```

---

### Visual Details

- **Background**: Pure black (`bg-black`)
- **Image container**: White background (`bg-white`), large rounded corners (`rounded-2xl`)
- **Product name**: `text-2xl font-bold text-white`
- **Price**: `text-xl font-semibold text-primary` (green)
- **Description trigger**: White text with chevron icon
- **Description content**: `text-neutral-400` for muted appearance
- **Separator**: `bg-neutral-800` for subtle dark line
- **Button**: Primary green, `rounded-full`, fixed at bottom with safe padding

---

### Animation

Add smooth entrance/exit animations:
- Slide up from bottom on open
- Fade out on close
- Use CSS transitions or animate classes

---

### Summary

This redesign transforms the product detail from a standard dialog modal into a full-screen immersive view that:
1. Matches the dark store aesthetic
2. Provides better mobile UX with full-screen layout
3. Uses collapsible description to save space
4. Has a prominent fixed "Add to cart" button
5. Includes proper navigation with back arrow and cart access

