# ERICF SYSTEM REQUIREMENTS
**Nexus (Air1ck3ff) - Master Reference**

## Core Goals

### 1. ALL TASKS IN ONE PLACE
**Where:** PENDING_TASKS.md
**What goes there:**
- Agent-assigned tasks (TASK-001, TASK-002, etc.)
- Standup auto-generated tasks (TASK-AUTO-001, etc.)
- Self-improvement tasks (TASK-CI-001, etc.)
- Innovation sprint tasks (TASK-037, TASK-038, etc.)

**Rule:** If it's work to be done, it MUST be in PENDING_TASKS.md

### 2. AUTO-AUDIT ON COMPLETION
**Trigger:** Every 30 minutes
**What happens:**
1. Scan PENDING_TASKS.md for "COMPLETED" tasks
2. Audit Bot rates each (minimum 95/100)
3. Report scores to EricF via Telegram
4. Create fix tasks for anything below 95

**No exceptions:** Every completed task gets audited

### 3. AUTO-DEPLOY EVERY 30 MINUTES
**Trigger:** Every 30 minutes
**What happens:**
1. Check if Git has new commits
2. If yes: Push to GitHub → Vercel auto-deploys
3. If no: Force redeploy anyway (fresh cache)
4. Log deployment status

**Result:** Vercel always shows latest version

### 4. EVERYTHING MESHES
**The Loop:**
1. Agent completes task → Marks COMPLETED in PENDING_TASKS.md
2. Audit Bot (30 min) → Audits completed tasks → Reports scores
3. If score < 95 → Creates fix task → Back to step 1
4. Auto-deploy (30 min) → Pushes latest to Vercel
5. EricF reviews on Vercel → Approves/requests changes

**No lost tasks. No missed audits. No stale deployments.**

---

## Task ID Conventions

| Prefix | Source | Example |
|--------|--------|---------|
| TASK-XXX | Agent-assigned | TASK-001, TASK-002 |
| TASK-AUTO-XXX | Standup auto-generated | TASK-AUTO-001 |
| TASK-CI-XXX | Continuous improvement | TASK-CI-001 |
| BUG-XXX | Bug fixes | BUG-001 |
| FEAT-XXX | New features | FEAT-001 |

---

## Audit Standards (Strict)

**Minimum Score:** 95/100
**Automatic deductions:**
- console.log statements: -5 each
- TODO comments: -5 each
- Hardcoded data without DEMO label: -10
- Missing error handling: -5
- Non-functional buttons: -5
- Placeholder content: -10

**Two specialized audit agents:**
1. **Audit-Backend** - Code quality, logic, APIs
2. **Audit-Frontend** - Visual display, UI, functionality

---

## Deployment

**URL:** https://dashboard-5b11p28d9-airickeffs-projects.vercel.app
**Auto-deploy:** Every 30 minutes
**Manual deploy:** On every Git push

**To view without auth:**
1. Go to Vercel Dashboard → Project Settings → Deployment Protection
2. Disable "Vercel Authentication"

---

## Cron Schedule Summary

| Job | Frequency | Purpose |
|-----|-----------|---------|
| heartbeat-nexus-airick | 30 min | System health check |
| immediate-audit-trigger | 15 min | Audit completed tasks |
| auto-audit-completed-tasks | 30 min | Deep audit with scores |
| auto-deploy-vercel | 30 min | Ensure latest deployment |
| continuous-improvement | 4 hours | Generate improvement tasks |
| agent-progress-report | 4 hours | Report to EricF |
| glasses-daily-briefing | 6:45 AM | Daily intelligence |
| daily-briefing | 8:00 AM | Daily summary |

---

## EricF Authority

**Executive Decisions (3+ hour absence):**
- Approve task completions
- Assign new tasks
- Fix blockers
- Deploy improvements

**Always requires approval:**
- Public posts (Twitter, LinkedIn)
- Cold call outreach
- API credential changes
- Budget/expense decisions

---

*This document is the single source of truth for Nexus operations.*