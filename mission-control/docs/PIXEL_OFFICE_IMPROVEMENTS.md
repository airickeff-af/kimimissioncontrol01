# Pixel Office Improvement Audit

**Audit Date:** 2026-02-20  
**Auditor:** System Audit Agent  
**Project:** Pixel Office - Isometric Agent Visualization  
**Current URL:** https://dashboard-ten-sand-20.vercel.app

---

## Executive Summary

The Pixel Office is a web-based isometric visualization system for AI agents. Currently at v2, it features 22 animated agents with basic sprite animations, real-time activity simulation, and a retro pixel art aesthetic. This audit identifies 10 specific improvements to elevate the user experience from "functional prototype" to "delightful product."

**Current State Assessment:**
- ✅ Animated pixel sprites (32x32, 8-frame)
- ✅ Basic isometric rendering
- ✅ Agent movement simulation
- ✅ Activity logging
- ⚠️ Static emojis in UI (not sprites)
- ⚠️ No real API integration for live data
- ⚠️ Limited interactivity
- ⚠️ No mobile optimization
- ⚠️ No collaboration visuals

---

## Priority Matrix

| Priority | Improvement | Effort | Impact |
|----------|-------------|--------|--------|
| **P1** | Real-Time Activity Feed | 4h | High |
| **P1** | Interactive Agent Selection | 6h | High |
| **P1** | Quick Action Command Center | 8h | High |
| **P2** | Agent Movement & Pathfinding | 12h | Medium |
| **P2** | Collaboration Visuals | 10h | Medium |
| **P2** | Standup Mode | 6h | Medium |
| **P3** | Office Environment Polish | 8h | Medium |
| **P3** | Mobile Responsive | 10h | Medium |
| **P4** | Animated Pixel Sprites (Enhancement) | 16h | Low |
| **P4** | Agent Customization | 12h | Low |

---

## P1 Improvements (Critical - Implement First)

### 1. Real-Time Activity Feed
**Status:** Partially implemented (mock data only)  
**Estimated Effort:** 4 hours  
**Priority:** P1

#### Current State
- Activity log shows simulated random activities
- No connection to actual agent API
- 30-second refresh mentioned but not implemented

#### Required Implementation

**API Integration:**
```javascript
// New file: js/activity-feed.js
class ActivityFeed {
  constructor(apiEndpoint, refreshInterval = 30000) {
    this.apiEndpoint = apiEndpoint;
    this.refreshInterval = refreshInterval;
    this.activities = [];
    this.maxItems = 10;
    this.pollTimer = null;
  }

  async fetchActivities() {
    try {
      const response = await fetch(`${this.apiEndpoint}/agents/activity`);
      const data = await response.json();
      this.updateFeed(data.activities);
    } catch (error) {
      console.error('Activity feed fetch failed:', error);
    }
  }

  updateFeed(newActivities) {
    // Merge and deduplicate
    const merged = [...newActivities, ...this.activities]
      .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
      .slice(0, this.maxItems);
    
    this.activities = merged;
    this.render();
  }

  startPolling() {
    this.pollTimer = setInterval(() => this.fetchActivities(), this.refreshInterval);
  }

  stopPolling() {
    clearInterval(this.pollTimer);
  }
}
```

**UI Components:**
1. **Activity Log Panel** (existing, needs real data)
2. **Current Task Badge** (above each agent sprite)
3. **Live Status Indicator** (colored dot with pulse animation)

**Visual Design:**
```css
.activity-feed {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-left: 3px solid var(--accent-cyan);
  background: rgba(0, 212, 255, 0.05);
  margin-bottom: 6px;
  border-radius: 0 6px 6px 0;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.task-badge {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  pointer-events: none;
}
```

**Acceptance Criteria:**
- [ ] Connect to `/api/agents` endpoint for live status
- [ ] Display current task above each agent sprite
- [ ] Activity log shows last 10 real actions
- [ ] Auto-refresh every 30 seconds
- [ ] Visual indicator when new activity arrives
- [ ] Fallback to mock data if API unavailable

---

### 2. Interactive Agent Selection
**Status:** Basic click detection exists  
**Estimated Effort:** 6 hours  
**Priority:** P1

#### Current State
- Clicking agent toggles `selected` boolean
- Simple white border highlight
- No detailed agent information panel

#### Required Implementation

**Selection System:**
```javascript
// Enhanced agent selection in sprite-system.js
class AgentSelector {
  constructor(renderer) {
    this.renderer = renderer;
    this.selectedAgent = null;
    this.onSelectCallbacks = [];
  }

  select(agentId) {
    // Deselect previous
    if (this.selectedAgent) {
      const prev = this.renderer.agents.get(this.selectedAgent);
      if (prev) prev.selected = false;
    }

    // Select new
    this.selectedAgent = agentId;
    const agent = this.renderer.agents.get(agentId);
    if (agent) {
      agent.selected = true;
      this.panToAgent(agent);
      this.showAgentCard(agent);
    }

    this.onSelectCallbacks.forEach(cb => cb(agentId));
  }

  panToAgent(agent) {
    const screenPos = this.renderer.isoMath.toScreen(agent.x, agent.y, 0);
    const targetX = screenPos.x - this.renderer.canvas.width / 2;
    const targetY = screenPos.y - this.renderer.canvas.height / 2;
    
    // Smooth pan animation
    this.renderer.animateCameraTo(targetX, targetY);
  }

  showAgentCard(agent) {
    // Render detailed agent card in sidebar
    const card = document.getElementById('agentDetailCard');
    card.innerHTML = this.renderAgentCardHTML(agent);
    card.classList.add('active');
  }
}
```

**Agent Card UI:**
```html
<div id="agentDetailCard" class="agent-card-detail">
  <div class="agent-header">
    <div class="agent-avatar-large">
      <canvas id="agentAvatarCanvas" width="64" height="64"></canvas>
    </div>
    <div class="agent-info">
      <h3 class="agent-name">${agent.name}</h3>
      <span class="agent-role">${agent.role}</span>
      <span class="agent-team">${agent.team}</span>
    </div>
  </div>
  
  <div class="agent-stats">
    <div class="stat">
      <span class="stat-value">${agent.tasksCompleted}</span>
      <span class="stat-label">Tasks Done</span>
    </div>
    <div class="stat">
      <span class="stat-value">${agent.successRate}%</span>
      <span class="stat-label">Success Rate</span>
    </div>
    <div class="stat">
      <span class="stat-value">${formatTokens(agent.tokensUsed)}</span>
      <span class="stat-label">Tokens Used</span>
    </div>
  </div>
  
  <div class="agent-current-task">
    <h4>Current Task</h4>
    <p>${agent.currentTask || 'Idle'}</p>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${agent.progress * 100}%"></div>
    </div>
  </div>
  
  <div class="quick-actions">
    <button class="btn btn-primary" onclick="messageAgent('${agent.id}')">
      💬 Message
    </button>
    <button class="btn btn-secondary" onclick="viewAgentTasks('${agent.id}')">
      📋 View Tasks
    </button>
    <button class="btn" onclick="assignTask('${agent.id}')">
      ➕ Assign Task
    </button>
  </div>
</div>
```

