# Mission Control API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:8080`  
**WebSocket:** `ws://localhost:8765`  
**Last Updated:** 2026-02-17

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Health Check](#health-check)
4. [Agents API](#agents-api)
5. [System API](#system-api)
6. [Tasks API](#tasks-api)
7. [Backups API](#backups-api)
8. [Files API](#files-api)
9. [WebSocket Events](#websocket-events)
10. [Error Handling](#error-handling)
11. [Examples](#examples)

---

## Overview

The Mission Control API provides REST endpoints for dashboard integration and WebSocket connections for real-time updates. All endpoints return JSON responses.

### Response Format

```json
{
  "status": "success",
  "data": { ... },
  "timestamp": "2026-02-17T12:00:00Z"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 400 | Bad Request - Invalid parameters |
| 403 | Forbidden - Invalid path or access denied |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Backend service not running |

---

## Authentication

Currently, the API is designed for internal use and does not require authentication. All endpoints are open.

**Note:** For production deployment, consider adding API key authentication.

---

## Health Check

### GET `/api/health`

Check the health status of all backend services.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-17T12:00:00.000000",
  "services": {
    "api": "running",
    "websocket": "available",
    "pipeline": "available"
  }
}
```

---

## Agents API

### GET `/api/agents`

List all agents with their current status.

**Response:**
```json
{
  "agents": [
    {
      "id": "nexus",
      "name": "Nexus (Air1ck3ff)",
      "status": "active",
      "current_tasks": ["monitoring"],
      "tasks_completed": 42,
      "tasks_failed": 0,
      "metrics": {
        "avg_response_time": 1.23,
        "success_rate": 0.98
      }
    }
  ]
}
```

### GET `/api/agents/{agent_id}`

Get detailed information about a specific agent.

**Parameters:**
- `agent_id` (path) - Agent identifier (e.g., "nexus", "forge", "scout")

**Response:**
```json
{
  "id": "nexus",
  "name": "Nexus (Air1ck3ff)",
  "status": "active",
  "current_tasks": ["monitoring", "coordination"],
  "tasks_completed": 42,
  "tasks_failed": 0,
  "metrics": {
    "avg_response_time": 1.23,
    "success_rate": 0.98
  }
}
```

**Error Response (404):**
```json
{
  "error": "Agent not found"
}
```

### GET `/api/agents/{agent_id}/metrics`

Get performance metrics for a specific agent.

**Parameters:**
- `agent_id` (path) - Agent identifier

**Response:**
```json
{
  "agent_id": "nexus",
  "period_hours": 24,
  "tasks_completed": 15,
  "tasks_failed": 0,
  "avg_task_duration": 245.5,
  "total_work_time": 3682.0,
  "idle_time": 120.0,
  "messages_sent": 89,
  "messages_received": 156,
  "error_rate": 0.0,
  "success_rate": 1.0
}
```

### GET `/api/agents/{agent_id}/history`

Get historical metrics for an agent.

**Parameters:**
- `agent_id` (path) - Agent identifier
- `hours` (query, optional) - Number of hours to look back (default: 24, max: 168)

**Response:**
```json
{
  "agent_id": "nexus",
  "history": [
    {
      "timestamp": "2026-02-17T11:00:00",
      "tasks_completed": 5,
      "tasks_failed": 0,
      "success_rate": 1.0
    }
  ]
}
```

---

## System API

### GET `/api/system/status`

Get overall system status including office state and current metrics.

**Response:**
```json
{
  "office_state": {
    "positions": {
      "nexus": {"x": 50, "y": 50, "zone": "command_center"},
      "forge": {"x": 30, "y": 40, "zone": "development"}
    }
  },
  "metrics": {
    "total_agents": 14,
    "active_agents": 12,
    "idle_agents": 2,
    "total_tasks_completed": 156,
    "total_tasks_pending": 8,
    "system_health_score": 0.95
  },
  "timestamp": "2026-02-17T12:00:00.000000"
}
```

### GET `/api/system/metrics`

Get system metrics history.

**Parameters:**
- `hours` (query, optional) - Number of hours to look back (default: 24)

**Response:**
```json
{
  "history": [
    {
      "timestamp": "2026-02-17T11:00:00",
      "total_agents": 14,
      "active_agents": 12,
      "system_health_score": 0.95,
      "events_per_minute": 4.5
    }
  ]
}
```

### GET `/api/system/events`

Get system events log.

**Parameters:**
- `type` (query, optional) - Filter by event type
- `limit` (query, optional) - Maximum number of events (default: 100, max: 1000)

**Response:**
```json
{
  "events": [
    {
      "timestamp": "2026-02-17T11:30:00",
      "type": "task_completed",
      "agent_id": "forge",
      "data": {"task": "build_component"}
    }
  ]
}
```

---

## Tasks API

### GET `/api/tasks`

Get the current task queue.

**Response:**
```json
{
  "tasks": [
    {
      "text": "Complete API documentation",
      "status": "pending"
    },
    {
      "text": "Test integration with frontend",
      "status": "completed"
    }
  ]
}
```

### GET `/api/tasks/active`

Get currently active tasks being worked on by agents.

**Response:**
```json
{
  "active_tasks": [
    {
      "agent": "coder",
      "task": "build_api_endpoints"
    },
    {
      "agent": "forge",
      "task": "create_ui_components"
    }
  ]
}
```

---

## Backups API

### GET `/api/backups`

List available backups.

**Parameters:**
- `type` (query, optional) - Filter by backup type ("full", "agent_state")

**Response:**
```json
{
  "backups": [
    {
      "id": "20240217_120000",
      "type": "full",
      "created_at": "2026-02-17T12:00:00",
      "size_bytes": 10485760,
      "size_human": "10.0 MB",
      "file_count": 150,
      "integrity_hash": "sha256:abc123..."
    }
  ]
}
```

### POST `/api/backups`

Create a new backup.

**Request Body:**
```json
{
  "type": "full"
}
```

**Response:**
```json
{
  "id": "20240217_130000",
  "type": "full",
  "created_at": "2026-02-17T13:00:00",
  "size_bytes": 10485760,
  "size_human": "10.0 MB",
  "file_count": 150,
  "integrity_hash": "sha256:abc123..."
}
```

### POST `/api/backups/{backup_id}/restore`

Restore from a backup.

**Parameters:**
- `backup_id` (path) - Backup identifier

**Response:**
```json
{
  "success": true,
  "message": "Backup 20240217_120000 restored"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Restore failed"
}
```

### GET `/api/backups/procedures`

Get recovery procedures documentation.

**Response:**
```json
{
  "procedures": [
    {
      "name": "Full System Restore",
      "steps": [
        "Stop all services",
        "Identify backup to restore",
        "Run restore command",
        "Verify agent states",
        "Restart services"
      ]
    }
  ]
}
```

---

## Files API

### GET `/api/files/browse`

Browse the file tree.

**Parameters:**
- `path` (query, optional) - Directory path relative to workspace (default: "")

**Response:**
```json
{
  "path": "mission-control/agents",
  "items": [
    {
      "name": "nexus",
      "type": "directory",
      "size": null,
      "modified": "2026-02-17T10:00:00"
    },
    {
      "name": "forge",
      "type": "directory",
      "size": null,
      "modified": "2026-02-17T10:00:00"
    }
  ]
}
```

**Error Response (403):**
```json
{
  "error": "Invalid path"
}
```

### GET `/api/files/read`

Read file contents.

**Parameters:**
- `path` (query, required) - File path relative to workspace

**Response:**
```json
{
  "path": "mission-control/README.md",
  "content": "# Mission Control...",
  "size": 1234
}
```

**Error Response (404):**
```json
{
  "error": "File not found"
}
```

---

## WebSocket Events

Connect to `ws://localhost:8765` for real-time updates.

### Client → Server Messages

#### Subscribe to Channel
```json
{
  "type": "subscribe",
  "channel": "agent_status"
}
```

#### Request Agent Status
```json
{
  "type": "request_agent_status",
  "agent_id": "nexus"
}
```

#### Ping
```json
{
  "type": "ping"
}
```

### Server → Client Events

#### Agent Status Update
```json
{
  "type": "agent_status",
  "timestamp": "2026-02-17T12:00:00Z",
  "data": {
    "agent": "nexus",
    "state": {
      "status": "active",
      "current_tasks": ["monitoring"]
    }
  },
  "source": "mission-control"
}
```

#### Agent Position Update
```json
{
  "type": "agent_position",
  "timestamp": "2026-02-17T12:00:00Z",
  "data": {
    "positions": {
      "nexus": {"x": 50, "y": 50, "zone": "command_center"}
    }
  }
}
```

#### Notification
```json
{
  "type": "notification",
  "timestamp": "2026-02-17T12:00:00Z",
  "data": {
    "title": "Task Completed",
    "message": "Forge completed UI components",
    "level": "success",
    "data": {}
  }
}
```

#### Task Update
```json
{
  "type": "task_update",
  "timestamp": "2026-02-17T12:00:00Z",
  "data": {
    "type": "task_queue_changed",
    "path": "mission-control/TASK_QUEUE.md"
  }
}
```

#### System Metric
```json
{
  "type": "system_metric",
  "timestamp": "2026-02-17T12:00:00Z",
  "data": {
    "metric": "active_agents",
    "value": 12,
    "unit": "agents"
  }
}
```

#### Agent Activity
```json
{
  "type": "agent_activity",
  "timestamp": "2026-02-17T12:00:00Z",
  "data": {
    "agent": "forge",
    "activity": {
      "action": "completed_task",
      "task": "build_component"
    }
  }
}
```

#### Heartbeat
```json
{
  "type": "heartbeat",
  "timestamp": "2026-02-17T12:00:00Z",
  "data": {
    "clients": 3
  }
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Descriptive error message",
  "code": "optional_error_code"
}
```

### Common Errors

| Error | Description | Solution |
|-------|-------------|----------|
| `Agent not found` | Invalid agent_id | Check agent list with GET /api/agents |
| `Invalid path` | Path traversal attempt | Use valid relative paths |
| `File not found` | File doesn't exist | Verify path with /api/files/browse |
| `Backup system not available` | Backup service not running | Start backend services |
| `Pipeline not available` | Data pipeline not running | Start backend services |

---

## Examples

### cURL Examples

#### Check Health
```bash
curl http://localhost:8080/api/health
```

#### List All Agents
```bash
curl http://localhost:8080/api/agents
```

#### Get Agent Details
```bash
curl http://localhost:8080/api/agents/nexus
```

#### Get Agent Metrics (Last 48 Hours)
```bash
curl "http://localhost:8080/api/agents/nexus/history?hours=48"
```

#### Browse Files
```bash
curl "http://localhost:8080/api/files/browse?path=mission-control/agents"
```

#### Read File
```bash
curl "http://localhost:8080/api/files/read?path=mission-control/README.md"
```

#### Create Backup
```bash
curl -X POST http://localhost:8080/api/backups \
  -H "Content-Type: application/json" \
  -d '{"type": "full"}'
```

#### Restore Backup
```bash
curl -X POST http://localhost:8080/api/backups/20240217_120000/restore
```

### JavaScript Examples

#### Fetch Agents
```javascript
const response = await fetch('http://localhost:8080/api/agents');
const data = await response.json();
console.log(data.agents);
```

#### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:8765');

ws.onopen = () => {
  console.log('Connected to Mission Control');
  ws.send(JSON.stringify({ type: 'subscribe', channel: 'agent_status' }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message.type, message.data);
};
```

#### Using MCWebSocketClient
```javascript
// Include websocket-client.js in your HTML
const ws = new MCWebSocketClient('ws://localhost:8765');

ws.on('agent_status', (data) => {
  console.log(`Agent ${data.agent} status: ${data.state.status}`);
});

ws.on('notification', (data) => {
  showToast(data.title, data.message, data.level);
});

ws.connect();
```

### Python Examples

#### Using requests
```python
import requests

# Get all agents
response = requests.get('http://localhost:8080/api/agents')
agents = response.json()['agents']

# Get agent metrics
response = requests.get('http://localhost:8080/api/agents/nexus/metrics')
metrics = response.json()
```

#### Using websockets
```python
import asyncio
import websockets
import json

async def connect():
    uri = "ws://localhost:8765"
    async with websockets.connect(uri) as ws:
        # Subscribe to agent status
        await ws.send(json.dumps({
            "type": "subscribe",
            "channel": "agent_status"
        }))
        
        # Listen for messages
        async for message in ws:
            data = json.loads(message)
            print(f"Received: {data['type']}")

asyncio.run(connect())
```

---

## Rate Limits

Currently, no rate limits are enforced. For production use, consider implementing:

- 100 requests per minute per IP for REST API
- 10 connections per IP for WebSocket

---

## Changelog

### v1.0.0 (2026-02-17)
- Initial API release
- WebSocket real-time updates
- Agent management endpoints
- System monitoring
- Backup management
- File browsing

---

## Support

For issues or questions:
1. Check service status: `./start-backend.sh status`
2. Review logs: `./start-backend.sh logs`
3. Verify endpoints: `curl http://localhost:8080/api/health`

---

*Documentation generated by Code (Backend Developer) for Mission Control*
