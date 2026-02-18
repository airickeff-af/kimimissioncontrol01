# Agent Task Brief: Pixel Office - ACCELERATED

## Mission
Execute TASK-092 Pixel Office with ACCELERATED timeline. 9 hours to deliver 95/100 quality.

## Current State
- File: `/root/.openclaw/workspace/mission-control/dashboard/living-pixel-office.html`
- Current Score: 72/100
- Target Score: 95/100
- Current Implementation: Static HTML agent cards with CSS styling
- Missing: Canvas-based pixel animations, walking sprites, visual polish

## Accelerated Timeline (9 Hours)

### Phase 1: Walking Animations (Hours 1-3) - CRITICAL
Create canvas-based pixel animation system:

1. **Add HTML5 Canvas element** to the office page
2. **Create 4-frame walking animation** for 9 core agents:
   - Frame 1: Standing
   - Frame 2: Left foot forward
   - Frame 3: Standing (shifted)
   - Frame 4: Right foot forward
3. **4 directions per agent**: Down, Up, Left, Right
4. **Kairosoft-style sprites**: 32x32 pixels, chibi, big heads, small bodies
5. **Agent designs** (walking computer heads):
   - Nexus: Red/pink screen, diamond symbol
   - Glasses: Cyan screen, magnifying glass eyes
   - Quill: Yellow screen, writing quill symbol
   - Pixel: Purple screen, paintbrush cursor
   - Gary: Orange screen, megaphone symbol
   - Larry: Blue screen, phone symbol
   - Sentry: Green screen, gear symbol
   - Audit: Purple screen, checkmark symbol
   - Cipher: Indigo screen, lock symbol

**Deliverable:** Working canvas with walking animations

### Phase 2: Idle Animations (Hours 4-6)
1. **Idle states**: Breathing (subtle bounce), blinking eyes
2. **Working states**: Typing animation, screen glow pulse
3. **Meeting states**: Agents face center, talk bubbles

### Phase 3: Visual Polish (Hours 7-9)
1. **Shadows**: Real-time shadows under agents
2. **Lighting**: Screen glow effects, dynamic lighting
3. **Environment**: Isometric office floor, desks, plants
4. **Particle effects**: Activity indicators
5. **Integration**: Seamless blend with existing HTML UI

## Technical Requirements

**Sprite Specs:**
- Size: 32x32 pixels
- Format: CSS box-shadow pixel art OR PNG sprites
- Animation: 200ms per frame (walking)
- Style: Kairosoft/Minecraft aesthetic

**Canvas Specs:**
- Size: 800x600px (fit in existing layout)
- Position: Replace or enhance agent grid section
- Performance: 60 FPS target

## Quality Scoring

**Current Gaps:**
- Visual Polish: 18/25 → target 23/25
- Animation Quality: 8/20 → target 18/20
- Sprite Detail: 22/25 → target 24/25
- Color Harmony: 14/15 → target 15/15
- Overall Cohesion: 10/15 → target 15/15

**Total Gain Needed:** +23 points

## Files to Modify

1. `/root/.openclaw/workspace/mission-control/dashboard/living-pixel-office.html` - Main file
2. Create `/root/.openclaw/workspace/mission-control/dashboard/pixel-sprites.css` - Sprite styles
3. Create `/root/.openclaw/workspace/mission-control/dashboard/pixel-office.js` - Animation logic

## Checkpoints

| Time | Deliverable |
|------|-------------|
| Hour 3 | Canvas + walking animations (down direction) |
| Hour 6 | All directions + idle animations |
| Hour 9 | Full polish pack, 95/100 score |

## Reference Materials

- `/root/.openclaw/workspace/mission-control/VISUAL_STYLE.md` - Kairosoft reference
- `/root/.openclaw/workspace/mission-control/OFFICE_VISUALIZATION.md` - Office layout
- `/root/.openclaw/workspace/mission-control/DYNAMIC_OFFICE.md` - Position states

## Success Criteria

- [ ] 9 agents with 4-frame walking animation
- [ ] 4 directions per agent
- [ ] Idle animations (breathing, blinking)
- [ ] Shadows and lighting effects
- [ ] 60 FPS performance
- [ ] Visual score: 95/100

## Command Authority

Nexus (Air1ck3ff) has authorized executive decision-making. You may:
- Make technical decisions without waiting for approval
- Modify existing code as needed
- Create new files and assets
- Report progress every 3 hours

**Execute immediately. Time is critical.**

---

**Start Time:** 00:11 GMT+8  
**Phase 1 Deadline:** 03:00 GMT+8  
**Final Deadline:** 09:00 GMT+8