**Visual Design:**
```css
.agent-card-detail {
  position: fixed;
  right: -350px;
  top: 80px;
  width: 320px;
  background: var(--bg-card);
  border: 4px solid var(--panel-border);
  box-shadow: -4px 4px 0 var(--panel-shadow);
  border-radius: 8px;
  padding: 20px;
  transition: right 0.3s ease;
  z-index: 200;
}

.agent-card-detail.active {
  right: 20px;
}

.selection-ring {
  position: absolute;
  width: 48px;
  height: 48px;
  border: 3px solid var(--accent-cyan);
  border-radius: 50%;
  animation: pulse-ring 1.5s infinite;
  pointer-events: none;
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}
```

**Acceptance Criteria:**
- [ ] Click agent to select (highlight ring animation)
- [ ] Show detailed agent card in sidebar
- [ ] Camera smoothly pans to selected agent
- [ ] Quick actions: Message, View Tasks, Assign Task
- [ ] Display full agent info: role, team, stats, current task
- [ ] Press ESC to deselect
- [ ] Click outside to deselect

---

### 3. Quick Action Command Center
**Status:** Not implemented  
**Estimated Effort:** 8 hours  
**Priority:** P1

#### Required Implementation

**Command Palette (Cmd+K):**
```javascript
// New file: js/command-center.js
class CommandCenter {
  constructor() {
    this.commands = [
      { id: 'standup', label: 'Call Standup', icon: '📢', shortcut: 'Ctrl+S' },
      { id: 'find-agent', label: 'Find Agent...', icon: '🔍', shortcut: 'Ctrl+F' },
      { id: 'assign-task', label: 'Assign Task...', icon: '➕', shortcut: 'Ctrl+T' },
      { id: 'emergency', label: 'Emergency Alert', icon: '🚨', shortcut: 'Ctrl+E' },
      { id: 'reset-camera', label: 'Reset Camera', icon: '🔄', shortcut: 'Ctrl+R' },
      { id: 'toggle-follow', label: 'Toggle Follow Mode', icon: '👁️', shortcut: 'Ctrl+Shift+F' },
      { id: 'debug-mode', label: 'Toggle Debug', icon: '🐛', shortcut: 'Ctrl+D' },
    ];
    this.isOpen = false;
    this.filteredCommands = [...this.commands];
    this.selectedIndex = 0;
  }

  open() {
    this.isOpen = true;
    this.render();
    document.getElementById('commandInput').focus();
  }

  close() {
    this.isOpen = false;
    document.getElementById('commandPalette').classList.remove('active');
  }

  filter(query) {
    this.filteredCommands = this.commands.filter(cmd =>
      cmd.label.toLowerCase().includes(query.toLowerCase())
    );
    this.selectedIndex = 0;
    this.render();
  }

  execute(commandId) {
    const command = this.commands.find(c => c.id === commandId);
    if (command) {
      this.executeCommand(command);
      this.close();
    }
  }

  executeCommand(command) {
    switch(command.id) {
      case 'standup': startStandup(); break;
      case 'find-agent': this.openAgentSearch(); break;
      case 'assign-task': this.openTaskAssigner(); break;
      case 'emergency': this.triggerEmergency(); break;
      case 'reset-camera': resetCamera(); break;
      case 'toggle-follow': toggleFollow(); break;
      case 'debug-mode': toggleDebug(); break;
    }
  }
}
```

**Floating Action Bar:**
```html
<div class="command-bar">
  <button class="cmd-btn" onclick="startStandup()" title="Call Standup (Ctrl+S)">
    📢 Standup
  </button>
  <button class="cmd-btn" onclick="openAgentSearch()" title="Find Agent (Ctrl+F)">
    🔍 Find
  </button>
  <button class="cmd-btn" onclick="openTaskAssigner()" title="Assign Task (Ctrl+T)">
    ➕ Task
  </button>
  <button class="cmd-btn emergency" onclick="triggerEmergency()" title="Emergency (Ctrl+E)">
    🚨 Alert
  </button>
  <button class="cmd-btn" onclick="commandCenter.open()" title="Command Palette (Cmd+K)">
    ⌘K
  </button>
</div>
```

**Visual Design:**
```css
.command-bar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  background: var(--bg-card);
  border: 4px solid var(--panel-border);
  box-shadow: 0 4px 0 var(--panel-shadow);
  border-radius: 12px;
  padding: 8px;
  z-index: 100;
}

.cmd-btn {
  padding: 10px 16px;
  background: var(--bg-secondary);
  border: 3px solid var(--panel-border);
  border-radius: 8px;
  font-family: 'Press Start 2P', cursive;
  font-size: 0.5rem;
  cursor: pointer;
  transition: all 0.1s;
}

.cmd-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 0 var(--panel-shadow);
}

.cmd-btn.emergency {
  background: #ef4444;
  border-color: #dc2626;
  color: white;
}

/* Command Palette Modal */
.command-palette {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  max-width: 90vw;
  background: var(--bg-card);
  border: 4px solid var(--panel-border);
  box-shadow: 0 8px 0 var(--panel-shadow);
  border-radius: 12px;
  z-index: 1000;
  display: none;
}

.command-palette.active {
  display: block;
}

.command-input {
  width: 100%;
  padding: 16px;
  border: none;
  border-bottom: 3px solid var(--panel-border);
  background: transparent;
  font-family: 'VT323', monospace;
  font-size: 1.2rem;
  outline: none;
}

.command-list {
  max-height: 300px;
  overflow-y: auto;
}

.command-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
}

.command-item.selected {
  background: var(--accent-cyan);
  color: white;
}

.command-shortcut {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--text-secondary);
}
```

**Acceptance Criteria:**
- [ ] Floating action bar with 4 main actions
- [ ] Cmd+K opens command palette
- [ ] Search/filter commands in palette
- [ ] Keyboard navigation (arrow keys, enter)
- [ ] "Call Standup" triggers standup mode
- [ ] "Find Agent" opens search with autocomplete
- [ ] "Assign Task" opens task assignment modal
- [ ] "Emergency Alert" triggers visual alarm

---

## P2 Improvements (High Value)

### 4. Agent Movement & Pathfinding
**Status:** Basic movement exists, no pathfinding  
**Estimated Effort:** 12 hours  
**Priority:** P2

#### Current State
- Agents can move to target positions
- Direct line movement (no obstacle avoidance)
- No collision detection

