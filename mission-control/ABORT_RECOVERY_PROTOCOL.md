# Agent Abort Recovery Protocol

## Purpose
Standardized response for handling aborted subagent sessions to prevent lost work.

## Detection
Aborted sessions are detected during Check A (Agent Health) in the heartbeat rotation.

## Recovery Steps

### Step 1: Identify Aborted Sessions
Check `memory/heartbeat-state.json` → `agentHealth.abortedSessions` for entries with `recoveryStatus: "pending"`.

### Step 2: Analyze Session Context
For each aborted session:
1. Read the session transcript to understand what was being worked on
2. Identify the last completed action
3. Determine if work can be recovered or needs restart

### Step 3: Recovery Actions

**Option A: Resume Work**
- If the task was partially completed
- Spawn a new subagent with context from the aborted session
- Include instructions to continue from where it left off

**Option B: Restart Task**
- If the task was not meaningfully started
- Add back to task queue with original priority
- Note the abort in task history

**Option C: Escalate to EricF**
- If the abort indicates a systemic issue
- If multiple aborts of the same type occur
- If the task was critical (P0)

### Step 4: Update Recovery Status
After recovery action, update `recoveryStatus`:
- `recovered` - Work successfully resumed
- `restarted` - Task added back to queue
- `escalated` - EricF notified
- `dropped` - Task no longer relevant

### Step 5: Pattern Analysis
Track abort patterns:
- Same agent type aborting repeatedly?
- Specific task types causing aborts?
- Time correlation (certain hours more prone)?
- Token usage correlation?

## Current Aborted Sessions (Pending Recovery)

| Session ID | Label | Detected At | Recovery Status |
|------------|-------|-------------|-----------------|
| 3945d207-fc0b-4091-b7c0-9ddd35e6fefe | forge-3-advanced | 1771299262 | pending |
| aeb8b8df-d877-421f-8647-ccbc9d38a3be | code-2-backend | 1771299000 | pending |
| 73728f13-3d28-4e2f-a9ee-6771ef72460d | forge-coder | 1771289394 | pending |

## Prevention Measures

1. **Shorter Timeouts**: Use 60-90s timeouts for subagents instead of 120s
2. **Checkpointing**: Agents should save progress every few steps
3. **Smaller Tasks**: Break large tasks into smaller sub-tasks
4. **Token Monitoring**: Watch main session token usage during heavy delegation

---
*Created: 2026-02-17*
*Maintained by: Nexus (Air1ck3ff)*
