#!/bin/bash
# Weekly Partnership Opportunity Report
# Runs every Monday at 9:00 AM
# Cron: 0 9 * * 1 /root/.openclaw/workspace/mission-control/agents/scout/weekly-partnership-report.sh

cd /root/.openclaw/workspace/mission-control/agents/scout

# Generate timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$TIMESTAMP] Starting weekly partnership report..."

# Generate report
node partnership-finder.js --report > /tmp/partnership-report.log 2>&1

# Generate dashboard
node partnership-finder.js --dashboard >> /tmp/partnership-report.log 2>&1

# Send notification if Telegram is configured
if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    REPORT_DATE=$(date '+%Y-%m-%d')
    curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
        -d "chat_id=1508346957" \
        -d "text=🤝 Weekly Partnership Report Generated%0A%0ADate: $REPORT_DATE%0A%0A📊 Top 10 partnership targets identified%0A📈 Report saved to reports/partnership-report-$REPORT_DATE.json%0A🌐 Dashboard: reports/partnership-dashboard-$REPORT_DATE.html%0A%0ARun: node partnership-finder.js --report" \
        > /dev/null 2>&1
fi

echo "[$TIMESTAMP] Weekly partnership report complete!"
echo "View report: node partnership-finder.js --report"
