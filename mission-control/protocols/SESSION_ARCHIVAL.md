# Session Archival Protocol

## Purpose
Manage session transcript lifecycle to prevent disk bloat and maintain system performance.

## Archival Rules

### Automatic Archival (Every 6 Hours)
Sessions are archived based on age and status:

| Age | Status | Action |
|-----|--------|--------|
| > 7 days | Completed | Archive to cold storage |
| > 3 days | Aborted | Archive + flag for review |
| > 1 day | Error/Crashed | Keep for debugging |
| < 1 day | Any | Keep active |

### Archive Location
```
/root/.openclaw/workspace/archives/
├── 2026-02/
│   ├── 2026-02-10_sessions.tar.gz
│   ├── 2026-02-11_sessions.tar.gz
│   └── ...
└── manifest.json
```

### Manual Archive Commands

```bash
# Archive sessions older than N days
./scripts/archive-sessions.sh --days 7

# View archive statistics
./scripts/archive-sessions.sh --stats

# Restore archived session
./scripts/archive-sessions.sh --restore <session-id>
```

### Session Retention Policy

**Hot Storage** (workspace root): Last 24 hours
**Warm Storage** (archives/): 7-30 days
**Cold Storage** (compressed): 30-90 days
**Deleted**: After 90 days (unless flagged)

## Current Session Inventory

### Active Sessions (Keep)
- agent:main:main (235k tokens - CRITICAL)
- agent:main:cron:* (current cron jobs)

### Pending Archive
- forge-coder (aborted, 3+ days old)
- forge-3-advanced (aborted, 3+ days old)
- code-2-backend (aborted, 3+ days old)

### Archive Schedule
- **Daily**: Archive sessions > 7 days old
- **Weekly**: Compress and move to cold storage
- **Monthly**: Purge sessions > 90 days old

## Implementation

### Cron Job
```json
{
  "name": "session-archive",
  "schedule": "0 2 * * *",
  "action": "Archive sessions > 7 days old"
}
```

### Archive Script
Location: `/root/.openclaw/workspace/mission-control/scripts/archive-sessions.sh`

### Archive Manifest
Tracks all archived sessions with metadata:
- Original session ID
- Archive date
- Size
- Compression ratio
- Restore availability

---
*Created: 2026-02-17*
*Maintained by: Nexus (Air1ck3ff)*
