/**
 * Mission Control Dashboard Data Bridge
 * 
 * Client-side script to fetch data from the API
 * and update the dashboard in real-time.
 */

const MC_API = {
  baseUrl: (typeof window !== 'undefined' && window.location.hostname === 'localhost') 
    ? 'http://localhost:3001' 
    : '',
  
  /**
   * Fetch JSON from API
   */
  async fetch(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`API Error: ${endpoint}`, error);
      return null;
    }
  },
  
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
   * Get agent activity
   */
  async getAgentActivity(id) {
    return this.fetch(`/api/agents/${id}/activity`);
  },
  
  /**
   * Get agent files
   */
  async getAgentFiles(id, path = '') {
    const query = path ? `?path=${encodeURIComponent(path)}` : '';
    return this.fetch(`/api/agents/${id}/files${query}`);
  },
  
  /**
   * Get system status
   */
  async getSystemStatus() {
    return this.fetch('/api/system/status');
  },
  
  /**
   * Get system logs
   */
  async getSystemLogs(limit = 50) {
    return this.fetch(`/api/system/logs?limit=${limit}`);
  },
  
  /**
   * Get activity feed
   */
  async getActivityFeed(limit = 20) {
    return this.fetch(`/api/system/activity?limit=${limit}`);
  },
  
  /**
   * Get tasks
   */
  async getTasks() {
    return this.fetch('/api/tasks');
  },
  
  /**
   * Browse files
   */
  async browseFiles(path = '') {
    const query = path ? `?path=${encodeURIComponent(path)}` : '';
    return this.fetch(`/api/files/browse${query}`);
  }
};

/**
 * Dashboard UI Updater
 */
