# Mission Control API Documentation

**Version:** 2026.2.19  
**Base URL:** `https://dashboard-ten-sand-20.vercel.app/api`  
**Format:** JSON  
**Authentication:** None required (public read-only endpoints)

---

## Overview

The Mission Control API provides real-time access to agent status, tasks, system metrics, and activity logs. All endpoints return JSON responses with consistent formatting.

### Response Format

All successful responses follow this structure:

```json
{
  "success": true,
  "timestamp": "2026-02-19T07:30:00.000Z",
  "...": "endpoint-specific data"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error description",
  "details": ["Additional error details"],
  "timestamp": "2026-02-19T07:30:00.000Z"
}
```

---

## Endpoints

### 1. Health Check

**Endpoint:** `GET /api/health`

Returns system health status and basic system information.

#### Request

```bash
curl https://dashboard-ten-sand-20.vercel.app/api/health
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `bust` | string | Optional cache-busting parameter |

#### Response Example

```json
{
  "success": true,
  "status": "healthy",
  "uptime": "99.9%",
  "version": "2026.2.18",
  "checks": {
    "api": "ok",
    "database": "ok",
    "agents": "ok",
    "cron": "ok"
  },
  "timestamp": "2026-02-19T07:30:00.000Z"
}
```

#### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `HEALTH_CHECK_ERROR` | 500 | Internal server error during health check |

---

### 2. Agents

**Endpoint:** `GET /api/agents`

Returns all 22 agents with real-time status, task counts, and token usage.

#### Request

```bash
curl https://dashboard-ten-sand-20.vercel.app/api/agents
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `bust` | string | Optional cache-busting parameter |

#### Response Example

```json
{
  "success": true,
  "agents": [
    {
      "name": "Nexus",
      "status": "active",
      "tasks": 5,
      "tokens": 75300,
      "lastActive": "2 min ago",
      "role": "Orchestrator",
      "department": "executive",
      "activity": "monitoring",
      "emoji": "🤖",
      "color": "cyan"
    },
    {
      "name": "Forge",
      "status": "active",
      "tasks": 4,
      "tokens": 45000,
      "lastActive": "5 min ago",
      "role": "UI/Frontend",
      "department": "dev",
      "activity": "coding",
      "emoji": "🔨",
      "color": "orange"
    }
  ],
  "summary": {
    "total": 22,
    "active": 19,
    "idle": 3,
    "blocked": 0,
    "totalTokens": 247500
  },
  "timestamp": "2026-02-19T07:30:00.000Z"
}
```

#### Agent Status Values

| Status | Description |
|--------|-------------|
| `active` | Agent is currently working on tasks |
| `idle` | Agent is available but not assigned |
| `blocked` | Agent is blocked and cannot proceed |

#### Agent Departments

| Department | Description |
|------------|-------------|
| `executive` | Command and orchestration |
| `dev` | Development and engineering |
| `content` | Content creation and writing |
| `growth` | Marketing and social media |
| `ops` | Operations and QA |
| `bd` | Business development and sales |

#### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AGENTS_READ_ERROR` | 500 | Failed to read agent data |

---

### 3. Tasks

**Endpoint:** `GET /api/tasks`

Returns all tasks parsed from `PENDING_TASKS.md` with filtering and pagination support.

#### Request

```bash
# Get all tasks
curl https://dashboard-ten-sand-20.vercel.app/api/tasks

# Filter by status
curl "https://dashboard-ten-sand-20.vercel.app/api/tasks?status=in_progress"

# Filter by priority
curl "https://dashboard-ten-sand-20.vercel.app/api/tasks?priority=P0"

# Search tasks
curl "https://dashboard-ten-sand-20.vercel.app/api/tasks?search=API"

# Paginate
curl "https://dashboard-ten-sand-20.vercel.app/api/tasks?limit=10&page=1"
```

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `status` | string | Filter by status: `pending`, `in_progress`, `completed`, `blocked`, `planned` | - |
| `priority` | string | Filter by priority: `P0`, `P1`, `P2`, `P3` | - |
| `agent` | string | Filter by assigned agent name | - |
| `search` | string | Search in title and description | - |
| `limit` | integer | Results per page (1-1000) | 50 |
| `page` | integer | Page number (1-10000) | 1 |
| `bust` | string | Cache-busting parameter | - |

#### Response Example

