# Holiday Costume System

A festive costume system for Pixel Office agents that automatically applies holiday-themed outfits based on the current date.

## Quick Start

```javascript
// Initialize in pixel-office.html
import { initializeCostumeSystem } from './costume-system/costume-integration.js';

// After agents are loaded
await initializeCostumeSystem({
  aiEnabled: true  // Enable AI texture generation
});
```

## Features

- 🎭 **12 Holidays**: New Year, Lunar New Year, Valentine's, St. Patrick's, Easter, Birthday, Halloween, Thanksgiving, Christmas, Hanukkah, Diwali, Pride Month
- 🎨 **AI + Sprite Hybrid**: Pre-made sprites for instant loading, AI generation for unique variations
- 👤 **Per-Agent Costumes**: Each of the 22 agents has unique costumes per holiday
- ✨ **Visual Effects**: Sparkles, hearts, snow, confetti, fireworks, glow
- 🎂 **Birthday Support**: Set your birthday for a special celebration
- 💾 **Save/Export**: Backup your custom costumes

## File Structure

```
costume-system/
├── costume-database.js      # Holiday definitions & costumes
├── costume-manager.js       # Core logic
├── costume-ui.js           # User interface
├── costume-styles.js       # CSS styles
└── costume-integration.js  # Pixel Office integration
```

## Configuration

### Environment Variables (for AI generation)

```bash
# Option 1: Replicate
REPLICATE_API_TOKEN=your_token_here

# Option 2: Stability AI
STABILITY_API_KEY=your_key_here
```

### Disable AI (sprites only)

```javascript
await initializeCostumeSystem({
  aiEnabled: false
});
```

## API

### CostumeManager

```javascript
const manager = new CostumeManager();
await manager.initialize();

// Get current holiday
const holiday = manager.getCurrentHoliday();

// Apply costume to agent
const costume = await manager.applyCostume('nexus');

// Toggle costumes
manager.toggleCostumes(false);

// Save custom costume
manager.saveDefaultCostume('nexus', {
  head: 'santa_hat',
  body: 'hoodie_red',
  accessory: 'candy_cane',
  effect: 'snow'
});

// Get upcoming holidays
const upcoming = manager.getUpcomingHolidays(5);
```

### CostumeUI

```javascript
const ui = new CostumeUI(manager);
ui.initialize();

// Open panel programmatically
ui.showPanel();

// Show notification
ui.showNotification('Costumes updated!');
```

## Adding New Holidays

Edit `costume-database.js`:

```javascript
const HOLIDAY_COSTUMES = {
  my_holiday: {
    id: 'my_holiday',
    name: 'My Holiday',
    date: '07-04',  // MM-DD format
    icon: '🎆',
    theme: {
      primary: '#FF0000',
      secondary: '#FFFFFF',
      accent: '#0000FF'
    },
    costumes: {
      ericf: { head: 'hat_patriotic', body: 'suit_flag', accessory: 'firework', effect: 'sparkles' },
      // ... other agents
    },
    aiPrompt: "Pixel art character with patriotic theme, red white and blue, fireworks, 32x32 sprite"
  }
};
```

## Creating Costume Sprites

1. Create 32x32 PNG files in `/sprites/costumes/`
2. Name format: `{part_name}.png`
3. Reference in costume database

Example:
```
sprites/costumes/
├── santa_hat.png
├── elf_tunic.png
├── candy_cane.png
└── sparkle_effect.gif
```

## License

MIT - Part of Mission Control
