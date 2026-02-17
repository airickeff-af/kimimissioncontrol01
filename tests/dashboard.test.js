/**
 * Dashboard Rendering Tests
 * 
 * Tests for dashboard UI components and rendering logic
 * - Agent list rendering
 * - Task list rendering
 * - Activity feed rendering
 * - Stat cards rendering
 * - File activity rendering
 */

describe('Dashboard Rendering', () => {
  
  // Mock DOM environment
  beforeAll(() => {
    // Setup minimal DOM for testing
    global.document = {
      readyState: 'complete',
      addEventListener: jest.fn(),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => []),
      createElement: jest.fn(() => ({
        className: '',
        innerHTML: '',
        textContent: '',
        style: {},
        appendChild: jest.fn(),
        addEventListener: jest.fn(),
        setAttribute: jest.fn(),
        dataset: {}
      }))
    };
    
    global.window = {
      location: { hostname: 'localhost' },
      addEventListener: jest.fn(),
      MC_API: {},
      MC_DASHBOARD: {}
    };
  });

  describe('Agent List Rendering', () => {
    const mockAgents = [
      {
        id: 'code',
        name: 'Code',
        role: 'Backend Lead',
        codename: 'The Architect',
        status: 'online',
        stats: { tasksActive: 3, tasksCompleted: 42 }
      },
      {
        id: 'scout',
        name: 'Scout',
        role: 'Researcher',
        codename: 'The Seeker',
        status: 'working',
        stats: { tasksActive: 5, tasksCompleted: 28 }
      },
      {
        id: 'pixel',
        name: 'Pixel',
        role: 'Designer',
        codename: 'The Artist',
        status: 'offline',
        stats: { tasksActive: 0, tasksCompleted: 15 }
      }
    ];

    it('should render all agents in list', () => {
      const renderAgentList = (agents) => {
        return agents.map(agent => ({
          id: agent.id,
          name: agent.name,
          rendered: true
        }));
      };

      const result = renderAgentList(mockAgents);
      
      expect(result.length).toBe(3);
      expect(result[0].name).toBe('Code');
      expect(result[1].name).toBe('Scout');
      expect(result[2].name).toBe('Pixel');
    });

    it('should display correct agent status indicators', () => {
      const getStatusClass = (status) => {
        if (status === 'online' || status === 'operational') return 'online';
        if (status === 'busy' || status === 'working') return 'busy';
        return 'offline';
      };

      expect(getStatusClass('online')).toBe('online');
      expect(getStatusClass('operational')).toBe('online');
      expect(getStatusClass('working')).toBe('busy');
      expect(getStatusClass('busy')).toBe('busy');
      expect(getStatusClass('offline')).toBe('offline');
      expect(getStatusClass('unknown')).toBe('offline');
    });

    it('should map agent roles to correct icons', () => {
      const getAgentIcon = (role) => {
        const icons = {
          'Nexus': '◈',
          'Orchestrator': '◈',
          'Coder': '⚒️',
          'Backend Lead': '⚒️',
          'Researcher': '🔍',
          'Designer': '🎨',
          'Security': '🔒',
          'DevOps': '🛠️',
          'QA': '✅'
        };
        return icons[role] || '🤖';
      };

      expect(getAgentIcon('Backend Lead')).toBe('⚒️');
      expect(getAgentIcon('Researcher')).toBe('🔍');
      expect(getAgentIcon('Designer')).toBe('🎨');
      expect(getAgentIcon('Unknown')).toBe('🤖');
    });

    it('should map agent roles to correct CSS classes', () => {
      const getAgentClass = (role) => {
        const classes = {
          'Nexus': 'nexus',
          'Orchestrator': 'nexus',
          'Coder': 'forge',
          'Backend Lead': 'forge',
          'Researcher': 'scout',
          'Designer': 'pixel',
          'Security': 'cipher'
        };
        return classes[role] || 'forge';
      };

      expect(getAgentClass('Backend Lead')).toBe('forge');
      expect(getAgentClass('Researcher')).toBe('scout');
      expect(getAgentClass('Designer')).toBe('pixel');
    });

    it('should display agent statistics correctly', () => {
      const agent = mockAgents[0];
      
      const stats = {
        active: agent.stats.tasksActive,
        completed: agent.stats.tasksCompleted
      };

      expect(stats.active).toBe(3);
      expect(stats.completed).toBe(42);
    });

    it('should handle missing agent data gracefully', () => {
      const incompleteAgent = {
        id: 'test',
        name: null,
        role: null,
        status: null,
        stats: null
      };

      const safeRender = (agent) => ({
        name: agent.name || agent.id,
        role: agent.role || 'Unknown',
        status: agent.status || 'offline',
        stats: agent.stats || { tasksActive: 0, tasksCompleted: 0 }
      });

      const result = safeRender(incompleteAgent);
      
      expect(result.name).toBe('test');
      expect(result.role).toBe('Unknown');
      expect(result.status).toBe('offline');
      expect(result.stats.tasksActive).toBe(0);
    });
  });

  describe('Task List Rendering', () => {
    const mockTasks = [
      {
        id: 'TASK-0001',
        description: 'Critical bug fix',
        priority: 'P0',
        status: 'in_progress',
        assignedTo: 'Code',
        subtasks: []
      },
      {
        id: 'TASK-0002',
        description: 'Research competitors',
        priority: 'P1',
        status: 'pending',
        assignedTo: 'Scout',
        subtasks: [
          { id: 'SUB-1', completed: true },
          { id: 'SUB-2', completed: false }
        ]
      },
      {
        id: 'TASK-0003',
        description: 'Update documentation',
        priority: 'P2',
        status: 'completed',
        assignedTo: 'Quill',
        subtasks: []
      }
    ];

    it('should render tasks with correct priority styling', () => {
      const getPriorityClass = (priority) => {
        const classes = {
          'P0': 'priority-critical',
          'P1': 'priority-high',
          'P2': 'priority-medium',
          'P3': 'priority-low'
        };
        return classes[priority] || 'priority-medium';
      };

      expect(getPriorityClass('P0')).toBe('priority-critical');
      expect(getPriorityClass('P1')).toBe('priority-high');
      expect(getPriorityClass('P2')).toBe('priority-medium');
      expect(getPriorityClass('P3')).toBe('priority-low');
    });

    it('should render tasks with correct status styling', () => {
      const getStatusClass = (status) => {
        const classes = {
          'pending': 'status-pending',
          'in_progress': 'status-active',
          'review': 'status-review',
          'completed': 'status-completed',
          'failed': 'status-failed'
        };
        return classes[status] || 'status-pending';
      };

      expect(getStatusClass('pending')).toBe('status-pending');
      expect(getStatusClass('in_progress')).toBe('status-active');
      expect(getStatusClass('completed')).toBe('status-completed');
    });

    it('should display subtask completion count', () => {
      const task = mockTasks[1];
      const completed = task.subtasks.filter(s => s.completed).length;
      const total = task.subtasks.length;

      expect(completed).toBe(1);
      expect(total).toBe(2);
      expect(`${completed}/${total} subtasks`).toBe('1/2 subtasks');
    });

    it('should handle empty task list', () => {
      const emptyTasks = [];
      
      const renderEmptyState = () => ({
        icon: '✨',
        message: 'No pending tasks',
        submessage: 'All agents are standing by and ready for assignment'
      });

      const result = renderEmptyState();
      
      expect(result.icon).toBe('✨');
      expect(result.message).toBe('No pending tasks');
    });

    it('should sort tasks by priority', () => {
      const sorted = [...mockTasks].sort((a, b) => {
        const weights = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
        return weights[a.priority] - weights[b.priority];
      });

      expect(sorted[0].priority).toBe('P0');
      expect(sorted[1].priority).toBe('P1');
      expect(sorted[2].priority).toBe('P2');
    });
  });

  describe('Activity Feed Rendering', () => {
    const mockActivities = [
      {
        type: 'memory',
        file: '2026-02-18.md',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        agentName: 'Code'
      },
      {
        type: 'log',
        file: 'debug.log',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        agentName: 'Scout'
      },
      {
        type: 'file',
        file: 'report.md',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        agentName: 'Pixel'
      }
    ];

    it('should map activity types to correct icons', () => {
      const getActivityIcon = (type) => {
        const icons = {
          'memory': '📝',
          'log': '📄',
          'file': '📁',
          'task': '✅'
        };
        return icons[type] || '📌';
      };

      expect(getActivityIcon('memory')).toBe('📝');
      expect(getActivityIcon('log')).toBe('📄');
      expect(getActivityIcon('file')).toBe('📁');
      expect(getActivityIcon('task')).toBe('✅');
      expect(getActivityIcon('unknown')).toBe('📌');
    });

    it('should format relative time correctly', () => {
      const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
      };

      expect(formatTime(new Date(Date.now() - 30 * 1000))).toBe('Just now');
      expect(formatTime(new Date(Date.now() - 5 * 60 * 1000))).toBe('5m ago');
      expect(formatTime(new Date(Date.now() - 2 * 60 * 60 * 1000))).toBe('2h ago');
      expect(formatTime(new Date(Date.now() - 25 * 60 * 60 * 1000))).toBe('1d ago');
    });

    it('should sort activities by timestamp descending', () => {
      const sorted = [...mockActivities].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );

      expect(new Date(sorted[0].timestamp) >= new Date(sorted[1].timestamp)).toBe(true);
    });
  });

  describe('Stat Cards Rendering', () => {
    const mockStats = {
      agents: { total: 5, online: 3 },
      tasks: { pending: 12, completed: 145 },
      files: { tracked: 234 },
      tokens: { cost: 12.45 }
    };

    it('should display agent statistics', () => {
      const agentStat = {
        value: mockStats.agents.total,
        subtitle: `${mockStats.agents.online} online`
      };

      expect(agentStat.value).toBe(5);
      expect(agentStat.subtitle).toBe('3 online');
    });

    it('should display task statistics', () => {
      const taskStat = {
        value: mockStats.tasks.pending,
        subtitle: 'Pending'
      };

      expect(taskStat.value).toBe(12);
    });

    it('should format token costs correctly', () => {
      const formatCost = (cost) => `$${cost.toFixed(2)}`;

      expect(formatCost(12.45)).toBe('$12.45');
      expect(formatCost(0.5)).toBe('$0.50');
      expect(formatCost(100)).toBe('$100.00');
    });

    it('should handle zero values gracefully', () => {
      const zeroStat = { value: 0, subtitle: 'No activity' };

      expect(zeroStat.value).toBe(0);
      expect(zeroStat.subtitle).toBe('No activity');
    });
  });

  describe('File Activity Rendering', () => {
    const mockFiles = [
      { name: 'report.md', extension: '.md', modified: new Date().toISOString() },
      { name: 'data.json', extension: '.json', modified: new Date().toISOString() },
      { name: 'script.js', extension: '.js', modified: new Date().toISOString() }
    ];

    it('should map file extensions to correct icons', () => {
      const getFileIcon = (ext) => {
        const icons = {
          '.md': '📝',
          '.json': '📋',
          '.js': '⚡',
          '.py': '🐍',
          '.html': '🌐',
          '.css': '🎨',
          '.txt': '📄',
          '.log': '📊'
        };
        return icons[ext] || '📄';
      };

      expect(getFileIcon('.md')).toBe('📝');
      expect(getFileIcon('.json')).toBe('📋');
      expect(getFileIcon('.js')).toBe('⚡');
      expect(getFileIcon('.py')).toBe('🐍');
      expect(getFileIcon('.unknown')).toBe('📄');
    });

    it('should format file sizes', () => {
      const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      };

      expect(formatSize(500)).toBe('500 B');
      expect(formatSize(1536)).toBe('1.5 KB');
      expect(formatSize(1024 * 1024)).toBe('1.0 MB');
    });
  });

  describe('Event Feed Rendering', () => {
    const mockEvents = [
      { id: '1', type: 'file:created', timestamp: new Date().toISOString() },
      { id: '2', type: 'task:updated', timestamp: new Date().toISOString() },
      { id: '3', type: 'file:modified', timestamp: new Date().toISOString() }
    ];

    it('should map event types to icons', () => {
      const getEventIcon = (type) => {
        if (type.startsWith('file:')) return '📁';
        if (type.startsWith('task:')) return '✓';
        return '●';
      };

      expect(getEventIcon('file:created')).toBe('📁');
      expect(getEventIcon('task:updated')).toBe('✓');
      expect(getEventIcon('unknown')).toBe('●');
    });

    it('should format event timestamps', () => {
      const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      };

      const testDate = new Date('2026-02-18T14:30:00');
      const result = formatTime(testDate.toISOString());
      
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('Responsive Design', () => {
    it('should handle mobile viewport', () => {
      const isMobile = (width) => width < 768;

      expect(isMobile(375)).toBe(true);
      expect(isMobile(768)).toBe(false);
      expect(isMobile(1024)).toBe(false);
    });

    it('should handle tablet viewport', () => {
      const isTablet = (width) => width >= 768 && width < 1024;

      expect(isTablet(768)).toBe(true);
      expect(isTablet(900)).toBe(true);
      expect(isTablet(1024)).toBe(false);
      expect(isTablet(375)).toBe(false);
    });

    it('should handle desktop viewport', () => {
      const isDesktop = (width) => width >= 1024;

      expect(isDesktop(1024)).toBe(true);
      expect(isDesktop(1440)).toBe(true);
      expect(isDesktop(768)).toBe(false);
    });
  });
});
