# Mission Control UI Components Library

**Version:** 1.0.0  
**Author:** Forge-2 (UI Components Specialist)  
**Date:** 2026-02-17  
**Deadline:** Feb 18 NOON (ACCELERATED) ✅ COMPLETED

---

## 📦 Components Overview

This library provides three core UI component sets for the Mission Control Dashboard:

1. **Sidebar Navigation** - Collapsible menu with agent categories and quick actions
2. **Dashboard Layout** - Responsive grid system with breakpoints
3. **Interactive Elements** - Hover effects, click handlers, and loading states

---

## 🎨 Visual Reference

**Design Style:** Kairosoft Games + Linear.app fusion
- Dark theme with cyan/purple accents
- Pixel-art inspired icons
- Clean, organized layout
- Cyberpunk aesthetic

---

## 📁 Files

| File | Description | Size |
|------|-------------|------|
| `ui-components.html` | Full demo page with all components | 61KB |
| `ui-components.css` | Standalone CSS library | 28KB |
| `ui-components.js` | JavaScript module for interactivity | 13KB |

---

## 🚀 Quick Start

### Option 1: Full HTML Demo
```bash
# Open the demo page
open /root/.openclaw/workspace/mission-control/dashboard/ui-components.html
```

### Option 2: Integrate into Existing Dashboard
```html
<!-- Add CSS -->
<link rel="stylesheet" href="ui-components.css">

<!-- Add HTML structure -->
<aside class="mc-sidebar" id="mc-sidebar">
  <!-- Sidebar content -->
</aside>

<main class="mc-main-content">
  <!-- Dashboard content -->
</main>

<!-- Add JavaScript -->
<script src="ui-components.js"></script>
```

---

## 📋 Component Details

### 1. Sidebar Navigation (`mc-sidebar`)

#### Features:
- ✅ Collapsible (260px → 72px)
- ✅ Agent categories (expandable)
- ✅ Quick action buttons
- ✅ Mobile responsive (drawer on mobile)
- ✅ State persistence (localStorage)
- ✅ Smooth animations

#### Usage:
```html
<aside class="mc-sidebar" id="mc-sidebar">
  <div class="mc-sidebar-toggle" id="mc-sidebar-toggle">◀</div>
  
  <div class="mc-sidebar-header">
    <div class="mc-sidebar-logo">◈</div>
    <div class="mc-sidebar-brand">
      <h1>Mission Control</h1>
      <span>v2.1.0</span>
    </div>
  </div>
  
  <nav class="mc-sidebar-nav">
    <!-- Navigation items -->
  </nav>
  
  <div class="mc-quick-actions">
    <button class="mc-quick-action-btn primary">New Task</button>
  </div>
</aside>
```

#### Agent Categories:
- **Command** (Nexus)
- **Content** (Forge, Quill, Pixel)
- **Research** (Scout, Glasses)
- **Social** (Buzz, Larry, Gary)
- **System** (Sentry, Audit, Cipher)

---

### 2. Dashboard Layout (`mc-grid`)

#### Features:
- ✅ 12-column grid system
- ✅ Responsive breakpoints (xl, lg, md, sm)
- ✅ Row/column spans
- ✅ Gap utilities
- ✅ Card components
- ✅ Stats cards with hover effects

#### Grid Classes:
```css
.mc-grid-cols-1 to .mc-grid-cols-12
.mc-col-span-1 to .mc-col-span-12
.mc-row-span-2, .mc-row-span-3
```

#### Responsive Breakpoints:
```css
/* Extra Large (≤1400px) */
.mc-xl-grid-cols-4, .mc-xl-col-span-6

/* Large (≤1200px) */
.mc-lg-grid-cols-3, .mc-lg-col-span-12

/* Medium (≤992px) */
.mc-md-grid-cols-2, .mc-md-col-span-12

/* Small (≤768px) */
.mc-sm-grid-cols-1, .mc-sm-col-span-12
```

#### Usage:
```html
<div class="mc-grid mc-grid-cols-12 lg:mc-grid-cols-1">
  <div class="mc-col-span-8 lg:mc-col-span-12">
    <!-- Main content -->
  </div>
  <div class="mc-col-span-4 lg:mc-col-span-12">
    <!-- Sidebar content -->
  </div>
</div>
```

---

### 3. Interactive Elements

#### Buttons (`mc-btn`)

**Variants:**
- `.mc-btn-primary` - Cyan/purple gradient
- `.mc-btn-secondary` - Elevated style
- `.mc-btn-ghost` - Transparent
- `.mc-btn-danger` - Red accent

**Sizes:**
- `.mc-btn-sm` - Small
- `.mc-btn-lg` - Large
- `.mc-btn-icon` - Icon only (36x36)

**States:**
- `.mc-btn-loading` - Loading spinner
- `.mc-btn-ripple` - Ripple effect
- `:disabled` - Disabled state

#### Usage:
```html
<button class="mc-btn mc-btn-primary mc-btn-ripple">Click Me</button>
<button class="mc-btn mc-btn-primary mc-btn-loading">Loading...</button>
<button class="mc-btn mc-btn-secondary mc-btn-icon mc-tooltip" data-tooltip="Settings">⚙</button>
```

#### Loading States

