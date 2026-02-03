
## Redesign Notifications to Match Reference Design

### Current State
The app uses two toast notification systems:
1. **Sonner** - Used throughout the dashboard for success/error messages
2. **shadcn/ui Toaster** - Used in checkout and public-facing pages

Both currently use a rectangular card-style design positioned at the corner of the screen.

### Reference Design Analysis
The uploaded images show a modern, minimal toast notification with:
- Centered, floating pill shape at bottom of screen
- Dark background with subtle border
- Green checkmark icon for success states
- Compact single-line text
- No visible close button (auto-dismiss)
- Smooth, non-intrusive appearance

### Proposed Design

```text
Current Toast:                    New Toast:
┌─────────────────────────┐       
│ Title                 X │            ┌──────────────────────┐
│ Description             │            │  ✓  Link copied      │
└─────────────────────────┘            └──────────────────────┘
(Corner positioned)                    (Bottom center, pill shape)
```

### Technical Implementation

#### 1. Sonner Component Redesign
Update `src/components/ui/sonner.tsx` to style toasts with:
- Bottom center positioning
- Pill shape with `rounded-full`
- Dark background (`bg-neutral-900`)
- Custom success icon styling (green checkmark)
- Compact padding
- No border or subtle `border-white/10`

#### 2. shadcn/ui Toast Redesign
Update `src/components/ui/toast.tsx` to match:
- Center-aligned viewport at bottom
- Rounded pill styling
- Matching dark theme colors
- Hide close button by default

#### 3. Toaster Component Update
Update `src/components/ui/toaster.tsx` layout for centered positioning

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ui/sonner.tsx` | Restyle with pill shape, center position, dark theme, custom icons |
| `src/components/ui/toast.tsx` | Update viewport centering and toast styling to pill shape |
| `src/components/ui/toaster.tsx` | Adjust layout for centered display |

---

### Styling Details

**Sonner Configuration:**
- Position: `bottom-center`
- Toast classes: `rounded-full bg-neutral-900 border-white/10 px-4 py-3`
- Success icon: Green checkmark with `text-green-500`
- Duration: Auto-dismiss (default 4s)

**Toast Viewport:**
- `fixed bottom-0 left-0 right-0 flex justify-center p-4`
- Remove side positioning (`sm:right-0`)

**Toast Component:**
- `rounded-full` instead of `rounded-md`
- Compact padding: `px-4 py-3`
- Remove close button or make it hidden
- Dark theme: `bg-neutral-900 text-white border-white/10`

