

## Redesign Shipping Settings Page

Based on the reference image, the shipping settings page needs a cleaner, more consolidated design with:
1. A **Shiprocket Automation toggle** at the top as a simple card
2. A **"MANUAL SHIPPING SETTINGS"** section header with a green indicator dot
3. Consolidated fields (Estimated Delivery, Shipping Charge, Free Shipping toggle)
4. A sticky **green "Save Shipping Settings" button** at the bottom
5. Removal of the "Learn Shipping" videos section for a cleaner look

---

### Design Changes

#### 1. New Layout Structure

| Current | New |
|---------|-----|
| Separate "Shipping Settings" card | Unified page with header and sections |
| Separate "Shiprocket Integration" card with email/password form | Simple toggle at top (opens modal for connection) |
| "Learn Shipping" videos section | Removed for cleaner design |
| Save button inside form | Full-width sticky green button at bottom |

#### 2. Visual Elements

- **Page header**: "Shipping" title with truck icon and options menu
- **Shiprocket toggle card**: Simple toggle with "Automate shipping with Shiprocket" subtitle
- **Section divider**: Green dot + "MANUAL SHIPPING SETTINGS" label
- **Form fields**: Same inputs but without card wrapper
- **Free Shipping**: Toggle card style (matches reference)
- **Save button**: Full-width, bright green, sticky at bottom on mobile

---

### Implementation Details

**File to modify:** `src/components/dashboard/ShippingSettings.tsx`

1. **Remove** the "Learn Shipping" videos section entirely
2. **Simplify** Shiprocket integration to a toggle:
   - When OFF: Show simple toggle card
   - When turned ON: Open a modal/expandable section for credentials
   - When connected: Show toggle as ON with connected state
3. **Add section header**: Green dot + "MANUAL SHIPPING SETTINGS" uppercase label
4. **Restructure form**: Remove card wrapper, use cleaner spacing
5. **Move save button**: Full-width, sticky green button at page bottom
6. **Update button styling**: Use bright green (`bg-green-500`) for primary action

---

### Component Structure (Simplified)

```text
ShippingSettings
├── Header Row (title + menu icon)
├── Shiprocket Toggle Card
│   ├── "Shiprocket Automation" label
│   ├── "Automate shipping with Shiprocket" subtitle
│   └── Switch (triggers connection modal when turned on)
├── Section Header ("• MANUAL SHIPPING SETTINGS")
├── Manual Settings Form
│   ├── Estimated Delivery input
│   ├── Shipping Charge input with currency symbol
│   └── Free Shipping toggle card
└── Sticky Save Button (full-width, green)
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/ShippingSettings.tsx` | Complete redesign: remove videos section, add Shiprocket toggle, add section header, restructure form, add sticky green save button |

