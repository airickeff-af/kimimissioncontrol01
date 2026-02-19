#!/bin/bash
# Life Intern - Morning Check-in (8 AM Asia/Shanghai)
# Sends daily morning briefing to EricF

cd /root/.openclaw/workspace

# Get today's date
date_str=$(date '+%A, %B %d')
day_short=$(date '+%a')

# Build the morning message
message="🌱 Good morning EricF!

**Today is ${day_short}, ${date_str}**

📅 Your Personal Schedule:
- Check /personal/schedule.md for today's items

💡 Today's gentle nudges:
• Morning routine — however you define it
• Take a moment to set your intention for the day
• Remember: work is important, but so are you

Have a great day! 🚀

_— Your Life Intern_"

# Send via Telegram (using openclaw message tool)
echo "$message"
