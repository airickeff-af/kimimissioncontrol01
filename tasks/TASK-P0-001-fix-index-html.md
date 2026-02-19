# TASK-P0-001: Fix index.html to Use Live API Data

**Priority:** P0  
**Deadline:** 7:00 AM, February 20, 2026  
**Assignee:** Code-1, Forge-1  
**Status:** 🔴 NOT STARTED

---

## Problem
The index.html (HQ) page is displaying **completely hardcoded data** instead of fetching from live APIs:

1. **Hardcoded agents array** (lines 90-280): 23 agents with static values
2. **Hardcoded stats** (lines 47-62): Header stats are static strings
3. **Hardcoded activities** (lines 283-340): 50 activities with fake timestamps
4. **No API calls** whatsoever

## Evidence
```javascript
// Current (HARDCODED):
const agents = [
    { id: "nexus", name: "Nexus", tokens: 75300, files: 156, ... },
    // ... 22 more hardcoded agents
];

// Header stats are static HTML:
<div class="stat-value" style="color: #51cf66;">23</div>
```

## Solution

### Step 1: Add API Configuration
```javascript
const API_URL = '/api';
const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
```

### Step 2: Create Data Fetch Functions
```javascript
async function fetchAgents() {
    const response = await fetch(`${API_URL}/agents`);
    if (!response.ok) throw new Error('Failed to fetch agents');
    const data = await response.json();
    return data.agents || [];
}

async function fetchStats() {
    const response = await fetch(`${API_URL}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return await response.json();
}

async function fetchActivity() {
    const response = await fetch(`${API_URL}/logs/activity?limit=50`);
    if (!response.ok) throw new Error('Failed to fetch activity');
    const data = await response.json();
    return data.logs || [];
}
```

### Step 3: Add Loading States
```html
<div id="loading-agents" class="loading">Loading agents...</div>
<div id="loading-stats" class="loading">Loading stats...</div>
<div id="loading-activity" class="loading">Loading activity...</div>
```

### Step 4: Add Error Handling
```javascript
function showError(message) {
    document.getElementById('error-container').innerHTML = `
        <div class="error">⚠️ ${message}</div>
        <button onclick="loadData()">Retry</button>
    `;
}
```

### Step 5: Update Render Functions
Replace static arrays with dynamic data from API responses.

## Files to Modify
- `/root/.openclaw/workspace/index.html`

## Acceptance Criteria
- [ ] Agents load from `/api/agents`
- [ ] Stats load from `/api/stats`
- [ ] Activity feed loads from `/api/logs/activity`
- [ ] Loading states shown during fetch
- [ ] Error states shown on API failure
- [ ] Auto-refresh every 30 minutes fetches fresh data
- [ ] Manual refresh button works
- [ ] No hardcoded data remains in the file

## Testing
1. Load page with API server running - verify live data displays
2. Load page with API server down - verify error message shows
3. Click refresh button - verify data reloads
4. Wait 30 minutes - verify auto-refresh triggers
