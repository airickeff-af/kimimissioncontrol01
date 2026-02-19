# Pixel Office Improvement Tasks

**Created:** 2026-02-20  
**Source:** Pixel Office Improvement Audit

---

## P1 Tasks (Critical Priority)

### TASK-P1-001: Real-Time Activity Feed
**Status:** 🔴 Not Started  
**Assignee:** TBD  
**Estimated Effort:** 4 hours  
**Due:** Week 1

#### Description
Replace mock activity data with live API integration. Display current tasks above agents and maintain an activity log panel with auto-refresh.

#### Acceptance Criteria
- [ ] Connect to `/api/agents` endpoint for live status
- [ ] Display current task above each agent sprite
- [ ] Activity log shows last 10 real actions
- [ ] Auto-refresh every 30 seconds
- [ ] Visual indicator when new activity arrives
- [ ] Fallback to mock data if API unavailable

#### Technical Notes
```javascript
// Create: js/activity-feed.js
class ActivityFeed {
  constructor(apiEndpoint, refreshInterval = 30000) { ... }
  async fetchActivities() { ... }
  updateFeed(newActivities) { ... }
}
```

#### Files to Modify
- `pixel-office/web/static/pixel-office-v2.html`
- New: `pixel-office/web/static/js/activity-feed.js`

---

### TASK-P1-002: Interactive Agent Selection
**Status:** 🔴 Not Started  
**Assignee:** TBD  
**Estimated Effort:** 6 hours  
**Due:** Week 1

#### Description
Enhance agent selection with visual feedback, detailed info cards, and camera panning. Add quick actions for messaging and task viewing.

#### Acceptance Criteria
- [ ] Click agent to select (highlight ring animation)
- [ ] Show detailed agent card in sidebar
- [ ] Camera smoothly pans to selected agent
- [ ] Quick actions: Message, View Tasks, Assign Task
- [ ] Display full agent info: role, team, stats, current task
- [ ] Press ESC to deselect
- [ ] Click outside to deselect

#### Technical Notes
```javascript
// Enhance: sprite-system.js
class AgentSelector {
  select(agentId) { ... }
  panToAgent(agent) { ... }
  showAgentCard(agent) { ... }
}
```

#### Files to Modify
- `pixel-office/web/static/sprite-system.js`
- `pixel-office/web/static/pixel-office-v2.html`

---

### TASK-P1-003: Quick Action Command Center
**Status:** 🔴 Not Started  
**Assignee:** TBD  
**Estimated Effort:** 8 hours  
**Due:** Week 1

#### Description
Implement floating action bar and Cmd+K command palette for quick access to common actions.

#### Acceptance Criteria
- [ ] Floating action bar with 4 main actions
- [ ] Cmd+K opens command palette
- [ ] Search/filter commands in palette
- [ ] Keyboard navigation (arrow keys, enter)
- [ ] "Call Standup" triggers standup mode
- [ ] "Find Agent" opens search with autocomplete
- [ ] "Assign Task" opens task assignment modal
- [ ] "Emergency Alert" triggers visual alarm

#### Technical Notes
```javascript
// Create: js/command-center.js
class CommandCenter {
  constructor() { ... }
  open() { ... }
  filter(query) { ... }
  execute(commandId) { ... }
}
```

#### Files to Modify
- New: `pixel-office/web/static/js/command-center.js`
- `pixel-office/web/static/pixel-office-v2.html`

---

## P2 Tasks (High Priority)

### TASK-P2-001: Agent Movement & Pathfinding
**Status:** 🔴 Not Started  
**Assignee:** TBD  
**Estimated Effort:** 12 hours  
**Due:** Week 2

#### Description
Implement A* pathfinding for agents to navigate around obstacles. Add collision avoidance and random idle movements.

#### Acceptance Criteria
- [ ] A* pathfinding around obstacles
- [ ] Agents follow computed paths
- [ ] Collision avoidance between agents
- [ ] Random idle wandering
- [ ] Smooth path following with direction changes
- [ ] Visual path preview on hover

#### Technical Notes
```javascript
// Create: js/pathfinding.js
class Pathfinder {
  findPath(startX, startY, endX, endY) { ... }
  getNeighbors(x, y) { ... }
  heuristic(x1, y1, x2, y2) { ... }
}
```

#### Files to Modify
- New: `pixel-office/web/static/js/pathfinding.js`
- `pixel-office/web/static/sprite-system.js`

---

### TASK-P2-002: Collaboration Visuals
**Status:** 🔴 Not Started  
**Assignee:** TBD  
**Estimated Effort:** 10 hours  
**Due:** Week 2

#### Description
Add visual indicators for agent collaboration including chat bubbles, pair programming animations, and celebration effects.

#### Acceptance Criteria
- [ ] Chat bubbles appear when agents "talk"
- [ ] Different bubble types: speech, thought, shout
- [ ] Pair programming animation when agents collaborate
- [ ] Visual connection line between collaborating agents
- [ ] High-five animation with particle effects
- [ ] Meeting table gathering with proper seating
- [ ] Task completion celebration

