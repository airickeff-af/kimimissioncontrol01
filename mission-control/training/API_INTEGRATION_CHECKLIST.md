# API Integration Checklist

**Target Agents:** All agents (Pixel, Forge, CodeMaster, Quill, Scout, DealFlow)  
**Purpose:** Ensure seamless frontend/backend coordination  
**Problem Solved:** Integration gaps costing -15 to -20 quality points

---

## The Integration Problem

### Common Failures

| Frontend Says | Backend Says | Result |
|---------------|--------------|--------|
| "API returns 404" | "Endpoint works locally" | Mismatch |
| "Wrong data format" | "That's what I return" | Miscommunication |
| "CORS error" | "Works on my machine" | Environment gap |
| "Data doesn't load" | "No errors in logs" | Silent failure |

### Cost of Poor Integration

- **-20 points:** API endpoint 404
- **-10 points:** Data not loading
- **-5 points:** Console errors
- **-15 points:** Feature non-functional

**Total potential loss: 50 points**

---

## Pre-Integration Checklist

### Before Writing Code

```
□ Agree on API contract (endpoint, params, response)
□ Document in shared location
□ Define error response format
□ Set up shared test environment
□ Establish communication channel (Slack/Discord)
```

### API Contract Template

```markdown
## Endpoint: GET /api/agents

### Request
- Method: GET
- Path: /api/agents
- Query params:
  - `status` (optional): 'active' | 'idle' | 'busy'
  - `limit` (optional): number, max 100

### Response (200 OK)
```json
{
  "agents": [
    {
      "id": "string",
      "name": "string",
      "status": "active" | "idle" | "busy",
      "emoji": "string",
      "lastActive": "ISO 8601 timestamp"
    }
  ],
  "total": number,
  "page": number
}
```

### Error Responses
- 400: Invalid query parameters
- 401: Authentication required
- 500: Server error
```

---

## Backend Responsibilities

### 1. Consistent Response Format

**Always return the same structure:**

```javascript
// ✅ GOOD: Consistent wrapper
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-19T09:00:00Z",
    "requestId": "uuid"
  }
}

// ❌ BAD: Inconsistent formats
{ "agents": [...] }           // Sometimes this
{ "data": { "agents": [...] } } // Sometimes that
[...]                          // Sometimes array
```

### 2. Proper Error Handling

```javascript
// ✅ GOOD: Structured error
res.status(400).json({
  "success": false,
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Status must be one of: active, idle, busy",
    "field": "status"
  }
});

// ❌ BAD: Vague error
res.status(500).send("Error");
```

### 3. Input Validation

```javascript
// ✅ GOOD: Validate everything
function validateAgentQuery(params) {
  const { status, limit } = params;
  
  if (status && !['active', 'idle', 'busy'].includes(status)) {
    throw new ValidationError('Invalid status');
  }
  
  if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
    throw new ValidationError('Limit must be 1-100');
  }
  
  return true;
}
```

### 4. CORS Configuration

