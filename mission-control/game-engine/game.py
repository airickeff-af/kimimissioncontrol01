#!/usr/bin/env python3
"""
Mission Control - Kairosoft Style Game Engine
Python backend for pixel art agent management game
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path

class MissionControlGame:
    def __init__(self):
        self.data_dir = Path("/root/.openclaw/workspace/mission-control/game-data")
        self.data_dir.mkdir(exist_ok=True)
        self.state_file = self.data_dir / "game_state.json"
        self.agents_file = self.data_dir / "agents.json"
        self.history_file = self.data_dir / "history.json"
        
        self.load_data()
    
    def load_data(self):
        """Load or initialize game data"""
        if self.agents_file.exists():
            with open(self.agents_file) as f:
                self.agents = json.load(f)
        else:
            self.agents = self.init_agents()
            self.save_agents()
        
        if self.state_file.exists():
            with open(self.state_file) as f:
                self.state = json.load(f)
        else:
            self.state = self.init_state()
            self.save_state()
    
    def init_agents(self):
        """Initialize agent data with Kairosoft-style stats"""
        return {
            "nexus": {
                "id": "nexus",
                "name": "Nexus",
                "role": "Orchestrator",
                "emoji": "◈",
                "color": "#ff6b6b",
                "level": 10,
                "xp": 950,
                "max_xp": 1000,
                "energy": 95,
                "max_energy": 100,
                "skills": {
                    "coordination": 95,
                    "strategy": 90,
                    "communication": 88
                },
                "tasks_completed": 45,
                "status": "active",
                "position": {"x": 1, "y": 1},
                "sprite": "nexus-pixel.png"
            },
            "glasses": {
                "id": "glasses",
                "name": "Glasses",
                "role": "Researcher",
                "emoji": "🔍",
                "color": "#4dabf7",
                "level": 8,
                "xp": 720,
                "max_xp": 800,
                "energy": 80,
                "max_energy": 100,
                "skills": {
                    "research": 92,
                    "analysis": 88,
                    "speed": 75
                },
                "tasks_completed": 32,
                "status": "working",
                "current_task": "Crypto research",
                "position": {"x": 3, "y": 2},
                "sprite": "glasses-pixel.png"
            },
            "quill": {
                "id": "quill",
                "name": "Quill",
                "role": "Writer",
                "emoji": "✍️",
                "color": "#ffa94d",
                "level": 7,
                "xp": 650,
                "max_xp": 700,
                "energy": 90,
                "max_energy": 100,
                "skills": {
                    "writing": 90,
                    "creativity": 88,
                    "speed": 82
                },
                "tasks_completed": 28,
                "status": "idle",
                "position": {"x": 5, "y": 2},
                "sprite": "quill-pixel.png"
            },
            "pixel": {
                "id": "pixel",
                "name": "Pixel",
                "role": "Designer",
                "emoji": "🎨",
                "color": "#da77f2",
                "level": 6,
                "xp": 550,
                "max_xp": 600,
                "energy": 75,
                "max_energy": 100,
                "skills": {
                    "design": 88,
                    "creativity": 92,
                    "tools": 70
                },
                "tasks_completed": 24,
                "status": "working",
                "current_task": "Graphics design",
                "position": {"x": 7, "y": 2},
                "sprite": "pixel-pixel.png"
            },
            "gary": {
                "id": "gary",
                "name": "Gary",
                "role": "Marketing",
                "emoji": "📢",
                "color": "#69db7c",
                "level": 8,
                "xp": 780,
                "max_xp": 800,
                "energy": 85,
                "max_energy": 100,
                "skills": {
                    "strategy": 90,
                    "analytics": 85,
                    "communication": 88
                },
                "tasks_completed": 35,
                "status": "idle",
                "position": {"x": 9, "y": 3},
                "sprite": "gary-pixel.png"
            },
            "larry": {
                "id": "larry",
                "name": "Larry",
                "role": "Social",
                "emoji": "📲",
                "color": "#ffd43b",
                "level": 7,
                "xp": 680,
                "max_xp": 700,
                "energy": 88,
                "max_energy": 100,
                "skills": {
                    "social": 90,
                    "timing": 88,
                    "engagement": 85
                },
                "tasks_completed": 30,
                "status": "idle",
                "position": {"x": 11, "y": 3},
                "sprite": "larry-pixel.png"
            },
            "sentry": {
                "id": "sentry",
                "name": "Sentry",
                "role": "DevOps",
                "emoji": "⚙️",
                "color": "#74c0fc",
                "level": 9,
                "xp": 890,
                "max_xp": 900,
                "energy": 92,
                "max_energy": 100,
                "skills": {
                    "monitoring": 95,
                    "security": 88,
                    "automation": 90
                },
                "tasks_completed": 42,
                "status": "monitoring",
                "position": {"x": 2, "y": 5},
                "sprite": "sentry-pixel.png"
            },
            "audit": {
                "id": "audit",
                "name": "Audit",
                "role": "QA",
                "emoji": "✅",
                "color": "#ffc078",
                "level": 8,
                "xp": 760,
                "max_xp": 800,
                "energy": 87,
                "max_energy": 100,
                "skills": {
                    "quality": 92,
                    "attention": 95,
                    "process": 88
                },
                "tasks_completed": 38,
                "status": "monitoring",
                "position": {"x": 6, "y": 5},
                "sprite": "audit-pixel.png"
            },
            "cipher": {
                "id": "cipher",
                "name": "Cipher",
                "role": "Security",
                "emoji": "🔒",
                "color": "#adb5bd",
                "level": 9,
                "xp": 880,
                "max_xp": 900,
                "energy": 94,
                "max_energy": 100,
                "skills": {
                    "security": 96,
                    "monitoring": 90,
                    "response": 88
                },
                "tasks_completed": 40,
                "status": "monitoring",
                "position": {"x": 10, "y": 5},
                "sprite": "cipher-pixel.png"
            }
        }
    
    def init_state(self):
        """Initialize game state"""
        return {
            "day": 1,
            "hour": datetime.now().hour,
            "office_state": "deep_work",
            "total_tasks_completed": 10,
            "funds": 999999,
            "reputation": 85,
            "last_update": datetime.now().isoformat(),
            "events": []
        }
    
    def save_agents(self):
        """Save agent data to JSON"""
        with open(self.agents_file, 'w') as f:
            json.dump(self.agents, f, indent=2)
    
    def save_state(self):
        """Save game state to JSON"""
        with open(self.state_file, 'w') as f:
            json.dump(self.state, f, indent=2)
    
    def update_hourly(self):
        """Update game state every hour"""
        current_hour = datetime.now().hour
        
        # Update office state based on hour
        if current_hour in [6, 7]:
            self.state["office_state"] = "morning_briefing"
        elif current_hour in [9, 10, 13, 14]:
            self.state["office_state"] = "deep_work"
        elif current_hour == 11:
            self.state["office_state"] = "collaboration"
        elif current_hour == 12:
            self.state["office_state"] = "lunch"
        elif current_hour == 15:
            self.state["office_state"] = "marketing"
        elif current_hour == 16:
            self.state["office_state"] = "review"
        elif current_hour in [19, 20]:
            self.state["office_state"] = "wind_down"
        else:
            self.state["office_state"] = "default"
        
        # Regenerate agent energy slightly
        for agent_id, agent in self.agents.items():
            if agent["energy"] < agent["max_energy"]:
                agent["energy"] = min(agent["max_energy"], agent["energy"] + 5)
        
        # Update positions based on office state
        self.update_positions()
        
        self.state["hour"] = current_hour
        self.state["last_update"] = datetime.now().isoformat()
        
        self.save_agents()
        self.save_state()
        
        return self.get_status()
    
    def update_positions(self):
        """Update agent positions based on office state"""
        state = self.state["office_state"]
        
        positions = {
            "morning_briefing": {
                "nexus": {"x": 6, "y": 3},
                "glasses": {"x": 5, "y": 3},
                "quill": {"x": 7, "y": 3},
                "pixel": {"x": 4, "y": 4},
                "gary": {"x": 8, "y": 4},
                "larry": {"x": 5, "y": 4},
                "sentry": {"x": 6, "y": 4},
                "audit": {"x": 7, "y": 4},
                "cipher": {"x": 6, "y": 5}
            },
            "deep_work": {
                "nexus": {"x": 1, "y": 1},
                "glasses": {"x": 3, "y": 2},
                "quill": {"x": 5, "y": 2},
                "pixel": {"x": 7, "y": 2},
                "gary": {"x": 9, "y": 3},
                "larry": {"x": 11, "y": 3},
                "sentry": {"x": 2, "y": 5},
                "audit": {"x": 6, "y": 5},
                "cipher": {"x": 10, "y": 5}
            },
            "collaboration": {
                "nexus": {"x": 6, "y": 3},
                "glasses": {"x": 5, "y": 3},
                "quill": {"x": 6, "y": 3},
                "pixel": {"x": 7, "y": 3},
                "gary": {"x": 9, "y": 3},
                "larry": {"x": 11, "y": 3},
                "sentry": {"x": 2, "y": 5},
                "audit": {"x": 6, "y": 5},
                "cipher": {"x": 10, "y": 5}
            },
            "default": {
                "nexus": {"x": 1, "y": 1},
                "glasses": {"x": 3, "y": 2},
                "quill": {"x": 5, "y": 2},
                "pixel": {"x": 7, "y": 2},
                "gary": {"x": 9, "y": 3},
                "larry": {"x": 11, "y": 3},
                "sentry": {"x": 2, "y": 5},
                "audit": {"x": 6, "y": 5},
                "cipher": {"x": 10, "y": 5}
            }
        }
        
        pos = positions.get(state, positions["default"])
        for agent_id, position in pos.items():
            self.agents[agent_id]["position"] = position
    
    def get_status(self):
        """Get current game status"""
        return {
            "state": self.state,
            "agents": self.agents,
            "summary": {
                "total_agents": len(self.agents),
                "online": sum(1 for a in self.agents.values() if a["status"] != "offline"),
                "working": sum(1 for a in self.agents.values() if a["status"] == "working"),
                "avg_energy": sum(a["energy"] for a in self.agents.values()) / len(self.agents),
                "avg_level": sum(a["level"] for a in self.agents.values()) / len(self.agents)
            }
        }
    
    def complete_task(self, agent_id, task_name, xp_reward=50):
        """Complete a task for an agent"""
        if agent_id not in self.agents:
            return False
        
        agent = self.agents[agent_id]
        agent["tasks_completed"] += 1
        agent["xp"] += xp_reward
        agent["energy"] = max(0, agent["energy"] - 10)
        
        # Level up check
        if agent["xp"] >= agent["max_xp"]:
            agent["level"] += 1
            agent["xp"] = agent["xp"] - agent["max_xp"]
            agent["max_xp"] = int(agent["max_xp"] * 1.2)
            agent["max_energy"] += 5
            agent["energy"] = agent["max_energy"]
        
        self.state["total_tasks_completed"] += 1
        
        self.save_agents()
        self.save_state()
        
        return True

if __name__ == "__main__":
    game = MissionControlGame()
    status = game.update_hourly()
    print(json.dumps(status, indent=2))