#### Technical Notes
```javascript
// Add to AnimatedAgent class
showChatBubble(text, duration, type) { ... }
renderChatBubble(ctx, x, y, zoom) { ... }

// Create: js/collaboration.js
class CollaborationManager {
  startCollaboration(agent1Id, agent2Id, type) { ... }
  triggerHighFive(agent1Id, agent2Id) { ... }
}
```

#### Files to Modify
- `pixel-office/web/static/sprite-system.js`
- New: `pixel-office/web/static/js/collaboration.js`

---

### TASK-P2-003: Standup Mode Enhancement
**Status:** 🟡 Partially Complete  
**Assignee:** TBD  
**Estimated Effort:** 6 hours  
**Due:** Week 2

#### Description
Enhance existing standup mode with real data, timer, notes editor, and export functionality.

#### Acceptance Criteria
- [ ] "Start Standup" button triggers standup mode
- [ ] All active agents walk to meeting table
- [ ] Show countdown timer (default 15 min)
- [ ] Display participant count, activities, completed tasks
- [ ] Editable standup notes (Yesterday/Today/Blockers)
- [ ] Export notes as Markdown
- [ ] End standup returns agents to positions
- [ ] Visual indicator during standup (overlay, timer)

#### Technical Notes
```javascript
// Create: js/standup-manager.js
class StandupManager {
  async start() { ... }
  startTimer() { ... }
  generateNotesTemplate(agents) { ... }
  exportNotes() { ... }
}
```

#### Files to Modify
- `pixel-office/web/static/pixel-office-v2.html`
- New: `pixel-office/web/static/js/standup-manager.js`

---

## P3 Tasks (Medium Priority)

### TASK-P3-001: Office Environment Polish
**Status:** 🔴 Not Started  
**Assignee:** TBD  
**Estimated Effort:** 8 hours  
**Due:** Week 3

#### Acceptance Criteria
- [ ] Add pixel art plants with subtle animation
- [ ] Coffee machine area with steam particle effect
- [ ] Whiteboard showing current sprint data
- [ ] Real-time clock showing actual time
- [ ] Day/night cycle with ambient lighting changes
- [ ] Additional decor: water cooler, bookshelf, couch
- [ ] Interactive furniture (click for info)

---

### TASK-P3-002: Mobile Responsive
**Status:** 🔴 Not Started  
**Assignee:** TBD  
**Estimated Effort:** 10 hours  
**Due:** Week 3

#### Acceptance Criteria
- [ ] Touch-friendly agent selection (larger hit areas)
- [ ] Pinch to zoom
- [ ] Swipe to pan
- [ ] Responsive layout for tablets and phones
- [ ] Mobile navigation menu
- [ ] Optimized agent card for mobile (bottom sheet)
- [ ] Touch gestures: double-tap to zoom, long-press for context menu

---

## P4 Tasks (Future Enhancements)

### TASK-P4-001: Enhanced Animated Sprites
**Status:** 🟡 Partially Complete  
**Assignee:** TBD  
**Estimated Effort:** 16 hours  
**Due:** Week 4

#### Acceptance Criteria
- [ ] 8-frame animations for all activities
- [ ] Directional sprites (left/right/up/down)
- [ ] Smooth animation transitions
- [ ] Activity-specific animations (typing, talking, celebrating)
- [ ] Procedural sprite generation from config
- [ ] Sprite caching for performance

---

### TASK-P4-002: Agent Customization
**Status:** 🔴 Not Started  
**Assignee:** TBD  
**Estimated Effort:** 12 hours  
**Due:** Week 4

#### Acceptance Criteria
- [ ] Change agent colors (primary, secondary, accent)
- [ ] Select outfit style (casual, formal, hoodie, etc.)
- [ ] Add accessories (glasses, hat, headphones)
- [ ] Customize desk decorations
- [ ] Holiday costumes (Halloween, Christmas, etc.)
- [ ] Save/load customizations from localStorage
- [ ] Preview changes in real-time

---

## Quick Reference

### API Endpoints
```
GET  /api/agents              - List all agents with status
GET  /api/agents/activity     - Recent agent activities
GET  /api/agents/:id          - Single agent details
POST /api/agents/:id/message  - Send message to agent
GET  /api/sprint/current      - Current sprint data
GET  /api/standup             - Standup data
POST /api/sprites/regenerate  - Regenerate agent sprite
```

### File Structure
```
pixel-office/web/static/
├── index.html              # Original office view
├── pixel-office-v2.html    # Main animated view (MODIFY)
├── sprite-system.js        # Core rendering (MODIFY)
└── js/
    ├── activity-feed.js    # NEW
    ├── command-center.js   # NEW
    ├── pathfinding.js      # NEW
    ├── collaboration.js    # NEW
    ├── standup-manager.js  # NEW
    └── touch-controller.js # NEW (P3)
```

### Priority Legend
- 🔴 Not Started
- 🟡 In Progress / Partial
- 🟢 Complete
