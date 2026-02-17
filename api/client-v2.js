/**
 * Mission Control Dashboard API Client v2
 * 
 * Enhanced client for File Watcher and Task Queue APIs
 * Integrates with Code's main API for unified experience
 */

const MC_API_V2 = {
  baseUrl: (typeof window !== 'undefined' && window.location.hostname === 'localhost') 
    ? 'http://localhost:3001' 
    : '',
  
  /**
   * Fetch JSON from API
   */
  async fetch(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      
      // Handle non-JSON responses (like markdown exports)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/markdown')) {
        return await response.text();
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error: ${endpoint}`, error);
      throw error;
    }
  },
  
  // ==================== AGENTS API ====================
  
  /**
   * Get all agents
   */
  async getAgents() {
    return this.fetch('/api/agents');
  },
  
  /**
   * Get specific agent
   */
  async getAgent(id) {
    return this.fetch(`/api/agents/${id}`);
  },
  
  /**
   * Get agent files
   */
  async getAgentFiles(id) {
    return this.fetch(`/api/agents/${id}/files`);
  },
  
  // ==================== SYSTEM API ====================
  
  /**
   * Get system status
   */
  async getSystemStatus() {
    return this.fetch('/api/system/status');
  },
  
  /**
   * Get system events
   */
  async getEvents(limit = 50) {
    return this.fetch(`/api/system/events?limit=${limit}`);
  },
  
  // ==================== FILE WATCHER API ====================
  
  /**
   * Get file watcher status
   */
  async getFileWatcherStatus() {
    return this.fetch('/api/files/watch');
  },
  
  /**
   * Get recent file activity
   */
  async getFileActivity(limit = 50) {
    return this.fetch(`/api/files/activity?limit=${limit}`);
  },
  
  /**
   * Get files for specific agent
   */
  async getAgentFileActivity(agentId, since = null) {
    const query = since ? `?since=${encodeURIComponent(since)}` : '';
    return this.fetch(`/api/files/agents/${agentId}${query}`);
  },
  
  /**
   * Refresh directory
   */
  async refreshDirectory(path) {
    return this.fetch('/api/files/refresh', {
      method: 'POST',
      body: JSON.stringify({ path })
    });
  },
  
  // ==================== TASK QUEUE API ====================
  
  /**
   * Get all tasks
   */
  async getTasks(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters.limit) params.append('limit', filters.limit);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.fetch(`/api/tasks${query}`);
  },
  
  /**
   * Create new task
   */
  async createTask(taskData) {
    return this.fetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  },
  
  /**
   * Get specific task
   */
  async getTask(id) {
    return this.fetch(`/api/tasks/${id}`);
  },
  
  /**
   * Update task
   */
  async updateTask(id, updates) {
    return this.fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },
  
  /**
   * Patch task (partial update)
   */
  async patchTask(id, updates) {
    return this.fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },
  
  /**
   * Delete task
   */
  async deleteTask(id) {
    return this.fetch(`/api/tasks/${id}`, {
      method: 'DELETE'
    });
  },
  
  /**
   * Assign task to agent
   */
  async assignTask(id, agentId, options = {}) {
    return this.fetch(`/api/tasks/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ agentId, options })
    });
  },
  
  /**
   * Set task priority
   */
  async setTaskPriority(id, priority) {
    return this.fetch(`/api/tasks/${id}/priority`, {
      method: 'PUT',
      body: JSON.stringify({ priority })
    });
  },
  
  /**
   * Add subtask
   */
  async addSubtask(parentId, description) {
    return this.fetch(`/api/tasks/${parentId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ description })
    });
  },
  
  /**
   * Get task statistics
   */
  async getTaskStats() {
    return this.fetch('/api/tasks/stats');
  },
  
  /**
   * Get task summary
   */
  async getTaskSummary() {
    return this.fetch('/api/tasks/summary');
  },
  
  /**
   * Get tasks due soon
   */
  async getTasksDueSoon(hours = 24) {
    return this.fetch(`/api/tasks/due?hours=${hours}`);
  },
  
  /**
   * Search tasks
   */
  async searchTasks(query) {
    return this.fetch(`/api/tasks/search?q=${encodeURIComponent(query)}`);
  },
  
  /**
   * Bulk update tasks
   */
  async bulkUpdateTasks(ids, updates) {
    return this.fetch('/api/tasks/bulk', {
      method: 'PUT',
      body: JSON.stringify({ ids, updates })
    });
  },
  
  /**
   * Export tasks
   */
  async exportTasks(format = 'json') {
    return this.fetch(`/api/export/tasks?format=${format}`);
  }
};

/**
 * Dashboard UI Controller v2
 */
const MC_DASHBOARD_V2 = {
  refreshInterval: null,
  eventSource: null,
  
  /**
   * Initialize dashboard
   */
  async init() {
    console.log('🚀 Initializing Mission Control Dashboard v2...');
    
    // Load all data
    await this.loadAgents();
    await this.loadSystemStatus();
    await this.loadTasks();
    await this.loadFileActivity();
    await this.loadEvents();
    
    // Start auto-refresh
    this.startRefresh(30000);
    
    console.log('✅ Dashboard v2 initialized');
  },
  
  /**
   * Load and display agents
   */
  async loadAgents() {
    try {
      const data = await MC_API_V2.getAgents();
      const agents = Array.isArray(data) ? data : data.agents || [];
      
      const onlineCount = agents.filter(a => 
        a.status === 'online' || a.status === 'operational'
      ).length;
      
      this.updateStat('agents', agents.length, `${onlineCount} online`);
      this.renderAgentList(agents);
      
      return agents;
    } catch (e) {
      console.error('Error loading agents:', e);
      return [];
    }
  },
  
  /**
   * Render agent list
   */
  renderAgentList(agents) {
    const container = document.querySelector('.agent-list');
    if (!container) return;
    
    const getAgentIcon = (role) => {
      const icons = {
        'Nexus': '◈', 'Orchestrator': '◈', 'Coder': '⚒️',
        'Researcher': '🔍', 'Social': '📢', 'Security': '🔒',
        'DevOps': '🛠️', 'QA': '✅', 'Writer': '✍️',
        'Designer': '🎨', 'Marketing': '📈'
      };
      return icons[role] || '🤖';
    };
    
    const getAgentClass = (role) => {
      const classes = {
        'Nexus': 'nexus', 'Orchestrator': 'nexus', 'Coder': 'forge',
        'Researcher': 'scout', 'Social': 'buzz', 'Security': 'cipher',
        'DevOps': 'sentry'
      };
      return classes[role] || 'forge';
    };
    
    const getStatusClass = (status) => {
      if (status === 'online' || status === 'operational') return 'online';
      if (status === 'busy' || status === 'working') return 'busy';
      return 'offline';
    };
    
    container.innerHTML = agents.map(agent => `
      <div class="agent-row" data-agent-id="${agent.id}">
        <div class="agent-avatar ${getAgentClass(agent.role)}">
          <span>${getAgentIcon(agent.role)}</span>
          <div class="agent-status-indicator ${getStatusClass(agent.status)}"></div>
        </div>
        <div class="agent-info">
          <div class="agent-name">${agent.name || agent.id}</div>
          <div class="agent-role">${agent.role}${agent.codename ? ` / ${agent.codename}` : ''}</div>
        </div>
        <div class="agent-stats">
          <div class="agent-stat">
            <span class="agent-stat-value">${agent.stats?.tasksActive || 0}</span>
            <span class="agent-stat-label">Active</span>
          </div>
          <div class="agent-stat">
            <span class="agent-stat-value">${agent.stats?.tasksCompleted || 0}</span>
            <span class="agent-stat-label">Done</span>
          </div>
        </div>
        <span class="agent-status ${getStatusClass(agent.status)}">${agent.status}</span>
      </div>
    `).join('');
    
    // Add click handlers
    container.querySelectorAll('.agent-row').forEach(row => {
      row.addEventListener('click', () => this.showAgentDetails(row.dataset.agentId));
    });
  },
  
  /**
   * Show agent details
   */
  async showAgentDetails(agentId) {
    try {
      const [agent, files, tasks] = await Promise.all([
        MC_API_V2.getAgent(agentId),
        MC_API_V2.getAgentFiles(agentId),
        MC_API_V2.getTasks({ assignedTo: agentId })
      ]);
      
      console.log('Agent:', agent);
      console.log('Files:', files);
      console.log('Tasks:', tasks);
      
      // TODO: Show modal with full details
      alert(`Agent: ${agent?.name || agentId}\nFiles: ${files.length}\nTasks: ${tasks.tasks?.length || 0}`);
    } catch (e) {
      console.error('Error loading agent details:', e);
    }
  },
  
  /**
   * Load and display system status
   */
  async loadSystemStatus() {
    try {
      const status = await MC_API_V2.getSystemStatus();
      
      // Update gateway status
      const gatewayStatus = status.system?.gatewayStatus || 'unknown';
      const statusPill = document.querySelector('.status-pill span:last-child');
      if (statusPill) {
        statusPill.textContent = gatewayStatus === 'running' 
          ? 'All Systems Online' 
          : `Gateway: ${gatewayStatus}`;
      }
      
      // Update file watcher status
      if (status.fileWatcher) {
        console.log(`📁 File Watcher: ${status.fileWatcher.trackedFiles} files tracked`);
      }
      
      return status;
    } catch (e) {
      console.error('Error loading system status:', e);
      return null;
    }
  },
  
  /**
   * Load and display tasks
   */
  async loadTasks() {
    try {
      const data = await MC_API_V2.getTasks();
      const tasks = data.tasks || [];
      const summary = data.summary || {};
      
      this.updateStat('pending', summary.pending || 0, 'Pending');
      this.updateStat('tasks', summary.completed || 0, 'Completed');
      this.renderTaskList(tasks);
      
      return data;
    } catch (e) {
      console.error('Error loading tasks:', e);
      return null;
    }
  },
  
  /**
   * Render task list
   */
  renderTaskList(tasks) {
    const container = document.querySelector('.task-list');
    if (!container) return;
    
    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✨</div>
          <div>No pending tasks</div>
          <div style="font-size: 0.875rem; margin-top: 0.5rem;">All agents are standing by</div>
        </div>
      `;
      return;
    }
    
    const getPriorityClass = (p) => ({
      'P0': 'priority-critical',
      'P1': 'priority-high',
      'P2': 'priority-medium',
      'P3': 'priority-low'
    })[p] || 'priority-medium';
    
    const getStatusClass = (s) => ({
      'pending': 'status-pending',
      'in_progress': 'status-active',
      'review': 'status-review',
      'completed': 'status-completed',
      'failed': 'status-failed'
    })[s] || 'status-pending';
    
    container.innerHTML = tasks.slice(0, 10).map(task => `
      <div class="task-item" data-task-id="${task.id}">
        <div class="task-priority ${getPriorityClass(task.priority)}"></div>
        <div class="task-content">
          <div class="task-title">${task.description}</div>
          <div class="task-meta">
            ${task.assignedTo} • ${task.priority}
            ${task.subtasks?.length ? ` • ${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length} subtasks` : ''}
          </div>
        </div>
        <span class="task-status ${getStatusClass(task.status)}">${task.status.replace('_', ' ')}</span>
      </div>
    `).join('');
  },
  
  /**
   * Load and display file activity
   */
  async loadFileActivity() {
    try {
      const activity = await MC_API_V2.getFileActivity(20);
      this.renderFileActivity(activity);
      return activity;
    } catch (e) {
      console.error('Error loading file activity:', e);
      return [];
    }
  },
  
  /**
   * Render file activity
   */
  renderFileActivity(activity) {
    const container = document.querySelector('.file-activity-list');
    if (!container) return;
    
    const getFileIcon = (ext) => {
      const icons = {
        '.md': '📝', '.json': '📋', '.js': '⚡', '.py': '🐍',
        '.html': '🌐', '.css': '🎨', '.txt': '📄', '.log': '📊'
      };
      return icons[ext] || '📄';
    };
    
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = Math.floor((now - date) / 1000);
      
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    };
    
    container.innerHTML = activity.slice(0, 10).map(file => `
      <div class="activity-item">
        <div class="activity-icon">${getFileIcon(file.extension)}</div>
        <div class="activity-content">
          <div class="activity-title">${file.name}</div>
          <div class="activity-meta">${file.relativePath}</div>
        </div>
        <div class="activity-time">${formatTime(file.modified)}</div>
      </div>
    `).join('');
  },
  
  /**
   * Load and display events
   */
  async loadEvents() {
    try {
      const events = await MC_API_V2.getEvents(20);
      this.renderEvents(events);
      return events;
    } catch (e) {
      console.error('Error loading events:', e);
      return [];
    }
  },
  
  /**
   * Render events feed
   */
  renderEvents(events) {
    const container = document.querySelector('.events-feed');
    if (!container) return;
    
    const getEventIcon = (type) => {
      if (type.startsWith('file:')) return '📁';
      if (type.startsWith('task:')) return '✓';
      return '●';
    };
    
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    container.innerHTML = events.slice(0, 15).map(event => `
      <div class="event-item" data-event-id="${event.id}">
        <span class="event-icon">${getEventIcon(event.type)}</span>
        <span class="event-type">${event.type}</span>
        <span class="event-time">${formatTime(event.timestamp)}</span>
      </div>
    `).join('');
  },
  
  /**
   * Update a stat card
   */
  updateStat(type, value, subtitle) {
    const cards = document.querySelectorAll('.stat-card');
    for (const card of cards) {
      const label = card.querySelector('.stat-label')?.textContent.toLowerCase();
      if (label && label.includes(type)) {
        const valueEl = card.querySelector('.stat-value');
        const changeEl = card.querySelector('.stat-change');
        if (valueEl) valueEl.textContent = value;
        if (changeEl) changeEl.innerHTML = `<span>●</span><span>${subtitle}</span>`;
        break;
      }
    }
  },
  
  /**
   * Start auto-refresh
   */
  startRefresh(intervalMs) {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    this.refreshInterval = setInterval(() => {
      console.log('🔄 Refreshing dashboard...');
      this.loadAgents();
      this.loadSystemStatus();
      this.loadTasks();
      this.loadFileActivity();
      this.loadEvents();
    }, intervalMs);
  },
  
  /**
   * Stop auto-refresh
   */
  stopRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  },
  
  // ==================== TASK MANAGEMENT ====================
  
  /**
   * Create new task
   */
  async createTask(description, options = {}) {
    try {
      const task = await MC_API_V2.createTask({
        description,
        priority: options.priority || 'P2',
        assignedTo: options.assignedTo || 'Unassigned',
        due: options.due || null,
        tags: options.tags || []
      });
      
      await this.loadTasks();
      return task;
    } catch (e) {
      console.error('Error creating task:', e);
      throw e;
    }
  },
  
  /**
   * Complete task
   */
  async completeTask(id) {
    try {
      await MC_API_V2.updateTask(id, { status: 'completed' });
      await this.loadTasks();
    } catch (e) {
      console.error('Error completing task:', e);
      throw e;
    }
  },
  
  /**
   * Assign task
   */
  async assignTask(id, agentId) {
    try {
      await MC_API_V2.assignTask(id, agentId, { autoStart: true });
      await this.loadTasks();
    } catch (e) {
      console.error('Error assigning task:', e);
      throw e;
    }
  }
};

// Auto-initialize
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MC_DASHBOARD_V2.init());
  } else {
    MC_DASHBOARD_V2.init();
  }
}

// Expose for debugging
if (typeof window !== 'undefined') {
  window.MC_API_V2 = MC_API_V2;
  window.MC_DASHBOARD_V2 = MC_DASHBOARD_V2;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MC_API_V2, MC_DASHBOARD_V2 };
}