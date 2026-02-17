# Mission Control Dashboard API

Backend API for the Mission Control Dashboard.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Dashboard     │────▶│   API Server    │────▶│   Data Sources  │
│   (Frontend)    │◀────│   (Node.js)     │◀────│   (Files/JSON)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
   index.html            api/ routes          agents/, memory/
```

## Data Sources

- Agent configs: `/mission-control/agents/*/SOUL.md` and `agent.json`
- Agent state: `/mission-control/agents/*/state.json`
- System state: `/mission-control/agents/sentry/state.json`
- Task queue: `/mission-control/TASK_QUEUE.md`
- Activity logs: `/mission-control/logs/`
- Agent workspaces: `/agents/*/` (Code, Forge, etc.)

## API Endpoints

### Agents
- `GET /api/agents` - List all agents with status
- `GET /api/agents/:id` - Get specific agent details
- `GET /api/agents/:id/activity` - Get agent activity history
- `GET /api/agents/:id/files` - List agent output files

### Tasks
- `GET /api/tasks` - Get task queue (pending/completed)
- `GET /api/tasks/active` - Get currently active tasks
- `POST /api/tasks` - Create new task (Nexus only)

### System
- `GET /api/system/status` - System health and metrics
- `GET /api/system/logs` - Recent system logs
- `GET /api/system/activity` - Global activity feed

### Files
- `GET /api/files/browse?path=` - Browse file tree
- `GET /api/files/read?path=` - Read file contents

## Status

- [x] API design
- [ ] Implementation
- [ ] Frontend integration
- [ ] Real-time updates (WebSocket)
