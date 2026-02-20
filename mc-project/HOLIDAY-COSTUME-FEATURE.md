# MC PROJECT — HOLIDAY COSTUME SYSTEM

**Feature:** Holiday Costume Button
**Added:** Feb 20, 2026 5:28 PM

---

## FEATURE DESCRIPTION

One-click holiday costume changes for the 3D character.

**User Flow:**
1. Click "Holiday" button
2. Select holiday from dropdown
3. Character instantly changes costume
4. Click "Reset" to return to default

---

## HOLIDAY CATALOG

| Holiday | Costume Elements | Priority |
|---------|------------------|----------|
| **New Year** | Party hat, confetti, champagne | P0 |
| **Birthday** | Cake hat, balloons, candles | P0 |
| **Lunar New Year** | Red outfit, lantern, dragon | P0 |
| **Christmas** | Santa hat, red/green outfit | P1 |
| **Halloween** | Pumpkin head, cape | P1 |
| **Valentine's** | Heart accessories, pink | P2 |

---

## IMPLEMENTATION OPTIONS

### Option A: Pre-made 3D Assets (Recommended)
- **Pros:** Fast, reliable, no AI dependency
- **Cons:** Fixed designs, storage space
- **Method:** Swap VRM accessories/textures

### Option B: AI-Generated Textures
- **Pros:** Unlimited variations, dynamic
- **Cons:** Requires AI service, slower
- **Method:** Generate texture → apply to 3D model

### Option C: Hybrid (Best)
- **Base:** Pre-made 3D accessories
- **Variations:** AI-generated textures
- **Fallback:** 2D overlay if 3D fails

---

## TECHNICAL SPEC

```javascript
// Holiday system API
GET /api/holidays — List available holidays
POST /api/character/costume — Apply costume
  Body: { holiday: "new-year", assetType: "3d" }

// Costume data structure
{
  id: "new-year-2026",
  name: "New Year",
  assets: {
    hat: "/assets/costumes/new-year-hat.vrm",
    texture: "/assets/costumes/new-year-tex.png",
    particles: "confetti"
  },
  duration: "2026-01-01 to 2026-01-02"
}
```

---

## UI DESIGN

```
[🎉 Holiday] ← Button
    ↓
┌─────────────────┐
│ 🎊 New Year     │
│ 🎂 Birthday     │
│ 🧧 Lunar New Year│
│ 🎄 Christmas    │
│ 🎃 Halloween    │
│ ❤️ Valentine's  │
│ ─────────────── │
│ ↩️ Reset        │
└─────────────────┘
```

---

## INTEGRATION

**Phase 1 (Current):**
- Add button to viewer.html
- 3 base costumes (New Year, Birthday, Lunar NY)
- Manual asset swap

**Phase 2 (Future):**
- AI texture generation
- More holidays
- Save favorite costumes

---

## ASSET REQUIREMENTS

Per costume:
- 1 hat/accessory (VRM/GLB)
- 1 texture (PNG/JPG)
- Optional: particle effect

**Total:** ~3-5MB per costume

---

**Status:** Added to MC Project backlog
**Priority:** P1 (after core features)
