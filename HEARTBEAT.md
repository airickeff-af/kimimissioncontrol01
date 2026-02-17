# Nexus Heartbeat Checklist

## Purpose
Batch periodic checks into a single efficient heartbeat instead of scattered individual checks.

## Consolidated Schedule (Post TASK-021)

**Previous overlapping jobs (DISABLED):**
- ~~self-improvement-continuous~~ (hourly) - ❌ Disabled
- ~~auto-sync-all-systems~~ (every 5 min) - ❌ Disabled  
- ~~memory-bank-update~~ (every 30 min) - ❌ Disabled
- ~~task-queue-reminder~~ (every 20 min) - ❌ Disabled

**New consolidated heartbeat:** `heartbeat-nexus-airick` (every 30 min)

## Check Rotation (30-minute intervals with task rotation)

### Cycle 1 (0:00, 6:00, 12:00, 18:00 UTC) - Task Queue & Sync
- [ ] Read TASK_QUEUE.md for pending items
- [ ] Check PENDING_TASKS.md for discrepancies
- [ ] Alert EricF only if P0/P1 tasks pending >30 min

### Cycle 2 (0:30, 6:30, 12:30, 18:30 UTC) - Agent Health
- [ ] Review agent session status via `sessions_list`
- [ ] Check for any crashed/stalled agents
- [ ] Verify cron job health (any failures?)

### Cycle 3 (1:00, 7:00, 13:00, 19:00 UTC) - Memory & Systems
- [ ] Memory bank update - review recent memory files
- [ ] System sync - check for forgotten items
- [ ] Update MEMORY_BANK.md if needed

### Cycle 4 (1:30, 7:30, 13:30, 19:30 UTC) - Self-Improvement
- [ ] Review recent agent outputs
- [ ] Identify friction points
- [ ] Propose/fix workflow improvements

### Cycle 5-8 (2:00-3:30 UTC) - Resource & Deep Maintenance
- [ ] Check disk space on workspace
- [ ] Review session token usage
- [ ] Archive old session transcripts
- [ ] Deep memory consolidation (every 6h)

## Alert Thresholds

**Notify EricF immediately if:**
- Any agent shows `abortedLastRun: true`
- Cron job has `consecutiveErrors > 2`
- P0 task pending >30 minutes
- Main session token usage >200k

**Silently handle:**
- Routine agent heartbeats
- P2/P3 tasks in queue
- Normal system operations

## State Tracking

Track last check times in `memory/heartbeat-state.json`:
```json
{
  "lastChecks": {
    "agentHealth": 0,
    "taskQueue": 0,
    "systemResources": 0,
    "memoryMaintenance": 0
  }
}
```

## Token Savings Estimate

**Before consolidation:**
- auto-sync-all-systems: every 5 min = 288 runs/day
- task-queue-reminder: every 20 min = 72 runs/day
- memory-bank-update: every 30 min = 48 runs/day
- self-improvement-continuous: hourly = 24 runs/day
- **Total: ~432 runs/day**

**After consolidation:**
- heartbeat-nexus-airick: every 30 min = 48 runs/day
- **Total: ~48 runs/day**

**Savings: ~89% reduction in scheduled job executions**

---
*Created: 2026-02-17*
*Updated: 2026-02-18 (TASK-021)*
*Maintained by: Nexus (Air1ck3ff)*
