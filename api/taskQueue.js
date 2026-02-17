/**
 * Mission Control - Task Queue Service
 * 
 * CRUD operations for tasks with priority management (P0/P1/P2/P3)
 * Status tracking and task lifecycle management
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class TaskQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.workspaceRoot = options.workspaceRoot || '/root/.openclaw/workspace';
    this.missionControlDir = options.missionControlDir || path.join(this.workspaceRoot, 'mission-control');
    this.tasksFile = options.tasksFile || path.join(this.missionControlDir, 'TASK_QUEUE.json');
    this.tasks = [];
    this.taskHistory = [];
    this.nextId = 1;
    this.autoSave = options.autoSave !== false;
    
    // Priority weights for sorting
    this.priorityWeights = {
      'P0': 0,  // Critical - highest
      'P1': 1,  // High
      'P2': 2,  // Medium
      'P3': 3   // Low
    };
    
    // Valid status values
    this.validStatuses = [
      'pending',
      'in_progress',
      'review',
      'completed',
      'failed',
      'delegated',
      'blocked',
      'cancelled'
    ];
    
    // Load existing tasks
    this.load();
  }

  /**
   * Load tasks from disk
   */
  load() {
    try {
      if (fs.existsSync(this.tasksFile)) {
        const data = JSON.parse(fs.readFileSync(this.tasksFile, 'utf-8'));
        this.tasks = data.tasks || [];
        this.taskHistory = data.history || [];
        this.nextId = data.nextId || 1;
        console.log(`📋 Loaded ${this.tasks.length} tasks, ${this.taskHistory.length} history items`);
      } else {
        // Try to parse from markdown if JSON doesn't exist
        this.parseFromMarkdown();
      }
    } catch (e) {
      console.error('Error loading tasks:', e.message);
      this.tasks = [];
      this.taskHistory = [];
    }
  }

  /**
   * Parse tasks from existing TASK_QUEUE.md
   */
  parseFromMarkdown() {
    const mdPath = path.join(this.missionControlDir, 'TASK_QUEUE.md');
    
    if (!fs.existsSync(mdPath)) {
      return;
    }

    try {
      const content = fs.readFileSync(mdPath, 'utf-8');
      
      // Parse active tasks
      const activeMatch = content.match(/## Active Task Queue[\s\S]*?(?=##|$)/);
      if (activeMatch) {
        const lines = activeMatch[0].split('\n');
        for (const line of lines) {
          if (line.includes('|') && !line.includes('---') && !line.includes('ID') && !line.includes('No pending')) {
            const parts = line.split('|').map(p => p.trim());
            if (parts.length >= 4 && parts[1] && parts[1] !== '-') {
              this.tasks.push({
                id: parts[1],
                description: parts[2],
                status: this.normalizeStatus(parts[3]),
                assignedTo: parts[4] || 'Unassigned',
                priority: this.normalizePriority(parts[5]),
                created: new Date().toISOString(),
                updated: new Date().toISOString()
              });
            }
          }
        }
      }
      
      // Parse history
      const historyMatch = content.match(/## Task History[\s\S]*?(?=##|$)/);
      if (historyMatch) {
        const lines = historyMatch[0].split('\n');
        for (const line of lines) {
          if (line.includes('|') && !line.includes('---') && !line.includes('ID')) {
            const parts = line.split('|').map(p => p.trim());
            if (parts.length >= 4 && parts[1] && parts[1] !== '-') {
              this.taskHistory.push({
                id: parts[1],
                description: parts[2],
                status: 'completed',
                completedAt: parts[4] || new Date().toISOString(),
                completedBy: parts[5] || 'Unknown'
              });
            }
          }
        }
      }
      
      console.log(`📋 Parsed ${this.tasks.length} tasks from markdown`);
      this.save();
      
    } catch (e) {
      console.error('Error parsing markdown:', e.message);
    }
  }

  /**
   * Save tasks to disk
   */
  save() {
    if (!this.autoSave) return;
    
    try {
      const data = {
        tasks: this.tasks,
        history: this.taskHistory,
        nextId: this.nextId,
        updated: new Date().toISOString()
      };
      
      fs.writeFileSync(this.tasksFile, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Error saving tasks:', e.message);
    }
  }

  /**
   * Normalize status string
   */
  normalizeStatus(status) {
    if (!status) return 'pending';
    
    const normalized = status.toLowerCase()
      .replace(/[🟡🔵🟢🔴⚪✅]/g, '')
      .replace(/\s+/g, '_')
      .trim();
    
    const validStatus = this.validStatuses.find(s => 
      s === normalized || 
      s.replace('_', '') === normalized.replace('_', '')
    );
    
    return validStatus || 'pending';
  }

  /**
   * Normalize priority string
   */
  normalizePriority(priority) {
    if (!priority) return 'P2';
    
    const normalized = priority.toUpperCase().trim();
    
    if (['P0', 'P1', 'P2', 'P3'].includes(normalized)) {
      return normalized;
    }
    
    // Map common terms
    const map = {
      'CRITICAL': 'P0',
      'HIGH': 'P1',
      'MEDIUM': 'P2',
      'LOW': 'P3',
      'URGENT': 'P0',
      'NORMAL': 'P2'
    };
    
    return map[normalized] || 'P2';
  }

  /**
   * Generate unique task ID
   */
  generateId() {
    const id = `TASK-${String(this.nextId).padStart(4, '0')}`;
    this.nextId++;
    return id;
  }

  /**
   * Create a new task
   */
  create(taskData) {
    const task = {
      id: taskData.id || this.generateId(),
      description: taskData.description || 'Untitled Task',
      status: this.normalizeStatus(taskData.status || 'pending'),
      priority: this.normalizePriority(taskData.priority || 'P2'),
      assignedTo: taskData.assignedTo || 'Unassigned',
      createdBy: taskData.createdBy || 'System',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      due: taskData.due || null,
      tags: taskData.tags || [],
      metadata: taskData.metadata || {},
      notes: taskData.notes || '',
      parentId: taskData.parentId || null,
      subtasks: taskData.subtasks || []
    };

    this.tasks.push(task);
    this.save();
    
    this.emit('taskCreated', task);
    console.log(`📝 Task created: ${task.id} - ${task.description}`);
    
    return task;
  }

  /**
   * Get a task by ID
   */
  get(id) {
    return this.tasks.find(t => t.id === id) || 
           this.taskHistory.find(t => t.id === id);
  }

  /**
   * Get all tasks with optional filters
   */
  getAll(filters = {}) {
    let result = [...this.tasks];
    
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      result = result.filter(t => statuses.includes(t.status));
    }
    
    if (filters.priority) {
      const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
      result = result.filter(t => priorities.includes(t.priority));
    }
    
    if (filters.assignedTo) {
      result = result.filter(t => 
        t.assignedTo.toLowerCase() === filters.assignedTo.toLowerCase()
      );
    }
    
    if (filters.tags) {
      const tags = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
      result = result.filter(t => 
        tags.some(tag => t.tags.includes(tag))
      );
    }
    
    // Sort by priority, then by creation date
    result.sort((a, b) => {
      const priorityDiff = this.priorityWeights[a.priority] - this.priorityWeights[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.created) - new Date(b.created);
    });
    
    if (filters.limit) {
      result = result.slice(0, filters.limit);
    }
    
    return result;
  }

  /**
   * Update a task
   */
  update(id, updates) {
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      throw new Error(`Task not found: ${id}`);
    }

    const task = this.tasks[taskIndex];
    const oldStatus = task.status;
    
    // Apply updates
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.status !== undefined) task.status = this.normalizeStatus(updates.status);
    if (updates.priority !== undefined) task.priority = this.normalizePriority(updates.priority);
    if (updates.assignedTo !== undefined) task.assignedTo = updates.assignedTo;
    if (updates.due !== undefined) task.due = updates.due;
    if (updates.tags !== undefined) task.tags = updates.tags;
    if (updates.metadata !== undefined) task.metadata = { ...task.metadata, ...updates.metadata };
    if (updates.notes !== undefined) task.notes = updates.notes;
    if (updates.subtasks !== undefined) task.subtasks = updates.subtasks;
    
    task.updated = new Date().toISOString();
    
    // Handle status transitions
    if (oldStatus !== task.status) {
      this.handleStatusTransition(task, oldStatus);
    }
    
    this.save();
    this.emit('taskUpdated', task);
    
    return task;
  }

  /**
   * Handle status transitions
   */
  handleStatusTransition(task, oldStatus) {
    console.log(`🔄 Task ${task.id} status: ${oldStatus} → ${task.status}`);
    
    switch (task.status) {
      case 'completed':
        this.moveToHistory(task, 'completed');
        break;
      case 'cancelled':
        this.moveToHistory(task, 'cancelled');
        break;
      case 'in_progress':
        task.startedAt = new Date().toISOString();
        break;
    }
    
    this.emit('statusChanged', {
      task,
      oldStatus,
      newStatus: task.status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Move task to history
   */
  moveToHistory(task, finalStatus) {
    const historyEntry = {
      ...task,
      status: finalStatus,
      completedAt: new Date().toISOString(),
      archived: new Date().toISOString()
    };
    
    this.taskHistory.unshift(historyEntry);
    this.tasks = this.tasks.filter(t => t.id !== task.id);
    
    // Keep history manageable (last 100)
    if (this.taskHistory.length > 100) {
      this.taskHistory = this.taskHistory.slice(0, 100);
    }
    
    this.emit('taskCompleted', historyEntry);
    console.log(`✅ Task completed: ${task.id}`);
  }

  /**
   * Delete a task
   */
  delete(id) {
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      throw new Error(`Task not found: ${id}`);
    }

    const task = this.tasks[taskIndex];
    this.tasks.splice(taskIndex, 1);
    this.save();
    
    this.emit('taskDeleted', { id, task });
    console.log(`🗑️  Task deleted: ${id}`);
    
    return task;
  }

  /**
   * Assign task to agent
   */
  assign(id, agentId, options = {}) {
    const updates = { assignedTo: agentId };
    
    if (options.autoStart) {
      updates.status = 'in_progress';
    }
    
    if (options.notes) {
      const task = this.get(id);
      updates.notes = task.notes + `\n[${new Date().toISOString()}] Assigned to ${agentId}: ${options.notes}`;
    }
    
    return this.update(id, updates);
  }

  /**
   * Change task priority
   */
  setPriority(id, priority) {
    return this.update(id, { priority: this.normalizePriority(priority) });
  }

  /**
   * Add subtask
   */
  addSubtask(parentId, subtaskData) {
    const parent = this.get(parentId);
    
    if (!parent) {
      throw new Error(`Parent task not found: ${parentId}`);
    }

    const subtask = {
      id: `${parentId}-SUB-${parent.subtasks.length + 1}`,
      description: subtaskData.description,
      status: 'pending',
      completed: false,
      created: new Date().toISOString()
    };

    parent.subtasks.push(subtask);
    this.update(parentId, { subtasks: parent.subtasks });
    
    return subtask;
  }

  /**
   * Complete subtask
   */
  completeSubtask(parentId, subtaskId) {
    const parent = this.get(parentId);
    
    if (!parent) {
      throw new Error(`Parent task not found: ${parentId}`);
    }

    const subtask = parent.subtasks.find(s => s.id === subtaskId);
    
    if (!subtask) {
      throw new Error(`Subtask not found: ${subtaskId}`);
    }

    subtask.completed = true;
    subtask.status = 'completed';
    subtask.completedAt = new Date().toISOString();
    
    this.update(parentId, { subtasks: parent.subtasks });
    
    // Check if all subtasks are complete
    const allComplete = parent.subtasks.every(s => s.completed);
    if (allComplete && parent.subtasks.length > 0) {
      this.update(parentId, { status: 'review' });
    }
    
    return subtask;
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const stats = {
      total: this.tasks.length,
      byStatus: {},
      byPriority: {},
      byAssignee: {},
      completed: this.taskHistory.length,
      updated: new Date().toISOString()
    };

    // Initialize counters
    this.validStatuses.forEach(s => stats.byStatus[s] = 0);
    ['P0', 'P1', 'P2', 'P3'].forEach(p => stats.byPriority[p] = 0);

    // Count tasks
    for (const task of this.tasks) {
      stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
      stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
      stats.byAssignee[task.assignedTo] = (stats.byAssignee[task.assignedTo] || 0) + 1;
    }

    return stats;
  }

  /**
   * Get queue summary for display
   */
  getSummary() {
    const stats = this.getStats();
    
    return {
      pending: stats.byStatus.pending || 0,
      inProgress: stats.byStatus.in_progress || 0,
      review: stats.byStatus.review || 0,
      completed: stats.completed,
      critical: stats.byPriority.P0 || 0,
      high: stats.byPriority.P1 || 0,
      total: stats.total,
      updated: stats.updated
    };
  }

  /**
   * Get tasks due soon
   */
  getDueSoon(hours = 24) {
    const now = new Date();
    const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);
    
    return this.tasks.filter(t => {
      if (!t.due || t.status === 'completed') return false;
      const due = new Date(t.due);
      return due <= cutoff;
    }).sort((a, b) => new Date(a.due) - new Date(b.due));
  }

  /**
   * Bulk update tasks
   */
  bulkUpdate(taskIds, updates) {
    const results = [];
    
    for (const id of taskIds) {
      try {
        results.push(this.update(id, updates));
      } catch (e) {
        results.push({ id, error: e.message });
      }
    }
    
    return results;
  }

  /**
   * Search tasks
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    
    return this.tasks.filter(t => 
      t.description.toLowerCase().includes(lowerQuery) ||
      t.assignedTo.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      (t.notes && t.notes.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Export tasks to markdown (for compatibility)
   */
  exportToMarkdown() {
    let md = `# Mission Control - Task Queue System\n\n`;
    md += `## Overview\n\n`;
    md += `Generated: ${new Date().toISOString()}\n\n`;
    
    md += `## Active Task Queue\n\n`;
    md += `| ID | Task | Status | Assigned To | Priority | Created | Due |\n`;
    md += `|----|------|--------|-------------|----------|---------|-----|\n`;
    
    for (const task of this.getAll()) {
      const statusEmoji = {
        'pending': '🟡',
        'in_progress': '🔵',
        'review': '🟠',
        'completed': '🟢',
        'failed': '🔴',
        'delegated': '⚪',
        'blocked': '⛔',
        'cancelled': '❌'
      }[task.status] || '⚪';
      
      md += `| ${task.id} | ${task.description} | ${statusEmoji} ${task.status.toUpperCase()} | ${task.assignedTo} | ${task.priority} | ${task.created.split('T')[0]} | ${task.due || '-'} |\n`;
    }
    
    if (this.tasks.length === 0) {
      md += `| - | No pending tasks | - | - | - | - | - |\n`;
    }
    
    md += `\n## Task History (Last 10)\n\n`;
    md += `| ID | Task | Status | Completed | By |\n`;
    md += `|----|------|--------|-----------|-----|\n`;
    
    for (const task of this.taskHistory.slice(0, 10)) {
      md += `| ${task.id} | ${task.description} | ✅ ${task.status.toUpperCase()} | ${task.completedAt?.split('T')[0] || '-'} | ${task.completedBy || task.assignedTo} |\n`;
    }
    
    return md;
  }
}

module.exports = TaskQueue;