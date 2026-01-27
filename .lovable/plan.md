

## Fix Landing Page and Seller View Headings

### Overview
Update the heading text to show the correct content without duplicate words.

---

### Changes Required

#### 1. Update Landing Page Heading (`src/pages/Index.tsx`)

**Current (lines 25-27):**
```tsx
<h2 className="text-5xl md:text-6xl font-bold tracking-tight">happy
shopin<br />stores.
</h2>
```

**Updated:**
```tsx
<h2 className="text-5xl md:text-6xl font-bold tracking-tight">happy shopin</h2>
```

---

#### 2. Update Seller View Heading (`src/components/landing/SellerView.tsx`)

**Current (lines 9-11):**
```tsx
<h1 className="text-5xl md:text-6xl font-bold tracking-tight">Simple
stores.<br />stores.
</h1>
```

**Updated:**
```tsx
<h1 className="text-5xl md:text-6xl font-bold tracking-tight">Simple stores.</h1>
```

---

### Result
- Landing page will display: **"happy shopin"**
- Seller content will display: **"Simple stores."**

