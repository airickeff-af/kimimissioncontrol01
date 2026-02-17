# Task Auto-Capture Protocol

## Problem
Tasks are often discussed in conversation but not formally added to TASK_QUEUE.md, leading to:
- Lost tasks that fall through cracks
- No visibility into what's being worked on
- Difficulty tracking completion rates

## Solution
Auto-capture tasks from conversation context and add them to the queue.

## Trigger Phrases (Nexus should detect)
- "I need to..."
- "Can you..."
- "We should..."
- "Add task:..."
- "Remind me to..."
- "Follow up on..."

## Auto-Capture Rules

### Immediate Capture (Add to queue right away)
1. **Explicit task requests** - "Add task: research competitors"
2. **Time-sensitive items** - Anything with a deadline mentioned
3. **Multi-step work** - Anything requiring >30 minutes
4. **Delegation candidates** - Work better suited for specialist agents

### Conversation-Only (Don't add to queue)
1. **Quick questions** - "What's the weather?"
2. **Clarifications** - "What did you mean by..."
3. **One-off lookups** - "Search for..."
4. **Already in progress** - Task already being handled

## Capture Template

When a task is detected, Nexus should:

1. **Acknowledge** - "I'll add that to the task queue."
2. **Assign** - Determine best agent (or self)
3. **Prioritize** - Default to P2 unless urgency indicated
4. **Log it** - Add to TASK_QUEUE.md with format:

```markdown
| ID | Task | Status | Assigned To | Priority | Created | Due |
|----|------|--------|-------------|----------|---------|-----|
| T{number} | {description} | 🟡 PENDING | {agent} | {P0-P3} | {timestamp} | {if specified} |
```

## Daily Task Reconciliation

At 8 AM daily briefing, Nexus should:
1. Review yesterday's conversation for uncaptured tasks
2. Add any missed items to queue
3. Update task statuses based on completion
4. Report queue summary to EricF

## Task Completion Detection

Nexus should detect task completion from:
- Explicit: "Mark task T5 as complete"
- Implicit: Delivering requested work
- Agent reports: Subagent session completion

## Integration with Heartbeat

The heartbeat check should:
1. Count pending tasks
2. Flag tasks >24h old
3. Alert if P0/P1 tasks pending >30 min

## Metrics to Track

- Tasks captured per day
- Tasks completed per day  
- Average time from capture to completion
- Tasks that slipped through (discovered later)

---

*Created: 2026-02-17*
*Next Review: 2026-02-24*
