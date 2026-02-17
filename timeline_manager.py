#!/usr/bin/env python3
"""
Mission Control Dashboard - Timeline Manager
Python backend for timeline visualization
"""

import json
from datetime import datetime, timedelta
from pathlib import Path

class TimelineManager:
    def __init__(self):
        self.data_file = Path("/root/.openclaw/workspace/mission-control/dashboard/timeline.json")
        self.load_timeline()
    
    def load_timeline(self):
        """Load timeline data from JSON"""
        with open(self.data_file) as f:
            self.data = json.load(f)
        self.timeline = self.data["timeline"]
    
    def get_current_phase(self):
        """Get the current active phase"""
        for phase in self.timeline["phases"]:
            if phase["status"] == "in_progress":
                return phase
        return None
    
    def get_phase_progress(self, phase_num):
        """Get progress percentage for a phase"""
        phase = self.timeline["phases"][phase_num - 1]
        tasks = phase["tasks"]
        
        if not tasks:
            return 0
        
        completed = sum(1 for t in tasks if t["status"] == "completed")
        in_progress = sum(0.5 for t in tasks if t["status"] == "in_progress")
        
        return int(((completed + in_progress) / len(tasks)) * 100)
    
    def get_agent_tasks(self, agent_name):
        """Get all tasks for a specific agent"""
        tasks = []
        for phase in self.timeline["phases"]:
            for task in phase["tasks"]:
                if task.get("agent") == agent_name or agent_name in task.get("agents", []):
                    tasks.append({
                        **task,
                        "phase": phase["name"],
                        "phase_num": phase["phase"]
                    })
        return tasks
    
    def get_overall_progress(self):
        """Get overall project progress"""
        all_tasks = []
        for phase in self.timeline["phases"]:
            all_tasks.extend(phase["tasks"])
        
        if not all_tasks:
            return 0
        
        completed = sum(1 for t in all_tasks if t["status"] == "completed")
        in_progress = sum(0.5 for t in all_tasks if t["status"] == "in_progress")
        
        return int(((completed + in_progress) / len(all_tasks)) * 100)
    
    def get_upcoming_deadlines(self, days=3):
        """Get tasks with upcoming deadlines"""
        # Simplified - in real app would parse dates properly
        urgent_tasks = []
        for phase in self.timeline["phases"]:
            for task in phase["tasks"]:
                if task["status"] in ["pending", "in_progress"]:
                    urgent_tasks.append({
                        **task,
                        "phase": phase["name"]
                    })
        return urgent_tasks[:5]  # Return top 5
    
    def update_task_status(self, task_id, new_status):
        """Update status of a specific task"""
        for phase in self.timeline["phases"]:
            for task in phase["tasks"]:
                if task["id"] == task_id:
                    task["status"] = new_status
                    task["updated_at"] = datetime.now().isoformat()
                    self.save_timeline()
                    return True
        return False
    
    def save_timeline(self):
        """Save timeline data back to JSON"""
        with open(self.data_file, 'w') as f:
            json.dump(self.data, f, indent=2)
    
    def generate_html_timeline(self):
        """Generate HTML visualization of timeline"""
        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Mission Control Timeline</title>
    <style>
        body {{
            font-family: 'JetBrains Mono', monospace;
            background: #0a0a0f;
            color: #00ff9f;
            padding: 20px;
        }}
        .header {{
            border-bottom: 2px solid #00ff9f;
            padding-bottom: 15px;
            margin-bottom: 30px;
        }}
        h1 {{ color: #ff6b6b; }}
        .progress-bar {{
            width: 100%;
            height: 30px;
            background: #222;
            border-radius: 15px;
            overflow: hidden;
            margin: 20px 0;
        }}
        .progress-fill {{
            height: 100%;
            background: linear-gradient(90deg, #00ff9f, #00d9e8);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #000;
            font-weight: bold;
        }}
        .phase {{
            background: rgba(0, 255, 159, 0.05);
            border: 1px solid #333;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }}
        .phase-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }}
        .phase-title {{
            color: #ff6b6b;
            font-size: 1.2rem;
        }}
        .phase-status {{
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.8rem;
        }}
        .status-in_progress {{ background: #ffaa00; color: #000; }}
        .status-pending {{ background: #666; }}
        .status-completed {{ background: #00ff9f; color: #000; }}
        .task {{
            background: rgba(0, 0, 0, 0.3);
            padding: 12px;
            margin: 10px 0;
            border-radius: 6px;
            border-left: 3px solid #00ff9f;
        }}
        .task-header {{
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }}
        .task-id {{ color: #666; font-size: 0.8rem; }}
        .task-priority {{ 
            padding: 2px 8px; 
            border-radius: 4px; 
            font-size: 0.75rem;
            font-weight: bold;
        }}
        .p0 {{ background: #ff4444; color: white; }}
        .p1 {{ background: #ffaa00; color: black; }}
        .p2 {{ background: #00ff9f; color: black; }}
        .task-agent {{ color: #00d9e8; font-size: 0.9rem; }}
        .task-deadline {{ color: #ffaa00; font-size: 0.8rem; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>◈ MISSION CONTROL TIMELINE</h1>
        <div>Project: {self.timeline['project']} v{self.timeline['version']}</div>
        <div>Sprint Duration: {self.timeline['sprint_duration']}</div>
    </div>
    
    <div class="progress-bar">
        <div class="progress-fill" style="width: {self.get_overall_progress()}%">
            {self.get_overall_progress()}% Complete
        </div>
    </div>
"""
        
        for phase in self.timeline["phases"]:
            status_class = f"status-{phase['status']}"
            progress = self.get_phase_progress(phase["phase"])
            
            html += f"""
    <div class="phase">
        <div class="phase-header">
            <div class="phase-title">Phase {phase['phase']}: {phase['name']}</div>
            <span class="phase-status {status_class}">{phase['status'].replace('_', ' ').title()}</span>
        </div>
        <div style="color: #888; margin-bottom: 10px;">{phase['dates']} | Progress: {progress}%</div>
"""
            
            for task in phase["tasks"]:
                agents = task.get("agents", [task.get("agent", "")])
                agent_str = ", ".join(agents)
                
                html += f"""
        <div class="task">
            <div class="task-header">
                <span class="task-id">{task['id']}</span>
                <span class="task-priority {task['priority'].lower()}">{task['priority']}</span>
            </div>
            <div style="color: #fff; margin: 5px 0;">{task['task']}</div>
            <div style="display: flex; justify-content: space-between;">
                <span class="task-agent">⚒️ {agent_str}</span>
                <span class="task-deadline">📅 {task['deadline']}</span>
            </div>
        </div>
"""
            
            html += "    \u003c/div\u003e\n"
        
        html += """
</body>
</html>
"""
        
        output_file = Path("/root/.openclaw/workspace/mission-control/dashboard/timeline-view.html")
        with open(output_file, 'w') as f:
            f.write(html)
        
        return str(output_file)

if __name__ == "__main__":
    tm = TimelineManager()
    
    print("=== MISSION CONTROL TIMELINE ===\n")
    print(f"Project: {tm.timeline['project']} v{tm.timeline['version']}")
    print(f"Overall Progress: {tm.get_overall_progress()}%\n")
    
    current = tm.get_current_phase()
    if current:
        print(f"Current Phase: {current['name']} ({current['dates']})")
        print(f"Phase Progress: {tm.get_phase_progress(current['phase'])}%\n")
    
    print("Forge Tasks:")
    for task in tm.get_agent_tasks("Forge"):
        print(f"  [{task['priority']}] {task['task']} - {task['deadline']}")
    
    print("\nCode Tasks:")
    for task in tm.get_agent_tasks("Code"):
        print(f"  [{task['priority']}] {task['task']} - {task['deadline']}")
    
    html_path = tm.generate_html_timeline()
    print(f"\nHTML Timeline generated: {html_path}")
