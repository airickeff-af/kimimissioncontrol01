# Holiday Costume System - Technical Specification

## Overview
A comprehensive costume system for Pixel Office agents with holiday-themed outfits, accessories, and visual effects.

**Status:** Ready for Phase 1 Implementation  
**Priority:** P1 (Part of TASK-P1-010)  
**Decision:** Option C - Both 3D base assets + AI texture variations

---

## Architecture Decision: Option C (Hybrid)

### Why Option C?
1. **Performance**: Pre-made 3D base assets load instantly
2. **Variety**: AI generates unique variations per holiday
3. **Scalability**: Easy to add new holidays without asset creation
4. **Fallback**: 3D assets work offline, AI enhances when available

### Implementation Stack
```
Base Assets (3D/2D Pixel)
├── Core costume geometry (pixel sprites)
├── Accessory attachments (hats, glasses, etc.)
└── Color palette definitions per holiday

AI Enhancement Layer
├── Texture generation API (Stable Diffusion/Replicate)
├── Prompt templates per holiday
└── Cache layer for generated textures
```

---

## Holiday Database

### Supported Holidays (v1.0)

| Holiday | Date | Theme | Costume Elements |
|---------|------|-------|------------------|
| **New Year** | Jan 1 | Celebration | Party hats, confetti, champagne glasses |
| **Lunar New Year** | Variable | Red/Gold | Dragon hats, lanterns, red envelopes |
| **Valentine's Day** | Feb 14 | Love | Heart accessories, pink/red outfits, roses |
| **St. Patrick's Day** | Mar 17 | Irish | Green outfits, shamrocks, leprechaun hats |
| **Easter** | Variable | Spring | Bunny ears, pastel colors, egg accessories |
| **Birthday** | User-defined | Celebration | Cake hats, balloons, party streamers |
| **Halloween** | Oct 31 | Spooky | Costumes (pumpkin, ghost, witch), candy |
| **Thanksgiving** | Nov 4th Thu | Harvest | Pilgrim hats, turkey accessories, autumn colors |
| **Christmas** | Dec 25 | Winter | Santa hats, reindeer antlers, snow effects |
| **Hanukkah** | Variable | Festival | Blue/silver colors, menorah, dreidel |
| **Diwali** | Variable | Lights | Diyas, colorful outfits, rangoli patterns |
| **Pride Month** | June | Rainbow | Rainbow accessories, flags, colorful outfits |

### Costume Components

```javascript
const COSTUME_COMPONENTS = {
  head: ['hat', 'glasses', 'mask', 'ears', 'antlers', 'headband'],
  body: ['shirt', 'dress', 'robe', 'suit', 'armor'],
  accessories: ['cape', 'scarf', 'tie', 'bow', 'sash'],
  handheld: ['candy', 'gift', 'flower', 'wand', 'instrument'],
  effects: ['sparkles', 'glow', 'particles', 'aura']
};
```

---

## Technical Implementation

### 1. Costume Database Schema