```json
{
  "success": true,
  "tasks": [
    {
      "id": "TASK-070",
      "title": "Fix Complete Deployment Failure",
      "assigned": "Code-1",
      "due": "Feb 18",
      "status": "in_progress",
      "priority": "P0",
      "description": "All pages and API endpoints return 404..."
    }
  ],
  "total": 45,
  "page": 1,
  "pages": 1,
  "summary": {
    "total": 60,
    "p0": 8,
    "p1": 29,
    "p2": 18,
    "completed": 16,
    "in_progress": 2,
    "blocked": 42,
    "pending": 0
  },
  "source": "PENDING_TASKS.md",
  "filters": {
    "status": null,
    "priority": null,
    "agent": null,
    "search": null
  },
  "timestamp": "2026-02-19T07:30:00.000Z"
}
```

#### Task Status Values

| Status | Description |
|--------|-------------|
| `pending` | Task not yet started |
| `in_progress` | Task is being worked on |
| `completed` | Task is finished |
| `blocked` | Task cannot proceed due to dependencies |
| `planned` | Task is scheduled for future |

#### Task Priority Levels

| Priority | Description |
|----------|-------------|
| `P0` | Critical - immediate attention required |
| `P1` | High - important for current sprint |
| `P2` | Medium - standard priority |
| `P3` | Low - nice to have |

#### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_QUERY` | 400 | Invalid query parameters |
| `TASKS_READ_ERROR` | 500 | Failed to read task data |

---

### 4. Activity Logs

**Endpoint:** `GET /api/logs/activity`

Returns recent agent activity logs with optional filtering.

#### Request

```bash
# Get default 100 logs
curl https://dashboard-ten-sand-20.vercel.app/api/logs/activity

# Limit results
curl "https://dashboard-ten-sand-20.vercel.app/api/logs/activity?limit=10"
```

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Number of logs to return (1-1000) | 100 |
| `agent` | string | Filter by agent name | - |
| `type` | string | Filter by log type | - |

#### Response Example

```json
{
  "success": true,
  "logs": [
    {
      "timestamp": "2026-02-19T07:30:00.000Z",
      "agent": "Nexus",
      "type": "system",
      "message": "API endpoint /api/logs/activity is working!",
      "sessionId": "api-test"
    },
    {
      "timestamp": "2026-02-19T07:29:00.000Z",
      "agent": "Code-1",
      "type": "task_complete",
      "message": "Fixed logs API endpoint",
      "sessionId": "logs-fix"
    }
  ],
  "total": 10,
  "timestamp": "2026-02-19T07:30:00.000Z"
}
```

#### Log Types

| Type | Description |
|------|-------------|
| `system` | System-level events |
| `task_complete` | Task completion events |
| `task_active` | Task started events |
| `audit` | Audit and quality checks |
| `idle` | Agent idle events |
| `error` | Error events |
| `warning` | Warning events |
| `info` | Informational events |

---

### 5. Metrics

**Endpoint:** `GET /api/metrics`

Returns system performance metrics and statistics.

#### Request

