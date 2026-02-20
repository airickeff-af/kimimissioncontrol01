# MC-P0-036: Random Character Movement on Refresh

**Priority:** P0  
**Assignee:** Forge-MC + Pixel-MC  
**Due:** Feb 21, 2026 (URGENT)  
**Status:** P0 - CRITICAL

---

## FEATURE DESCRIPTION

Every time the page refreshes, the 3D character performs a **different movement/animation**.

**User Experience:**
1. User opens/refreshes the page
2. Character randomly selects from 8+ movement types
3. Character performs the animation
4. Next refresh = different movement

---

## MOVEMENT TYPES (8+ animations)

| # | Movement | Description | Duration |
|---|----------|-------------|----------|
| 1 | **Idle Stand** | Default standing pose | 3 sec |
| 2 | **Walk Cycle** | Walking in place | 4 sec |
| 3 | **Wave Hello** | Hand wave greeting | 2 sec |
| 4 | **Jump** | Small hop/bounce | 1 sec |
| 5 | **Sit Down** | Sit then stand up | 3 sec |
| 6 | **Spin Around** | 360° rotation | 2 sec |
| 7 | **Dance** | Simple dance move | 4 sec |
| 8 | **Stretch** | Morning stretch pose | 3 sec |
| 9 | **Celebrate** | Victory pose | 2 sec |
| 10 | **Sleepy** | Yawn + drowsy | 3 sec |

---

## TECHNICAL IMPLEMENTATION

### Option A: VRM Animation Clips (Recommended)
```javascript
// Pre-made animation clips
const animations = [
  'idle.vrma',
  'walk.vrma', 
  'wave.vrma',
  'jump.vrma',
  'sit.vrma',
  'spin.vrma',
  'dance.vrma',
  'stretch.vrma',
  'celebrate.vrma',
  'sleepy.vrma'
];

// Random selection on load
const randomAnim = animations[Math.floor(Math.random() * animations.length)];
character.playAnimation(randomAnim);
```

### Option B: Procedural Animation
- Use VRM blend shapes
- Code movements programmatically
- More flexible but complex

---

## ASSETS NEEDED

From Pixel-MC:
- [ ] 10 VRM animation files (.vrma)
- [ ] Each animation 2-4 seconds
- [ ] Smooth looping where applicable
- [ ] Export from Blender/Unity

---

## UI INDICATOR

Show current movement name:
```
┌─────────────────────────────┐
│  🎭 Current: "Wave Hello"   │
│  [🔄 Refresh for new move]  │
└─────────────────────────────┘
```

---

## ACCEPTANCE CRITERIA

- [ ] 8+ unique movements
- [ ] Random selection on each refresh
- [ ] Smooth animation transitions
- [ ] Movement name displayed
- [ ] Mobile responsive
- [ ] Quality score 95/100

---

## FILES TO MODIFY

- `/public/viewer.html` - Add animation logic
- `/public/assets/animations/` - New folder for .vrma files
- `/src/character-controller.js` - Animation manager

---

**Created:** Feb 20, 2026 8:00 PM  
**EricF Request:** Character moving/walking/new movement each refresh