```javascript
// ✅ GOOD: Explicit CORS
app.use(cors({
  origin: [
    'https://dashboard-ten-sand-20.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 5. Health Check Endpoint

```javascript
/**
 * GET /api/health
 * Returns service health status
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime()
  });
});
```

---

## Frontend Responsibilities

### 1. API Client Setup

```javascript
// ✅ GOOD: Centralized API client
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api.mission-control.com'
  : 'http://localhost:3001';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
    this.defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...this.defaultOptions,
      ...options
    });
    
    if (!response.ok) {
      throw new ApiError(response.status, await response.json());
    }
    
    return response.json();
  }
}

export const api = new ApiClient();
```

### 2. Error Handling

```javascript
// ✅ GOOD: Handle all error cases
async function loadAgents() {
  try {
    const response = await api.request('/api/agents');
    return response.data.agents;
  } catch (error) {
    if (error.status === 404) {
      console.error('API endpoint not found - contact backend team');
      showError('Service temporarily unavailable');
    } else if (error.status === 500) {
      console.error('Server error:', error.data);
      showError('Something went wrong. Please try again.');
    } else {
      console.error('Unexpected error:', error);
      showError('Failed to load agents');
    }
    return [];
  }
}
```

### 3. Loading States

```javascript
// ✅ GOOD: Always show loading state
function AgentList() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAgents()
      .then(data => {
        setAgents(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  return <AgentGrid agents={agents} />;
}
```

### 4. Data Validation

```javascript
// ✅ GOOD: Validate API response
function validateAgentResponse(data) {
  if (!data || !Array.isArray(data.agents)) {
    console.error('Invalid response format:', data);
    throw new Error('Invalid API response');
  }
  
  return data.agents.every(agent => 
    agent.id && 
    agent.name && 
    typeof agent.status === 'string'
  );
}
```

---

## Integration Testing Checklist

### Before Deployment

```
□ Test locally with production API
□ Test with staging data
□ Verify error handling
□ Check loading states
□ Test on mobile
□ Test with slow network (throttling)
□ Test with API failures
□ Cross-browser testing
```

### Test Scenarios

| Scenario | Expected | Test |
|----------|----------|------|
| API returns 200 | Data displays | ✅ |
| API returns 404 | Error message shown | ✅ |
| API returns 500 | Retry option shown | ✅ |
| Network offline | Offline message | ✅ |
| Slow response | Loading spinner | ✅ |
| Empty data | Empty state shown | ✅ |
| Large dataset | Pagination works | ✅ |

---

## Communication Protocol

### When Backend Changes API

1. **Notify frontend team immediately**
2. **Update API documentation**
3. **Provide migration guide**
4. **Maintain backward compatibility (2 weeks)**
5. **Coordinate deployment timing**

### When Frontend Needs New Endpoint

1. **Create API request ticket**
2. **Specify exact requirements**
3. **Provide example requests/responses**
4. **Discuss timeline**
5. **Test in staging before production**

### API Request Template

```markdown
**Endpoint Needed:** POST /api/tasks/bulk-update

**Use Case:** Update multiple task statuses at once

**Request:**
```json
{
  "taskIds": ["task-1", "task-2"],
  "updates": {
    "status": "completed",
    "completedAt": "2026-02-19T09:00:00Z"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "updated": 2,
  "failed": []
}
```

**Priority:** P1
**Deadline:** 2026-02-20
```

---

## Common Integration Patterns

### Real-Time Updates

```javascript
// WebSocket for real-time data
const ws = new WebSocket('wss://api.mission-control.com/ws');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  
  switch (update.type) {
    case 'AGENT_STATUS_CHANGE':
      updateAgentStatus(update.agentId, update.status);
      break;
    case 'NEW_TASK':
      addTask(update.task);
      break;
  }
};
```

### Polling Fallback

```javascript
// For browsers without WebSocket support
function pollForUpdates() {
  setInterval(async () => {
    const lastUpdate = localStorage.getItem('lastUpdate');
    const updates = await api.request(`/api/updates?since=${lastUpdate}`);
    
    updates.forEach(applyUpdate);
    localStorage.setItem('lastUpdate', Date.now());
  }, 5000);
}
```

### Optimistic Updates

```javascript
// Update UI immediately, sync with server
async function completeTask(taskId) {
  // Optimistic update
  updateTaskStatus(taskId, 'completed');
  
  try {
    await api.request(`/api/tasks/${taskId}/complete`, {
      method: 'POST'
    });
  } catch (error) {
    // Rollback on failure
    updateTaskStatus(taskId, 'pending');
    showError('Failed to complete task');
  }
}
```

---

## Debugging Integration Issues

### Frontend Debugging

```javascript
// Add request logging in development
if (process.env.NODE_ENV === 'development') {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    console.log('API Request:', args[0]);
    const response = await originalFetch(...args);
    console.log('API Response:', response.status, await response.clone().json());
    return response;
  };
}
```

### Backend Debugging

```javascript
// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
    headers: req.headers['user-agent']
  });
  next();
});
```

---

## Integration Score Checklist

Verify before submission:

```
□ API contract documented and agreed upon
□ Backend returns consistent format
□ Frontend handles all error cases
□ Loading states implemented
□ Error messages user-friendly
□ CORS configured correctly
□ Health check endpoint works
□ Integration tests pass
□ Cross-browser tested
□ Mobile responsive
□ No console errors
□ Network failures handled gracefully
```

---

**Remember:** Integration is a team sport. Communicate early, test often, deploy together.

**Questions?** Contact Training Agent or Nexus
