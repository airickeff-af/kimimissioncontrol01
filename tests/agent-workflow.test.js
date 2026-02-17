/**
 * Agent Workflow Tests
 * 
 * Tests for agent-specific workflows:
 * - Task assignment flow
 * - Status transitions
 * - File creation events
 * - Task completion flow
 * - Error handling
 */

describe('Agent Workflow', () => {
  
  describe('Task Assignment Flow', () => {
    it('should assign task to agent', () => {
      const task = {
        id: 'TASK-0001',
        description: 'Build API endpoint',
        assignedTo: 'Unassigned',
        status: 'pending'
      };

      const assignTask = (task, agentId, options = {}) => {
        task.assignedTo = agentId;
        if (options.autoStart) {
          task.status = 'in_progress';
          task.startedAt = new Date().toISOString();
        }
        return task;
      };

      const updated = assignTask(task, 'Code', { autoStart: true });

      expect(updated.assignedTo).toBe('Code');
      expect(updated.status).toBe('in_progress');
      expect(updated.startedAt).toBeDefined();
    });

    it('should track task assignment history', () => {
      const task = {
        id: 'TASK-0001',
        assignedTo: 'Unassigned',
        history: []
      };

      const assignWithHistory = (task, agentId) => {
        task.history.push({
          action: 'assigned',
          from: task.assignedTo,
          to: agentId,
          timestamp: new Date().toISOString()
        });
        task.assignedTo = agentId;
        return task;
      };

      assignWithHistory(task, 'Code');
      assignWithHistory(task, 'Scout');

      expect(task.history).toHaveLength(2);
      expect(task.history[0].to).toBe('Code');
      expect(task.history[1].from).toBe('Code');
      expect(task.history[1].to).toBe('Scout');
    });

    it('should validate agent exists before assignment', () => {
      const agents = ['Code', 'Scout', 'Pixel'];
      
      const canAssign = (agentId) => agents.includes(agentId);

      expect(canAssign('Code')).toBe(true);
      expect(canAssign('Unknown')).toBe(false);
    });

    it('should handle bulk assignment', () => {
      const tasks = [
        { id: 'T1', assignedTo: 'Unassigned' },
        { id: 'T2', assignedTo: 'Unassigned' },
        { id: 'T3', assignedTo: 'Code' }
      ];

      const bulkAssign = (tasks, agentId) => {
        return tasks.map(task => ({
          ...task,
          assignedTo: agentId
        }));
      };

      const updated = bulkAssign(tasks, 'Scout');

      expect(updated[0].assignedTo).toBe('Scout');
      expect(updated[1].assignedTo).toBe('Scout');
      expect(updated[2].assignedTo).toBe('Scout');
    });
  });

  describe('Status Transition Flow', () => {
    const validTransitions = {
      'pending': ['in_progress', 'cancelled', 'delegated'],
      'in_progress': ['review', 'blocked', 'failed'],
      'review': ['completed', 'in_progress'],
      'blocked': ['in_progress', 'cancelled'],
      'completed': [],
      'cancelled': [],
      'failed': ['in_progress'],
      'delegated': ['pending']
    };

    it('should allow valid status transitions', () => {
      const canTransition = (from, to) => {
        return validTransitions[from]?.includes(to) || false;
      };

      expect(canTransition('pending', 'in_progress')).toBe(true);
      expect(canTransition('in_progress', 'review')).toBe(true);
      expect(canTransition('review', 'completed')).toBe(true);
      expect(canTransition('completed', 'in_progress')).toBe(false);
    });

    it('should track status change timestamps', () => {
      const task = {
        id: 'TASK-0001',
        status: 'pending',
        statusHistory: []
      };

      const updateStatus = (task, newStatus) => {
        task.statusHistory.push({
          from: task.status,
          to: newStatus,
          timestamp: new Date().toISOString()
        });
        task.status = newStatus;
        return task;
      };

      updateStatus(task, 'in_progress');
      updateStatus(task, 'review');

      expect(task.statusHistory).toHaveLength(2);
      expect(task.statusHistory[0].from).toBe('pending');
      expect(task.statusHistory[0].to).toBe('in_progress');
    });

    it('should emit events on status change', () => {
      const events = [];
      
      const emitStatusChange = (task, oldStatus, newStatus) => {
        events.push({
          type: 'statusChanged',
          taskId: task.id,
          oldStatus,
          newStatus,
          timestamp: new Date().toISOString()
        });
      };

      emitStatusChange({ id: 'T1' }, 'pending', 'in_progress');

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('statusChanged');
    });

    it('should auto-complete when all subtasks done', () => {
      const task = {
        id: 'TASK-0001',
        status: 'in_progress',
        subtasks: [
          { id: 'S1', completed: true },
          { id: 'S2', completed: true },
          { id: 'S3', completed: true }
        ]
      };

      const checkAutoComplete = (task) => {
        const allComplete = task.subtasks.every(s => s.completed);
        if (allComplete && task.subtasks.length > 0) {
          task.status = 'review';
        }
        return task;
      };

      const updated = checkAutoComplete(task);

      expect(updated.status).toBe('review');
    });
  });

  describe('File Creation Events', () => {
    it('should detect new file creation', () => {
      const fileCache = new Map();
      
      const handleFileCreated = (filePath, content) => {
        const hash = require('crypto')
          .createHash('md5')
          .update(content)
          .digest('hex');
        
        fileCache.set(filePath, { hash, created: new Date() });
        
        return {
          type: 'file:created',
          path: filePath,
          timestamp: new Date().toISOString()
        };
      };

      const event = handleFileCreated('/test/file.md', 'content');

      expect(event.type).toBe('file:created');
      expect(fileCache.has('/test/file.md')).toBe(true);
    });

    it('should detect file modifications', () => {
      const fileCache = new Map();
      fileCache.set('/test/file.md', { 
        hash: 'oldhash123',
        modified: new Date('2026-02-17')
      });

      const handleFileModified = (filePath, newContent) => {
        const newHash = require('crypto')
          .createHash('md5')
          .update(newContent)
          .digest('hex');
        
        const cached = fileCache.get(filePath);
        
        if (cached && cached.hash !== newHash) {
          fileCache.set(filePath, { hash: newHash, modified: new Date() });
          return {
            type: 'file:modified',
            path: filePath,
            timestamp: new Date().toISOString()
          };
        }
        
        return null;
      };

      const event = handleFileModified('/test/file.md', 'new content');

      expect(event).not.toBeNull();
      expect(event.type).toBe('file:modified');
    });

    it('should auto-create task for new deliverables', () => {
      const tasks = [];
      
      const handleDeliverableCreated = (fileData) => {
        const task = {
          id: `TASK-${String(tasks.length + 1).padStart(4, '0')}`,
          description: `Review: ${fileData.name}`,
          priority: 'P2',
          assignedTo: fileData.agentId || 'nexus',
          tags: ['auto-generated', 'file-review'],
          status: 'pending',
          metadata: { filePath: fileData.path },
          created: new Date().toISOString()
        };
        
        tasks.push(task);
        return task;
      };

      const task = handleDeliverableCreated({
        name: 'report.md',
        path: '/agents/scout/output/report.md',
        agentId: 'Scout'
      });

      expect(task.description).toBe('Review: report.md');
      expect(task.assignedTo).toBe('Scout');
      expect(task.tags).toContain('auto-generated');
    });
  });

  describe('Task Completion Flow', () => {
    it('should complete task and move to history', () => {
      const activeTasks = [
        { id: 'T1', description: 'Task 1', status: 'review' }
      ];
      const taskHistory = [];

      const completeTask = (taskId) => {
        const index = activeTasks.findIndex(t => t.id === taskId);
        if (index === -1) return null;
        
        const task = activeTasks[index];
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        
        taskHistory.unshift(task);
        activeTasks.splice(index, 1);
        
        return task;
      };

      const completed = completeTask('T1');

      expect(completed.status).toBe('completed');
      expect(completed.completedAt).toBeDefined();
      expect(activeTasks).toHaveLength(0);
      expect(taskHistory).toHaveLength(1);
    });

    it('should update agent stats on completion', () => {
      const agent = {
        id: 'Code',
        stats: { tasksCompleted: 10, tasksActive: 3 }
      };

      const completeTaskForAgent = (agent) => {
        agent.stats.tasksCompleted++;
        agent.stats.tasksActive = Math.max(0, agent.stats.tasksActive - 1);
        return agent;
      };

      const updated = completeTaskForAgent(agent);

      expect(updated.stats.tasksCompleted).toBe(11);
      expect(updated.stats.tasksActive).toBe(2);
    });

    it('should trigger dependent tasks on completion', () => {
      const tasks = [
        { id: 'T1', status: 'in_progress', blocks: ['T2'] },
        { id: 'T2', status: 'blocked', dependsOn: ['T1'] }
      ];

      const completeAndUnblock = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        task.status = 'completed';
        
        // Unblock dependent tasks
        if (task.blocks) {
          for (const blockedId of task.blocks) {
            const blocked = tasks.find(t => t.id === blockedId);
            if (blocked) {
              blocked.status = 'pending';
              blocked.dependsOn = blocked.dependsOn.filter(id => id !== taskId);
            }
          }
        }
        
        return task;
      };

      completeAndUnblock('T1');

      expect(tasks[0].status).toBe('completed');
      expect(tasks[1].status).toBe('pending');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing task gracefully', () => {
      const tasks = [];
      
      const getTask = (id) => tasks.find(t => t.id === id);

      const result = getTask('NON-EXISTENT');

      expect(result).toBeUndefined();
    });

    it('should handle invalid status transitions', () => {
      const task = { id: 'T1', status: 'completed' };
      
      const updateStatus = (task, newStatus) => {
        if (task.status === 'completed') {
          throw new Error('Cannot modify completed task');
        }
        task.status = newStatus;
        return task;
      };

      expect(() => updateStatus(task, 'in_progress')).toThrow();
    });

    it('should handle file system errors', () => {
      const readFile = (path) => {
        try {
          // Simulate file not found
          throw new Error('ENOENT: file not found');
        } catch (e) {
          return { error: e.message, path };
        }
      };

      const result = readFile('/non/existent/file.txt');

      expect(result.error).toContain('ENOENT');
    });

    it('should retry failed operations', async () => {
      let attempts = 0;
      
      const operationWithRetry = async (maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          attempts++;
          if (attempts >= 3) {
            return { success: true, attempts };
          }
          // Simulate failure
        }
        return { success: false, attempts };
      };

      const result = await operationWithRetry();

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
    });

    it('should validate task data before creation', () => {
      const validateTask = (data) => {
        const errors = [];
        
        if (!data.description || data.description.trim() === '') {
          errors.push('Description is required');
        }
        
        if (data.priority && !['P0', 'P1', 'P2', 'P3'].includes(data.priority)) {
          errors.push('Invalid priority');
        }
        
        return errors.length === 0 ? { valid: true } : { valid: false, errors };
      };

      expect(validateTask({ description: 'Valid task' })).toEqual({ valid: true });
      expect(validateTask({ description: '' })).toEqual({ 
        valid: false, 
        errors: ['Description is required'] 
      });
      expect(validateTask({ description: 'Test', priority: 'P5' })).toEqual({ 
        valid: false, 
        errors: ['Invalid priority'] 
      });
    });
  });

  describe('Agent Coordination', () => {
    it('should distribute tasks among agents', () => {
      const agents = [
        { id: 'Code', capacity: 5, active: 3 },
        { id: 'Scout', capacity: 3, active: 1 },
        { id: 'Pixel', capacity: 4, active: 4 }
      ];

      const findBestAgent = () => {
        return agents
          .filter(a => a.active < a.capacity)
          .sort((a, b) => (b.capacity - b.active) - (a.capacity - a.active))[0];
      };

      const best = findBestAgent();

      expect(best.id).toBe('Scout'); // Has most available capacity
    });

    it('should handle agent handoff', () => {
      const task = {
        id: 'T1',
        assignedTo: 'Code',
        handoffHistory: []
      };

      const handoff = (task, fromAgent, toAgent, notes) => {
        task.handoffHistory.push({
          from: fromAgent,
          to: toAgent,
          notes,
          timestamp: new Date().toISOString()
        });
        task.assignedTo = toAgent;
        return task;
      };

      handoff(task, 'Code', 'Scout', 'Needs research expertise');

      expect(task.assignedTo).toBe('Scout');
      expect(task.handoffHistory).toHaveLength(1);
      expect(task.handoffHistory[0].notes).toBe('Needs research expertise');
    });
  });
});
