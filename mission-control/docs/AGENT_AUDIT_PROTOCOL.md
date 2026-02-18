# Agent-Audit Integration Protocol

## Overview

This protocol defines how agents report progress to the audit system during task execution. All agents must follow this protocol to ensure transparency and accountability.

---

## When to Report to Audit

Agents MUST report to audit at the following milestones:

| Milestone | Description |
|-----------|-------------|
| **Task Started** | Immediately after accepting a task |
| **25% Complete** | First quarter milestone |
| **50% Complete** | Halfway point |
| **75% Complete** | Three-quarter milestone |
| **Task Completed** | Upon successful completion |
| **Errors Encountered** | Whenever errors or blockers occur |

---

## Report Format

All audit reports must be sent as JSON with the following structure:

```json
{
  "agent": "agent-name",
  "task": "TASK-XXX",
  "timestamp": "2026-02-18T20:48:00Z",
  "progress": 0-100,
  "status": "started|in_progress|blocked|completed|failed",
  "details": "What was done",
  "issues": ["any problems"],
  "next_steps": "what's next"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agent` | string | Yes | Unique identifier for the reporting agent |
| `task` | string | Yes | Task identifier (e.g., TASK-001) |
| `timestamp` | ISO-8601 | Yes | UTC timestamp of the report |
| `progress` | integer | Yes | Completion percentage (0-100) |
| `status` | enum | Yes | Current task status |
| `details` | string | Yes | Description of work completed |
| `issues` | array | No | List of any problems encountered |
| `next_steps` | string | No | Description of planned next actions |

### Status Values

- `started` - Task has been accepted and work is beginning
- `in_progress` - Task is actively being worked on
- `blocked` - Task is blocked by dependencies or issues
- `completed` - Task has been successfully completed
- `failed` - Task has failed and cannot be completed

---

## Usage Example

```javascript
const { reportToAudit } = require('../lib/report-to-audit');

// At task start
await reportToAudit({
  agent: 'Builder-1',
  task: 'TASK-042',
  progress: 0,
  status: 'started',
  details: 'Beginning implementation of user authentication system'
});

// At 50% complete
await reportToAudit({
  agent: 'Builder-1',
  task: 'TASK-042',
  progress: 50,
  status: 'in_progress',
  details: 'Completed login form UI, now implementing backend API',
  next_steps: 'Integrate JWT token generation'
});

// On error
await reportToAudit({
  agent: 'Builder-1',
  task: 'TASK-042',
  progress: 75,
  status: 'blocked',
  details: 'Database connection failed during user creation test',
  issues: ['PostgreSQL connection timeout', 'Network latency > 5s'],
  next_steps: 'Retry with connection pool configuration'
});

// On completion
await reportToAudit({
  agent: 'Builder-1',
  task: 'TASK-042',
  progress: 100,
  status: 'completed',
  details: 'User authentication system fully implemented and tested'
});
```

---

## Integration with Nexus Delegation

When Nexus assigns tasks, it MUST include audit reporting requirements:

### Task Assignment Format

```json
{
  "task": "TASK-042",
  "assigned_to": "Builder-1",
  "audit_requirements": {
    "report_progress_every": "25%",
    "primary_auditor": "Audit-1",
    "verifier": "Audit-2"
  }
}
```

### Audit Requirements

- **Report progress to Audit-1 every 25%** - Regular progress updates
- **Audit-2 will verify completion** - Final verification before task closure

---

## Audit Dashboard

A real-time dashboard is available to monitor all agent progress:

**URL:** `https://dashboard-ten-sand-20.vercel.app`

### Dashboard Features

- Real-time progress tracking
- Agent status overview
- Task completion rates
- Error and blocker alerts
- Historical audit logs

---

## Implementation

### Node.js

```javascript
const { reportToAudit } = require('./lib/report-to-audit');

await reportToAudit({
  agent: 'Your-Agent-Name',
  task: 'TASK-XXX',
  progress: 50,
  status: 'in_progress',
  details: 'Your progress description'
});
```

### Python

```python
from report_to_audit import report_to_audit

report_to_audit(
    agent="Your-Agent-Name",
    task="TASK-XXX",
    progress=50,
    status="in_progress",
    details="Your progress description"
)
```

### Shell/Curl

```bash
curl -X POST https://dashboard-ten-sand-20.vercel.app/api/audit/report \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "Your-Agent-Name",
    "task": "TASK-XXX",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "progress": 50,
    "status": "in_progress",
    "details": "Your progress description"
  }'
```

---

## Error Handling

If audit reporting fails:

1. **Retry 3 times** with exponential backoff
2. **Log locally** to `logs/audit-fallback.log`
3. **Continue task execution** - don't block on audit failures
4. **Report backlog** when connection restored

---

## Audit Log Retention

- **Active tasks:** Real-time
- **Completed tasks:** 90 days
- **Failed tasks:** 1 year (for analysis)
- **Archived:** After retention period

---

## Related Documents

- `/mission-control/lib/report-to-audit.js` - Helper function
- `/mission-control/dashboard/audit-dashboard.html` - Local dashboard view
- `/mission-control/docs/AUDIT_URL_STANDARD.md` - URL standards

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-18 | Initial protocol definition |
