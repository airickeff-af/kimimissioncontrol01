# TASK-034: Token Tracker Live API (P2 MEDIUM)
## Assigned: Code-1
## Due: Feb 19, 2026 9:00 AM
## Quality Standard: 95/100

## OBJECTIVE:
Build backend API for real token usage data - currently using static hardcoded data

## CURRENT STATE:
- Token Tracker page shows static/hardcoded data
- No live connection to actual token usage

## REQUIREMENTS:
1. Create/enhance `/api/tokens` endpoint to return real data
2. Parse session files from `/root/.openclaw/agents/main/sessions/*.jsonl`
3. Calculate tokens per agent:
   - Total tokens (lifetime)
   - Tokens today/this week
   - Cost estimates
4. Return structured JSON response

## API RESPONSE FORMAT:
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "name": "Nexus",
        "tokensIn": 100000,
        "tokensOut": 50000,
        "totalTokens": 150000,
        "cost": 0.15,
        "sessions": 25
      }
    ],
    "total": {
      "tokensIn": 1000000,
      "tokensOut": 500000,
      "totalTokens": 1500000,
      "cost": 1.50
    }
  },
  "timestamp": "2026-02-19T00:00:00Z"
}
```

## ACCEPTANCE CRITERIA:
- [ ] /api/tokens returns real data from session files
- [ ] All 22 agents have token metrics
- [ ] Token Tracker page uses live API
- [ ] Data updates within 15 minutes

## IMPLEMENTATION NOTES:
- Use existing `/mission-control/api/tokens.js` as base
- Parse JSONL session files for usage data
- Cache results for performance

## AUDIT CHECKPOINTS:
- 25%: API endpoint created
- 50%: Session parsing working
- 75%: Frontend integration complete
- 100%: Final verification
