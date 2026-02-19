#!/bin/bash
# Life Intern - Weekly Summary (Sunday 6 PM Asia/Shanghai)
# Sends weekly summary and prepares next week's review

cd /root/.openclaw/workspace

# Get current week dates
week_start=$(date -d 'last sunday' '+%Y-%m-%d')
week_end=$(date '+%Y-%m-%d')
next_week_start=$(date -d '+1 day' '+%Y-%m-%d')

# Create next week's review file
next_review="/root/.openclaw/workspace/personal/weekly-reviews/${next_week_start}.md"
if [ ! -f "$next_review" ]; then
    cp /root/.openclaw/workspace/personal/weekly-reviews/TEMPLATE.md "$next_review"
    sed -i "s/\[DATE\]/${next_week_start}/g" "$next_review"
fi

# Build the weekly message
message="📅 **Weekly Summary - Week of ${week_start}**

🌱 Hey EricF, here's your personal week in review:

🏆 **Wins to celebrate:**
(Check your weekly review at /personal/weekly-reviews/)

📅 **Next week preview:**
- Review your schedule at /personal/schedule.md
- Any appointments to prepare for?

👥 **Connection check:**
- Who haven't you spoken to lately?
- Check /personal/contacts.md

💆 **Self-care reminder:**
- Did you take time for yourself this week?
- What's one thing that would make next week better?

New weekly review created: \`weekly-reviews/${next_week_start}.md\`

_— Your Life Intern_"

echo "$message"