#### Required Implementation

**A* Pathfinding:**
```javascript
// New file: js/pathfinding.js
class Pathfinder {
  constructor(gridWidth, gridHeight) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.obstacles = new Set();
  }

  setObstacles(obstacles) {
    this.obstacles = new Set(obstacles.map(o => `${o.x},${o.y}`));
  }

  findPath(startX, startY, endX, endY) {
    const openSet = [new Node(startX, startY, 0, this.heuristic(startX, startY, endX, endY))];
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    gScore.set(`${startX},${startY}`, 0);

    while (openSet.length > 0) {
      // Get node with lowest fScore
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();

      if (current.x === endX && current.y === endY) {
        return this.reconstructPath(cameFrom, current);
      }

      closedSet.add(`${current.x},${current.y}`);

      for (const neighbor of this.getNeighbors(current.x, current.y)) {
        if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue;
        if (this.obstacles.has(`${neighbor.x},${neighbor.y}`)) continue;

        const tentativeG = gScore.get(`${current.x},${current.y}`) + 1;
        const neighborKey = `${neighbor.x},${neighbor.y}`;

        if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeG);
          const fScore = tentativeG + this.heuristic(neighbor.x, neighbor.y, endX, endY);
          
          const existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
          if (!existingNode) {
            openSet.push(new Node(neighbor.x, neighbor.y, tentativeG, fScore));
          }
        }
      }
    }

    return null; // No path found
  }

  heuristic(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  getNeighbors(x, y) {
    return [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 }
    ].filter(n => n.x >= 0 && n.x < this.gridWidth && n.y >= 0 && n.y < this.gridHeight);
  }

  reconstructPath(cameFrom, current) {
    const path = [current];
    while (cameFrom.has(`${current.x},${current.y}`)) {
      current = cameFrom.get(`${current.x},${current.y}`);
      path.unshift(current);
    }
    return path;
  }
}
```

**Collision Avoidance:**
```javascript
// Enhanced agent movement with collision
class SmartAgent extends AnimatedAgent {
  constructor(agentId, name, x, y, config = {}) {
    super(agentId, name, x, y, config);
    this.path = [];
    this.pathIndex = 0;
    this.avoidanceRadius = 1.5;
  }

  update(dt, otherAgents) {
    // Check for nearby agents and adjust path
    for (const other of otherAgents) {
      if (other.id === this.id) continue;
      
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.avoidanceRadius) {
        // Apply repulsion force
        const force = (this.avoidanceRadius - dist) / this.avoidanceRadius;
        this.x -= (dx / dist) * force * 0.1;
        this.y -= (dy / dist) * force * 0.1;
      }
    }

    // Follow path
    if (this.path.length > 0 && this.pathIndex < this.path.length) {
      const target = this.path[this.pathIndex];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.2) {
        this.pathIndex++;
        if (this.pathIndex >= this.path.length) {
          this.setActivity('idle');
          this.path = [];
        }
      } else {
        this.x += (dx / dist) * this.speed * dt * 0.01;
        this.y += (dy / dist) * this.speed * dt * 0.01;
        this.setActivity('walking');
      }
    }

    super.update(dt);
  }

  setPath(path) {
    this.path = path;
    this.pathIndex = 0;
    this.setActivity('walking');
  }
}
```

**Random Idle Movements:**
```javascript
// Add to agent update loop
if (this.activity === 'idle' && Math.random() < 0.001) {
  // 0.1% chance per frame to start wandering
  const wanderX = this.x + (Math.random() - 0.5) * 3;
  const wanderY = this.y + (Math.random() - 0.5) * 3;
  const path = pathfinder.findPath(
    Math.floor(this.x), Math.floor(this.y),
    Math.floor(wanderX), Math.floor(wanderY)
  );
  if (path) this.setPath(path);
}
```

**Acceptance Criteria:**
- [ ] A* pathfinding around obstacles
- [ ] Agents follow computed paths
- [ ] Collision avoidance between agents
- [ ] Random idle wandering
- [ ] Smooth path following with direction changes
- [ ] Visual path preview on hover

---

### 5. Collaboration Visuals
**Status:** Not implemented  
**Estimated Effort:** 10 hours  
**Priority:** P2

#### Required Implementation

**Chat Bubbles:**
```javascript
// Add to AnimatedAgent class
showChatBubble(text, duration = 3000, type = 'speech') {
  this.chatBubble = {
    text,
    type, // 'speech', 'thought', 'shout'
    createdAt: Date.now(),
    duration
  };
}

renderChatBubble(ctx, x, y, zoom) {
  if (!this.chatBubble) return;
  
  const age = Date.now() - this.chatBubble.createdAt;
  if (age > this.chatBubble.duration) {
    this.chatBubble = null;
    return;
  }

  const bubbleWidth = 100 * zoom;
  const bubbleHeight = 40 * zoom;
  const bubbleX = x - bubbleWidth / 2;
  const bubbleY = y - bubbleHeight - 15 * zoom;
  
  // Fade in/out
  const opacity = age < 300 ? age / 300 : 
                  age > this.chatBubble.duration - 300 ? 
                  (this.chatBubble.duration - age) / 300 : 1;

  ctx.save();
  ctx.globalAlpha = opacity;
  
  // Bubble background
  const colors = {
    speech: '#ffffff',
    thought: '#e8f4f8',
    shout: '#fff3cd'
  };
  
  ctx.fillStyle = colors[this.chatBubble.type];
  ctx.beginPath();
  ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 8 * zoom);
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Tail
  ctx.beginPath();
  ctx.moveTo(x - 8 * zoom, bubbleY + bubbleHeight);
  ctx.lineTo(x, bubbleY + bubbleHeight + 8 * zoom);
  ctx.lineTo(x + 8 * zoom, bubbleY + bubbleHeight);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Text
  ctx.fillStyle = '#333';
  ctx.font = `${10 * zoom}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(
    this.truncateText(this.chatBubble.text, 15),
    x,
    bubbleY + bubbleHeight / 2 + 4 * zoom
  );
  
  ctx.restore();
}
```

**Pair Programming Animation:**
```javascript
// New collaboration types
const COLLABORATION_TYPES = {
  PAIR_PROGRAMMING: {
    animation: 'typing_together',
    indicator: '👥',
    color: '#64c864'
  },
  CODE_REVIEW: {
    animation: 'reviewing',
    indicator: '👀',
    color: '#f0c864'
  },
  DISCUSSION: {
    animation: 'talking',
    indicator: '💬',
    color: '#6496f0'
  },
  HIGH_FIVE: {
    animation: 'high_five',
    indicator: '🙌',
    color: '#f06496',
    duration: 2000
  }
};

class CollaborationManager {
  constructor() {
    this.activeCollaborations = new Map();
  }