const MC_DASHBOARD = {
  refreshInterval: null,
  
  /**
   * Initialize dashboard with live data
   */
  async init() {
    console.log('🚀 Initializing Mission Control Dashboard...');
    
    // Load initial data
    await this.loadAgents();
    await this.loadSystemStatus();
    await this.loadTasks();
    await this.loadActivity();
    await this.loadLogs();
    
    // Start auto-refresh
    this.startRefresh(30000); // 30 seconds
    
    console.log('✅ Dashboard initialized');
  },
  
  /**
   * Load and display agents
   */
  async loadAgents() {
    const agents = await MC_API.getAgents();
    if (!agents) return;
    
    // Update agent count stat
    const onlineCount = agents.filter(a => a.status === 'online' || a.status === 'operational').length;
    this.updateStat('agents', agents.length, `${onlineCount} online`);
    
    // Update agent list in UI
    this.renderAgentList(agents);
  },
  
  /**
   * Render agent list
   */
  renderAgentList(agents) {
    const container = document.querySelector('.agent-list');
    if (!container) return;
    
    // Get emoji/icon mapping
    const getAgentIcon = (role) => {
      const icons = {
        'Nexus': '◈',
        'Orchestrator': '◈',
        'Coder': '⚒️',
        'Researcher': '🔍',
        'Social': '📢',
        'Security': '🔒',
        'DevOps': '🛠️',
        'QA': '✅',
        'Writer': '✍️',
        'Designer': '🎨',
        'Marketing': '📈'
      };
      return icons[role] || '🤖';
    };
    
    const getAgentClass = (role) => {
      const classes = {
        'Nexus': 'nexus',
        'Orchestrator': 'nexus',
        'Coder': 'forge',
        'Researcher': 'scout',
        'Social': 'buzz',
        'Security': 'cipher',
        'DevOps': 'sentry'
      };
      return classes[role] || 'forge';
    };
    
    const getStatusClass = (status) => {
      if (status === 'online' || status === 'operational') return 'online';
      if (status === 'busy' || status === 'working') return 'busy';
      return 'offline';
    };
    
    const getStatusText = (status) => {
      if (status === 'online' || status === 'operational') return '● Online';
      if (status === 'busy' || status === 'working') return '● Working';
      return '● Offline';
    };
    
    container.innerHTML = agents.map(agent => `
      <div class="agent-row" data-agent-id="${agent.id}">
        <div class="agent-avatar ${getAgentClass(agent.role)}">
          <span>${getAgentIcon(agent.role)}</span>
          <div class="agent-status-indicator"></div>
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
        <span class="agent-status ${getStatusClass(agent.status)}">${getStatusText(agent.status)}</span>
      </div>
    `).join('');
    
    // Add click handlers
    container.querySelectorAll('.agent-row').forEach(row => {
      row.addEventListener('click', () => this.showAgentDetails(row.dataset.agentId));
    });
  },
  
  /**
   * Show agent details modal
   */
  async showAgentDetails(agentId) {
    const agent = await MC_API.getAgent(agentId);
    const activity = await MC_API.getAgentActivity(agentId);
    
    console.log('Agent details:', agent);
    console.log('Agent activity:', activity);
    
    // TODO: Show modal with agent details
    alert(`Agent: ${agent?.name || agentId}\nRole: ${agent?.role}\nStatus: ${agent?.status}`);
  },
  
  /**
   * Load and display system status
   */
  async loadSystemStatus() {
    const status = await MC_API.getSystemStatus();
    if (!status) return;
    
    // Update gateway status
    const gatewayStatus = status.system?.gatewayStatus || 'unknown';
    const statusPill = document.querySelector('.status-pill span:last-child');
    if (statusPill) {
      statusPill.textContent = gatewayStatus === 'running' 
        ? 'All Systems Online' 
        : `Gateway: ${gatewayStatus}`;
    }
    
    // Update session count if element exists
    if (status.sessions) {
      console.log(`Sessions: ${status.sessions.active}/${status.sessions.total} active`);
    }
  },
  
  /**
   * Load and display tasks
   */
  async loadTasks() {
    const tasks = await MC_API.getTasks();
    if (!tasks) return;
    
    const pendingCount = tasks.pending?.length || 0;
    const completedCount = tasks.completed?.length || 0;
    
    this.updateStat('pending', pendingCount, pendingCount === 0 ? 'Queue clear' : 'Pending');
    this.updateStat('tasks', completedCount, 'Total completed');
    
    // Update task list
    this.renderTaskList(tasks);
  },
  
  /**
   * Render task list
   */
  renderTaskList(tasks) {
    const container = document.querySelector('.task-list');
    if (!container) return;
    
    const allTasks = [
      ...(tasks.pending || []).map(t => ({ ...t, statusType: 'pending' })),
      ...(tasks.active || []).map(t => ({ ...t, statusType: 'running' }))
    ];
    
    if (allTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✨</div>
          <div>No pending tasks</div>
          <div style="font-size: 0.875rem; margin-top: 0.5rem;">All agents are standing by and ready for assignment</div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = allTasks.map(task => `
      <div class="task-item">
        <div class="task-priority ${(task.priority || 'P2').toLowerCase().replace('p', '')}"></div>
        <div class="task-content">
          <div class="task-title">${task.description || task.id}</div>
          <div class="task-meta">Assigned to: ${task.assignedTo} • ${task.priority || 'P2'}</div>
        </div>
        <span class="task-status ${task.statusType}">${task.status}</span>
      </div>
    `).join('');
  },
  
  /**
   * Load and display activity feed
   */
  async loadActivity() {
    const activities = await MC_API.getActivityFeed(10);
    if (!activities) return;
    
    this.renderActivityList(activities);
  },
  
  /**
   * Render activity list
   */
  renderActivityList(activities) {
    const container = document.querySelector('.activity-list');
    if (!container) return;
    
    const getActivityIcon = (type) => {
      const icons = {
        'memory': '📝',
        'log': '📄',
        'file': '📁',
        'task': '✅'
      };
      return icons[type] || '📌';
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
    
    container.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon">${getActivityIcon(activity.type)}</div>
        <div class="activity-content">
          <div class="activity-title">${activity.agentName} ${activity.type}</div>
          <div class="activity-meta">${activity.file || 'Activity recorded'}</div>
        </div>
        <div class="activity-time">${formatTime(activity.timestamp)}</div>
      </div>
    `).join('');
  },
  
  /**
   * Load and display system logs
   */
  async loadLogs() {
    const logs = await MC_API.getSystemLogs(20);
    if (!logs) return;
    
    this.renderTerminal(logs);
  },
  
  /**
   * Render terminal/logs
   */
  renderTerminal(logs) {
    const container = document.getElementById('terminal');
    if (!container) return;
    
    container.innerHTML = logs.map(log => `
      <div class="terminal-line">
        <span class="terminal-time">[${log.timestamp}]</span>
        <span class="terminal-agent">[${log.agent}]</span>
        <span class="terminal-level ${log.level.toLowerCase()}">${log.level}</span>
        <span class="terminal-msg">${log.message}</span>
      </div>
    `).join('');
    
    container.scrollTop = container.scrollHeight;
  },
  
  /**
   * Update a stat card
   */
  updateStat(type, value, subtitle) {
    // Find stat card by checking the label
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
      console.log('🔄 Refreshing dashboard data...');
      this.loadAgents();
      this.loadSystemStatus();
      this.loadTasks();
      this.loadActivity();
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
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MC_DASHBOARD.init());
} else {
  MC_DASHBOARD.init();
}

// Expose for debugging
window.MC_API = MC_API;
window.MC_DASHBOARD = MC_DASHBOARD;
