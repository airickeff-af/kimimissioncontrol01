#!/usr/bin/env python3
"""
Continuous Improvement Task Creator
Reads improvement reports and creates actual tasks in PENDING_TASKS.md
"""

import json
import re
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

WORKSPACE = Path("/root/.openclaw/workspace")
PENDING_TASKS_PATH = WORKSPACE / "PENDING_TASKS.md"

def get_next_task_number():
    """Find the next available TASK-CI-XXX number"""
    if not PENDING_TASKS_PATH.exists():
        return 1
    
    content = PENDING_TASKS_PATH.read_text()
    # Find all TASK-CI-XXX patterns
    matches = re.findall(r'TASK-CI-(\d{3})', content)
    if matches:
        return max(int(m) for m in matches) + 1
    return 1

def parse_improvement_report(report_text):
    """Parse improvement report text to extract actionable items"""
    improvements = []
    
    # Look for patterns like "TASK-XXX: Description" or "- Task: Description"
    task_patterns = [
        r'\*\*TASK-([^*]+)\*\*[:\s]+(.+?)(?=\n|$)',
        r'TASK-([^\s:]+)[:\s]+(.+?)(?=\n|$)',
        r'[-*]\s*\[?\s*\]?\s*([^:]+)[:\s]+(.+?)(?=\n|$)',
    ]
    
    for pattern in task_patterns:
        matches = re.findall(pattern, report_text, re.IGNORECASE)
        for match in matches:
            if isinstance(match, tuple):
                task_id = match[0].strip()
                desc = match[1].strip()
            else:
                task_id = None
                desc = match.strip()
            
            if desc and len(desc) > 10:
                improvements.append({
                    'id': task_id,
                    'description': desc
                })
    
    # Also look for "Improvements in Progress" section
    in_progress_section = re.search(
        r'IMPROVEMENTS IN PROGRESS.*?(?=BLOCKERS|RECOMMENDATIONS|$)',
        report_text, re.DOTALL | re.IGNORECASE
    )
    if in_progress_section:
        lines = in_progress_section.group(0).split('\n')
        for line in lines:
            # Look for table rows or list items with task info
            if '|' in line and ('IN PROGRESS' in line or 'Queued' in line):
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 3:
                    task_name = parts[1] if parts[1] else parts[2]
                    assignee = parts[2] if len(parts) > 2 else 'Nexus'
                    if task_name and task_name != 'Task':
                        improvements.append({
                            'id': None,
                            'description': task_name,
                            'assignee': assignee
                        })
    
    return improvements

def create_task_entry(task_num, description, assignee="Nexus", priority="P2", source="Continuous Improvement"):
    """Create a formatted task entry"""
    now = datetime.now()
    due_date = (now + timedelta(days=3)).strftime("%Y-%m-%d")
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M")
    
    task_id = f"TASK-CI-{task_num:03d}"
    
    return f"""### **{task_id}: {description}**
- **Assigned:** {assignee}
- **Due:** {due_date}
- **Status:** ⏳ NOT STARTED
- **Priority:** {priority}
- **Description:** Auto-generated from continuous improvement analysis
- **Source:** {source}
- **Created:** {date_str} {time_str}

"""

def append_tasks_to_pending(tasks):
    """Append tasks to PENDING_TASKS.md"""
    if not tasks:
        return 0
    
    # Ensure directory exists
    PENDING_TASKS_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    # Read existing content or create header
    if PENDING_TASKS_PATH.exists():
        content = PENDING_TASKS_PATH.read_text()
    else:
        content = """# PENDING TASKS LOG - MISSION CONTROL
**Status:** ACTIVE  
**Last Updated:** {date}
**Total Tasks:** 0  
**Completed Today:** 0

---

""".format(date=datetime.now().strftime("%Y-%m-%d %H:%M HKT"))

    # Find insertion point (after the header, before existing tasks)
    insert_marker = "## 🆕 NEW TASKS FROM CONTINUOUS IMPROVEMENT"
    
    if insert_marker not in content:
        # Add the section after the first ---
        parts = content.split('---', 1)
        if len(parts) == 2:
            content = parts[0] + '---\n\n' + insert_marker + '\n\n' + parts[1].lstrip()
        else:
            content = content + '\n\n' + insert_marker + '\n\n'
    
    # Insert new tasks after the marker
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    batch_header = f"\n#### Batch: {timestamp}\n\n"
    
    task_content = batch_header + ''.join(tasks)
    
    # Insert after the marker
    marker_pos = content.find(insert_marker) + len(insert_marker)
    content = content[:marker_pos] + task_content + content[marker_pos:]
    
    # Update last updated timestamp
    content = re.sub(
        r'\*\*Last Updated:.*\*\*',
        f'**Last Updated:** {datetime.now().strftime("%Y-%m-%d %H:%M HKT")}**',
        content
    )
    
    PENDING_TASKS_PATH.write_text(content)
    return len(tasks)

def main():
    """Main entry point - can be called from cron or CLI"""
    # Check if we received JSON input
    if len(sys.argv) > 1:
        try:
            data = json.loads(sys.argv[1])
            improvements = data.get('improvements', [])
        except json.JSONDecodeError:
            # Treat as report text
            improvements = parse_improvement_report(sys.argv[1])
    else:
        # Read from stdin
        input_text = sys.stdin.read()
        if input_text:
            try:
                data = json.loads(input_text)
                improvements = data.get('improvements', [])
            except json.JSONDecodeError:
                improvements = parse_improvement_report(input_text)
        else:
            improvements = []
    
    if not improvements:
        print("No improvements found to convert to tasks")
        return 0
    
    # Get starting task number
    start_num = get_next_task_number()
    
    # Create task entries
    task_entries = []
    for i, imp in enumerate(improvements):
        task_num = start_num + i
        desc = imp.get('description', 'Untitled Improvement')
        assignee = imp.get('assignee', 'Nexus')
        priority = imp.get('priority', 'P2')
        
        entry = create_task_entry(task_num, desc, assignee, priority)
        task_entries.append(entry)
    
    # Append to file
    count = append_tasks_to_pending(task_entries)
    
    print(f"Created {count} tasks in PENDING_TASKS.md")
    for i, entry in enumerate(task_entries):
        task_id = f"TASK-CI-{start_num + i:03d}"
        print(f"  - {task_id}")
    
    return count

if __name__ == "__main__":
    count = main()
    sys.exit(0 if count >= 0 else 1)