```javascript
// costume-database.js
const HOLIDAY_COSTUMES = {
  new_year: {
    id: 'new_year',
    name: 'New Year Celebration',
    date: '01-01',
    theme: {
      primary: '#FFD700',    // Gold
      secondary: '#C0C0C0',  // Silver
      accent: '#FF6B6B'      // Red
    },
    costumes: {
      ericf: {
        head: 'party_hat_gold',
        body: 'tuxedo_black',
        accessory: 'confetti_cannon',
        effect: 'sparkle_burst'
      },
      nexus: {
        head: '2025_glasses',
        body: 'hoodie_metallic',
        accessory: 'countdown_watch',
        effect: 'digital_fireworks'
      },
      // ... other agents
    },
    sprites: {
      'party_hat_gold': '/sprites/costumes/party_hat_gold.png',
      'tuxedo_black': '/sprites/costumes/tuxedo_black.png',
      // ...
    },
    aiPrompt: "Pixel art character wearing festive New Year's party hat, gold and silver colors, confetti, celebration theme, 32x32 sprite"
  },
  
  lunar_new_year: {
    id: 'lunar_new_year',
    name: 'Lunar New Year',
    date: 'variable', // Calculated based on lunar calendar
    theme: {
      primary: '#DC143C',    // Crimson
      secondary: '#FFD700',  // Gold
      accent: '#FF8C00'      // Dark orange
    },
    costumes: {
      ericf: {
        head: 'dragon_hat_red',
        body: 'tang_suit_gold',
        accessory: 'red_envelope',
        effect: 'lantern_glow'
      },
      nexus: {
        head: 'ox_horns', // Based on zodiac year
        body: 'robe_silk_red',
        accessory: 'lantern_hand',
        effect: 'firework_trail'
      }
    },
    aiPrompt: "Pixel art character in traditional Chinese New Year outfit, red and gold colors, dragon elements, 32x32 sprite"
  },
  
  birthday: {
    id: 'birthday',
    name: 'Birthday Celebration',
    date: 'user_defined',
    theme: {
      primary: '#FF69B4',    // Hot pink
      secondary: '#87CEEB',  // Sky blue
      accent: '#FFD700'      // Gold
    },
    costumes: {
      default: {
        head: 'cake_hat',
        body: 'party_outfit',
        accessory: 'balloon_bunch',
        effect: 'confetti_rain'
      }
    },
    aiPrompt: "Pixel art character with birthday cake hat, balloons, party theme, colorful, 32x32 sprite"
  },
  
  // ... more holidays
};
```

### 2. Costume Manager Class

```javascript
// costume-manager.js
class CostumeManager {
  constructor() {
    this.currentHoliday = null;
    this.activeCostumes = new Map();
    this.aiCache = new Map();
    this.defaultCostumes = new Map();
    this.userBirthday = null;
  }

  // Initialize and detect current holiday
  async initialize() {
    this.userBirthday = await this.loadUserBirthday();
    this.currentHoliday = this.detectHoliday();
    await this.loadCostumeAssets();
  }

  // Detect which holiday is active
  detectHoliday() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const dateStr = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Check fixed-date holidays
    for (const [key, holiday] of Object.entries(HOLIDAY_COSTUMES)) {
      if (holiday.date === dateStr) {
        return key;
      }
      if (holiday.date === 'variable' && this.isVariableHoliday(key, now)) {
        return key;
      }
    }
    
    // Check user birthday
    if (this.userBirthday && this.isBirthdayToday(now)) {
      return 'birthday';
    }
    
    return null;
  }

  // Apply costume to agent
  async applyCostume(agentId, holidayKey = this.currentHoliday) {
    if (!holidayKey) return null;
    
    const holiday = HOLIDAY_COSTUMES[holidayKey];
    const costume = holiday.costumes[agentId] || holiday.costumes.default;
    
    // Try AI-generated texture first (if enabled)
    if (this.aiEnabled && !this.aiCache.has(`${agentId}_${holidayKey}`)) {
      const aiTexture = await this.generateAITexture(agentId, holiday);
      if (aiTexture) {
        this.aiCache.set(`${agentId}_${holidayKey}`, aiTexture);
        return { ...costume, texture: aiTexture, source: 'ai' };
      }
    }
    
    // Fall back to pre-made sprites
    return { ...costume, sprites: this.getSpritePaths(costume), source: 'sprite' };
  }

  // Generate AI texture for costume
  async generateAITexture(agentId, holiday) {
    try {
      const agent = AGENTS_DATA.find(a => a.id === agentId);
      const prompt = `${holiday.aiPrompt}, ${agent.color} color scheme, character named ${agent.name}`;
      
      // Call AI generation API
      const response = await fetch('/api/generate-costume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          agentId,
          holiday: holiday.id,
          size: 32 // Pixel sprite size
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.textureUrl;
      }
    } catch (error) {
      console.warn('AI costume generation failed:', error);
    }
    return null;
  }

  // Get sprite paths for costume components
  getSpritePaths(costume) {
    const paths = {};
    if (costume.head) paths.head = `/sprites/costumes/${costume.head}.png`;
    if (costume.body) paths.body = `/sprites/costumes/${costume.body}.png`;
    if (costume.accessory) paths.accessory = `/sprites/costumes/${costume.accessory}.png`;
    return paths;
  }

  // Save/restore default costume
  saveDefaultCostume(agentId, costume) {
    this.defaultCostumes.set(agentId, costume);
    localStorage.setItem(`costume_default_${agentId}`, JSON.stringify(costume));
  }

  restoreDefaultCostume(agentId) {
    return this.defaultCostumes.get(agentId) || 
           JSON.parse(localStorage.getItem(`costume_default_${agentId}`) || 'null');
  }

  // Toggle costumes on/off
  toggleCostumes(enabled) {
    this.costumesEnabled = enabled;
    if (!enabled) {
      this.activeCostumes.clear();
    } else {
      this.refreshAllCostumes();
    }
  }
}
```

