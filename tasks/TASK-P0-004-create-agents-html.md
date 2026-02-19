# TASK-P0-004: Create Missing agents.html Page

**Priority:** P0  
**Deadline:** 7:00 AM, February 20, 2026  
**Assignee:** Forge-1, Code-1  
**Status:** 🔴 NOT STARTED

---

## Problem
The agents.html page **does not exist** but is linked in the navigation of multiple pages:
- index.html
- office.html
- task-board.html
- living-pixel-office.html

Users clicking "Agents" in the navigation get a 404 error.

## Solution

### Create New File: `/root/.openclaw/workspace/agents.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agents | Mission Control</title>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        /* Consistent styling with other pages */
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
        /* ... more styles ... */
    </style>
</head>
<body>
    <header class="header">
        <div class="logo">🎯 Mission Control</div>
        <nav class="nav">
            <a href="/index.html">HQ</a>
            <a href="/office.html">Office</a>
            <a href="/agents.html" class="active">Agents</a>
            <a href="/deals.html">DealFlow</a>
            <a href="/tokens.html">Tokens</a>
            <a href="/task-board.html">Tasks</a>
        </nav>
    </header>

    <div class="container">
        <h1>👥 Agent Roster</h1>
        <div id="agents-content">
            <div class="loading">Loading agents...</div>
        </div>
    </div>

    <script>
        const API_URL = '/api';

        async function loadAgents() {
            const content = document.getElementById('agents-content');
            content.innerHTML = '<div class="loading">Loading agents...</div>';

            try {
                const response = await fetch(`${API_URL}/agents`);
                const data = await response.json();

                if (!data.success) {
                    throw new Error('API returned error');
                }

                const agents = data.agents || [];
                renderAgents(agents);
            } catch (error) {
                content.innerHTML = `<div class="error">⚠️ Failed to load agents: ${error.message}</div>`;
            }
        }

        function renderAgents(agents) {
            // Render agent cards/grid
            const content = document.getElementById('agents-content');
            content.innerHTML = `
                <div class="agents-grid">
                    ${agents.map(agent => `
                        <div class="agent-card">
                            <div class="agent-avatar" style="background: ${agent.color || '#00d4ff'}">
                                ${agent.name.charAt(0)}
                            </div>
                            <div class="agent-info">
                                <h3>${agent.name}</h3>
                                <p>${agent.role}</p>
                                <span class="status ${agent.status}">${agent.status}</span>
                            </div>
                            <div class="agent-stats">
                                <div>Tokens: ${formatNumber(agent.tokens || 0)}</div>
                                <div>Tasks: ${agent.tasks || 0}</div>
                                <div>Files: ${agent.files || 0}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        function formatNumber(num) {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
        }

        // Load on page load
        loadAgents();

        // Auto-refresh every 30 minutes
        setInterval(loadAgents, 30 * 60 * 1000);
    </script>
</body>
</html>
```

## Files to Create
- `/root/.openclaw/workspace/agents.html`

## Acceptance Criteria
- [ ] Page exists at `/agents.html`
- [ ] Fetches data from `/api/agents`
- [ ] Displays all agents in a grid/list
- [ ] Shows agent stats (tokens, tasks, files)
- [ ] Shows agent status
- [ ] Has consistent navigation with other pages
- [ ] Has loading state
- [ ] Has error handling
- [ ] Auto-refreshes every 30 minutes

## Testing
1. Click "Agents" in navigation - page loads
2. Verify agents display from API
3. Verify stats are correct
4. Test error handling with API down
