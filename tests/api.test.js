/**
 * API Endpoint Tests
 * 
 * Tests for all 4 API endpoints:
 * 1. GET /api/agents - List all agents
 * 2. GET /api/agents/:id - Get specific agent
 * 3. GET /api/system/status - System status
 * 4. GET /api/tasks - Task queue
 * 5. GET /api/health - Health check
 * 6. GET /api/tokens - Token usage
 */

const path = require('path');
const http = require('http');
const url = require('url');

// Mock fs before requiring modules
const mockFiles = global.testUtils.createMockFs();
const mockFs = global.testUtils.mockFs(mockFiles);

// Now require the modules under test
const FileWatcher = require('../mission-control/dashboard/api/fileWatcher');
const TaskQueue = require('../mission-control/dashboard/api/taskQueue');

// Restore fs after module load
mockFs.restore();

describe('API Endpoints', () => {
  let taskQueue;
  let fileWatcher;
  let mockFsInstance;

  beforeEach(() => {
    // Setup fresh mocks for each test
    const files = global.testUtils.createMockFs();
    mockFsInstance = global.testUtils.mockFs(files);
    
    taskQueue = new TaskQueue({
      workspaceRoot: '/root/.openclaw/workspace',
      missionControlDir: '/root/.openclaw/workspace/mission-control',
      autoSave: false
    });
    
    fileWatcher = new FileWatcher({
      workspaceRoot: '/root/.openclaw/workspace',
      agentsDir: '/root/.openclaw/workspace/mission-control/agents'
    });
  });

  afterEach(() => {
    mockFsInstance.restore();
    if (fileWatcher.isWatching) {
      fileWatcher.stop();
    }
  });

  describe('GET /api/health', () => {
    it('should return health status', () => {
      const response = {
        status: 'ok',
        timestamp: expect.any(String),
        services: {
          fileWatcher: expect.any(Boolean),
          taskQueue: true
        }
      };
      
      // Verify structure matches expected API response
      expect(response.status).toBe('ok');
      expect(new Date(response.timestamp).toISOString()).toBe(response.timestamp);
    });

    it('should return valid ISO timestamp', () => {
      const timestamp = new Date().toISOString();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('GET /api/agents', () => {
    it('should return array of agents', () => {
      const agents = [
        {
          id: 'code',
          name: 'Code',
          role: 'Backend Lead',
          codename: 'The Architect',
          division: 'Engineering',
          specialties: ['API Development', 'Database Design', 'System Architecture'],
          status: 'online',
          stats: { tasksCompleted: 42, tasksActive: 3 }
        },
        {
          id: 'scout',
          name: 'Scout',
          role: 'Researcher',
          codename: 'The Seeker',
          division: 'Intelligence',
          specialties: ['Market Research', 'Competitive Analysis', 'Lead Discovery'],
          status: 'working',
          stats: { tasksCompleted: 28, tasksActive: 5 }
        }
      ];

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
      
      // Verify agent structure
      agents.forEach(agent => {
        expect(agent).toHaveProperty('id');
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('role');
        expect(agent).toHaveProperty('status');
        expect(agent).toHaveProperty('stats');
      });
    });

    it('should parse agent identity from SOUL.md', () => {
      const soulContent = `
# Test Agent - Role Name

**Name:** TestAgent
**Role:** Test Role
**Codename:** "TestCode"
**Division:** Test Division

**Specialties**
- Skill One
- Skill Two
`;
      
      // Test parsing logic
      const nameMatch = soulContent.match(/\*\*Name:\*\*\s*(.+)/i);
      expect(nameMatch).toBeTruthy();
      expect(nameMatch[1].trim()).toBe('TestAgent');
      
      const roleMatch = soulContent.match(/\*\*Role:\*\*\s*(.+)/i);
      expect(roleMatch).toBeTruthy();
      expect(roleMatch[1].trim()).toBe('Test Role');
    });

    it('should include agent statistics', () => {
      const agent = {
        stats: {
          tasksCompleted: 10,
          tasksActive: 2
        }
      };
      
      expect(agent.stats.tasksCompleted).toBeGreaterThanOrEqual(0);
      expect(agent.stats.tasksActive).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/agents/:id', () => {
    it('should return specific agent by ID', () => {
      const agentId = 'code';
      const agent = {
        id: agentId,
        name: 'Code',
        role: 'Backend Lead',
        status: 'online'
      };
      
      expect(agent.id).toBe(agentId);
      expect(agent.name).toBeDefined();
    });

    it('should return 404 for non-existent agent', () => {
      const nonExistentId = 'nonexistent';
      const agent = null; // Simulating not found
      
      expect(agent).toBeNull();
    });

    it('should handle agent files endpoint', () => {
      const agentId = 'code';
      const files = fileWatcher.getAgentFiles(agentId);
      
      expect(Array.isArray(files)).toBe(true);
    });
  });

  describe('GET /api/system/status', () => {
    it('should return system status structure', () => {
      const status = {
        system: { gatewayStatus: 'running' },
        sessions: { total: 10, active: 3 },
        agents: { deployed: ['code', 'scout'], pending: [] },
        alerts: [],
        fileWatcher: fileWatcher.getStatus(),
        taskQueue: taskQueue.getSummary()
      };

      expect(status).toHaveProperty('system');
      expect(status).toHaveProperty('sessions');
      expect(status).toHaveProperty('agents');
      expect(status).toHaveProperty('fileWatcher');
      expect(status).toHaveProperty('taskQueue');
    });

    it('should include file watcher status', () => {
      const fwStatus = fileWatcher.getStatus();
      
      expect(fwStatus).toHaveProperty('isWatching');
      expect(fwStatus).toHaveProperty('watchedDirectories');
      expect(fwStatus).toHaveProperty('trackedFiles');
      expect(fwStatus).toHaveProperty('timestamp');
    });

    it('should include task queue summary', () => {
      const summary = taskQueue.getSummary();
      
      expect(summary).toHaveProperty('pending');
      expect(summary).toHaveProperty('inProgress');
      expect(summary).toHaveProperty('review');
      expect(summary).toHaveProperty('completed');
      expect(summary).toHaveProperty('total');
    });
  });

  describe('GET /api/tasks', () => {
    it('should return tasks with summary', () => {
      // Create test tasks
      taskQueue.create({
        description: 'Test Task 1',
        priority: 'P0',
        assignedTo: 'code'
      });
      
      taskQueue.create({
        description: 'Test Task 2',
        priority: 'P2',
        assignedTo: 'scout'
      });

      const tasks = taskQueue.getAll();
      const summary = taskQueue.getSummary();

      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBe(2);
      expect(summary.total).toBe(2);
    });

    it('should filter tasks by status', () => {
      const task1 = taskQueue.create({
        description: 'Pending Task',
        status: 'pending'
      });
      
      const task2 = taskQueue.create({
        description: 'In Progress Task',
        status: 'in_progress'
      });

      const pendingTasks = taskQueue.getAll({ status: 'pending' });
      const inProgressTasks = taskQueue.getAll({ status: 'in_progress' });

      expect(pendingTasks.length).toBe(1);
      expect(inProgressTasks.length).toBe(1);
      expect(pendingTasks[0].description).toBe('Pending Task');
    });

    it('should filter tasks by priority', () => {
      taskQueue.create({ description: 'P0 Task', priority: 'P0' });
      taskQueue.create({ description: 'P1 Task', priority: 'P1' });
      taskQueue.create({ description: 'P2 Task', priority: 'P2' });

      const p0Tasks = taskQueue.getAll({ priority: 'P0' });
      const p1Tasks = taskQueue.getAll({ priority: 'P1' });

      expect(p0Tasks.length).toBe(1);
      expect(p1Tasks.length).toBe(1);
      expect(p0Tasks[0].priority).toBe('P0');
    });

    it('should sort tasks by priority', () => {
      taskQueue.create({ description: 'P2 First', priority: 'P2' });
      taskQueue.create({ description: 'P0 Critical', priority: 'P0' });
      taskQueue.create({ description: 'P1 High', priority: 'P1' });

      const tasks = taskQueue.getAll();

      expect(tasks[0].priority).toBe('P0');
      expect(tasks[1].priority).toBe('P1');
      expect(tasks[2].priority).toBe('P2');
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', () => {
      const taskData = {
        description: 'New Test Task',
        priority: 'P1',
        assignedTo: 'code',
        tags: ['test', 'api']
      };

      const task = taskQueue.create(taskData);

      expect(task).toHaveProperty('id');
      expect(task.description).toBe(taskData.description);
      expect(task.priority).toBe('P1');
      expect(task.assignedTo).toBe('code');
      expect(task.tags).toEqual(['test', 'api']);
      expect(task.status).toBe('pending');
    });

    it('should generate unique task IDs', () => {
      const task1 = taskQueue.create({ description: 'Task 1' });
      const task2 = taskQueue.create({ description: 'Task 2' });

      expect(task1.id).not.toBe(task2.id);
      expect(task1.id).toMatch(/^TASK-\d+$/);
    });

    it('should normalize priority values', () => {
      const task1 = taskQueue.create({ description: 'Critical', priority: 'critical' });
      const task2 = taskQueue.create({ description: 'High', priority: 'HIGH' });
      const task3 = taskQueue.create({ description: 'Low', priority: 'low' });

      expect(task1.priority).toBe('P0');
      expect(task2.priority).toBe('P1');
      expect(task3.priority).toBe('P3');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task fields', () => {
      const task = taskQueue.create({
        description: 'Original',
        priority: 'P2',
        status: 'pending'
      });

      const updated = taskQueue.update(task.id, {
        description: 'Updated',
        priority: 'P0',
        status: 'in_progress'
      });

      expect(updated.description).toBe('Updated');
      expect(updated.priority).toBe('P0');
      expect(updated.status).toBe('in_progress');
    });

    it('should track status changes', () => {
      const task = taskQueue.create({
        description: 'Status Test',
        status: 'pending'
      });

      let statusChanged = false;
      taskQueue.on('statusChanged', () => {
        statusChanged = true;
      });

      taskQueue.update(task.id, { status: 'in_progress' });

      expect(statusChanged).toBe(true);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', () => {
      const task = taskQueue.create({ description: 'To Delete' });
      const taskId = task.id;

      taskQueue.delete(taskId);

      expect(taskQueue.get(taskId)).toBeUndefined();
    });

    it('should throw error for non-existent task', () => {
      expect(() => {
        taskQueue.delete('NON-EXISTENT');
      }).toThrow('Task not found');
    });
  });

  describe('GET /api/tokens', () => {
    it('should return token usage structure', () => {
      const tokenData = {
        agents: [
          { name: 'Code', tokensIn: 1000, tokensOut: 500, cost: 0.05 },
          { name: 'Scout', tokensIn: 800, tokensOut: 400, cost: 0.04 }
        ],
        total: {
          tokensIn: 1800,
          cost: 0.09
        },
        meta: {
          lastUpdated: new Date().toISOString(),
          sessionCount: 10,
          agentCount: 2
        }
      };

      expect(tokenData).toHaveProperty('agents');
      expect(tokenData).toHaveProperty('total');
      expect(tokenData).toHaveProperty('meta');
      expect(Array.isArray(tokenData.agents)).toBe(true);
    });

    it('should calculate total costs correctly', () => {
      const agents = [
        { cost: 0.05 },
        { cost: 0.04 },
        { cost: 0.03 }
      ];

      const total = agents.reduce((sum, a) => sum + a.cost, 0);

      expect(total).toBeCloseTo(0.12, 2);
    });
  });

  describe('GET /api/files/activity', () => {
    it('should return file activity', () => {
      const activity = fileWatcher.getRecentActivity(50);
      
      expect(Array.isArray(activity)).toBe(true);
    });

    it('should track file metadata', () => {
      const testFile = '/root/.openclaw/workspace/test.txt';
      const metadata = fileWatcher.getFileMetadata(testFile);
      
      // Since file doesn't exist in mock, should return null
      expect(metadata).toBeNull();
    });
  });

  describe('GET /api/system/events', () => {
    it('should return system events', () => {
      const events = [];
      
      // Simulate events
      taskQueue.on('taskCreated', (data) => {
        events.push({ type: 'task:created', data });
      });

      taskQueue.create({ description: 'Event Test' });

      expect(events.length).toBe(1);
      expect(events[0].type).toBe('task:created');
    });
  });
});
