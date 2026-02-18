#!/usr/bin/env python3
"""
Continuous Improvement Task Creator - Direct Mode
Reads PENDING_TASKS.md, finds improvements mentioned, converts to actual tasks.

Usage:
  python3 ci_task_creator_direct.py                    # Auto-detect improvements
  python3 ci_task_creator_direct.py "Task description" # Create specific task
"""

import re
import sys
import json
from datetime import datetime, timedelta
from pathlib import Path

WORKSPACE = Path("/root/.openclaw/workspace")
PENDING_TASKS_PATH = WORKSPACE / "PENDING_TASKS.md"

def get_next_ci_task_number():
    """Find the next available TASK-CI-XXX number"""
    if not PENDING_TASKS_PATH.exists():
        return 1
    
    content = PENDING_TASKS_PATH.read_text()
    matches = re.findall(r'TASK-CI-(\d{3})', content)
    if matches:
        return max(int(m) for m in matches) + 1
    return 1

def create_task_entry(task_num, title, assignee="Nexus", priority="P2"):
    """Create a formatted task entry"""
    now = datetime.now()
    due_date = (now + timedelta(days=3)).strftime("%Y-%m-%d")
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M")
    
    task_id = f"TASK-CI-{task_num:03d}"
    
    return f"""### **{task_id}: {title}**
- **Assigned:** {assignee}
- **Due:** {due_date}
- **Status:** ⏳ NOT STARTED
- **Priority:** {priority}
- **Description:** Auto-generated from continuous improvement analysis
- **Source:** Continuous Improvement
- **Created:** {date_str} {time_str}

"""

def append_task_to_pending(title, assignee="Nexus", priority="P2"):
    """Append a single task to PENDING_TASKS.md"""
    task_num = get_next_ci_task_number()
    task_entry = create_task_entry(task_num, title, assignee, priority)
    
    # Ensure directory exists
    PENDING_TASKS_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    # Read or create file
    if PENDING_TASKS_PATH.exists():
        content = PENDING_TASKS_PATH.read_text()
    else:
        content = f"""# PENDING TASKS LOG - MISSION CONTROL
**Status:** ACTIVE  
**Last Updated:** {datetime.now().strftime("%Y-%m-%d %H:%M HKT")}
**Total Tasks:** 0  
**Completed Today:** 0

---

"""

    # Find or create CI section
    ci_section = "## 🆕 NEW TASKS FROM CONTINUOUS IMPROVEMENT"
    
    if ci_section not in content:
        # Add after first ---
        parts = content.split('---', 1)
        if len(parts) == 2:
            content = parts[0] + '---\n\n' + ci_section + '\n\n' + parts[1].lstrip()
        else:
            content = content + '\n\n' + ci_section + '\n\n'
    
    # Insert after section header
    marker_pos = content.find(ci_section) + len(ci_section)
    
    # Check if we need a batch header
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    batch_marker = f"#### Batch: {timestamp}"
    
    # Only add batch header if this is a new batch (different minute)
    if batch_marker not in content[marker_pos:marker_pos+500]:
        task_entry = f"\n{batch_marker}\n\n{task_entry}"
    
    content = content[:marker_pos] + task_entry + content[marker_pos:]
    
    # Update timestamp
    content = re.sub(
        r'\*\*Last Updated:.*\*\*',
        f'**Last Updated:** {datetime.now().strftime("%Y-%m-%d %H:%M HKT")}**',
        content
    )
    
    PENDING_TASKS_PATH.write_text(content)
    return task_num

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 ci_task_creator_direct.py 'Task Title' [Assignee] [Priority]")
        print("Example: python3 ci_task_creator_direct.py 'Fix API timeout' 'Code' 'P1'")
        sys.exit(1)
    
    title = sys.argv[1]
    assignee = sys.argv[2] if len(sys.argv) > 2 else "Nexus"
    priority = sys.argv[3] if len(sys.argv) > 3 else "P2"
    
    task_num = append_task_to_pending(title, assignee, priority)
    task_id = f"TASK-CI-{task_num:03d}"
    
    print(f"✅ Created {task_id}: {title}")
    print(f"   Assigned: {assignee} | Due: 3 days | Priority: {priority}")
    print(f"   File: {PENDING_TASKS_PATH}")
    
    return task_num

if __name__ == "__main__":
    main()
