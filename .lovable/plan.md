

## Update Collection Section Design to Match Product Section

### Overview

Align the Collections section styling with the Products section and update the "Add" buttons to match the reference design with a green outline style instead of solid background.

---

### Current Issues

| Issue | Current State | Target State |
|-------|---------------|--------------|
| Button Style | Solid primary background (green fill) | Green outline with green text |
| CollectionManager header | Shows "Collections" title + count | Remove - tab switcher already indicates section |
| Button placement | Both tabs have buttons, but styles differ | Consistent outline button style on both tabs |

---

### Reference Design Analysis

The uploaded image shows:
- Tab switcher: `[Products]` `Collections` with dark pill styling
- Add button: Green outline/border with green text and `+` icon
- No background fill on the button

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/ProductManager.tsx` | Update "Add Product" button to use outline variant with green styling |
| `src/components/dashboard/CollectionManager.tsx` | Remove the header section (title + count), keep only the dialog and list. The "Add Collection" button will be moved to ProductManager |

---

### Technical Implementation

**1. Add Product Button (ProductManager.tsx)**

Current:
```tsx
<Button onClick={() => openDialog()} className="rounded-xl">
  <Plus className="h-4 w-4 mr-2" />
  Add Product
</Button>
```

Updated:
```tsx
<Button 
  onClick={() => openDialog()} 
  variant="outline"
  className="rounded-xl border-primary text-primary hover:bg-primary/10"
>
  <Plus className="h-4 w-4 mr-2" />
  Add Product
</Button>
```

**2. Add Collection Button in ProductManager.tsx**

When Collections tab is active, show "Add Collection" button in the same position:
```tsx
<Button 
  onClick={handleOpenCollectionDialog} 
  variant="outline"
  className="rounded-xl border-primary text-primary hover:bg-primary/10"
>
  <Plus className="h-4 w-4 mr-2" />
  Add Collection
</Button>
```

**3. CollectionManager Changes**

- Remove the header section with title "Collections" and count
- Export a function to open the dialog from parent component OR accept an `onAddClick` prop
- The component will now only render the list and dialog, controlled externally for the "Add" action

---

### Layout Structure After Changes

**Products Tab:**
```text
+--------------------------------------------------+
|  [Products]  Collections     [+ Add Product]     |  <- Green outline button
+--------------------------------------------------+
|  Product cards...                                |
+--------------------------------------------------+
```

**Collections Tab:**
```text
+--------------------------------------------------+
|  Products  [Collections]     [+ Add Collection]  |  <- Green outline button
+--------------------------------------------------+
|  Collection cards...                             |
+--------------------------------------------------+
```

---

### Button Styling Details

The button will use:
- `variant="outline"` - Base outline style from shadcn
- `border-primary` - Green border color
- `text-primary` - Green text color
- `hover:bg-primary/10` - Subtle green background on hover
- `rounded-xl` - Rounded corners to match design system