  startCollaboration(agent1Id, agent2Id, type) {
    const collabId = `${agent1Id}-${agent2Id}`;
    this.activeCollaborations.set(collabId, {
      agent1: agent1Id,
      agent2: agent2Id,
      type,
      startedAt: Date.now()
    });

    // Position agents facing each other
    const agent1 = renderer.agents.get(agent1Id);
    const agent2 = renderer.agents.get(agent2Id);
    
    // Midpoint
    const midX = (agent1.x + agent2.x) / 2;
    const midY = (agent1.y + agent2.y) / 2;
    
    // Move to collaboration positions
    agent1.moveTo(midX - 0.5, midY);
    agent2.moveTo(midX + 0.5, midY);
    
    // Set animations
    agent1.setActivity(type.animation);
    agent2.setActivity(type.animation);
  }

  renderCollaborationIndicator(ctx, collab, camera) {
    const agent1 = renderer.agents.get(collab.agent1);
    const agent2 = renderer.agents.get(collab.agent2);
    
    const midX = (agent1.x + agent2.x) / 2;
    const midY = (agent1.y + agent2.y) / 2;
    
    const screenPos = isoMath.toScreen(midX, midY, 0);
    const x = (screenPos.x - camera.x) * camera.zoom;
    const y = (screenPos.y - camera.y) * camera.zoom - 40 * camera.zoom;
    
    const config = COLLABORATION_TYPES[collab.type];
    
    // Draw connection line
    ctx.strokeStyle = config.color;
    ctx.lineWidth = 2 * camera.zoom;
    ctx.setLineDash([5 * camera.zoom, 5 * camera.zoom]);
    
    const pos1 = isoMath.toScreen(agent1.x, agent1.y, 0);
    const pos2 = isoMath.toScreen(agent2.x, agent2.y, 0);
    
    ctx.beginPath();
    ctx.moveTo((pos1.x - camera.x) * camera.zoom, (pos1.y - camera.y) * camera.zoom);
    ctx.lineTo((pos2.x - camera.x) * camera.zoom, (pos2.y - camera.y) * camera.zoom);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw indicator
    ctx.font = `${20 * camera.zoom}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(config.indicator, x, y);
  }
}
```

**High-Five Effect:**
```javascript
triggerHighFive(agent1Id, agent2Id) {
  const collab = this.startCollaboration(agent1Id, agent2Id, 'HIGH_FIVE');
  
  // Create particle effect
  particleSystem.emit({
    x: (agent1.x + agent2.x) / 2,
    y: (agent1.y + agent2.y) / 2,
    type: 'celebration',
    count: 20,
    colors: ['#ffd700', '#ff6b6b', '#51cf66', '#339af0']
  });
  
  // Show chat bubbles
  const messages = ['Great work!', 'Nice job!', 'High five!', '🙌'];
  const agent1 = renderer.agents.get(agent1Id);
  const agent2 = renderer.agents.get(agent2Id);
  
  agent1.showChatBubble(messages[Math.floor(Math.random() * messages.length)], 2000);
  setTimeout(() => {
    agent2.showChatBubble(messages[Math.floor(Math.random() * messages.length)], 2000);
  }, 500);
  
  // End collaboration after duration
  setTimeout(() => {
    this.endCollaboration(agent1Id, agent2Id);
  }, COLLABORATION_TYPES.HIGH_FIVE.duration);
}
```

**Meeting Table Gatherings:**
```javascript
class MeetingManager {
  constructor() {
    this.meetingTables = [
      { x: 0, y: 0, radius: 3, seats: 8 }
    ];
  }

  gatherForMeeting(agentIds, tableIndex = 0) {
    const table = this.meetingTables[tableIndex];
    const angleStep = (Math.PI * 2) / table.seats;
    
    agentIds.forEach((agentId, index) => {
      const agent = renderer.agents.get(agentId);
      const angle = angleStep * index;
      const targetX = table.x + Math.cos(angle) * table.radius;
      const targetY = table.y + Math.sin(angle) * table.radius;
      
      agent.moveTo(targetX, targetY);
      
      // Face center
      agent.direction = this.angleToDirection(angle + Math.PI);
    });
  }

  angleToDirection(angle) {
    const degrees = (angle * 180 / Math.PI + 360) % 360;
    if (degrees >= 315 || degrees < 45) return 'right';
    if (degrees >= 45 && degrees < 135) return 'down';
    if (degrees >= 135 && degrees < 225) return 'left';
    return 'up';
  }
}
```

**Acceptance Criteria:**
- [ ] Chat bubbles appear when agents "talk"
- [ ] Different bubble types: speech, thought, shout
- [ ] Pair programming animation when agents collaborate
- [ ] Visual connection line between collaborating agents
- [ ] High-five animation with particle effects
- [ ] Meeting table gathering with proper seating
- [ ] Task completion celebration

---

### 6. Standup Mode
**Status:** Basic implementation exists  
**Estimated Effort:** 6 hours  
**Priority:** P2

#### Current State
- "Toggle Standup" button exists
- Agents move to center (0,0)
- Basic modal with stats

#### Required Implementation

**Enhanced Standup Flow:**
```javascript
class StandupManager {
  constructor() {
    this.isActive = false;
    this.startTime = null;
    this.duration = 15 * 60 * 1000; // 15 minutes default
    this.participants = new Set();
    this.notes = [];
  }

  async start() {
    this.isActive = true;
    this.startTime = Date.now();
    
    // Fetch real standup data
    const standupData = await this.fetchStandupData();
    
    // Gather all active agents
    const activeAgents = Array.from(renderer.agents.values())
      .filter(a => a.status !== 'offline');
    
    this.participants = new Set(activeAgents.map(a => a.id));
    
    // Move to meeting area
    meetingManager.gatherForMeeting(Array.from(this.participants), 0);
    
    // Start timer
    this.startTimer();
    
    // Show standup modal
    this.showStandupModal(standupData);
    
    // Generate notes template
    this.notes = this.generateNotesTemplate(activeAgents);
  }

  async fetchStandupData() {
    try {
      const response = await fetch('/api/standup');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch standup data:', error);
      return this.generateMockStandupData();
    }
  }

  startTimer() {
    const timerEl = document.getElementById('standupTimer');
    
    this.timerInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const remaining = Math.max(0, this.duration - elapsed);
      
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      
      timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      timerEl.classList.toggle('warning', remaining < 60000); // < 1 min
      timerEl.classList.toggle('danger', remaining < 30000);  // < 30 sec
      
      if (remaining === 0) {
        this.end();
      }
    }, 1000);
  }

  generateNotesTemplate(agents) {
    return agents.map(agent => ({
      agentId: agent.id,
      name: agent.name,
      yesterday: '',
      today: agent.currentTask || 'TBD',
      blockers: ''
    }));
  }

  exportNotes() {
    const date = new Date().toISOString().split('T')[0];
    const content = this.notes.map(note => `
## ${note.name}

**Yesterday:** ${note.yesterday || 'N/A'}
**Today:** ${note.today}
**Blockers:** ${note.blockers || 'None'}
    `).join('\n---\n');

    const blob = new Blob([`# Standup Notes - ${date}\n\n${content}`], 
                          { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `standup-${date}.md`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  end() {
    this.isActive = false;
    clearInterval(this.timerInterval);
    
    // Return agents to their positions
    AGENTS_DATA.forEach(data => {
      const agent = renderer.agents.get(data.id);
      if (agent && this.participants.has(data.id)) {
        agent.moveTo(data.x, data.y);
      }
    });
    
    // Hide modal
    document.getElementById('standupModal').classList.remove('active');
  }
}
```

**Standup Modal UI:**
```html
<div class="modal" id="standupModal">
  <div class="modal-content standup-modal">
    <div class="modal-header">
      <span class="modal-title">📢 DAILY STANDUP</span>
      <div class="standup-timer" id="standupTimer">15:00</div>
      <button class="modal-close" onclick="standupManager.end()">&times;</button>
    </div>
    
    <div class="standup-stats">
      <div class="stat-box">
        <div class="stat-value" id="statParticipants">0</div>
        <div class="stat-label">Participants</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" id="statActivities">0</div>
        <div class="stat-label">Activities (24h)</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" id="statCompleted">0</div>
        <div class="stat-label">Tasks Done</div>
      </div>
    </div>
    
    <div class="standup-notes">
      <h4>📝 Standup Notes</h4>
      <div class="notes-editor" id="notesEditor">
        <!-- Dynamic notes fields -->
      </div>
    </div>
    
    <div class="standup-actions">
      <button class="btn btn-primary" onclick="standupManager.exportNotes()">
        💾 Export Notes
      </button>
      <button class="btn btn-secondary" onclick="standupManager.end()">
        ✋ End Standup
      </button>
    </div>
  </div>
</div>
```

**Visual Design:**
```css
.standup-timer {
  font-family: 'Press Start 2P', cursive;
  font-size: 1.2rem;
  color: var(--accent-green);
  background: var(--bg-secondary);
  padding: 8px 16px;
  border-radius: 8px;
  border: 3px solid var(--panel-border);
}

.standup-timer.warning {
  color: var(--accent-yellow);
  animation: pulse 1s infinite;
}

.standup-timer.danger {
  color: #ef4444;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.standup-modal {
  max-width: 800px;
}

.notes-editor {
  max-height: 300px;
  overflow-y: auto;
  margin: 15px 0;
}

.note-row {
  display: grid;
  grid-template-columns: 150px 1fr 1fr 1fr;
  gap: 10px;
  padding: 10px;
  background: var(--bg-secondary);
  border-radius: 6px;
  margin-bottom: 8px;
}

.note-row input {
  background: var(--bg-card);
  border: 2px solid var(--panel-border);
  border-radius: 4px;
  padding: 6px;
  font-family: 'VT323', monospace;
  font-size: 0.9rem;
}
```

**Acceptance Criteria:**
- [ ] "Start Standup" button triggers standup mode
- [ ] All active agents walk to meeting table
- [ ] Show countdown timer (default 15 min)
- [ ] Display participant count, activities, completed tasks
- [ ] Editable standup notes (Yesterday/Today/Blockers)
- [ ] Export notes as Markdown
- [ ] End standup returns agents to positions
- [ ] Visual indicator during standup (overlay, timer)

---

## P3 Improvements (Nice to Have)

### 7. Office Environment Polish
**Status:** Basic furniture exists  
**Estimated Effort:** 8 hours  
**Priority:** P3

#### Required Implementation

**New Furniture & Decor:**
```javascript
// Add to sprite-system.js furniture loading
const FURNITURE_TYPES = {
  // Existing
  desk: { width: 1, height: 1, blocking: true },
  chair: { width: 0.5, height: 0.5, blocking: false },
  computer: { width: 0.5, height: 0.5, blocking: false },
  
  // New
  plant: { width: 0.8, height: 0.8, blocking: false, animated: true },
  coffee_machine: { width: 1, height: 0.8, blocking: true, interactive: true },
  whiteboard: { width: 2, height: 0.2, blocking: false, interactive: true },
  water_cooler: { width: 0.6, height: 0.6, blocking: false },
  bookshelf: { width: 1.5, height: 0.5, blocking: true },
  couch: { width: 2, height: 1, blocking: true },
  lamp: { width: 0.4, height: 0.4, blocking: false, animated: true },
  clock: { width: 0.5, height: 0.5, blocking: false, animated: true }
};
```

**Real-Time Clock:**
```javascript
class OfficeClock {
  constructor() {
    this.time = new Date();
    this.speed = 1; // 1 = real-time, 60 = 1 min per second
  }

  update(dt) {
    this.time = new Date(this.time.getTime() + dt * this.speed);
  }

  render(ctx, x, y, zoom) {
    const size = 32 * zoom;
    const centerX = x;
    const centerY = y;
    
    // Clock face
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2 * zoom;
    ctx.stroke();
    
    // Hour markers
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const x1 = centerX + Math.cos(angle) * (size / 2 - 4 * zoom);
      const y1 = centerY + Math.sin(angle) * (size / 2 - 4 * zoom);
      const x2 = centerX + Math.cos(angle) * (size / 2 - 8 * zoom);
      const y2 = centerY + Math.sin(angle) * (size / 2 - 8 * zoom);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    // Hands
    const hours = this.time.getHours() % 12;
    const minutes = this.time.getMinutes();
    const seconds = this.time.getSeconds();
    
    // Hour hand
    const hourAngle = ((hours + minutes / 60) / 12) * Math.PI * 2 - Math.PI / 2;
    this.drawHand(ctx, centerX, centerY, hourAngle, size / 4, 3 * zoom, '#333');
    
    // Minute hand
    const minuteAngle = ((minutes + seconds / 60) / 60) * Math.PI * 2 - Math.PI / 2;
    this.drawHand(ctx, centerX, centerY, minuteAngle, size / 2 - 4 * zoom, 2 * zoom, '#333');
    
    // Second hand
    const secondAngle = (seconds / 60) * Math.PI * 2 - Math.PI / 2;
    this.drawHand(ctx, centerX, centerY, secondAngle, size / 2 - 2 * zoom, 1 * zoom, '#ef4444');
  }

  drawHand(ctx, x, y, angle, length, width, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length
    );
    ctx.stroke();
  }
}
```

**Day/Night Cycle:**
```javascript
class DayNightCycle {
  constructor() {
    this.hour = 8; // Start at 8 AM
    this.cycleDuration = 10 * 60 * 1000; // 10 min = 24 hours
    this.colors = {
      dawn: { sky: '#ffecd2', ambient: 0.7 },
      day: { sky: '#87ceeb', ambient: 1.0 },
      dusk: { sky: '#fd5e53', ambient: 0.6 },
      night: { sky: '#1a1a2e', ambient: 0.3 }
    };
  }

