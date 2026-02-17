# Agent Onboarding Checklist

## Pre-Creation
- [ ] Define agent name (lowercase, alphanumeric with hyphens)
- [ ] Determine agent type (worker, specialist, manager, scout, sentry)
- [ ] Clarify agent role and responsibilities
- [ ] Set priority level (P0-Critical, P1-High, P2-Medium, P3-Low)
- [ ] Decide if dashboard integration is needed
- [ ] Determine if cron jobs are required

## Creation Process
- [ ] Run `create-agent.sh` with appropriate options
- [ ] Verify directory structure created correctly
- [ ] Confirm agent.json configuration
- [ ] Review SOUL.md personality definition
- [ ] Check README.md documentation
- [ ] Validate initial onboarding task created

## Post-Creation
- [ ] Read welcome message (WELCOME.txt)
- [ ] Review training materials
- [ ] Complete onboarding task checklist
- [ ] Test communication channels
- [ ] Verify dashboard integration (if enabled)
- [ ] Confirm cron job setup (if configured)
- [ ] Update agent registry

## First Week
- [ ] Complete onboarding task
- [ ] Submit first report
- [ ] Establish daily workflow
- [ ] Meet other agents
- [ ] Receive first real assignment

## Monthly Review
- [ ] Assess task completion rate
- [ ] Review and update capabilities
- [ ] Check metrics and performance
- [ ] Update documentation if needed
- [ ] Gather feedback for improvements

---

## Quick Reference

### Agent Types
| Type | Description | Use Case |
|------|-------------|----------|
| worker | General-purpose executor | Routine tasks, data processing |
| specialist | Domain expert | Deep expertise in specific area |
| manager | Coordinator | Orchestrates other agents |
| scout | Proactive researcher | Monitors and discovers |
| sentry | Alert system | Monitoring and notifications |

### Priority Levels
- **P0-Critical**: Immediate attention required
- **P1-High**: Complete within 24 hours
- **P2-Medium**: Complete within 3-5 days
- **P3-Low**: Complete when possible

### File Locations
- Agents: `/mission-control/agents/{agent-name}/`
- Scripts: `/mission-control/scripts/`
- Templates: `/mission-control/templates/`
- Dashboard: `/mission-control/dashboard/`
- Docs: `/mission-control/docs/`
