# Continuous Improvement Task Creation System

## Overview

This system ensures that improvements identified by the `continuous-improvement-delegation` cron job are ACTUALLY persisted as tasks in `PENDING_TASKS.md`, rather than just being logged to console and lost.

## Problem Solved

**Before:** The CI cron job would identify improvements but only log them to console. Tasks never appeared in PENDING_TASKS.md and were lost.

**After:** The CI cron job now has explicit instructions and tools to create TASK-CI-XXX entries in PENDING_TASKS.md with proper assignments, due dates, and tracking.

## Components

### 1. Updated Cron Job (`continuous-improvement-delegation`)
- **ID:** `a50f738e-4783-4543-8e48-a9e8d4585a53`
- **Schedule:** Every 4 hours
- **Location:** `/root/.openclaw/cron/jobs.json`

The cron payload now includes explicit instructions to:
- Use TASK-CI-XXX format for continuous improvement tasks
- Call the task creation script/API
- Actually persist tasks (not just log to console)

### 2. Task Creation Scripts

#### Direct Creator (Recommended)
```bash
python3 /root/.openclaw/workspace/mission-control/scripts/ci_task_creator_direct.py "Task Title" "Assignee" "Priority"
```

**Examples:**
```bash
# Basic usage
python3 ci_task_creator_direct.py "Fix API timeout issues"

# With assignee
python3 ci_task_creator_direct.py "Fix API timeout issues" "Code"

# Full specification
python3 ci_task_creator_direct.py "Fix API timeout issues" "Code" "P1"
```

#### Shell Wrapper
```bash
/root/.openclaw/workspace/mission-control/scripts/ci_delegation.sh "Task Title" "Assignee" "Priority"
```

#### Python Parser (Batch Mode)
```bash
python3 /root/.openclaw/workspace/mission-control/scripts/ci_task_creator.py < improvement_report.txt
```

### 3. API Endpoint

If the API server is running, tasks can be created via:

```bash
curl -X POST http://localhost:8080/api/tasks/create \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [{
      "title": "Fix API timeout",
      "assignee": "Code",
      "priority": "P1"
    }],
    "source": "Continuous Improvement"
  }'
```

## Task Format

Continuous Improvement tasks follow this format:

```markdown
### **TASK-CI-001: [Title]**
- **Assigned:** [Agent Name]
- **Due:** [YYYY-MM-DD] (3 days from creation)
- **Status:** ⏳ NOT STARTED
- **Priority:** P0/P1/P2/P3
- **Description:** Auto-generated from continuous improvement analysis
- **Source:** Continuous Improvement
- **Created:** [YYYY-MM-DD HH:MM]
```

## Usage for Agents

When the `continuous-improvement-delegation` cron runs, the agent should:

1. **Review** improvements from the last 4 hours
2. **Identify** actionable items
3. **Create tasks** using one of these methods:
   - Shell: `ci_delegation.sh "Title" "Assignee" "Priority"`
   - Python: `ci_task_creator_direct.py "Title" "Assignee" "Priority"`
   - API: POST to `/api/tasks/create`
4. **Report** to EricF with the TASK-CI-XXX IDs created

## File Locations

| Component | Path |
|-----------|------|
| Cron Config | `/root/.openclaw/cron/jobs.json` |
| Task File | `/root/.openclaw/workspace/PENDING_TASKS.md` |
| Direct Creator | `/root/.openclaw/workspace/mission-control/scripts/ci_task_creator_direct.py` |
| Shell Wrapper | `/root/.openclaw/workspace/mission-control/scripts/ci_delegation.sh` |
| Python Parser | `/root/.openclaw/workspace/mission-control/scripts/ci_task_creator.py` |
| API Server | `/root/.openclaw/workspace/mission-control/backend/api_server.py` |

## Testing

Test the task creation:
```bash
python3 /root/.openclaw/workspace/mission-control/scripts/ci_task_creator_direct.py "Test Task" "Nexus" "P2"
```

Verify in PENDING_TASKS.md:
```bash
grep "TASK-CI" /root/.openclaw/workspace/PENDING_TASKS.md
```

## Logs

Task creation logs:
```bash
tail -f /root/.openclaw/workspace/logs/ci_delegation.log
```

## Maintenance

- Tasks are auto-numbered (TASK-CI-001, TASK-CI-002, etc.)
- Due dates are automatically set to 3 days from creation
- Tasks are appended to the "NEW TASKS FROM CONTINUOUS IMPROVEMENT" section
- Duplicate detection is based on task title (within same batch)
