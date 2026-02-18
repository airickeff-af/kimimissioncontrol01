"""
Mock API data for testing without a real backend
"""
import random
from typing import Dict, Any, List

class MockAPI:
    """Generates mock API data for testing"""
    
    def __init__(self):
        self.agents = self._generate_agents(8)
        self.tasks = self._generate_tasks(10)
        self.audits = []
        self.tick = 0
    
    def _generate_agents(self, count: int) -> List[Dict]:
        """Generate mock agents"""
        roles = ['developer', 'analyst', 'designer', 'manager', 'auditor']
        statuses = ['idle', 'working', 'busy', 'delegated']
        tasks = ['Coding feature', 'Code review', 'Testing', 'Documentation', 
                'Bug fixing', 'API integration', 'UI design', 'Meeting']
        
        return [
            {
                'id': f'agent_{i}',
                'name': f'Agent {i+1}',
                'role': random.choice(roles),
                'status': random.choice(statuses),
                'current_task': random.choice(tasks),
                'progress': random.random(),
                'delegated_from': None if random.random() > 0.3 else f'Agent {random.randint(1, count)}',
            }
            for i in range(count)
        ]
    
    def _generate_tasks(self, count: int) -> List[Dict]:
        """Generate mock tasks"""
        statuses = ['pending', 'active', 'completed', 'blocked']
        priorities = ['low', 'medium', 'high', 'critical']
        
        return [
            {
                'id': f'task_{i}',
                'title': f'Task {i+1}',
                'status': random.choice(statuses),
                'priority': random.choice(priorities),
                'assignee': f'agent_{random.randint(0, 7)}',
                'progress': random.random(),
            }
            for i in range(count)
        ]
    
    def update(self):
        """Update mock data (simulate activity)"""
        self.tick += 1
        
        # Update agent progress
        for agent in self.agents:
            if agent['status'] == 'working':
                agent['progress'] = min(1.0, agent['progress'] + random.uniform(0, 0.05))
                if agent['progress'] >= 1.0:
                    agent['status'] = 'idle'
                    agent['progress'] = 0
            elif agent['status'] == 'idle' and random.random() < 0.1:
                agent['status'] = 'working'
                agent['current_task'] = random.choice([
                    'Coding feature', 'Code review', 'Testing', 'Bug fixing'
                ])
        
        # Random audits
        if self.tick % 10 == 0:
            self.audits = [
                {'target_id': f'agent_{random.randint(0, len(self.agents)-1)}'}
                for _ in range(random.randint(0, 2))
            ]
    
    def get_data(self) -> Dict[str, Any]:
        """Get current mock data"""
        self.update()
        return {
            'agents': self.agents,
            'tasks': self.tasks,
            'audits': self.audits,
        }
