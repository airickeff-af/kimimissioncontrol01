# TASK-P0-005: Fix task-board.html Fallback Data

**Priority:** P0  
**Deadline:** 7:00 AM, February 20, 2026  
**Assignee:** Code-2, Forge-2  
**Status:** 🔴 NOT STARTED

---

## Problem
The task-board.html page has a **fallback to hardcoded data** when the API fails. This is dangerous because it shows **fake tasks** that may mislead users.

## Evidence
```javascript
// Lines 382-395: HARDCODED FALLBACK
function loadFallbackData() {
    allTasks = [
        { id: 'TASK-093', taskId: 'TASK-093', priority: 'P0', 
          title: 'Fix HQ Refresh Button + Add Auto-Refresh', 
          status: 'in_progress', assignee: 'Forge', ... },
        // ... more fake tasks
    ];
    processTasks();
    updateUI();
    // ... continues as if data is real
}
```

## Solution

### Step 1: Remove Fallback Function
Delete the `loadFallbackData()` function entirely.

### Step 2: Update Error Handler
```javascript
async function fetchTasks() {
    showLoading();
    
    try {
        const apiPaths = [
            '/api/tasks',
            '../api/tasks',
            '../../api/tasks',
            'https://dashboard-ten-sand-20.vercel.app/api/tasks'
        ];
        
        let response;
        let lastError;
        
        for (const path of apiPaths) {
            try {
                response = await fetch(path, { 
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
                if (response.ok) break;
            } catch (e) {
                lastError = e;
                continue;
            }
        }
        
        if (!response || !response.ok) {
            throw lastError || new Error('Failed to fetch from all API paths');
        }
        
        const data = await response.json();
        
        if (data.success && data.data && data.data.tasks) {
            allTasks = data.data.tasks;
            processTasks();
            updateUI();
            updateTaskLog();
            hideLoading();
            updateLastUpdated();
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
        // ❌ REMOVED: loadFallbackData();
        showError('Failed to load tasks. Please check your connection and try again.');
    }
}
```

### Step 3: Improve Error Display
```javascript
function showError(message) {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('error-state').style.display = 'block';
    document.getElementById('error-state').innerHTML = `
        <div class="error-text">⚠️ ${message}</div>
        <button class="retry-btn" onclick="fetchTasks()">🔄 Retry</button>
    `;
    document.getElementById('task-list').innerHTML = '';
    document.getElementById('pagination').style.display = 'none';
}
```

## Files to Modify
- `/root/.openclaw/workspace/task-board.html`

## Acceptance Criteria
- [ ] `loadFallbackData()` function removed
- [ ] Error state shows when API fails
- [ ] No fake tasks displayed
- [ ] Retry button works
- [ ] User is clearly informed of the error

## Testing
1. Load page with API down
2. Verify error message shows
3. Verify no tasks are displayed
4. Click retry - verify retry attempt
