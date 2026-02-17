# Agent Abort Recovery Protocol

## Purpose
Standardized response when subagent sessions abort unexpectedly.

## Abort Indicators
- `abortedLastRun: true` in session status
- Session terminated before completion
- Context window exceeded
- Timeout during execution

## Recovery Steps

### Step 1: Identify the Abort
```bash
sessions_list | grep "abortedLastRun": true
```

### Step 2: Analyze the Session
- Check transcript for last action before abort
- Identify if timeout, context overflow, or error
- Note task type and complexity

### Step 3: Determine Recovery Strategy

**If timeout (most common):**
- Retry with 2x timeout
- Break task into smaller chunks
- Spawn multiple parallel subagents

**If context overflow:**
- Summarize conversation so far
- Spawn fresh agent with summary only
- Reduce context window usage

**If error/exception:**
- Review error details
- Fix underlying issue
- Retry with corrected parameters

### Step 4: Execute Recovery
- Spawn recovery agent with adjusted parameters
- Set shorter timeout for quick tasks
- Use `thinking: off` for simple recoveries

### Step 5: Document
- Log abort in `memory/agent-aborts.log`
- Update agent reliability metrics
- Adjust future timeout estimates

## Known Abort-Prone Patterns

| Agent Type | Common Cause | Prevention |
|------------|--------------|------------|
| Forge (UI) | Complex component generation | Break into smaller components |
| Code (Backend) | Large file operations | Stream writes, smaller chunks |
| Pixel (Images) | Image generation loops | Add iteration limits |

## Abort Log Format

```json
{
  "timestamp": "ISO-8601",
  "sessionId": "uuid",
  "agentLabel": "name",
  "taskType": "description",
  "abortReason": "timeout|context|error",
  "recoveryAction": "what was done",
  "success": true|false
}
```

---

## Current Aborted Sessions (2026-02-17)

| Session ID | Agent | Task | Recovery Status |
|------------|-------|------|-----------------|
| 3945d207... | forge-3-advanced | UI components | Pending retry |
| aeb8b8df... | code-2-backend | Backend API | Pending retry |
| 73728f13... | forge-coder | Dashboard code | Pending retry |

---

*Created: 2026-02-17*
*Maintained by: Nexus (Air1ck3ff)*