### 3. UI Components

```javascript
// costume-ui.js
class CostumeUI {
  constructor(costumeManager) {
    this.manager = costumeManager;
    this.panel = null;
  }

  // Create holiday selector panel
  createHolidaySelector() {
    const panel = document.createElement('div');
    panel.className = 'holiday-selector-panel';
    panel.innerHTML = `
      <div class="panel-header">
        <h3>🎭 Holiday Costumes</h3>
        <button class="close-btn">×</button>
      </div>
      <div class="current-holiday">
        <span class="holiday-badge">${this.getCurrentHolidayIcon()}</span>
        <span class="holiday-name">${this.getCurrentHolidayName()}</span>
      </div>
      <div class="costume-toggle">
        <label class="switch">
          <input type="checkbox" id="costumeToggle" checked>
          <span class="slider"></span>
        </label>
        <span>Enable Costumes</span>
      </div>
      <div class="holiday-list">
        <h4>Upcoming Holidays</h4>
        ${this.renderHolidayList()}
      </div>
      <div class="customization-panel">
        <h4>Agent Customization</h4>
        <button class="btn" onclick="costumeUI.openAgentSelector()">
          Select Agent to Customize
        </button>
      </div>
    `;
    
    this.bindEvents(panel);
    return panel;
  }

  // Render holiday list
  renderHolidayList() {
    const holidays = Object.values(HOLIDAY_COSTUMES);
    return holidays.map(h => `
      <div class="holiday-item ${h.id === this.manager.currentHoliday ? 'active' : ''}" 
           data-holiday="${h.id}">
        <span class="holiday-icon">${this.getHolidayIcon(h.id)}</span>
        <div class="holiday-info">
          <span class="holiday-name">${h.name}</span>
          <span class="holiday-date">${this.formatDate(h.date)}</span>
        </div>
        <button class="preview-btn" data-holiday="${h.id}">Preview</button>
      </div>
    `).join('');
  }

  // Create agent costume editor
  createAgentEditor(agentId) {
    const agent = AGENTS_DATA.find(a => a.id === agentId);
    const modal = document.createElement('div');
    modal.className = 'costume-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Customize ${agent.name}</h3>
          <button class="close-btn">×</button>
        </div>
        <div class="costume-preview">
          <canvas id="costumePreview" width="128" height="128"></canvas>
          <div class="preview-controls">
            <button class="btn" onclick="costumeUI.animatePreview()">▶ Animate</button>
            <button class="btn" onclick="costumeUI.randomizeCostume()">🎲 Random</button>
          </div>
        </div>
        <div class="costume-parts">
          <div class="part-section">
            <h4>Head</h4>
            <div class="part-grid" data-part="head">
              ${this.renderPartOptions('head')}
            </div>
          </div>
          <div class="part-section">
            <h4>Body</h4>
            <div class="part-grid" data-part="body">
              ${this.renderPartOptions('body')}
            </div>
          </div>
          <div class="part-section">
            <h4>Accessories</h4>
            <div class="part-grid" data-part="accessories">
              ${this.renderPartOptions('accessories')}
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="costumeUI.saveCostume()">
            Save Costume
          </button>
          <button class="btn" onclick="costumeUI.resetToDefault()">
            Reset to Default
          </button>
        </div>
      </div>
    `;
    
    return modal;
  }
}
```

### 4. CSS Styles

```css
/* costume-styles.css */
.holiday-selector-panel {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 320px;
  background: var(--bg-card);
  border: 4px solid var(--panel-border);
  border-radius: 12px;
  padding: 16px;
  z-index: 1000;
  font-family: 'Press Start 2P', cursive;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--panel-border);
}

