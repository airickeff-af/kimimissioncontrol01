# PIXEL OFFICE UPDATE v7
**Assigned to:** Pixel-2  
**Due:** Feb 18, 5:00 AM HKT (6 hours)  
**Status:** IN PROGRESS

---

## 🎨 VISUAL IMPROVEMENTS REQUIRED

### **1. Agent Sprites - Walking Computer Heads**

Each agent should be a **walking computer/monitor with pixel art face**:

**Design:**
```
┌─────────┐
│ ███████ │  <- Screen (glows with agent color)
│ █ ◕ ◕ █ │  <- Eyes (animated, blink)
│ █  ▽  █ │  <- Mouth (changes with activity)
│ ███████ │
└────┬────┘
     │     <- Neck
    ═══    <- Body (small, walks)
    │ │    <- Legs (animated walking)
```

**Per Agent:**
- **Screen color:** Matches agent's department color
- **Face:** Unique expression per agent
- **Glow:** Screen glows when active
- **Animation:** Walking legs, bobbing motion

---

### **2. Enhanced Animations**

**Walking Animation:**
- Legs move alternately (left, right, left, right)
- Body bounces with each step
- Shadow scales with bounce
- 8-frame walk cycle

**Idle Animation:**
- Screen pulses gently
- Eyes blink randomly
- Occasional "thinking" expression

**Meeting Animation:**
- Agents face center table
- Screens tilt toward each other
- "Talking" expression (mouth moves)
- Idea bubbles appear above heads

---

### **3. Enhanced Lighting & Shadows**

**Dynamic Lighting:**
- Screen glow casts light on floor
- Shadows based on agent position
- Meeting table has center glow
- Command balcony has red glow

**Shadow System:**
- Real-time shadow calculation
- Shadow length based on "height"
- Soft edges (gradient)

---

### **4. Detailed Environment**

**Floor:**
- Isometric tiles with depth
- Grid pattern with glow
- Reflections under agents

**Desks:**
- Computer terminals with glow
- Keyboard detail
- Chair behind desk

**Plants:**
- Minecraft-style blocky plants
- Animated (gentle sway)
- Different types (cactus, tree, flower)

**Meeting Table:**
- Glowing center
- Chairs around it
- Holographic display above

---

### **5. Minecraft Style Retained**

**Keep:**
- Blocky pixel aesthetic
- Sharp edges
- 8-bit colors
- Isometric view
- Retro feel

**Add:**
- More detail within pixel constraints
- Better color palette
- Smooth animations (within pixel style)

---

## 🤖 AGENT DESIGNS

### **Executive (EricF, Nexus)**
- **Screen:** Red/Pink glow
- **Face:** Commanding expression
- **Special:** Crown or special marker

### **Dev Team (Forge, Code)**
- **Screen:** Orange/Green glow
- **Face:** Focused/coding expression
- **Special:** Code symbols on screen

### **Design Team (Pixel)**
- **Screen:** Purple glow
- **Face:** Creative expression
- **Special:** Paintbrush cursor

### **Content Team (Glasses, Quill)**
- **Screen:** Cyan/Yellow glow
- **Face:** Reading/writing expression
- **Special:** Book/quill icon

### **Ops Team (Sentry, Audit, Cipher)**
- **Screen:** Cyan/Yellow/Purple glow
- **Face:** Alert/professional expression
- **Special:** Shield/check/lock icon

### **Business Dev (DealFlow, ColdCall, Scout)**
- **Screen:** Orange/Green/Cyan glow
- **Face:** Friendly/persuasive expression
- **Special:** Phone/magnifying glass icon

---

## ⏰ TIMELINE

| Time | Task |
|------|------|
| 11:15 PM | Start - Create base computer head sprite |
| 12:00 AM | Walking animation system |
| 1:00 AM | Enhanced lighting/shadows |
| 2:00 AM | Environment details (plants, desks) |
| 3:00 AM | All 20 agent variations |
| 4:00 AM | Standup meeting animations |
| 5:00 AM | Testing & polish |

---

## 🎯 SUCCESS CRITERIA

- [ ] All 20 agents are walking computer heads
- [ ] Smooth walking animation (8-frame cycle)
- [ ] Screen glows with department colors
- [ ] Dynamic shadows
- [ ] Enhanced environment
- [ ] Standup meeting looks amazing
- [ ] Minecraft style preserved
- [ ] 60 FPS performance

---

## 📁 FILES

**Location:** `/root/.openclaw/workspace/mission-control/dashboard/living-pixel-office.html`

**Backup:** Create `living-pixel-office-v6.html` before changes

---

*Pixel-2 - Start immediately, complete by 5 AM*
