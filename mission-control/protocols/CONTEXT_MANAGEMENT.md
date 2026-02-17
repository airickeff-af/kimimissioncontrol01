# Main Session Context Management Protocol

## Purpose
Prevent main session context overflow and maintain optimal performance.

## Current Status
- **Session**: agent:main:main
- **Context Usage**: 235k/262k (90%)
- **Status**: ⚠️ WARNING - Near threshold
- **Last Checked**: 2026-02-17 16:17 CST

## Thresholds

| Level | Tokens | Action |
|-------|--------|--------|
| 🟢 Normal | < 150k | No action needed |
| 🟡 Elevated | 150k-200k | Monitor closely |
| 🟠 Warning | 200k-240k | Prepare compression |
| 🔴 Critical | > 240k | **COMPRESS IMMEDIATELY** |

## Compression Strategy

### Automatic Compression Triggers
1. **Token count > 240k** → Immediate compression
2. **Token count > 200k for > 1 hour** → Scheduled compression
3. **Daily at 3 AM** → Routine maintenance compression

### Compression Methods

#### Method 1: Summarize Old Context (Preferred)
- Summarize conversations older than 24 hours
- Preserve key decisions and action items
- Remove redundant tool call outputs

#### Method 2: Archive and Reset
- Archive full transcript to file
- Reset session with summary context
- Link to archived transcript

#### Method 3: Selective Pruning
- Remove old heartbeat acknowledgments
- Remove successful tool call confirmations
- Keep only essential context

## Current Compression Plan

### Immediate Actions (Next 2 Hours)
1. ✅ Disable redundant cron jobs (reduces new token accumulation)
2. ⏳ Summarize yesterday's deployment activity
3. ⏳ Archive old agent spawn logs

### Short-term Actions (Today)
1. Archive 3 aborted agent sessions
2. Compress cron job transcripts
3. Summarize completed task history

### Long-term Actions (This Week)
1. Implement automatic compression at 200k threshold
2. Create session health dashboard
3. Set up alerts before critical threshold

## Compression Script

```bash
#!/bin/bash
# compress-context.sh

TOKEN_COUNT=$(session_status | grep "Context:" | awk '{print $2}' | cut -d'/' -f1)
THRESHOLD=200000

if [ "$TOKEN_COUNT" -gt "$THRESHOLD" ]; then
    echo "Token count $TOKEN_COUNT exceeds threshold. Compressing..."
    # Archive old messages
    # Summarize context
    # Notify EricF
fi
```

## Prevention Measures

### 1. Reduce Noise
- ✅ Disabled redundant agent heartbeats
- ✅ Consolidated task queue checks
- ⏳ Review and optimize other cron jobs

### 2. Efficient Context Usage
- Use isolated sessions for complex tasks
- Spawn sub-agents for parallel work
- Archive completed work immediately

### 3. Monitoring
- Check token count every 30 minutes
- Alert at 200k threshold
- Emergency compression at 240k

## Recovery Protocol

If session hits 262k limit:
1. Archive current transcript immediately
2. Create new session with summary context
3. Notify EricF of session reset
4. Link to archived full history

## Metrics to Track

- Context usage over time
- Compression frequency
- Token accumulation rate
- Session reset count

---
*Created: 2026-02-17*
*Status: ⚠️ Active - Context at 90%*
*Maintained by: Nexus (Air1ck3ff)*
