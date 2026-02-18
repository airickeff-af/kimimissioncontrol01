# Agent-Audit Integration System

## Overview

This document describes the complete Agent-Audit Integration system that enables agents to report their progress to audit during task execution.

---

## System Components

### 1. AGENT_AUDIT_PROTOCOL.md
**Location:** `/mission-control/docs/AGENT_AUDIT_PROTOCOL.md`

The protocol specification defining:
- When agents must report (milestones)
- Report format (JSON schema)
- Status values and their meanings
- Integration with Nexus delegation
- Usage examples in multiple languages

### 2. report-to-audit.js
**Location:** `/mission-control/lib/report-to-audit.js`

JavaScript helper module providing:
- `reportToAudit()` - Main reporting function with validation
- `quickReports` - Convenience methods for common milestones
- `replayFallbackLogs()` - Replays failed reports when connection restored
- `getTaskAuditStatus()` - Query audit status for a task
- Automatic retry with exponential backoff
- Fallback logging to local file

### 3. audit-dashboard.html
**Location:** `/mission-control/dashboard/audit-dashboard.html`

Real-time dashboard featuring:
- Statistics overview (Active, Completed, Blocked, Pending)
- Task list with progress bars and status badges
- Active agents list with online/offline status
- Recent activity log
- Filter controls
- Auto-refresh every 5 seconds
- Demo mode when API unavailable

---

## Quick Start

### For Agent Developers

```javascript
const { reportToAudit, quickReports } = require('./mission-control/lib/report-to-audit');

// Quick milestone reports
await quickReports.started('Builder-1', 'TASK-001', 'Starting implementation');
await quickReports.half('Builder-1', 'TASK-001', 'Backend API complete');
await quickReports.completed('Builder-1', 'TASK-001', 'All tests passing');

// Or full control
await reportToAudit({
  agent: 'Builder-1',
  task: 'TASK-001',
  progress: 75,
  status: 'in_progress',
  details: 'Frontend integration in progress',
  issues: ['Minor CSS alignment issue'],
  next_steps: 'Fix CSS and deploy'
});
```

### For Nexus (Task Assignment)

When assigning tasks, include audit requirements:

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

### For Auditors

View real-time progress at:
**https://dashboard-ten-sand-20.vercel.app**

Or open `mission-control/dashboard/audit-dashboard.html` locally.

---

## Reporting Milestones

| Milestone | Progress | Status | Required |
|-----------|----------|--------|----------|
| Task Started | 0% | `started` | ✅ Yes |
| 25% Complete | 25% | `in_progress` | ✅ Yes |
| 50% Complete | 50% | `in_progress` | ✅ Yes |
| 75% Complete | 75% | `in_progress` | ✅ Yes |
| Task Completed | 100% | `completed` | ✅ Yes |
| Errors/Blocked | any | `blocked` | ⚠️ As needed |
| Task Failed | any | `failed` | ⚠️ As needed |

---

## Report Format

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

---

## Error Handling

The `reportToAudit()` function handles failures gracefully:

1. **Retries:** 3 attempts with exponential backoff
2. **Fallback:** Logs to `logs/audit-fallback.log` if API unavailable
3. **Continues:** Task execution is never blocked by audit failures
4. **Replay:** Call `replayFallbackLogs()` when connection restored

---

## Dashboard Features

### Statistics Cards
- **Active Tasks:** Currently being worked on
- **Completed Today:** Finished tasks
- **Blocked:** Tasks with issues
- **Pending:** Not yet started

### Task Table
- Task ID and description
- Assigned agent
- Status badge
- Progress bar
- Last update time

### Agent List
- Agent name and avatar
- Current task
- Online/offline/busy status

### Activity Log
- Real-time updates
- Timestamp
- Agent and task
- Progress details

---

## File Structure

```
mission-control/
├── docs/
│   ├── AGENT_AUDIT_PROTOCOL.md    # Protocol specification
│   └── AUDIT_URL_STANDARD.md      # URL standards
├── lib/
│   └── report-to-audit.js         # Helper functions
├── dashboard/
│   └── audit-dashboard.html       # Local dashboard view
└── logs/
    └── audit-fallback.log         # Fallback audit logs
```

---

## API Endpoints

The dashboard expects these API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/audit/report` | POST | Submit audit report |
| `/api/tasks` | GET | List all tasks |
| `/api/agents` | GET | List active agents |
| `/api/audit/recent` | GET | Recent audit entries |
| `/api/audit/task/:id` | GET | Task audit history |

---

## Configuration

### Environment Variables

```bash
# Optional: Override dashboard URL
AUDIT_DASHBOARD_URL=https://your-dashboard.vercel.app

# Optional: Change retry behavior
AUDIT_MAX_RETRIES=3
AUDIT_RETRY_DELAY_MS=1000
```

---

## Integration Checklist

- [ ] Agent imports `report-to-audit.js`
- [ ] Reports at task start (0%)
- [ ] Reports at 25%, 50%, 75% milestones
- [ ] Reports at task completion (100%)
- [ ] Reports errors/blockers immediately
- [ ] Nexus includes audit requirements in assignments
- [ ] Dashboard URL configured correctly

---

## Troubleshooting

### Reports not appearing on dashboard
1. Check network connectivity to dashboard URL
2. Verify agent name and task ID are correct
3. Check browser console for errors
4. Review fallback log file

### Fallback log growing
1. Check dashboard API is accessible
2. Run `replayFallbackLogs()` to retry
3. Monitor connection status

### Dashboard shows offline
1. Verify API endpoints are responding
2. Check CORS settings
3. Dashboard falls back to demo mode automatically

---

## Version

**Version:** 1.0  
**Created:** 2026-02-18  
**Dashboard URL:** https://dashboard-ten-sand-20.vercel.app
