# Mission Control Visual Style Guide

## Primary Reference: KAIROSOFT GAMES

### What is Kairosoft?
Japanese game developer known for simulation/management games like:
- Game Dev Story
- Pocket Academy
- Mega Mall Story
- Dungeon Village
- Hot Springs Story

### Key Visual Elements

#### 1. Character Design
- **Chibi style** - Big heads, small bodies
- **Pixel art** - 16-bit or 32-bit aesthetic
- **Expressive** - Clear emotions through simple sprites
- **Color coded** - Each character has distinct color palette
- **Animated** - Simple walk/idle animations

#### 2. UI Design
- **Clean grids** - Organized layout with clear sections
- **Resource bars** - Health, energy, progress meters
- **Icons** - Pixel art icons for everything
- **Numbers** - Stats prominently displayed
- **Borders** - Distinct panel borders with depth

#### 3. Office/Environment
- **Isometric or top-down** - View from above
- **Tile-based** - Grid movement system
- **Interactive objects** - Desks, computers, plants
- **Visual feedback** - Highlights when hovering
- **Day/night cycle** - Lighting changes

#### 4. Game Feel
- **Progression** - Levels, experience points
- **Resources** - Money, energy, materials
- **Goals** - Visible objectives and missions
- **Rewards** - Achievements, unlocks
- **Management** - Staff happiness, efficiency stats

## Implementation for Mission Control

### Agent Sprites (Chibi Style)
```
┌─────────┐
│  ◕  ◕   │  <- Big eyes
│    ▽    │  <- Small mouth
│  ┌───┐  │
│  │ ◈ │  │  <- Agent symbol on shirt
│  └───┘  │
│   │ │   │  <- Tiny legs
└─────────┘
```

### UI Elements Needed
- [ ] Pixel art agent avatars (9 agents)
- [ ] Resource bars (energy, productivity)
- [ ] Office tiles (floor, walls, furniture)
- [ ] Icon set (tasks, alerts, messages)
- [ ] Stats panels (agent levels, skills)
- [ ] Progress bars (task completion)
- [ ] Day/night cycle visualization

### Color Palette
- **Background:** Soft blues/purples
- **UI Panels:** Warm browns/beiges
- **Accents:** Bright but not neon
- **Text:** Dark on light, easy to read
- **Highlights:** Yellow/gold for important

## Reference Images to Study
- Game Dev Story office layout
- Pocket Academy character sprites
- Mega Mall Story UI panels

## Technical Implementation
- CSS pixel art (box-shadow technique)
- OR actual pixel art sprites
- Grid-based positioning
- Simple CSS animations
- Responsive scaling

---

*Visual style requirement for Mission Control*
*Reference: Kairosoft simulation games*
*Priority: HIGH*
