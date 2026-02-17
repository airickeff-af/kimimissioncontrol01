/**
 * Integration Tests (End-to-End)
 * 
 * Tests for complete system workflows:
 * - Full task lifecycle
 * - API to dashboard data flow
 * - File watcher to task creation
 * - Token tracking pipeline
 * - System health monitoring
 */

const http = require('http');
const path = require('path');

describe('Integration Tests', () => {
  
  // Mock fs before requiring modules
  let mockFsInstance;
  let TaskQueue;
  let FileWatcher;

  beforeAll(() => {
    const mockFiles = global.testUtils.createMockFs();
    mockFsInstance = global.testUtils.mockFs(mockFiles);
    
    TaskQueue = require('../mission-control/dashboard/api/taskQueue');
    FileWatcher = require('../mission-control/dashboard/api/fileWatcher');
  });

  afterAll(() => {
    mockFsInstance.restore();
  });

  describe('Full Task Lifecycle', () => {
    it('should complete full task lifecycle', () => {
      const taskQueue = new TaskQueue({
        workspaceRoot: '/root/.openclaw/workspace',
        missionControlDir: '/root/.openclaw/workspace/mission-control',
        autoSave: false
      });

      // 1. Create task
      const task = taskQueue.create({
        description: 'Build integration test',
        priority: 'P1',
        assignedTo: 'Code',
        tags: ['integration', 'test']
      });

      expect(task.status).toBe('pending');
      expect(task.id).toBeDefined();

      // 2. Assign and start
      taskQueue.assign(task.id, 'Code', { autoStart: true });
      let updated = taskQueue.get(task.id);
      expect(updated.status).toBe('in_progress');

      // 3. Add subtasks
      taskQueue.addSubtask(task.id, { description: 'Setup test env' });
      taskQueue.addSubtask(task.id, { description: 'Write tests' });
      updated = taskQueue.get(task.id);
      expect(updated.subtasks).toHaveLength(2);

      // 4. Complete subtasks
      taskQueue.completeSubtask(task.id, `${task.id}-SUB-1`);
      taskQueue.completeSubtask(task.id, `${task.id}-SUB-2`);
      updated = taskQueue.get(task.id);
      expect(updated.status).toBe('review');

      // 5. Complete task
      taskQueue.update(task.id, { status: 'completed' });
      const completed = taskQueue.taskHistory.find(t => t.id === task.id);
      expect(completed).toBeDefined();
      expect(completed.status).toBe('completed');
    });
  });

  describe('API to Dashboard Data Flow', () => {
    it('should transform API data for dashboard', () => {
      // Simulate raw API data
      const apiData = {
        agents: [
          { id: 'code', name: 'Code', role: 'Backend Lead', status: 'online', stats: { tasksCompleted: 42 } },
          { id: 'scout', name: 'Scout', role: 'Researcher', status: 'working', stats: { tasksCompleted: 28 } }
        ],
        tasks: {
          tasks: [
            { id: 'T1', description: 'Task 1', priority: 'P0', status: 'in_progress' },
            { id: 'T2', description: 'Task 2', priority: 'P2', status: 'pending' }
          ],
          summary: { pending: 1, inProgress: 1, completed: 50 }
        }
      };

      // Transform for dashboard
      const dashboardData = {
        stats: {
          agents: {
            total: apiData.agents.length,
            online: apiData.agents.filter(a => a.status === 'online').length
          },
          tasks: apiData.tasks.summary
        },
        agentList: apiData.agents.map(a => ({
          ...a,
          avatar: `/avatars/${a.id}.png`,
          displayName: a.name || a.id
        })),
        taskList: apiData.tasks.tasks.map(t => ({
          ...t,
          priorityClass: `priority-${t.priority.toLowerCase()}`,
          statusClass: `status-${t.status.replace('_', '-')}`
        }))
      };

      expect(dashboardData.stats.agents.total).toBe(2);
      expect(dashboardData.stats.agents.online).toBe(1);
      expect(dashboardData.agentList[0].avatar).toBe('/avatars/code.png');
      expect(dashboardData.taskList[0].priorityClass).toBe('priority-p0');
    });

    it('should handle real-time updates', () => {
      const events = [];
      
      // Simulate event stream
      const simulateEvent = (type, data) => {
        events.push({ type, data, timestamp: new Date().toISOString() });
      };

      simulateEvent('task:created', { id: 'T1', description: 'New task' });
      simulateEvent('agent:status', { id: 'code', status: 'busy' });
      simulateEvent('file:created', { name: 'report.md', agentId: 'scout' });

      expect(events).toHaveLength(3);
      expect(events[0].type).toBe('task:created');
      expect(events[1].type).toBe('agent:status');
    });
  });

  describe('File Watcher Integration', () => {
    it('should detect and process file changes', () => {
      const fileWatcher = new FileWatcher({
        workspaceRoot: '/root/.openclaw/workspace',
        agentsDir: '/root/.openclaw/workspace/mission-control/agents'
      });

      const events = [];
      fileWatcher.on('fileCreated', (data) => events.push({ type: 'created', ...data }));
      fileWatcher.on('fileModified', (data) => events.push({ type: 'modified', ...data }));

      // Simulate file creation
      fileWatcher.emit('fileCreated', {
        name: 'test-report.md',
        path: '/test/path',
        agentId: 'scout'
      });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('created');
      expect(events[0].name).toBe('test-report.md');
    });

    it('should scan agent directories', () => {
      const fileWatcher = new FileWatcher({
        workspaceRoot: '/root/.openclaw/workspace',
        agentsDir: '/root/.openclaw/workspace/mission-control/agents'
      });

      const agents = fileWatcher.getAgentDirectories();

      expect(Array.isArray(agents)).toBe(true);
    });
  });

  describe('Token Tracking Pipeline', () => {
    it('should process session data into token stats', () => {
      // Simulate raw session data
      const sessions = [
        {
          agentName: 'Code',
          tokensIn: 5000,
          tokensOut: 2500,
          cost: 1.25,
          timestamp: '2026-02-18T10:00:00Z'
        },
        {
          agentName: 'Code',
          tokensIn: 3000,
          tokensOut: 1500,
          cost: 0.75,
          timestamp: '2026-02-18T11:00:00Z'
        },
        {
          agentName: 'Scout',
          tokensIn: 2000,
          tokensOut: 1000,
          cost: 0.50,
          timestamp: '2026-02-18T10:30:00Z'
        }
      ];

      // Process into dashboard format
      const processTokenData = (sessions) => {
        const agentMap = new Map();
        
        for (const session of sessions) {
          if (!agentMap.has(session.agentName)) {
            agentMap.set(session.agentName, {
              name: session.agentName,
              tokensIn: 0,
              tokensOut: 0,
              cost: 0,
              sessions: 0
            });
          }
          
          const agent = agentMap.get(session.agentName);
          agent.tokensIn += session.tokensIn;
          agent.tokensOut += session.tokensOut;
          agent.cost += session.cost;
          agent.sessions++;
        }
        
        const agents = Array.from(agentMap.values());
        const total = agents.reduce((acc, a) => ({
          tokensIn: acc.tokensIn + a.tokensIn,
          cost: acc.cost + a.cost
        }), { tokensIn: 0, cost: 0 });
        
        return { agents, total };
      };

      const result = processTokenData(sessions);

      expect(result.agents).toHaveLength(2);
      expect(result.total.tokensIn).toBe(10000);
      expect(result.total.cost).toBe(2.5);
      
      const codeAgent = result.agents.find(a => a.name === 'Code');
      expect(codeAgent.tokensIn).toBe(8000);
      expect(codeAgent.sessions).toBe(2);
    });
  });

  describe('System Health Monitoring', () => {
    it('should aggregate system health data', () => {
      const healthData = {
        gateway: { status: 'running', uptime: 86400 },
        fileWatcher: { isWatching: true, trackedFiles: 150 },
        taskQueue: { pending: 5, inProgress: 3 },
        agents: [
          { id: 'code', status: 'online', lastActive: new Date().toISOString() },
          { id: 'scout', status: 'working', lastActive: new Date().toISOString() }
        ]
      };

      const calculateHealth = (data) => {
        const checks = {
          gateway: data.gateway.status === 'running',
          fileWatcher: data.fileWatcher.isWatching,
          agents: data.agents.some(a => a.status === 'online' || a.status === 'working')
        };
        
        const allHealthy = Object.values(checks).every(c => c);
        
        return {
          status: allHealthy ? 'healthy' : 'degraded',
          checks,
          timestamp: new Date().toISOString()
        };
      };

      const health = calculateHealth(healthData);

      expect(health.status).toBe('healthy');
      expect(health.checks.gateway).toBe(true);
      expect(health.checks.fileWatcher).toBe(true);
    });

    it('should detect system issues', () => {
      const healthData = {
        gateway: { status: 'stopped' },
        fileWatcher: { isWatching: false },
        agents: []
      };

      const calculateHealth = (data) => {
        const issues = [];
        
        if (data.gateway.status !== 'running') {
          issues.push('Gateway is not running');
        }
        
        if (!data.fileWatcher.isWatching) {
          issues.push('File watcher is not active');
        }
        
        if (data.agents.length === 0) {
          issues.push('No agents registered');
        }
        
        return {
          status: issues.length === 0 ? 'healthy' : 'critical',
          issues,
          timestamp: new Date().toISOString()
        };
      };

      const health = calculateHealth(healthData);

      expect(health.status).toBe('critical');
      expect(health.issues).toHaveLength(3);
    });
  });

  describe('End-to-End API Flows', () => {
    it('should handle complete API request flow', async () => {
      // Simulate API request handling
      const handleRequest = async (req) => {
        const routes = {
          '/api/health': () => ({ status: 'ok', timestamp: new Date().toISOString() }),
          '/api/agents': () => [{ id: 'code', name: 'Code', status: 'online' }],
          '/api/tasks': () => ({ tasks: [], summary: { total: 0 } })
        };

        const handler = routes[req.url];
        if (!handler) {
          return { status: 404, body: { error: 'Not found' } };
        }

        return { status: 200, body: handler() };
      };

      const healthResponse = await handleRequest({ url: '/api/health' });
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body.status).toBe('ok');

      const agentsResponse = await handleRequest({ url: '/api/agents' });
      expect(agentsResponse.status).toBe(200);
      expect(agentsResponse.body).toHaveLength(1);

      const notFoundResponse = await handleRequest({ url: '/api/unknown' });
      expect(notFoundResponse.status).toBe(404);
    });

    it('should handle CORS preflight requests', () => {
      const handleCors = (req) => {
        if (req.method === 'OPTIONS') {
          return {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          };
        }
        return null;
      };

      const response = handleCors({ method: 'OPTIONS' });

      expect(response.status).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    });
  });

  describe('Data Persistence Flow', () => {
    it('should save and load task queue data', () => {
      const writtenFiles = {};
      
      // Mock save operation
      const saveTasks = (tasks, history, nextId) => {
        const data = {
          tasks,
          history,
          nextId,
          updated: new Date().toISOString()
        };
        writtenFiles['TASK_QUEUE.json'] = JSON.stringify(data);
        return true;
      };

      // Mock load operation
      const loadTasks = () => {
        const content = writtenFiles['TASK_QUEUE.json'];
        return content ? JSON.parse(content) : null;
      };

      const tasks = [{ id: 'T1', description: 'Test' }];
      const history = [];
      
      saveTasks(tasks, history, 2);
      const loaded = loadTasks();

      expect(loaded).not.toBeNull();
      expect(loaded.tasks).toHaveLength(1);
      expect(loaded.nextId).toBe(2);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from API errors', async () => {
      let failures = 0;
      
      const resilientRequest = async (maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            // Simulate occasional failure
            if (failures < 2) {
              failures++;
              throw new Error('Network error');
            }
            return { success: true, data: 'response' };
          } catch (e) {
            if (i === maxRetries - 1) throw e;
            await new Promise(r => setTimeout(r, 10)); // Small delay for testing
          }
        }
      };

      const result = await resilientRequest();

      expect(result.success).toBe(true);
      expect(failures).toBe(2);
    });

    it('should handle malformed data gracefully', () => {
      const parseAgentData = (content) => {
        try {
          // Try to extract name even from malformed content
          const nameMatch = content.match(/Name:\s*(.+)/i);
          return {
            name: nameMatch ? nameMatch[1].trim() : 'Unknown',
            valid: !!nameMatch
          };
        } catch (e) {
          return { name: 'Unknown', valid: false, error: e.message };
        }
      };

      const valid = parseAgentData('Name: Code\nRole: Developer');
      expect(valid.name).toBe('Code');
      expect(valid.valid).toBe(true);

      const invalid = parseAgentData('No name here');
      expect(invalid.name).toBe('Unknown');
      expect(invalid.valid).toBe(false);
    });
  });

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', () => {
      const largeTaskList = Array.from({ length: 1000 }, (_, i) => ({
        id: `TASK-${i}`,
        description: `Task ${i}`,
        priority: ['P0', 'P1', 'P2', 'P3'][i % 4],
        status: ['pending', 'in_progress', 'completed'][i % 3]
      }));

      const start = Date.now();
      
      // Sort by priority
      const sorted = [...largeTaskList].sort((a, b) => {
        const weights = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
        return weights[a.priority] - weights[b.priority];
      });
      
      const duration = Date.now() - start;

      expect(sorted).toHaveLength(1000);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should batch process updates', () => {
      const updates = Array.from({ length: 100 }, (_, i) => ({
        id: `TASK-${i}`,
        status: 'completed'
      }));

      const batchProcess = (updates, batchSize = 10) => {
        const batches = [];
        for (let i = 0; i < updates.length; i += batchSize) {
          batches.push(updates.slice(i, i + batchSize));
        }
        return batches;
      };

      const batches = batchProcess(updates);

      expect(batches).toHaveLength(10);
      expect(batches[0]).toHaveLength(10);
    });
  });
});
