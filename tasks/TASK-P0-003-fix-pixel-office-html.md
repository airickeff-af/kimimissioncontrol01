# TASK-P0-003: Fix pixel-office.html to Use Live API Data

**Priority:** P0  
**Deadline:** 7:00 AM, February 20, 2026  
**Assignee:** Code-3, Forge-3  
**Status:** 🔴 NOT STARTED

---

## Problem
The pixel-office.html page uses a **hardcoded AGENTS_DATA array** and **simulated behavior** instead of real API data:

1. **AGENTS_DATA static array** (lines 189-212): 22 agents hardcoded
2. **TASKS static array** (line 214): Hardcoded task list
3. **Sprite loader has fallback** that always generates fake data
4. **Agent movement is random**, not based on real activity

## Evidence
```javascript
// Current (HARDCODED):
const AGENTS_DATA = [
    { id: 'ericf', name: 'EricF', role: 'Commander', color: '#ffd700', x: -8, y: -6, task: 'Strategic Planning' },
    { id: 'nexus', name: 'Nexus', role: 'Orchestrator', color: '#00d4ff', x: 4, y: -6, task: 'System Coordination' },
    // ... 20 more
];

// Fallback always creates fake sprites:
img.onerror = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 16;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = agent ? agent.color : '#888';  // FAKE!
    // ... generates placeholder
};
```

## Solution

### Step 1: Add API Configuration
```javascript
const API_URL = '/api';
```

### Step 2: Create Data Fetch Function
```javascript
async function fetchAgents() {
    const response = await fetch(`${API_URL}/agents`);
    if (!response.ok) throw new Error('Failed to fetch agents');
    const data = await response.json();
    return data.agents || [];
}

async function fetchActivity() {
    const response = await fetch(`${API_URL}/logs/activity?limit=20`);
    if (!response.ok) throw new Error('Failed to fetch activity');
    const data = await response.json();
    return data.logs || [];
}
```

### Step 3: Map API Data to Agent Class
```javascript
class Agent {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.role = data.role;
        this.color = data.color;
        this.baseX = data.x || getDefaultX(data.role);
        this.baseY = data.y || getDefaultY(data.role);
        this.x = this.baseX;
        this.y = this.baseY;
        this.baseTask = data.currentTask || 'Idle';
        this.currentTask = this.baseTask;
        // ... rest of initialization
    }
    // ...
}
```

### Step 4: Initialize from API
```javascript
async function init() {
    showLoading();
    try {
        const [apiAgents, apiActivity] = await Promise.all([
            fetchAgents(),
            fetchActivity()
        ]);
        
        // Create agents from API data
        AGENTS_DATA = apiAgents.map((agent, index) => ({
            id: agent.id,
            name: agent.name,
            role: agent.role,
            color: agent.color || getRoleColor(agent.role),
            x: getPositionForRole(agent.role, index).x,
            y: getPositionForRole(agent.role, index).y,
            task: agent.currentTask || 'Available'
        }));
        
        // Initialize renderer
        renderer = new OfficeRenderer(canvas);
        AGENTS_DATA.forEach(data => renderer.addAgent(data));
        renderer.start();
        
        hideLoading();
    } catch (error) {
        showError('Failed to load office data: ' + error.message);
    }
}
```

## Files to Modify
- `/root/.openclaw/workspace/pixel-office.html`

## Acceptance Criteria
- [ ] Agents load from `/api/agents`
- [ ] Activity feed loads from `/api/logs/activity`
- [ ] Agent positions based on role from API
- [ ] Agent tasks reflect real current tasks
- [ ] Loading overlay shows during fetch
- [ ] Error message shows on API failure
- [ ] Canvas animation uses real agent data

## Testing
1. Verify 22 agents load from API
2. Verify agent positions match roles
3. Verify activity feed shows real logs
4. Test error handling with API down
