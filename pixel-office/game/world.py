"""
World/Scene management for the isometric office
"""
import random
import math
from typing import List, Dict, Optional, Tuple, Any
from entities.agent import Agent, Tile, Furniture, Nexus, ActivityType

class OfficeWorld:
    """Manages the office world state"""
    
    def __init__(self, width: int = 20, height: int = 20):
        self.width = width
        self.height = height
        
        # Entities
        self.tiles: List[Tile] = []
        self.agents: List[Agent] = []
        self.furniture: List[Furniture] = []
        self.nexus: Optional[Nexus] = None
        
        # Standup
        self.standup_active = False
        self.standup_center = (width // 2, height // 2)
        self.standup_timer = 0
        
        # Audit
        self.audit_agents: List[Agent] = []
        self.active_audits: List[Dict] = []
        
        self._generate_world()
    
    def _generate_world(self):
        """Generate the office layout"""
        # Generate floor tiles
        for y in range(self.height):
            for x in range(self.width):
                self.tiles.append(Tile(x, y, 0, 'floor'))
        
        # Create desk clusters (workstations)
        desk_positions = [
            # Cluster 1
            [(3, 3), (4, 3), (3, 4), (4, 4)],
            # Cluster 2
            [(8, 3), (9, 3), (8, 4), (9, 4)],
            # Cluster 3
            [(14, 3), (15, 3), (14, 4), (15, 4)],
            # Cluster 4
            [(3, 10), (4, 10), (3, 11), (4, 11)],
            # Cluster 5
            [(8, 10), (9, 10), (8, 11), (9, 11)],
            # Cluster 6
            [(14, 10), (15, 10), (14, 11), (15, 11)],
        ]
        
        for cluster in desk_positions:
            for pos in cluster:
                self.furniture.append(Furniture(pos[0], pos[1], 'desk'))
                # Add chair near desk
                chair_offset = random.choice([(0.3, 0.3), (-0.3, 0.3), (0.3, -0.3)])
                self.furniture.append(Furniture(
                    pos[0] + chair_offset[0], 
                    pos[1] + chair_offset[1], 
                    'chair'
                ))
                # Add computer on desk
                self.furniture.append(Furniture(pos[0], pos[1], 'computer'))
        
        # Add some plants
        plant_positions = [(1, 1), (18, 1), (1, 18), (18, 18), (10, 1), (1, 10)]
        for pos in plant_positions:
            self.furniture.append(Furniture(pos[0], pos[1], 'plant'))
        
        # Create Nexus at center
        self.nexus = Nexus(self.width // 2, self.height // 2)
        
        # Add initial agents
        self._spawn_agents(6)
    
    def _spawn_agents(self, count: int):
        """Spawn initial agents"""
        colors = ['shirt_blue', 'shirt_red', 'shirt_green', 'shirt_purple', 'shirt_orange']
        roles = ['developer', 'analyst', 'designer', 'manager']
        
        for i in range(count):
            # Find spawn position
            x = random.randint(2, self.width - 2)
            y = random.randint(2, self.height - 2)
            
            agent = Agent(
                agent_id=f"agent_{i}",
                name=f"Agent {i+1}",
                x=float(x),
                y=float(y),
                color=random.choice(colors),
                role=random.choice(roles)
            )
            self.agents.append(agent)
    
    def spawn_audit_agent(self, target_agent: Agent) -> Agent:
        """Spawn an audit agent"""
        audit = Agent(
            agent_id=f"audit_{len(self.audit_agents)}",
            name=f"Audit {len(self.audit_agents)+1}",
            x=target_agent.x + 1,
            y=target_agent.y + 1,
            color='audit_gold',
            role='auditor'
        )
        audit.set_activity(ActivityType.AUDITING, {'target': target_agent.name})
        self.audit_agents.append(audit)
        self.agents.append(audit)
        return audit
    
    def update(self, dt: float, api_data: Optional[Dict] = None):
        """Update world state"""
        # Update Nexus
        if self.nexus:
            self.nexus.update(dt)
        
        # Update agents
        for agent in self.agents:
            agent.update(dt)
        
        # Handle standup meeting
        if self.standup_active:
            self._update_standup(dt)
        
        # Random agent behaviors
        self._update_agent_behaviors(dt)
        
        # Update from API data
        if api_data:
            self._update_from_api(api_data)
    
    def _update_agent_behaviors(self, dt: float):
        """Update random agent behaviors"""
        for agent in self.agents:
            if agent.activity == ActivityType.IDLE and random.random() < 0.01:
                # Random walk
                target_x = max(1, min(self.width - 2, agent.x + random.randint(-3, 3)))
                target_y = max(1, min(self.height - 2, agent.y + random.randint(-3, 3)))
                agent.move_to(float(target_x), float(target_y))
            
            elif agent.activity == ActivityType.IDLE and random.random() < 0.005:
                # Start working
                agent.set_activity(ActivityType.WORKING, {'task': random.choice([
                    'Coding', 'Reviewing', 'Testing', 'Documenting', 'Debugging'
                ])})
            
            elif agent.activity == ActivityType.WORKING and random.random() < 0.01:
                # Stop working
                agent.set_activity(ActivityType.IDLE)
                agent.progress = 0
    
    def _update_standup(self, dt: float):
        """Update standup meeting state"""
        self.standup_timer += dt
        
        # Gather agents to center
        for agent in self.agents:
            if agent.role != 'auditor':  # Don't move auditors
                # Calculate position in circle
                idx = self.agents.index(agent)
                angle = (2 * math.pi * idx) / max(1, len(self.agents) - len(self.audit_agents))
                radius = 3
                target_x = self.standup_center[0] + math.cos(angle) * radius
                target_y = self.standup_center[1] + math.sin(angle) * radius
                
                dist = math.sqrt((agent.x - target_x)**2 + (agent.y - target_y)**2)
                if dist > 0.5:
                    agent.move_to(target_x, target_y)
                else:
                    agent.set_activity(ActivityType.STANDUP)
                    if random.random() < 0.02:
                        agent.say(random.choice([
                            "Working on tasks", "Blocked by nothing", 
                            "Need help with API", "Making progress"
                        ]))
    
    def _update_from_api(self, api_data: Dict):
        """Update world from API data"""
        # Update agent activities from API
        if 'agents' in api_data:
            for agent_data in api_data['agents']:
                agent = self.get_agent_by_id(agent_data.get('id'))
                if agent:
                    # Update status
                    status = agent_data.get('status', 'idle')
                    if status == 'working':
                        agent.set_activity(ActivityType.WORKING, {
                            'task': agent_data.get('current_task', 'Unknown')
                        })
                        agent.progress = agent_data.get('progress', 0)
                    elif status == 'delegated':
                        agent.set_activity(ActivityType.DELEGATED, {
                            'from': agent_data.get('delegated_from', 'Unknown')
                        })
        
        # Update Nexus tasks
        if 'tasks' in api_data and self.nexus:
            self.nexus.active_tasks = api_data['tasks']
        
        # Update audits
        if 'audits' in api_data:
            self._update_audits(api_data['audits'])
    
    def _update_audits(self, audits: List[Dict]):
        """Update audit visualizations"""
        # Remove completed audits
        current_targets = {a.get('target_id') for a in audits}
        self.audit_agents = [a for a in self.audit_agents 
                            if a.activity_data.get('target') in current_targets]
        
        # Add new audits
        for audit_data in audits:
            target_id = audit_data.get('target_id')
            target = self.get_agent_by_id(target_id)
            if target and not any(a.activity_data.get('target') == target.name 
                                 for a in self.audit_agents):
                self.spawn_audit_agent(target)
    
    def get_agent_by_id(self, agent_id: str) -> Optional[Agent]:
        """Get agent by ID"""
        for agent in self.agents:
            if agent.id == agent_id:
                return agent
        return None
    
    def toggle_standup(self):
        """Toggle standup meeting"""
        self.standup_active = not self.standup_active
        if not self.standup_active:
            self.standup_timer = 0
            # Release agents
            for agent in self.agents:
                if agent.activity == ActivityType.STANDUP:
                    agent.set_activity(ActivityType.IDLE)
    
    def delegate_task(self, from_agent_id: str, to_agent_id: str, task: str):
        """Visualize task delegation"""
        from_agent = self.get_agent_by_id(from_agent_id)
        to_agent = self.get_agent_by_id(to_agent_id)
        
        if from_agent and to_agent:
            from_agent.say(f"Delegating {task}")
            to_agent.set_activity(ActivityType.DELEGATED, {
                'from': from_agent.name,
                'task': task
            })
            # Move to Nexus
            to_agent.move_to(self.nexus.x + 1, self.nexus.y + 1)
    
    def get_entities_for_render(self) -> List[Any]:
        """Get all entities sorted by depth for rendering"""
        entities = []
        
        # Tiles first
        entities.extend(self.tiles)
        
        # Then furniture
        entities.extend(self.furniture)
        
        # Nexus
        if self.nexus:
            entities.append(self.nexus)
        
        # Agents sorted by depth
        agents_sorted = sorted(self.agents, key=lambda a: (a.y + a.x, a.y))
        entities.extend(agents_sorted)
        
        return entities
    
    def get_entity_at(self, x: float, y: float) -> Optional[Any]:
        """Get entity at world coordinates"""
        for agent in self.agents:
            if abs(agent.x - x) < 0.5 and abs(agent.y - y) < 0.5:
                return agent
        return None