.panel-header h3 {
  font-size: 0.7rem;
  color: var(--accent-cyan);
  margin: 0;
}

.current-holiday {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 212, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 16px;
}

.holiday-badge {
  font-size: 2rem;
}

.holiday-name {
  font-size: 0.6rem;
  color: var(--text-light);
}

.costume-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 0.5rem;
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #666;
  transition: .3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--accent-green);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

/* Holiday List */
.holiday-list h4 {
  font-size: 0.5rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.holiday-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg-secondary);
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.holiday-item:hover {
  background: rgba(0, 212, 255, 0.2);
}

.holiday-item.active {
  border: 2px solid var(--accent-green);
}

.holiday-icon {
  font-size: 1.5rem;
}

.holiday-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.holiday-info .holiday-name {
  font-size: 0.5rem;
  color: var(--text-light);
}

.holiday-info .holiday-date {
  font-size: 0.4rem;
  color: var(--text-secondary);
}

.preview-btn {
  padding: 4px 8px;
  font-size: 0.4rem;
  background: var(--accent-cyan);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #000;
}

/* Costume Modal */
.costume-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  background: var(--bg-card);
  border: 4px solid var(--panel-border);
  border-radius: 12px;
  padding: 20px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.costume-preview {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

#costumePreview {
  width: 128px;
  height: 128px;
  image-rendering: pixelated;
  border: 2px solid var(--panel-border);
  border-radius: 8px;
}

.part-section {
  margin-bottom: 16px;
}

.part-section h4 {
  font-size: 0.5rem;
  color: var(--accent-cyan);
  margin-bottom: 8px;
}

.part-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.part-option {
  aspect-ratio: 1;
  background: var(--bg-secondary);
  border: 2px solid var(--panel-border);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.part-option:hover {
  border-color: var(--accent-cyan);
  transform: scale(1.05);
}

.part-option.selected {
  border-color: var(--accent-green);
  background: rgba(81, 207, 102, 0.2);
}

/* Costume Button in Main UI */
.costume-btn {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: var(--bg-card);
  border: 3px solid var(--panel-border);
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 999;
  transition: all 0.2s;
}

.costume-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(233, 69, 96, 0.5);
}

.costume-btn.active {
  border-color: var(--accent-green);
  animation: pulse 2s infinite;
}
```

---

## Integration with Pixel Office

### 1. Add Costume Button to Controls

```javascript
// In pixel-office.html, add to controls div:
<button class="btn" onclick="toggleCostumePanel()" title="Holiday Costumes">
  🎭
</button>
```

### 2. Modify Agent Rendering

```javascript
// In Agent class render method:
render(ctx, camera, spriteLoader) {
  // ... existing render code ...
  
  // Apply costume overlay if active
  if (costumeManager.costumesEnabled && this.costume) {
    this.renderCostume(ctx, camera, spriteLoader);
  }
}

