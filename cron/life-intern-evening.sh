#!/bin/bash
# Life Intern - Evening Wrap-up (9 PM Asia/Shanghai)
# Sends daily evening summary to EricF

cd /root/.openclaw/workspace

# Get tomorrow's date
tomorrow_str=$(date -d '+1 day' '+%A, %B %d')
tomorrow_short=$(date -d '+1 day' '+%a')

# Build the evening message
message="🌙 Evening wrap-up, EricF.

**Tomorrow (${tomorrow_short}, ${tomorrow_str}):**
- Check /personal/schedule.md for tomorrow's items

📝 Quick reflection:
• One thing that went well today?
• One thing to let go of?

💤 Wind-down reminder:
• Step away from screens when you can
• Tomorrow will be there when you wake up

Rest well! 🌟

_— Your Life Intern_"

# Send via Telegram (using openclaw message tool)
echo "$message"
