# TASK-068: Agent Work Cards with Token Metrics (P1 HIGH)
## Assigned: Forge-2
## Due: Feb 19, 2026
## Quality Standard: 95/100

## OBJECTIVE:
Update agent work cards to display detailed token usage metrics

## CURRENT STATE:
- Agent cards show basic info
- Token usage is minimal or static
- No detailed metrics per agent

## REQUIREMENTS:
1. Update agent cards to show:
   - Total tokens used (lifetime)
   - Tokens used today/this week
   - Cost estimate ($)
   - Efficiency rating (tokens per task)
   - Trend indicator (up/down/stable)
2. Fetch data from /api/tokens endpoint
3. Update in real-time or on refresh
4. Maintain Kairosoft pixel theme

## ACCEPTANCE CRITERIA:
- [ ] All 22 agents show token metrics
- [ ] Data is fetched from API (not hardcoded)
- [ ] Cards maintain pixel theme styling
- [ ] Metrics update correctly

## AUDIT CHECKPOINTS:
- 25%: Design mockup complete
- 50%: Card component updated
- 75%: API integration complete
- 100%: Final verification

## QUALITY STANDARD: 95/100
