# TASK-P0-006: Create Missing logs-view.html Page

**Priority:** P0  
**Deadline:** 7:00 AM, February 20, 2026  
**Assignee:** Forge-3, Code-3  
**Status:** 🔴 NOT STARTED

---

## Problem
The logs-view.html page **does not exist** but is linked in the navigation of task-board.html. Users clicking "Logs" get a 404 error.

## Solution

### Create New File: `/root/.openclaw/workspace/logs-view.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Activity Logs | Mission Control</title>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: #0a0a0f;
            color: #e0e0e0;
            min-height: 100vh;
        }
        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            padding: 1rem 2rem;
            border-bottom: 2px solid #00d4ff;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo { font-size: 1.5rem; font-weight: 700; color: #00d4ff; }
        .nav { display: flex; gap: 1rem; }
        .nav a {
            color: #888;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            transition: all 0.2s;
        }
        .nav a:hover, .nav a.active { color: #00d4ff; background: rgba(0,212,255,0.1); }
        .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
        .filters { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .filter-btn {
            background: #1a1a2e;
            border: 1px solid #333;
            color: #888;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
        }
        .filter-btn.active { background: #00d4ff20; border-color: #00d4ff; color: #00d4ff; }
        .log-entry {
            background: #1a1a2e;
            border-left: 3px solid #00d4ff;
            padding: 1rem;
            margin-bottom: 0.5rem;
            border-radius: 0 8px 8px 0;
        }
        .log-time { color: #666; font-size: 0.875rem; }
        .log-agent { color: #00d4ff; font-weight: 600; }
        .log-action { color: #e0e0e0; }
        .loading { text-align: center; padding: 3rem; color: #888; }
        .error { text-align: center; padding: 3rem; color: #ff4444; }
    </style>
</head>
<body>
    <header class="header">
        <div class="logo">🎯 Mission Control</div>
        <nav class="nav">
            <a href="/index.html">HQ</a>
            <a href="/office.html">Office</a>
            <a href="/agents.html">Agents</a>
            <a href="/deals.html">DealFlow</a>
            <a href="/tokens.html">Tokens</a>
            <a href="/task-board.html">Tasks</a>
            <a href="/logs-view.html" class="active">Logs</a>
        </nav>
    </header>

    <div class="container">
        <h1>📝 Activity Logs</h1>
        
        <div class="filters">
            <button class="filter-btn active" onclick="filterLogs('all')">All</button>
            <button class="filter-btn" onclick="filterLogs('agent')">Agents</button>
            <button class="filter-btn" onclick="filterLogs('task')">Tasks</button>
            <button class="filter-btn" onclick="filterLogs('system')">System</button>
        </div>

        <div id="logs-content">
            <div class="loading">Loading logs...</div>
        </div>
    </div>

    <script>
        const API_URL = '/api';
        let allLogs = [];

        async function loadLogs() {
            const content = document.getElementById('logs-content');
            content.innerHTML = '<div class="loading">Loading logs...</div>';

            try {
                const response = await fetch(`${API_URL}/logs/activity?limit=100`);
                const data = await response.json();

                if (!data.success) {
                    throw new Error('API returned error');
                }

                allLogs = data.logs || [];
                renderLogs(allLogs);
            } catch (error) {
                content.innerHTML = `<div class="error">⚠️ Failed to load logs: ${error.message}</div>`;
            }
        }

        function renderLogs(logs) {
            const content = document.getElementById('logs-content');
            
            if (logs.length === 0) {
                content.innerHTML = '<div class="loading">No logs found</div>';
                return;
            }

            content.innerHTML = logs.map(log => `
                <div class="log-entry">
                    <div class="log-time">${new Date(log.timestamp).toLocaleString()}</div>
                    <div>
                        <span class="log-agent">${log.agent || 'System'}</span>
                        <span class="log-action">${log.action}</span>
                    </div>
                    <div>${log.details || ''}</div>
                </div>
            `).join('');
        }

        function filterLogs(type) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            if (type === 'all') {
                renderLogs(allLogs);
            } else {
                const filtered = allLogs.filter(log => log.type === type || log.category === type);
                renderLogs(filtered);
            }
        }

        // Load on page load
        loadLogs();

        // Auto-refresh every 30 minutes
        setInterval(loadLogs, 30 * 60 * 1000);
    </script>
</body>
</html>
```

## Files to Create
- `/root/.openclaw/workspace/logs-view.html`

## Acceptance Criteria
- [ ] Page exists at `/logs-view.html`
- [ ] Fetches data from `/api/logs/activity`
- [ ] Displays logs in chronological order
- [ ] Shows agent name, action, timestamp
- [ ] Has filter buttons (All, Agents, Tasks, System)
- [ ] Has consistent navigation with other pages
- [ ] Has loading state
- [ ] Has error handling
- [ ] Auto-refreshes every 30 minutes

## Testing
1. Click "Logs" in navigation - page loads
2. Verify logs display from API
3. Test filter buttons
4. Test error handling with API down
