#!/usr/bin/env python3
"""
Mission Control - Agent Data Tracker
Tracks SOUL and memory accumulation for each agent
"""

import json
import os
from datetime import datetime
from pathlib import Path

class AgentDataTracker:
    def __init__(self):
        self.base_dir = Path("/root/.openclaw/workspace/mission-control")
        self.agents_dir = self.base_dir / "agents"
        self.memory_dir = self.base_dir / "memory"
        self.data_file = self.base_dir / "game-engine" / "agent_data.json"
        
        self.agents = [
            "nexus", "glasses", "quill", "pixel", 
            "gary", "larry", "sentry", "audit", "cipher"
        ]
        
        self.load_data()
    
    def load_data(self):
        """Load or initialize agent data"""
        if self.data_file.exists():
            with open(self.data_file) as f:
                self.data = json.load(f)
        else:
            self.data = self.init_data()
            self.save_data()
    
    def init_data(self):
        """Initialize agent data structure"""
        data = {
            "last_update": datetime.now().isoformat(),
            "agents": {}
        }
        
        for agent_id in self.agents:
            data["agents"][agent_id] = {
                "soul_size": 0,
                "memory_size": 0,
                "total_knowledge_kb": 0,
                "files_count": 0,
                "last_modified": None,
                "knowledge_areas": [],
                "experience_score": 0  # Based on data accumulated, not XP
            }
        
        return data
    
    def scan_agent_data(self):
        """Scan each agent's SOUL and memory files"""
        for agent_id in self.agents:
            agent_path = self.agents_dir / agent_id
            
            # Check SOUL.md
            soul_file = agent_path / "SOUL.md"
            soul_size = 0
            if soul_file.exists():
                soul_size = soul_file.stat().st_size
            
            # Check memory files
            memory_size = 0
            files_count = 0
            knowledge_areas = []
            
            if agent_path.exists():
                for file in agent_path.rglob("*"):
                    if file.is_file():
                        memory_size += file.stat().st_size
                        files_count += 1
                        
                        # Extract knowledge areas from filenames
                        if "research" in file.name.lower():
                            knowledge_areas.append("research")
                        if "content" in file.name.lower():
                            knowledge_areas.append("content")
                        if "code" in file.name.lower():
                            knowledge_areas.append("coding")
            
            # Calculate total knowledge in KB
            total_kb = (soul_size + memory_size) / 1024
            
            # Calculate experience score based on data accumulated
            # Formula: soul (40%) + memory (50%) + files variety (10%)
            soul_score = min(soul_size / 5000, 100) * 0.4  # Max 5KB soul
            memory_score = min(memory_size / 50000, 100) * 0.5  # Max 50KB memory
            variety_score = min(files_count * 5, 100) * 0.1  # 20 files = max
            experience_score = soul_score + memory_score + variety_score
            
            # Update agent data
            self.data["agents"][agent_id] = {
                "soul_size": soul_size,
                "memory_size": memory_size,
                "total_knowledge_kb": round(total_kb, 2),
                "files_count": files_count,
                "last_modified": datetime.now().isoformat(),
                "knowledge_areas": list(set(knowledge_areas)),
                "experience_score": round(experience_score, 1)
            }
        
        self.data["last_update"] = datetime.now().isoformat()
        self.save_data()
        
        return self.data
    
    def save_data(self):
        """Save agent data to JSON"""
        with open(self.data_file, 'w') as f:
            json.dump(self.data, f, indent=2)
    
    def get_agent_report(self, agent_id):
        """Get detailed report for specific agent"""
        if agent_id not in self.data["agents"]:
            return None
        
        agent = self.data["agents"][agent_id]
        agent_path = self.agents_dir / agent_id
        
        # List all files
        files = []
        if agent_path.exists():
            for file in agent_path.rglob("*"):
                if file.is_file():
                    files.append({
                        "name": file.name,
                        "size": file.stat().st_size,
                        "modified": datetime.fromtimestamp(file.stat().st_mtime).isoformat()
                    })
        
        return {
            "agent_id": agent_id,
            "data": agent,
            "files": sorted(files, key=lambda x: x["size"], reverse=True)[:10]
        }
    
    def get_all_agents_summary(self):
        """Get summary of all agents"""
        summary = []
        for agent_id, data in self.data["agents"].items():
            summary.append({
                "id": agent_id,
                "knowledge_kb": data["total_knowledge_kb"],
                "files": data["files_count"],
                "experience": data["experience_score"],
                "areas": data["knowledge_areas"]
            })
        
        return sorted(summary, key=lambda x: x["knowledge_kb"], reverse=True)
    
    def generate_html_dashboard(self):
        """Generate HTML dashboard showing agent data"""
        summary = self.get_all_agents_summary()
        
        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Mission Control - Agent Data</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'JetBrains Mono', monospace;
            background: #0a0a0f;
            color: #00ff9f;
            padding: 20px;
        }}
        
        .header {{
            border-bottom: 2px solid #00ff9f;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }}
        
        h1 {{
            color: #ff6b6b;
            font-size: 1.5rem;
        }}
        
        .timestamp {{
            color: #666;
            font-size: 0.8rem;
        }}
        
        .agent-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
        }}
        
        .agent-card {{
            background: rgba(0, 255, 159, 0.05);
            border: 1px solid #333;
            padding: 15px;
            border-radius: 8px;
        }}
        
        .agent-name {{
            color: #ff6b6b;
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 10px;
        }}
        
        .stat-row {{
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #222;
        }}
        
        .stat-label {{
            color: #888;
        }}
        
        .stat-value {{
            color: #fff;
        }}
        
        .data-bar {{
            width: 100%;
            height: 20px;
            background: #222;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 5px;
        }}
        
        .data-fill {{
            height: 100%;
            background: linear-gradient(90deg, #00ff9f, #00d9e8);
            transition: width 0.3s;
        }}
        
        .knowledge-areas {{
            margin-top: 10px;
        }}
        
        .area-tag {{
            display: inline-block;
            background: rgba(0, 217, 232, 0.2);
            color: #05d9e8;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            margin: 2px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>◈ AGENT DATA ACCUMULATION</h1>
        <div class="timestamp">Last Updated: {self.data['last_update']}</div>
    </div>
    
    <div class="agent-grid">
"""
        
        max_knowledge = max(s["knowledge_kb"] for s in summary) if summary else 1
        
        for agent in summary:
            percentage = (agent["knowledge_kb"] / max_knowledge) * 100 if max_knowledge > 0 else 0
            
            html += f"""
        <div class="agent-card">
            <div class="agent-name">{agent['id'].upper()}</div>
            
            <div class="stat-row">
                <span class="stat-label">Knowledge:</span>
                <span class="stat-value">{agent['knowledge_kb']:.1f} KB</span>
            </div>
            <div class="data-bar">
                <div class="data-fill" style="width: {percentage}%"></div>
            </div>
            
            <div class="stat-row">
                <span class="stat-label">Files:</span>
                <span class="stat-value">{agent['files']}</span>
            </div>
            
            <div class="stat-row">
                <span class="stat-label">Experience:</span>
                <span class="stat-value">{agent['experience']}/100</span>
            </div>
            
            <div class="knowledge-areas">
                {' '.join(f'<span class="area-tag">{area}</span>' for area in agent['areas'])}
            </div>
        </div>
"""
        
        html += """
    </div>
</body>
</html>
"""
        
        dashboard_file = self.base_dir / "dashboard" / "agent-data.html"
        with open(dashboard_file, 'w') as f:
            f.write(html)
        
        return str(dashboard_file)

if __name__ == "__main__":
    tracker = AgentDataTracker()
    tracker.scan_agent_data()
    dashboard_path = tracker.generate_html_dashboard()
    
    print("Agent data scanned and dashboard generated!")
    print(f"Dashboard: {dashboard_path}")
    print("\nAgent Summary:")
    for agent in tracker.get_all_agents_summary():
        print(f"  {agent['id']}: {agent['knowledge_kb']:.1f} KB | {agent['files']} files | Exp: {agent['experience']}")
