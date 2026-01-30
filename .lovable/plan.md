

## Redesign Passcode Gate as "Coming Soon" Page

### Overview

Transform the current passcode gate into a polished "Coming Soon" page that conveys the app is under development, with a subtle developer access option at the bottom.

---

### Design Changes

#### Current vs New Layout

| Current | New |
|---------|-----|
| Simple "happy2buy" logo | "happy2buy" logo with tagline |
| "Enter access code" label | "Coming Soon" headline + teaser text |
| Form prominently displayed | Developer access section at bottom |

#### Visual Hierarchy

1. **Logo** - "happy2buy" branding at top
2. **Coming Soon** - Large headline text
3. **Teaser Copy** - Brief description of what's coming
4. **Developer Access** - Subtle section at bottom for passcode entry

---

### New Layout Structure

```text
PasscodeGate (Coming Soon View)
├── Logo Section
│   └── "happy2buy" (branded text)
├── Main Content
│   ├── "Coming Soon" (large headline)
│   └── Teaser text ("We're building something amazing...")
├── Spacer
└── Developer Access Section
    ├── "Enter developer's passcode" label (muted)
    ├── Password input field
    └── "Enter" button
```

---

### Copy Updates

- **Headline**: "Coming Soon"
- **Teaser**: "We're building something amazing. Stay tuned!"
- **Developer label**: "Enter developer's passcode"
- **Placeholder**: "Paste developer passcode"
- **Error message**: "Invalid passcode" (instead of "Invalid access code")

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/PasscodeGate.tsx` | Redesign layout: add "Coming Soon" headline, teaser text, move passcode form to bottom as "developer access" section |

---

### Technical Notes

- No logic changes needed - only UI/copy updates
- Same localStorage caching mechanism
- Same passcode validation
- Developer access section uses smaller, muted styling to be less prominent

