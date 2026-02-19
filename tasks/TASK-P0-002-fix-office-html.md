# TASK-P0-002: Fix office.html to Use Live API Data

**Priority:** P0  
**Deadline:** 7:00 AM, February 20, 2026  
**Assignee:** Code-2, Forge-2  
**Status:** 🔴 NOT STARTED

---

## Problem
The office.html page uses a **hardcoded AGENT_TYPES array** and **simulated random data** instead of real API data:

1. **AGENT_TYPES static array** (lines 156-180): 22 agent types hardcoded
2. **Random productivity values**: `productivity: 70 + Math.random() * 30`
3. **Random task assignments**: `getRandomTask(type.role)`
4. **No API integration**

## Evidence
```javascript
// Current (HARDCODED):
const AGENT_TYPES = [
    { name: 'Nexus', role: 'AI Coordinator', color: '#6b8e6b', crown: true },
    { name: 'Scribe', role: 'Documentation', color: '#8b9dc3', crown: false },
    // ... 20 more
];

// Simulated data:
function initAgents() {
    agents = AGENT_TYPES.map((type, index) => ({
        ...type,
        productivity: 70 + Math.random() * 30,  // FAKE!
        currentTask: getRandomTask(type.role),   // FAKE!
    }));
}
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

async function fetchTasks() {
    const response = await fetch(`${API_URL}/tasks`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    const data = await response.json();
    return data.tasks || [];
}
```

### Step 3: Map API Data to Agent Objects
```javascript
function mapAgentData(apiAgent, apiTasks) {
    const agentTasks = apiTasks.filter(t => t.assignee === apiAgent.name);
    const currentTask = agentTasks.find(t => t.status === 'in_progress');
    
    return {
        id: apiAgent.id,
        name: apiAgent.name,
        role: apiAgent.role,
        color: apiAgent.color || '#6b8e6b',
        crown: apiAgent.role.includes('Lead') || apiAgent.role.includes('CEO'),
        productivity: apiAgent.productivity || calculateProductivity(apiAgent),
        currentTask: currentTask ? currentTask.title : 'Idle',
        status: apiAgent.status || 'idle'
    };
}
```

### Step 4: Initialize from API
```javascript
async function initAgents() {
    showLoading();
    try {
        const [apiAgents, apiTasks] = await Promise.all([
            fetchAgents(),
            fetchTasks()
        ]);
        
        agents = apiAgents.map(a => mapAgentData(a, apiTasks));
        updateAgentList();
        hideLoading();
    } catch (error) {
        showError('Failed to load agent data: ' + error.message);
    }
}
```

## Files to Modify
- `/root/.openclaw/workspace/office.html`

## Acceptance Criteria
- [ ] Agents load from `/api/agents`
- [ ] Tasks load from `/api/tasks`
- [ ] Agent productivity comes from real data, not random
- [ ] Current tasks come from real assignments, not random
- [ ] Loading state shown during fetch
- [ ] Error state shown on API failure
- [ ] Canvas animation uses real agent positions/status

## Testing
1. Verify agents match API response
2. Verify tasks are real assignments
3. Verify productivity reflects actual metrics
4. Test error handling with API down