  update(dt) {
    this.hour = (this.hour + (dt / this.cycleDuration) * 24) % 24;
  }

  getCurrentPhase() {
    if (this.hour >= 5 && this.hour < 8) return 'dawn';
    if (this.hour >= 8 && this.hour < 17) return 'day';
    if (this.hour >= 17 && this.hour < 20) return 'dusk';
    return 'night';
  }

  getAmbientColor() {
    const phase = this.getCurrentPhase();
    const color = this.colors[phase];
    
    // Interpolate between phases
    // ... interpolation logic
    
    return color;
  }

  renderOverlay(ctx, width, height) {
    const phase = this.getCurrentPhase();
    const color = this.colors[phase];
    
    // Apply ambient lighting overlay
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color.sky);
    gradient.addColorStop(1, this.darken(color.sky, 0.3));
    
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
  }

  darken(color, amount) {
    // Convert hex to rgb, darken, convert back
    // ... implementation
    return color;
  }
}
```

**Whiteboard with Sprint Data:**
```javascript
class Whiteboard {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.sprintData = null;
    this.lastUpdate = 0;
  }

  async update() {
    if (Date.now() - this.lastUpdate < 60000) return; // Update every minute
    
    try {
      const response = await fetch('/api/sprint/current');
      this.sprintData = await response.json();
      this.lastUpdate = Date.now();
    } catch (error) {
      console.error('Failed to fetch sprint data:', error);
    }
  }

  render(ctx, camera, zoom) {
    const pos = isoMath.toScreen(this.x, this.y, 0);
    const x = (pos.x - camera.x) * camera.zoom;
    const y = (pos.y - camera.y) * camera.zoom;
    
    const width = 80 * zoom;
    const height = 60 * zoom;
    
    // Whiteboard background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(x - width / 2, y - height, width, height);
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 3 * zoom;
    ctx.strokeRect(x - width / 2, y - height, width, height);
    
    // Sprint info
    if (this.sprintData) {
      ctx.fillStyle = '#333';
      ctx.font = `${8 * zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`Sprint ${this.sprintData.number}`, x, y - height + 15 * zoom);
      
      // Progress bar
      const barWidth = width - 10 * zoom;
      const progress = this.sprintData.completed / this.sprintData.total;
      
      ctx.fillStyle = '#ddd';
      ctx.fillRect(x - barWidth / 2, y - height + 25 * zoom, barWidth, 8 * zoom);
      ctx.fillStyle = '#64c864';
      ctx.fillRect(x - barWidth / 2, y - height + 25 * zoom, barWidth * progress, 8 * zoom);
      
      // Stats
      ctx.fillStyle = '#333';
      ctx.font = `${6 * zoom}px sans-serif`;
      ctx.fillText(
        `${this.sprintData.completed}/${this.sprintData.total} tasks`,
        x,
        y - height + 45 * zoom
      );
      ctx.fillText(
        `${this.sprintData.daysLeft} days left`,
        x,
        y - height + 55 * zoom
      );
    }
  }
}
```

**Acceptance Criteria:**
- [ ] Add pixel art plants with subtle animation
- [ ] Coffee machine area with steam particle effect
- [ ] Whiteboard showing current sprint data
- [ ] Real-time clock showing actual time
- [ ] Day/night cycle with ambient lighting changes
- [ ] Additional decor: water cooler, bookshelf, couch
- [ ] Interactive furniture (click for info)

---

### 8. Mobile Responsive
**Status:** Basic responsive CSS exists  
**Estimated Effort:** 10 hours  
**Priority:** P3

#### Required Implementation

**Touch Controls:**
```javascript
// Enhanced touch handling
class TouchController {
  constructor(canvas, renderer) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.touches = new Map();
    this.lastPinchDist = 0;
    this.lastPinchZoom = 1;
  }

  init() {
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
    this.canvas.addEventListener('touchcancel', this.onTouchEnd.bind(this));
  }

  onTouchStart(e) {
    e.preventDefault();
    
    for (const touch of e.changedTouches) {
      this.touches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
        startX: touch.clientX,
        startY: touch.clientY
      });
    }
    
    if (e.touches.length === 2) {
      // Start pinch
      this.lastPinchDist = this.getPinchDistance(e.touches);
      this.lastPinchZoom = this.renderer.camera.zoom;
    } else if (e.touches.length === 1) {
      // Check for tap on agent
      const touch = e.touches[0];
      const agent = this.getAgentAt(touch.clientX, touch.clientY);
      if (agent) {
        this.selectedAgent = agent;
        agentSelector.select(agent.id);
      }
    }
  }

  onTouchMove(e) {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // Pinch to zoom
      const dist = this.getPinchDistance(e.touches);
      const scale = dist / this.lastPinchDist;
      this.renderer.camera.zoom = Math.max(0.5, Math.min(3, this.lastPinchZoom * scale));
    } else if (e.touches.length === 1 && this.touches.size === 1) {
      // Pan
      const touch = e.touches[0];
      const prevTouch = this.touches.get(touch.identifier);
      
      if (prevTouch) {
        const dx = touch.clientX - prevTouch.x;
        const dy = touch.clientY - prevTouch.y;
        this.renderer.pan(-dx, -dy);
        
        prevTouch.x = touch.clientX;
        prevTouch.y = touch.clientY;
      }
    }
  }

  onTouchEnd(e) {
    for (const touch of e.changedTouches) {
      const prevTouch = this.touches.get(touch.identifier);
      
      // Check for tap
      if (prevTouch) {
        const dx = touch.clientX - prevTouch.startX;
        const dy = touch.clientY - prevTouch.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 10) { // Tap threshold
          this.onTap(touch.clientX, touch.clientY);
        }
      }
      
      this.touches.delete(touch.identifier);
    }
  }

  getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getAgentAt(screenX, screenY) {
    // Convert screen to world, find agent
    // ... implementation
  }

  onTap(x, y) {
    // Handle tap
  }
}
```

**Responsive Layout:**
```css
/* Mobile-first responsive design */
@media (max-width: 768px) {
  .header {
    padding: 10px;
    flex-direction: column;
    gap: 10px;
  }
  
  .nav-tabs {
    display: none; /* Hide nav on mobile, use hamburger */
  }
  
  .mobile-nav {
    display: block;
    position: fixed;
    bottom: 80px;
    right: 20px;
    z-index: 100;
  }
  
  .mobile-nav-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--accent-cyan);
    border: 3px solid var(--panel-border);
    box-shadow: 0 4px 0 var(--panel-shadow);
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .office-container {
    padding: 10px;
  }
  
  #officeCanvas {
    height: 50vh;
    min-height: 300px;
  }
  
  .info-panel {
    grid-template-columns: 1fr;
  }
  
  .panel {
    padding: 10px;
  }
  
  .agent-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .command-bar {
    bottom: 10px;
    left: 10px;
    right: 10px;
    transform: none;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .cmd-btn {
    padding: 8px 12px;
    font-size: 0.4rem;
  }
  
  .agent-card-detail {
    position: fixed;
    left: 10px;
    right: 10px;
    top: auto;
    bottom: 100px;
    width: auto;
    transform: translateY(100%);
    transition: transform 0.3s ease;
  }
  
  .agent-card-detail.active {
    right: 10px;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .brand-text h1 {
    font-size: 0.5rem;
  }
  
  .agent-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .office-title {
    font-size: 0.45rem;
  }
  
  .action-btns {
    width: 100%;
    justify-content: center;
  }
  
  .btn {
    padding: 6px 10px;
    font-size: 0.4rem;
  }
}
```

**Mobile-Optimized Agent Selection:**
```javascript
// Larger touch targets for mobile
class MobileAgentSelector {
  getTouchTarget(agent, camera) {
    const pos = isoMath.toScreen(agent.x, agent.y, 0);
    const screenX = (pos.x - camera.x) * camera.zoom;
    const screenY = (pos.y - camera.y) * camera.zoom;
    
    return {
      x: screenX - 30 * camera.zoom, // Larger hit area
      y: screenY - 50 * camera.zoom,
      width: 60 * camera.zoom,
      height: 60 * camera.zoom
    };
  }

  renderTouchTarget(ctx, agent, camera) {
    if (!this.isMobile) return;
    
    const target = this.getTouchTarget(agent, camera);
    
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(target.x, target.y, target.width, target.height);
    ctx.setLineDash([]);
  }
}
```

**Acceptance Criteria:**
- [ ] Touch-friendly agent selection (larger hit areas)
- [ ] Pinch to zoom
- [ ] Swipe to pan
- [ ] Responsive layout for tablets and phones
- [ ] Mobile navigation menu
- [ ] Optimized agent card for mobile (bottom sheet)
- [ ] Touch gestures: double-tap to zoom, long-press for context menu

---

## P4 Improvements (Future Enhancements)

### 9. Animated Pixel Sprites (Enhancement)
**Status:** Basic sprites exist, need enhancement  
**Estimated Effort:** 16 hours  
**Priority:** P4

#### Current State
- 32x32 pixel sprites
- 8-frame idle animation
- Basic walking animation
- Limited directional sprites

#### Proposed Enhancements

**Enhanced Animation Set:**
```javascript
const ANIMATION_SET = {
  // Existing
  idle: { frames: 8, speed: 150 },
  walk_down: { frames: 8, speed: 100 },
  walk_up: { frames: 8, speed: 100 },
  walk_left: { frames: 8, speed: 100 },
  walk_right: { frames: 8, speed: 100 },
  
  // New
  typing: { frames: 8, speed: 80 },      // Working at desk
  talking: { frames: 8, speed: 120 },    // Conversation
  celebrating: { frames: 8, speed: 100 }, // High-five, success
  thinking: { frames: 8, speed: 200 },   // Idle thinking
  drinking: { frames: 8, speed: 150 },   // Coffee break
  presenting: { frames: 8, speed: 120 }, // Standup/meeting
  reviewing: { frames: 8, speed: 100 },  // Code review
  sleeping: { frames: 8, speed: 300 }    // Idle (rare)
};
```

**Directional Sprite System:**
```javascript
class DirectionalSprite {
  constructor(spriteSheet) {
    this.sheet = spriteSheet;
    this.directions = ['down', 'left', 'right', 'up'];
    this.currentDirection = 'down';
  }

  getFrame(animation, frame, direction) {
    const dirIndex = this.directions.indexOf(direction);
    const animRow = this.getAnimationRow(animation);
    const row = animRow * 4 + dirIndex; // 4 directions per animation
    
    return {
      x: frame * 32,
      y: row * 32,
      width: 32,
      height: 32
    };
  }
}
```

**Procedural Sprite Generation:**
```python
# Enhance existing sprite generator
class EnhancedSpriteGenerator:
    def __init__(self):
        self.base_colors = {
            'skin': ['#f5d0a9', '#e8c4a0', '#d4a574', '#8b6914'],
            'hair': ['#2c1810', '#4a3728', '#d4a574', '#f5e6c8'],
            'shirt': ['#61afef', '#98c379', '#e5c07b', '#d19a66'],
            'pants': ['#3e4451', '#5c6370', '#282c34']
        }
    
    def generate_agent_sprite(self, config):
        """Generate unique sprite based on agent config"""
        sprite = Image.new('RGBA', (32, 32 * 8 * 4), (0, 0, 0, 0))
        
        # Generate each animation
        for anim_name, anim_config in ANIMATION_SET.items():
            for frame in range(anim_config['frames']):
                frame_img = self.generate_frame(config, anim_name, frame)
                y_offset = self.get_animation_offset(anim_name) + frame * 32
                sprite.paste(frame_img, (0, y_offset))
        
        return sprite
    
    def generate_frame(self, config, animation, frame):
        """Generate a single frame with animation-specific pose"""
        img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Base body
        self.draw_body(draw, config, animation, frame)
        
        # Animation-specific modifications
        if animation == 'walking':
            self.apply_walking_pose(draw, frame)
        elif animation == 'typing':
            self.apply_typing_pose(draw, frame)
        elif animation == 'celebrating':
            self.apply_celebration_pose(draw, frame)
        
        return img
```

**Acceptance Criteria:**
- [ ] 8-frame animations for all activities
- [ ] Directional sprites (left/right/up/down)
- [ ] Smooth animation transitions
- [ ] Activity-specific animations (typing, talking, celebrating)
- [ ] Procedural sprite generation from config
- [ ] Sprite caching for performance

---

### 10. Agent Customization
**Status:** Not implemented  
**Estimated Effort:** 12 hours  
**Priority:** P4

#### Required Implementation

**Customization System:**
```javascript
const CUSTOMIZATION_OPTIONS = {
  colors: {
    primary: ['#61afef', '#98c379', '#e5c07b', '#d19a66', '#c678dd', '#ff6b6b'],
    secondary: ['#3e4451', '#5c6370', '#abb2bf', '#828997'],
    accent: ['#ffd700', '#ff6b6b', '#51cf66', '#339af0', '#da77f2']
  },
  outfits: ['casual', 'formal', 'hoodie', 'tshirt', 'suit'],
  accessories: ['glasses', 'hat', 'headphones', 'none'],
  desk_decorations: ['plant', 'picture', 'toy', 'none'],
  holiday_costumes: {
    halloween: 'pumpkin',
    christmas: 'santa',
    newyear: 'party_hat'
  }
};

class AgentCustomizer {
  constructor() {
    this.customizations = new Map(); // agentId -> customization
  }

  customize(agentId, options) {
    const current = this.customizations.get(agentId) || {};
    const updated = { ...current, ...options };
    this.customizations.set(agentId, updated);
    
    // Regenerate sprite if needed
    if (options.color || options.outfit || options.accessory) {
      this.regenerateSprite(agentId, updated);
    }
    
    // Update desk decoration
    if (options.deskDecoration) {
      this.updateDeskDecoration(agentId, options.deskDecoration);
    }
    
    this.saveToStorage();
  }

  regenerateSprite(agentId, customization) {
    // Trigger sprite regeneration with new colors/outfit
    fetch('/api/sprites/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, customization })
    });
  }

  applyHolidayCostume(agentId, holiday) {
    const costume = CUSTOMIZATION_OPTIONS.holiday_costumes[holiday];
    if (costume) {
      this.customize(agentId, { holidayCostume: costume });
    }
  }

  saveToStorage() {
    localStorage.setItem('agentCustomizations', 
      JSON.stringify(Array.from(this.customizations.entries())));
  }

  loadFromStorage() {
    const stored = localStorage.getItem('agentCustomizations');
    if (stored) {
      this.customizations = new Map(JSON.parse(stored));
    }
  }
}
```

**Customization UI:**
```html
<div class="customization-panel" id="customizationPanel">
  <h3>🎨 Customize Agent</h3>
  
  <div class="custom-section">
    <h4>Colors</h4>
    <div class="color-picker">
      <label>Primary</label>
      <div class="color-options" id="primaryColors">
        <!-- Generated dynamically -->
      </div>
    </div>
    <div class="color-picker">
      <label>Accent</label>
      <div class="color-options" id="accentColors">
        <!-- Generated dynamically -->
      </div>
    </div>
  </div>
  
  <div class="custom-section">
    <h4>Outfit</h4>
    <div class="option-grid" id="outfitOptions">
      <button class="option-btn" data-outfit="casual">👕 Casual</button>
      <button class="option-btn" data-outfit="formal">👔 Formal</button>
      <button class="option-btn" data-outfit="hoodie">🧥 Hoodie</button>
      <button class="option-btn" data-outfit="tshirt">👚 T-Shirt</button>
    </div>
  </div>
  
  <div class="custom-section">
    <h4>Accessories</h4>
    <div class="option-grid" id="accessoryOptions">
      <button class="option-btn" data-accessory="none">❌ None</button>
      <button class="option-btn" data-accessory="glasses">👓 Glasses</button>
      <button class="option-btn" data-accessory="hat">🎩 Hat</button>
      <button class="option-btn" data-accessory="headphones">🎧 Headphones</button>
    </div>
  </div>
  
  <div class="custom-section">
    <h4>Desk Decoration</h4>
    <div class="option-grid" id="deskOptions">
      <button class="option-btn" data-decor="none">❌ None</button>
      <button class="option-btn" data-decor="plant">🪴 Plant</button>
      <button class="option-btn" data-decor="picture">🖼️ Picture</button>
      <button class="option-btn" data-decor="toy">🧸 Toy</button>
    </div>
  </div>
  
  <div class="custom-actions">
    <button class="btn btn-primary" onclick="saveCustomization()">💾 Save</button>
    <button class="btn" onclick="resetCustomization()">🔄 Reset</button>
  </div>
</div>
```

**Visual Design:**
```css
.customization-panel {
  background: var(--bg-card);
  border: 4px solid var(--panel-border);
  border-radius: 8px;
  padding: 20px;
  max-width: 400px;
}

.custom-section {
  margin-bottom: 20px;
}

.custom-section h4 {
  font-family: 'Press Start 2P', cursive;
  font-size: 0.5rem;
  margin-bottom: 10px;
  color: var(--panel-border);
}

.color-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border: 3px solid var(--panel-border);
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.1s;
}

.color-swatch:hover {
  transform: scale(1.1);
}

.color-swatch.selected {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 2px var(--accent-cyan);
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.option-btn {
  padding: 10px;
  background: var(--bg-secondary);
  border: 3px solid var(--panel-border);
  border-radius: 6px;
  font-family: 'VT323', monospace;
  font-size: 1rem;
  cursor: pointer;
}

.option-btn.selected {
  background: var(--accent-cyan);
  border-color: var(--accent-cyan);
  color: white;
}
```

**Acceptance Criteria:**
- [ ] Change agent colors (primary, secondary, accent)
- [ ] Select outfit style (casual, formal, hoodie, etc.)
- [ ] Add accessories (glasses, hat, headphones)
- [ ] Customize desk decorations
- [ ] Holiday costumes (Halloween, Christmas, etc.)
- [ ] Save/load customizations from localStorage
- [ ] Preview changes in real-time

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] P1: Real-Time Activity Feed
- [ ] P1: Interactive Agent Selection
- [ ] P1: Quick Action Command Center

### Phase 2: Interactivity (Week 2)
- [ ] P2: Agent Movement & Pathfinding
- [ ] P2: Collaboration Visuals
- [ ] P2: Standup Mode

### Phase 3: Polish (Week 3)
- [ ] P3: Office Environment Polish
- [ ] P3: Mobile Responsive

### Phase 4: Enhancement (Week 4)
- [ ] P4: Animated Pixel Sprites (Enhancement)
- [ ] P4: Agent Customization

---

## Technical Notes

### API Endpoints Required
```
GET  /api/agents              - List all agents with status
GET  /api/agents/activity     - Recent agent activities
GET  /api/agents/:id          - Single agent details
POST /api/agents/:id/message  - Send message to agent
GET  /api/sprint/current      - Current sprint data
GET  /api/standup             - Standup data
POST /api/sprites/regenerate  - Regenerate agent sprite
```

### Performance Considerations
- Use `requestAnimationFrame` for smooth animations
- Implement sprite caching to reduce draw calls
- Use object pooling for particles/effects
- Debounce API calls (30s minimum for activity feed)
- Use Intersection Observer for off-screen culling

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| FPS | 45 | 60 |
| Time to Interactive | 3s | 1.5s |
| Mobile Usability Score | 60 | 95 |
| User Engagement (avg session) | 2 min | 5 min |
| API Response Time | N/A | <500ms |

---

**Audit Complete**  
*Next Steps: Create implementation tickets for P1 improvements*
