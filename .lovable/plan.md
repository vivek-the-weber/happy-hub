

## Update Headings with Line Breaks

### Overview
Add line breaks to the main headings on the landing page and seller view so each word appears on its own line.

---

### Changes Required

#### 1. Update Landing Page Heading (`src/pages/Index.tsx`)

**Current (line 24):**
```tsx
<h2 className="text-5xl md:text-6xl font-bold tracking-tight">happy shop'n</h2>
```

**Updated:**
```tsx
<h2 className="text-5xl md:text-6xl font-bold tracking-tight">happy<br />shop'n</h2>
```

---

#### 2. Update Seller View Heading (`src/components/landing/SellerView.tsx`)

**Current (line 9):**
```tsx
<h1 className="text-5xl md:text-6xl font-bold tracking-tight">Simple stores.</h1>
```

**Updated:**
```tsx
<h1 className="text-5xl md:text-6xl font-bold tracking-tight">Simple<br />stores.</h1>
```

---

### Result
- Landing page heading will display:
  ```
  happy
  shop'n
  ```
- Seller content heading will display:
  ```
  Simple
  stores.
  ```