```bash
# Get all metrics
curl https://dashboard-ten-sand-20.vercel.app/api/metrics

# Get specific metric type
curl "https://dashboard-ten-sand-20.vercel.app/api/metrics?type=agents"
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Specific metric type: `system`, `api`, `agents`, `tokens` | - |

#### Response Example

```json
{
  "success": true,
  "timestamp": "2026-02-19T07:30:00.000Z",
  "system": {
    "uptime": "99.9%",
    "status": "healthy",
    "version": "2026.2.18"
  },
  "api": {
    "requests": 15234,
    "avgResponseTime": "45ms",
    "errorRate": "0.1%"
  },
  "agents": {
    "total": 20,
    "active": 11,
    "busy": 4,
    "idle": 5,
    "avgSuccessRate": "91%"
  },
  "tokens": {
    "dailyUsage": 1545592,
    "dailyCost": 0.43,
    "trend": "stable"
  }
}
```

#### Available Metric Types

When using the `type` parameter, the response structure changes:

```bash
curl "https://dashboard-ten-sand-20.vercel.app/api/metrics?type=agents"
```

Response:

```json
{
  "success": true,
  "type": "agents",
  "data": {
    "total": 20,
    "active": 11,
    "busy": 4,
    "idle": 5,
    "avgSuccessRate": "91%"
  },
  "timestamp": "2026-02-19T07:30:00.000Z"
}
```

---

### 6. Configuration

**Endpoint:** `GET /api/config`

Returns system configuration and available endpoints.

#### Request

```bash
curl https://dashboard-ten-sand-20.vercel.app/api/config
```

#### Response Example

```json
{
  "success": true,
  "version": "2026.2.18",
  "environment": "production",
  "features": [
    "real-tasks",
    "live-agents",
    "token-tracking",
    "input-validation"
  ],
  "endpoints": [
    {
      "path": "/api/health",
      "description": "Health check endpoint",
      "methods": ["GET"]
    },
    {
      "path": "/api/agents",
      "description": "List all agents with status",
      "methods": ["GET"]
    },
    {
      "path": "/api/tasks",
      "description": "List all tasks with filtering",
      "methods": ["GET"]
    },
    {
      "path": "/api/logs/activity",
      "description": "Activity logs",
      "methods": ["GET"]
    },
    {
      "path": "/api/metrics",
      "description": "System metrics",
      "methods": ["GET"]
    },
    {
      "path": "/api/config",
      "description": "API configuration",
      "methods": ["GET"]
    }
  ],
  "caching": {
    "defaultTTL": 60,
    "healthTTL": 300,
    "logsTTL": 30
  },
  "timestamp": "2026-02-19T07:30:00.000Z"
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 304 | Not Modified | Content unchanged (ETag match) |
| 400 | Bad Request | Invalid query parameters |
| 404 | Not Found | Endpoint not found |
| 500 | Internal Server Error | Server error occurred |

### Validation Errors

When query parameters fail validation:

```json
{
  "success": false,
  "error": "Invalid query parameters",
  "details": [
    "Parameter 'limit' must be at most 1000",
    "Parameter 'status' must be one of: pending, in_progress, completed, blocked, planned"
  ],
  "timestamp": "2026-02-19T07:30:00.000Z"
}
```

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `INVALID_LIMIT` | Limit parameter out of range | Use value between 1-1000 |
| `INVALID_STATUS` | Unknown status value | Use allowed status values |
| `INVALID_PRIORITY` | Unknown priority value | Use P0, P1, P2, or P3 |
| `INVALID_DATE` | Date format invalid | Use ISO 8601 format |
| `DANGEROUS_CONTENT` | Potential injection detected | Remove special characters |
| `READ_ERROR` | Failed to read data source | Retry request |

---

## Caching

All endpoints support HTTP caching with the following headers:

- `Cache-Control`: TTL directives
- `ETag`: Content hash for conditional requests
- `Vary: Accept-Encoding`

### Cache Durations

| Endpoint | TTL | Stale-While-Revalidate |
|----------|-----|------------------------|
| `/api/health` | 300s | 600s |
| `/api/agents` | 60s | 120s |
| `/api/tasks` | 60s | 120s |
| `/api/logs/activity` | 30s | 60s |
| `/api/metrics` | 60s | 120s |

### Cache Busting

To bypass caching, use the `bust` parameter or `X-Cache-Bust` header:

```bash
curl "https://dashboard-ten-sand-20.vercel.app/api/health?bust=true"
```

### Conditional Requests

Use `If-None-Match` with the ETag value to receive `304 Not Modified` when content hasn't changed:

```bash
curl -H "If-None-Match: \"abc123\"" https://dashboard-ten-sand-20.vercel.app/api/agents
```

---

## Rate Limiting

Currently, no rate limiting is enforced. However, please be respectful:

- Cache responses when possible
- Use conditional requests (ETag)
- Avoid polling more than once per minute

---

## CORS

All endpoints support Cross-Origin Resource Sharing (CORS):

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
const API_BASE = 'https://dashboard-ten-sand-20.vercel.app/api';

async function getAgents(): Promise<Agent[]> {
  const response = await fetch(`${API_BASE}/agents`);
  const data = await response.json();
  return data.agents;
}

async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.priority) params.set('priority', filters.priority);
  
  const response = await fetch(`${API_BASE}/tasks?${params}`);
  const data = await response.json();
  return data.tasks;
}
```

### Python

```python
import requests

API_BASE = 'https://dashboard-ten-sand-20.vercel.app/api'

def get_agents():
    response = requests.get(f'{API_BASE}/agents')
    return response.json()['agents']

def get_tasks(status=None, priority=None):
    params = {}
    if status:
        params['status'] = status
    if priority:
        params['priority'] = priority
    
    response = requests.get(f'{API_BASE}/tasks', params=params)
    return response.json()['tasks']
```

### cURL

```bash
# Health check
curl https://dashboard-ten-sand-20.vercel.app/api/health

# Get active agents
curl https://dashboard-ten-sand-20.vercel.app/api/agents

# Get P0 tasks
curl "https://dashboard-ten-sand-20.vercel.app/api/tasks?priority=P0"

# Get recent logs
curl "https://dashboard-ten-sand-20.vercel.app/api/logs/activity?limit=5"
```

---

## Changelog

### 2026.2.18
- Added input validation for all query parameters
- Implemented caching with ETag support
- Added cache-busting capability
- Standardized error response format

### 2026.2.15
- Initial API release
- Basic endpoints: health, agents, tasks, logs

---

**Document maintained by:** Quill Agent  
**Last updated:** 2026-02-19
