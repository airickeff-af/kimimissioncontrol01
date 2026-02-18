# Mission Control API Quick Reference

**Base URL:** `https://dashboard-ten-sand-20.vercel.app/api`

---

## Endpoints

| Endpoint | Method | Description | Cache TTL |
|----------|--------|-------------|-----------|
| `/health` | GET | System health status | 300s |
| `/agents` | GET | All 22 agents with status | 60s |
| `/tasks` | GET | Tasks with filtering | 60s |
| `/logs/activity` | GET | Activity logs | 30s |
| `/metrics` | GET | System metrics | 60s |
| `/config` | GET | API configuration | 300s |

---

## Quick Examples

### Health Check
```bash
curl https://dashboard-ten-sand-20.vercel.app/api/health
```

### Get All Agents
```bash
curl https://dashboard-ten-sand-20.vercel.app/api/agents
```

### Filter Tasks by Priority
```bash
curl "https://dashboard-ten-sand-20.vercel.app/api/tasks?priority=P0"
```

### Get In-Progress Tasks
```bash
curl "https://dashboard-ten-sand-20.vercel.app/api/tasks?status=in_progress"
```

### Search Tasks
```bash
curl "https://dashboard-ten-sand-20.vercel.app/api/tasks?search=API"
```

### Get Recent Logs
```bash
curl "https://dashboard-ten-sand-20.vercel.app/api/logs/activity?limit=10"
```

### Get System Metrics
```bash
curl https://dashboard-ten-sand-20.vercel.app/api/metrics
```

### Get Specific Metric Type
```bash
curl "https://dashboard-ten-sand-20.vercel.app/api/metrics?type=agents"
```

### Cache Bust
```bash
curl "https://dashboard-ten-sand-20.vercel.app/api/agents?bust=true"
```

---

## Query Parameters

### Tasks
- `status` - pending, in_progress, completed, blocked, planned
- `priority` - P0, P1, P2, P3
- `agent` - Agent name
- `search` - Search query
- `limit` - Results per page (1-1000)
- `page` - Page number

### Logs
- `limit` - Number of logs (1-1000)
- `agent` - Filter by agent
- `type` - Filter by type

### Metrics
- `type` - system, api, agents, tokens

---

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 304 | Not Modified (cache) |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 500 | Server Error |

---

## Full Documentation

See: `/docs/API_DOCUMENTATION.md`
