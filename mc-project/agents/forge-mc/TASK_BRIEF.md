# FORGE-MC — TASK BRIEF
**Agent:** Forge-MC (Frontend Engineer)  
**Assigned by:** Meemo (PM)  
**Date:** February 20, 2026 23:48 GMT+8

---

## 🎯 YOUR MISSION
Build the UI that makes MC Project addictive. Smooth interactions, viral sharing, and GenZ-friendly design.

---

## 📋 ACTIVE TASKS

### 🔴 HIGH PRIORITY

#### TASK: FORGE-001 — Confession Submission Form
- **Description:** UI for posting anonymous confessions
- **Features:**
  - Text input (500 char limit with counter)
  - Category selector (5 options with icons)
  - Anonymous toggle
  - Submit button with loading state
  - Success/error feedback
- **Design:** Modal or inline form
- **ETA:** 2 hours
- **Deliverable:** `ConfessionForm.jsx` component

#### TASK: FORGE-002 — Confession Feed UI
- **Description:** Scrollable feed of confessions
- **Features:**
  - Infinite scroll pagination
  - Category filter tabs
  - Sort options (newest, most liked, trending)
  - Like button with animation
  - Report button
  - Timestamp display
- **ETA:** 2 hours
- **Deliverable:** `ConfessionFeed.jsx` component

#### TASK: FORGE-003 — Social Sharing Integration
- **Description:** Share progress to social media
- **Platforms:**
  - Twitter/X (Web Intent)
  - Instagram Stories (share image)
  - Copy to clipboard
- **Features:**
  - Pre-filled message with hashtags
  - Generated image cards
  - Tracking params for analytics
- **ETA:** 1.5 hours
- **Deliverable:** `SocialShare.jsx` component

### 🟡 MEDIUM PRIORITY

#### TASK: FORGE-004 — Winner Notification Popup
- **Description:** Modal when user wins daily lottery
- **Features:**
  - Celebration animation
  - Prize display
  - Share button
  - Confetti effect
- **ETA:** 1 hour
- **Deliverable:** `WinnerModal.jsx` component

---

## 📁 WORKSPACE
```
/mc-project/agents/forge-mc/
├── components/
│   ├── ConfessionForm.jsx
│   ├── ConfessionFeed.jsx
│   ├── ConfessionCard.jsx
│   ├── SocialShare.jsx
│   └── WinnerModal.jsx
├── hooks/            # Custom React hooks
├── styles/           # CSS modules
└── tests/            # Component tests
```

---

## 🎨 UI SPECIFICATIONS

### Design System
- **Framework:** React (existing)
- **Styling:** CSS-in-JS or Tailwind
- **Animations:** Framer Motion or CSS transitions
- **Icons:** Lucide or custom SVG

### Responsive Breakpoints
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

### Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast WCAG 2.1 AA

---

## 🔌 API INTEGRATION

### Endpoints to Use
```javascript
// Confessions
POST   /api/confessions
GET    /api/confessions?page=1&category=money&sort=likes
POST   /api/confessions/:id/like
DELETE /api/confessions/:id/like

// Streaks
GET    /api/streaks/current
POST   /api/streaks/claim

// Quiz
GET    /api/quiz/daily
POST   /api/quiz/answer
```

---

## ✅ COMPLETION CHECKLIST

- [ ] FORGE-001: Confession form with validation
- [ ] FORGE-002: Feed with infinite scroll
- [ ] FORGE-003: Social sharing (Twitter, Instagram)
- [ ] FORGE-004: Winner notification modal
- [ ] Mobile responsive
- [ ] Loading states
- [ ] Error handling

---

## 📊 QUALITY TARGET
**Score:** 95/100

| Criteria | Weight |
|----------|--------|
| UI/UX quality | 35% |
| Code organization | 25% |
| Performance | 20% |
| Accessibility | 20% |

---

## 🚀 NEXT STEPS
1. Start with FORGE-001 (confession form) — needed for launch
2. FORGE-002 (feed) — core engagement feature
3. FORGE-003 (social sharing) — viral growth
4. FORGE-004 (winner modal) — retention

**Questions?** Ping Meemo immediately.

---

*Forge-MC — Forging the frontend experience* ⚒️
