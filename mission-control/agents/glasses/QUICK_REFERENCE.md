# Weekly Report Generator - Quick Reference

## 🚀 Quick Start

### Generate a Report Manually
```bash
/root/.openclaw/workspace/mission-control/agents/glasses/scripts/generate-weekly-report.sh
```

### View Latest Report
```bash
cat /root/.openclaw/workspace/reports/weekly/$(ls -t /root/.openclaw/workspace/reports/weekly/ | head -1)
```

### List All Reports
```bash
ls -la /root/.openclaw/workspace/reports/weekly/
```

---

## 📁 File Locations

| File | Path |
|------|------|
| System Documentation | `/root/.openclaw/workspace/mission-control/agents/glasses/weekly-report-system.md` |
| Report Template | `/root/.openclaw/workspace/mission-control/agents/glasses/templates/weekly-report-template.md` |
| Generation Script | `/root/.openclaw/workspace/mission-control/agents/glasses/scripts/generate-weekly-report.sh` |
| Report Archive | `/root/.openclaw/workspace/reports/weekly/` |
| Sample Report | `/root/.openclaw/workspace/reports/weekly/2026-W08-report.md` |

---

## 📊 Data Sources

The report pulls from these files:

1. **MEMORY_BANK.md** - Critical facts, agent statuses, blockers, financials
2. **PENDING_TASKS.md** - Task completion tracking, priorities
3. **AGENT_TASK_TRACKER.md** - Agent-specific work, metrics
4. **ACTIVE_TASKS.md** - Current active tasks
5. **LEAD_MANAGEMENT_SYSTEM_v2.md** - Lead generation metrics
6. **memory/YYYY-MM-DD.md** - Daily logs (for trend analysis)

---

## 🔄 Automation Schedule

**Default:** Every Sunday at 9:00 PM HKT

To schedule with cron:
```bash
# Edit crontab
crontab -e

# Add line:
0 21 * * 0 /root/.openclaw/workspace/mission-control/agents/glasses/scripts/generate-weekly-report.sh
```

---

## 📝 Report Sections

Each weekly report includes:

1. **Executive Summary** - High-level week status
2. **Accomplishments** - Tasks completed by priority
3. **Lead Generation** - DealFlow metrics and pipeline
4. **Agent Performance** - Status and quality scores
5. **Blockers & Issues** - Active problems and resolutions
6. **Financial Metrics** - Token usage and costs
7. **System Metrics** - Health and uptime stats
8. **Next Week Focus** - Upcoming priorities and deadlines
9. **Key Learnings** - What worked/didn't
10. **Strategic Recommendations** - Data-driven suggestions
11. **Trends & Insights** - Week-over-week comparisons
12. **Achievements** - Milestones unlocked

---

## 🎯 Placeholder Reference

### Date/Time
- `{{WEEK_START}}` - First day of week
- `{{WEEK_END}}` - Last day of week
- `{{GENERATED_AT}}` - Report generation timestamp
- `{{REPORT_NUMBER}}` - Sequential report ID
- `{{NEXT_REPORT_DATE}}` - Next Sunday

### Tasks
- `{{COMPLETED_COUNT}}` - Tasks completed
- `{{TOTAL_TASKS}}` - Total tasks
- `{{P0_COMPLETED}}` / `{{P0_TOTAL}}` / `{{P0_RATE}}` - P0 metrics
- `{{MAJOR_WINS}}` - Significant accomplishments

### Leads
- `{{LEAD_TARGET}}` / `{{LEAD_ACTUAL}}` - Lead numbers
- `{{DAILY_AVERAGE}}` - Average leads per day
- `{{REGIONAL_ACTUAL}}` - Regional lead counts

### Agents
- `{{AGENT_NAME}}` - Agent codename
- `{{AGENT_STATUS}}` - 🟢/🟡/🔴 status
- `{{AGENT_TASKS}}` - Tasks completed
- `{{AGENT_SCORE}}` - Quality percentage

### Financial
- `{{WEEKLY_TOKENS}}` - Token count
- `{{WEEKLY_COST}}` - Cost in USD
- `{{EFFICIENCY_RATING}}` - Good/Excellent/Poor

---

## 🔧 Customization

### Add New Metrics
1. Edit the template: `templates/weekly-report-template.md`
2. Add placeholder: `{{NEW_METRIC}}`
3. Update script to populate value

### Change Schedule
1. Edit cron job or heartbeat configuration
2. Update `NEXT_REPORT_DATE` calculation in script

### Modify Format
1. Edit template file
2. Maintain placeholder structure for automation

---

## 📞 Support

**System Owner:** Glasses (The Researcher)  
**Reports To:** Nexus (Air1ck3ff)  
**Delivery:** EricF via Telegram

---

*Quick Reference v1.0 | Glasses | Mission Control*
