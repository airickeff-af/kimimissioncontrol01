# TASK-068: Agent Work Cards Enhancement

## Assignment
- **Agent:** Forge-2
- **Task ID:** TASK-068
- **Priority:** P1
- **Due:** Feb 19, 2026 7:31 AM
- **Quality Target:** 96/100

## Objective
Enhance Agent Work Cards to display token metrics per agent with daily/weekly/total usage statistics.

## Requirements
1. **Token Metrics to Display**
   - **Daily Usage**: Tokens consumed today
   - **Weekly Usage**: Tokens consumed this week (7 days)
   - **Total Usage**: All-time token consumption
   - **Cost Estimate**: Approximate cost based on token usage

2. **Per-Agent Display**
   - Agent name/avatar
   - Current status (active/idle/offline)
   - Token metrics (daily/weekly/total)
   - Task completion rate
   - Last active timestamp

3. **Visual Elements**
   - Progress bars for usage vs limits
   - Sparkline charts for usage trends
   - Color indicators (green/yellow/red) for usage levels
   - Expandable details view

4. **Data Sources**
   - Token usage logs
   - Agent activity logs
   - Cost calculation config

## API/Data Requirements
```typescript
interface AgentMetrics {
  agentId: string;
  agentName: string;
  status: 'active' | 'idle' | 'offline';
  tokens: {
    daily: number;
    weekly: number;
    total: number;
  };
  cost: {
    daily: number;  // USD
    weekly: number;
    total: number;
  };
  tasksCompleted: number;
  lastActive: Date;
}
```

## Deliverables
- Enhanced Work Card component
- Token metrics service/module
- Data aggregation logic
- UI updates

## Audit Checkpoints
- [ ] 25% - Design spec, data model
- [ ] 50% - Basic metrics display
- [ ] 75% - Charts and visual polish
- [ ] 100% - Complete with all features

## Progress Reports
Report every 2 hours to main agent.
