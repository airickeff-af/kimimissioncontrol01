# Mission Control Documentation Hub

## Quick Links

| Resource | Location | Description |
|----------|----------|-------------|
| **Dashboard** | `mission-control/dashboard/index-v4.html` | Main HQ interface |
| **Task Board** | `mission-control/dashboard/task-board.html` | All P0/P1/P2/P3 tasks |
| **Agent Performance** | `mission-control/dashboard/agent-performance.html` | Real-time metrics |
| **Token Tracker** | `mission-control/dashboard/token-tracker.html` | Usage & costs |
| **Pending Tasks** | `PENDING_TASKS.md` | Source of truth |
| **Memory** | `MEMORY.md` | Long-term knowledge |

---

## System Architecture

```
Mission Control/
├── agents/           # 9 core agents + subagents
├── dashboard/        # Web interfaces
├── modules/          # Shared utilities
├── reports/          # Generated reports
├── scripts/          # Automation scripts
└── docs/             # Documentation
```

---

## Agents Overview

| Agent | Role | Status | Current Task |
|-------|------|--------|--------------|
| Nexus | Orchestrator | ✅ Active | System coordination |
| Glasses | Research | ✅ Active | Daily briefings |
| Quill | Writer | ✅ Active | Content creation |
| Pixel | Designer | ✅ Active | Visual assets |
| Gary | Marketing | ✅ Active | Campaigns |
| Larry | Social | ⚠️ Blocked | API credentials needed |
| Sentry | DevOps | ✅ Active | Infrastructure |
| Audit | QA | ✅ Active | Quality reviews |
| Cipher | Security | ✅ Active | Monitoring |

---

## Task Priority System

- **P0 - Critical:** Complete ASAP, blocks other work
- **P1 - High:** This week, important for goals
- **P2 - Medium:** This month, nice to have
- **P3 - Low:** Future, when time permits

---

## Quick Commands

```bash
# View all tasks
openclaw cron list

# Check agent status
openclaw sessions list

# Generate weekly report
node mission-control/reports/weekly-report-generator.js

# Create new agent
./mission-control/scripts/create-agent.sh agent-name
```

---

## Key Files

| File | Purpose |
|------|---------|
| `PENDING_TASKS.md` | All tasks, priorities, assignments |
| `MEMORY.md` | Long-term memory, decisions, lessons |
| `HEARTBEAT.md` | System health check schedule |
| `AGENTS.md` | Agent definitions and roles |

---

## Integration Points

- **Telegram:** Main communication channel
- **Cron Jobs:** Automated task scheduling
- **API Server:** Port 3001 (localhost)
- **Dashboard:** File-based, open in browser

---

## Getting Started

1. Open `mission-control/dashboard/index-v4.html` in browser
2. Check Task Board for current priorities
3. Review Agent Performance for status
4. Read `PENDING_TASKS.md` for full context

---

*Last Updated: 2026-02-18*
*Maintained by: Nexus (Air1ck3ff)*