**Skeleton Loading:**
```html
<div class="mc-skeleton mc-skeleton-text"></div>
<div class="mc-skeleton mc-skeleton-card"></div>
<div class="mc-skeleton mc-skeleton-avatar"></div>
```

**Button Loading (JS):**
```javascript
// Auto-loading on click (data attribute)
<button class="mc-btn mc-btn-primary" data-loading="2000">Save</button>

// Manual control
mcUI.setButtonLoading(btn, true);  // Start loading
mcUI.setButtonLoading(btn, false); // Stop loading
```

#### Progress Bars
```html
<div class="mc-progress">
  <div class="mc-progress-bar" style="width: 75%;"></div>
</div>
```

**Update via JS:**
```javascript
mcUI.updateProgress('#progress-container', 85);
```

#### Toggle Switches
```html
<label class="mc-toggle">
  <input type="checkbox" checked>
  <span class="mc-toggle-switch"></span>
  <span>Enable Feature</span>
</label>
```

#### Dropdowns
```html
<div class="mc-dropdown" id="user-dropdown">
  <button onclick="mcUI.toggleDropdown(document.getElementById('user-dropdown'))">
    Menu ▼
  </button>
  <div class="mc-dropdown-menu">
    <div class="mc-dropdown-item">Option 1</div>
    <div class="mc-dropdown-divider"></div>
    <div class="mc-dropdown-item">Option 2</div>
  </div>
</div>
```

---

## 🎨 CSS Variables

All colors and measurements are customizable via CSS variables:

```css
:root {
  /* Backgrounds */
  --mc-bg-primary: #0a0a0f;
  --mc-bg-secondary: #111118;
  --mc-bg-card: #15151d;
  
  /* Accents */
  --mc-accent-cyan: #00d4ff;
  --mc-accent-purple: #a855f7;
  
  /* Text */
  --mc-text-primary: #fafafa;
  --mc-text-secondary: #a1a1aa;
  
  /* Layout */
  --sidebar-width: 260px;
  --sidebar-collapsed: 72px;
}
```

---

## 🔧 JavaScript API

### Initialize
```javascript
const ui = new MissionControlUI({
  sidebarSelector: '#mc-sidebar',
  toggleSelector: '#mc-sidebar-toggle',
  storageKey: 'mc-sidebar-collapsed'
});
```

### Methods

| Method | Description |
|--------|-------------|
| `toggleSidebar()` | Toggle sidebar collapsed state |
| `toggleCategory(id, expand)` | Expand/collapse agent category |
| `setButtonLoading(btn, isLoading)` | Set button loading state |
| `updateProgress(selector, percentage)` | Update progress bar |
| `showSkeleton(selector, type)` | Show skeleton loading |
| `hideSkeleton(selector)` | Hide skeleton loading |
| `animateNumber(element, target, duration)` | Animate number counter |
| `addActivity(container, activity)` | Add activity to feed |

### Events

```javascript
// Listen for sidebar toggle
mcUI.on('sidebarToggle', (data) => {
  console.log('Sidebar collapsed:', data.collapsed);
});

// Listen for category expand
mcUI.on('categoryToggle', (data) => {
  console.log('Category:', data.category, 'Expanded:', data.expanded);
});
```

---

## 📱 Responsive Behavior

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Desktop | >1200px | Full sidebar, 4-col stats |
| Large | ≤1200px | Full sidebar, 2-col stats |
| Medium | ≤992px | Hidden sidebar (drawer), 2-col stats |
| Small | ≤768px | Mobile drawer, 1-col stats |

---

## ✅ Task Completion Checklist

### 1. Sidebar Navigation ✅
- [x] Collapsible menu (260px → 72px)
- [x] Agent categories (5 categories)
- [x] Quick actions section
- [x] Mobile responsive drawer
- [x] State persistence
- [x] Smooth animations

### 2. Dashboard Layout ✅
- [x] 12-column grid system
- [x] Responsive breakpoints (xl, lg, md, sm)
- [x] Row/column span utilities
- [x] Card components
- [x] Stats cards with hover effects
- [x] Mobile adaptation

### 3. Interactive Elements ✅
- [x] Hover effects (cards, buttons)
- [x] Click handlers (ripple, loading)
- [x] Loading states (skeleton, spinner)
- [x] Toggle switches
- [x] Dropdown menus
- [x] Progress bars
- [x] Tooltips

---

## 🔄 Integration with Main Dashboard

To integrate these components into the main Mission Control dashboard:

1. **Copy files** to dashboard directory (done)
2. **Link CSS** in `index.html` head
3. **Add sidebar HTML** before main content
4. **Add JavaScript** at end of body
5. **Update grid classes** on existing content

See `ui-components.html` for complete integration example.

---

## 📊 Performance

- **CSS Size:** 28KB (unminified)
- **JS Size:** 13KB (unminified)
- **No external dependencies**
- **CSS-only animations** where possible
- **Hardware-accelerated transforms**

---

## 📝 Notes

- All components use the `mc-` prefix to avoid conflicts
- Components are fully accessible (keyboard navigation)
- Mobile-first responsive design
- Dark theme only (consistent with Mission Control aesthetic)

---

**Status:** ✅ COMPLETE  
**Next Steps:** Integration with main dashboard by Forge (primary)