renderCostume(ctx, camera, spriteLoader) {
  const screenX = (this.x - camera.x) * camera.zoom + camera.offsetX;
  const screenY = (this.y - camera.y) * camera.zoom + camera.offsetY;
  const size = 16 * this.scale * camera.zoom;
  
  // Render costume components
  if (this.costume.sprites) {
    // Render pre-made sprites
    if (this.costume.sprites.head) {
      const headSprite = spriteLoader.getCostumeSprite(this.costume.sprites.head, this.animation, this.frame);
      ctx.drawImage(headSprite.image, screenX, screenY - size * 0.3, size, size);
    }
    if (this.costume.sprites.body) {
      const bodySprite = spriteLoader.getCostumeSprite(this.costume.sprites.body, this.animation, this.frame);
      ctx.drawImage(bodySprite.image, screenX, screenY, size, size);
    }
  } else if (this.costume.texture) {
    // Render AI-generated texture
    ctx.drawImage(this.costume.texture, screenX, screenY - size * 0.3, size, size * 1.3);
  }
  
  // Render effects
  if (this.costume.effect) {
    this.renderEffect(ctx, screenX, screenY, size);
  }
}
```

---

## API Endpoints

```javascript
// /api/costumes

// GET /api/costumes/current
// Returns current holiday and costume status
{
  "holiday": "lunar_new_year",
  "name": "Lunar New Year",
  "active": true,
  "expiresAt": "2025-02-13T00:00:00Z"
}

// GET /api/costumes/list
// Returns all available holidays
{
  "holidays": [
    { "id": "new_year", "name": "New Year", "date": "01-01", "icon": "🎆" },
    { "id": "lunar_new_year", "name": "Lunar New Year", "date": "variable", "icon": "🧧" }
  ]
}

// POST /api/costumes/apply
// Apply costume to agent
{
  "agentId": "nexus",
  "holiday": "lunar_new_year"
}

// POST /api/generate-costume
// Generate AI texture
{
  "prompt": "Pixel art character in festive outfit...",
  "agentId": "nexus",
  "holiday": "lunar_new_year",
  "size": 32
}
// Returns: { "textureUrl": "/generated/costumes/nexus_lunar_new_year.png" }

// POST /api/costumes/customize
// Save custom costume
{
  "agentId": "nexus",
  "costume": {
    "head": "party_hat",
    "body": "hoodie_custom",
    "accessory": "glasses_pixel"
  }
}
```

---

## File Structure

```
mission-control/
├── dashboard/
│   ├── pixel-office.html
│   └── costume-system/
│       ├── costume-manager.js
│       ├── costume-ui.js
│       ├── costume-database.js
│       ├── costume-styles.css
│       └── sprites/
│           ├── costumes/
│           │   ├── party_hat_gold.png
│           │   ├── dragon_hat_red.png
│           │   ├── tuxedo_black.png
│           │   └── ...
│           └── effects/
│               ├── sparkle_burst.gif
│               ├── confetti_rain.gif
│               └── ...
├── api/
│   └── costumes.js
└── tasks/
    └── HOLIDAY_COSTUME_SYSTEM.md
```

---

## Implementation Phases

### Phase 1: Core System (This Week)
- [x] Costume database with 12 holidays
- [x] CostumeManager class
- [x] Basic UI (selector + toggle)
- [x] Sprite-based costumes (pre-made assets)
- [x] Integration with Pixel Office

### Phase 2: AI Enhancement (Next Sprint)
- [ ] AI texture generation API
- [ ] Prompt engineering per holiday
- [ ] Texture caching system
- [ ] Fallback to sprites when AI fails

### Phase 3: Advanced Features (Future)
- [ ] User-defined custom holidays
- [ ] Costume marketplace (share designs)
- [ ] Animated costumes
- [ ] Particle effects system
- [ ] Sound effects per holiday

---

## Quality Checklist

- [ ] Costumes render at 60fps
- [ ] Toggle on/off works instantly
- [ ] AI generation < 3 seconds
- [ ] Sprites load < 100ms
- [ ] Mobile responsive UI
- [ ] Accessibility (keyboard nav)
- [ ] Graceful degradation (no AI = sprites only)

---

**Status:** ✅ Ready for implementation  
**Estimated Time:** 6-8 hours  
**Assignee:** Forge + Pixel  
**Review:** EricF approval on costume designs
