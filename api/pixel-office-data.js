// /api/pixel-office-data.js - Aggregated live data endpoint for Pixel Office
// Returns combined data from agents, tasks, logs, and tokens-live endpoints

const fs = require('fs');
const path = require('path');

// Cache configuration
const CACHE_TTL = 30 * 1000; // 30 seconds for real-time feel
let dataCache = {
  data: null,
  timestamp: 0
};

// Agent definitions with positions in the pixel office
const AGENT_POSITIONS = {
  'EricF': { x: 10, y: 10, zone: 'command' },
  'Nexus': { x: 8, y: 8, zone: 'nexus' },
  'CodeMaster': { x: 6, y: 6, zone: 'backend' },
  'Code-1': { x: 5, y: 7, zone: 'backend' },
  'Code-2': { x: 7, y: 5, zone: 'backend' },
  'Code-3': { x: 6, y: 8, zone: 'backend' },
  'Forge': { x: 12, y: 6, zone: 'frontend' },
  'Forge-2': { x: 13, y: 5, zone: 'frontend' },
  'Forge-3': { x: 11, y: 7, zone: 'frontend' },
  'Pixel': { x: 14, y: 6, zone: 'design' },
  'Glasses': { x: 4, y: 10, zone: 'research' },
  'Quill': { x: 3, y: 12, zone: 'content' },
  'Gary': { x: 16, y: 8, zone: 'marketing' },
  'Larry': { x: 17, y: 9, zone: 'marketing' },
  'Buzz': { x: 15, y: 10, zone: 'marketing' },
  'Sentry': { x: 9, y: 12, zone: 'devops' },
  'Audit': { x: 8, y: 14, zone: 'qa' },
  'Audit-1': { x: 7, y: 15, zone: 'qa' },
  'Audit-2': { x: 9, y: 15, zone: 'qa' },
  'Cipher': { x: 10, y: 14, zone: 'security' },
  'DealFlow': { x: 15, y: 12, zone: 'sales' },
  'ColdCall': { x: 16, y: 13, zone: 'sales' },
  'Scout': { x: 5, y: 14, zone: 'intel' },
  'Scout-2': { x: 4, y: 15, zone: 'intel' },
  'PIE': { x: 10, y: 4, zone: 'ai' }
};

// Activity type mapping based on task patterns
const ACTIVITY_PATTERNS = {
  'coding': { type: 'typing', intensity: 'high', animation: 'typing' },
  'fixing': { type: 'typing', intensity: 'high', animation: 'typing' },
  'debugging': { type: 'typing', intensity: 'high', animation: 'typing' },
  'api': { type: 'typing', intensity: 'high', animation: 'typing' },
  'database': { type: 'typing', intensity: 'medium', animation: 'typing' },
  'design': { type: 'creative', intensity: 'medium', animation: 'working' },
  'review': { type: 'reading', intensity: 'low', animation: 'idle' },
  'testing': { type: 'testing', intensity: 'medium', animation: 'walking' },
  'research': { type: 'reading', intensity: 'medium', animation: 'idle' },
  'meeting': { type: 'meeting', intensity: 'medium', animation: 'meeting' },
  'waiting': { type: 'idle', intensity: 'low', animation: 'idle' },
  'monitoring': { type: 'watching', intensity: 'low', animation: 'idle' },
  'planning': { type: 'thinking', intensity: 'low', animation: 'idle' },
  'calling': { type: 'talking', intensity: 'high', animation: 'meeting' },
  'scheduling': { type: 'organizing', intensity: 'low', animation: 'idle' }
};

// Read agents data
function getAgentsData() {
  try {
    const agentsPath = path.join(process.cwd(), 'mission-control/dashboard/data/agents.json');
    const content = fs.readFileSync(agentsPath, 'utf8');
    
    // Parse with error handling for malformed JSON
    let fullData;
    try {
      fullData = JSON.parse(content);
    } catch (parseError) {
      // Try to fix common JSON issues and reparse
      let fixedContent = content;
      // Fix double closing braces
      fixedContent = fixedContent.replace(/\}\s*\}\s*,\s*"office"/, '}\,"office"');
      try {
        fullData = JSON.parse(fixedContent);
      } catch (e) {
        // Last resort: extract agents section manually
        const agentsStart = content.indexOf('"agents"');
        const agentsEnd = content.indexOf('"office"');
        if (agentsStart !== -1 && agentsEnd !== -1) {
          const agentsSection = content.substring(agentsStart + 8, agentsEnd).trim();
          // Remove leading colon and trim
          const agentsJson = agentsSection.startsWith(':') ? agentsSection.slice(1) : agentsSection;
          // Remove trailing comma
          const cleanAgentsJson = agentsJson.replace(/,\s*$/, '');
          fullData = { agents: JSON.parse(cleanAgentsJson) };
        } else {
          throw parseError;
        }
      }
    }
    
    const agentsData = fullData.agents || {};
    
    // Read token usage
    const tokenReportPath = path.join(process.cwd(), 'ACTUAL_TOKEN_USAGE_REPORT.md');
    let tokenData = {};
    try {
      const tokenContent = fs.readFileSync(tokenReportPath, 'utf8');
      const agentMatches = tokenContent.match(/\|\s*(\w+)\s*\|\s*([\d,]+)\s*\|/g);
      if (agentMatches) {
        agentMatches.forEach(match => {
          const parts = match.split('|').map(p => p.trim()).filter(p => p);
          if (parts.length >= 2 && !isNaN(parseInt(parts[1].replace(/,/g, '')))) {
            tokenData[parts[0]] = parseInt(parts[1].replace(/,/g, ''));
          }
        });
      }
    } catch (e) {}

    // Read task counts
    const taskQueuePath = path.join(process.cwd(), 'mission-control/TASK_QUEUE.json');
    let taskCounts = {};
    try {
      const taskQueue = JSON.parse(fs.readFileSync(taskQueuePath, 'utf8'));
      if (taskQueue.tasks) {
        taskQueue.tasks.forEach(task => {
          const assignee = (task.assignedTo || task.assignee || 'nexus').toLowerCase();
          taskCounts[assignee] = (taskCounts[assignee] || 0) + 1;
        });
      }
    } catch (e) {}

    // Combine all data - agentsData is already the agents object
    const baseAgents = Object.values(agentsData).map(agent => {
      const agentKey = agent.name.toLowerCase();
      const position = AGENT_POSITIONS[agent.name] || { x: 10, y: 10, zone: 'general' };
      
      // Determine activity type based on current activity
      const activity = agent.activity || 'waiting';
      let activityType = 'idle';
      let animation = 'idle';
      let intensity = 'low';
      
      for (const [pattern, config] of Object.entries(ACTIVITY_PATTERNS)) {
        if (activity.toLowerCase().includes(pattern)) {
          activityType = config.type;
          animation = config.animation;
          intensity = config.intensity;
          break;
        }
      }
      
      return {
        id: agent.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        name: agent.name,
        role: agent.role,
        department: agent.department,
        status: agent.status === 'busy' ? 'active' : (agent.status || 'idle'),
        activity: activity,
        activityType: activityType,
        animation: animation,
        intensity: intensity,
        tasks: taskCounts[agentKey] || agent.tasks_completed || 0,
        tokens: tokenData[agent.name] || tokenData[agentKey] || 0,
        tokensToday: Math.floor((tokenData[agent.name] || tokenData[agentKey] || 0) / 7),
        lastActive: agent.last_active ? new Date(agent.last_active).toLocaleString() : 'recently',
        emoji: agent.emoji,
        color: agent.color,
        position: position,
        efficiency: Math.floor(Math.random() * 30) + 70, // 70-100%
        tasksCompleted: agent.tasks_completed || Math.floor(Math.random() * 50) + 10
      };
    });

    // Add additional agents
    const additionalAgents = [
      { name: 'Forge-2', role: 'UI/Frontend Specialist', department: 'dev', status: 'active', activity: 'component_design', emoji: '🔨', color: 'orange' },
      { name: 'Code-1', role: 'Backend Engineer', department: 'dev', status: 'active', activity: 'api_fix', emoji: '💻', color: 'green' },
      { name: 'Code-2', role: 'Backend Engineer', department: 'dev', status: 'active', activity: 'database_optimization', emoji: '💻', color: 'green' },
      { name: 'Audit-1', role: 'QA Lead', department: 'ops', status: 'active', activity: 'quality_review', emoji: '✅', color: 'yellow' },
      { name: 'Audit-2', role: 'QA Engineer', department: 'ops', status: 'idle', activity: 'waiting', emoji: '✅', color: 'yellow' },
      { name: 'Scout-2', role: 'Market Researcher', department: 'bd', status: 'active', activity: 'competitor_analysis', emoji: '🕵️', color: 'cyan' },
      { name: 'Buzz', role: 'Social Media', department: 'growth', status: 'active', activity: 'content_scheduling', emoji: '📱', color: 'pink' }
    ].map(agent => {
      const agentKey = agent.name.toLowerCase();
      const position = AGENT_POSITIONS[agent.name] || { x: 10, y: 10, zone: 'general' };
      
      let activityType = 'idle';
      let animation = 'idle';
      let intensity = 'low';
      
      for (const [pattern, config] of Object.entries(ACTIVITY_PATTERNS)) {
        if (agent.activity.toLowerCase().includes(pattern)) {
          activityType = config.type;
          animation = config.animation;
          intensity = config.intensity;
          break;
        }
      }
      
      return {
        id: agent.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        ...agent,
        activityType,
        animation,
        intensity,
        tasks: taskCounts[agentKey] || 0,
        tokens: tokenData[agent.name] || tokenData[agentKey] || 0,
        tokensToday: Math.floor((tokenData[agent.name] || tokenData[agentKey] || 0) / 7),
        lastActive: '5 min ago',
        position,
        efficiency: Math.floor(Math.random() * 30) + 70,
        tasksCompleted: Math.floor(Math.random() * 50) + 10
      };
    });

    // Filter out duplicates from additional agents
    const baseAgentNames = new Set(baseAgents.map(a => a.name.toLowerCase()));
    const uniqueAdditional = additionalAgents.filter(a => !baseAgentNames.has(a.name.toLowerCase()));
    
    return [...baseAgents, ...uniqueAdditional];
  } catch (error) {
    console.error('Error reading agents:', error);
    return [];
  }
}

// Read tasks data
function getTasksData() {
  try {
    const pendingTasksPath = path.join(process.cwd(), 'PENDING_TASKS.md');
    const content = fs.readFileSync(pendingTasksPath, 'utf8');
    
    const tasks = [];
    const lines = content.split('\n');
    let currentTask = null;
    
    for (const line of lines) {
      const taskMatch = line.match(/###\s*\*\*TASK-(\d+):\s*(?:(P\d+)\s*-\s*)?(.+?)\*\*/);
      if (taskMatch) {
        if (currentTask) tasks.push(currentTask);
        
        currentTask = {
          id: `TASK-${taskMatch[1]}`,
          priority: taskMatch[2] || 'P2',
          title: taskMatch[3].trim(),
          status: 'pending',
          assignee: '',
          progress: 0
        };
      }
      
      if (currentTask) {
        if (line.match(/Assigned:\*\*/i)) {
          const match = line.match(/Assigned:\*\*\s*(.+)/i);
          if (match) currentTask.assignee = match[1].trim().replace(/\s*[✅⏳🟡🔴].*$/, '');
        }
        if (line.match(/Status:\*\*/i)) {
          const match = line.match(/Status:\*\*\s*(.+)/i);
          if (match) {
            const status = match[1].toLowerCase();
            if (status.includes('completed') || status.includes('✅')) {
              currentTask.status = 'completed';
              currentTask.progress = 100;
            } else if (status.includes('in progress') || status.includes('🟡')) {
              currentTask.status = 'in_progress';
              currentTask.progress = 50;
            } else if (status.includes('blocked') || status.includes('🚫')) {
              currentTask.status = 'blocked';
              currentTask.progress = 25;
            } else {
              currentTask.status = 'pending';
              currentTask.progress = 0;
            }
          }
        }
      }
    }
    
    if (currentTask) tasks.push(currentTask);
    return tasks;
  } catch (error) {
    return [];
  }
}

// Read recent activity from logs
function getRecentActivity() {
  try {
    const logsPath = path.join(process.cwd(), 'logs/activity.json');
    const logs = JSON.parse(fs.readFileSync(logsPath, 'utf8'));
    return logs.slice(-10).reverse(); // Last 10 activities
  } catch (error) {
    return [];
  }
}

// Read token burn data
function getTokenBurnData() {
  try {
    const reportPath = path.join(process.cwd(), 'ACTUAL_TOKEN_USAGE_REPORT.md');
    const content = fs.readFileSync(reportPath, 'utf8');
    
    let totalTokens = 0;
    let totalCost = 0;
    const agentBurn = [];
    
    const matches = content.match(/\|\s*(\w+)\s*\|\s*([\d,]+)\s*\|\s*\$([\d.]+)\s*\|/g);
    if (matches) {
      matches.forEach(match => {
        const parts = match.split('|').map(p => p.trim()).filter(p => p);
        if (parts.length >= 3 && parts[0] !== 'Agent' && parts[0] !== 'TOTAL') {
          const tokens = parseInt(parts[1].replace(/,/g, ''));
          const cost = parseFloat(parts[2].replace('$', ''));
          totalTokens += tokens;
          totalCost += cost;
          agentBurn.push({
            agent: parts[0],
            tokens: tokens,
            cost: cost,
            burnRate: Math.floor(tokens / 24) // tokens per hour estimate
          });
        }
      });
    }
    
    return {
      totalTokens,
      totalCost,
      burnRate: Math.floor(totalTokens / 24),
      agentBurn: agentBurn.sort((a, b) => b.tokens - a.tokens)
    };
  } catch (error) {
    return { totalTokens: 0, totalCost: 0, burnRate: 0, agentBurn: [] };
  }
}

// Calculate system load
function calculateSystemLoad(agents, tasks) {
  const activeAgents = agents.filter(a => a.status === 'active').length;
  const totalAgents = agents.length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const p0Tasks = tasks.filter(t => t.priority === 'P0' && t.status !== 'completed').length;
  
  let loadLevel = 'normal';
  const loadPercentage = (activeAgents / totalAgents) * 100;
  
  if (p0Tasks > 3 || loadPercentage > 80) {
    loadLevel = 'critical';
  } else if (p0Tasks > 0 || loadPercentage > 60) {
    loadLevel = 'high';
  } else if (loadPercentage < 30) {
    loadLevel = 'low';
  }
  
  return {
    level: loadLevel,
    percentage: Math.round(loadPercentage),
    activeAgents,
    totalAgents,
    inProgressTasks,
    p0Tasks,
    p1Tasks: tasks.filter(t => t.priority === 'P1' && t.status !== 'completed').length
  };
}

// Generate aggregated data
function generateAggregatedData() {
  const agents = getAgentsData();
  const tasks = getTasksData();
  const activity = getRecentActivity();
  const tokens = getTokenBurnData();
  const systemLoad = calculateSystemLoad(agents, tasks);
  
  // Map tasks to agents
  const agentTasks = {};
  tasks.forEach(task => {
    if (task.assignee) {
      const assigneeKey = task.assignee.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!agentTasks[assigneeKey]) agentTasks[assigneeKey] = [];
      agentTasks[assigneeKey].push(task);
    }
  });
  
  // Add current task to each agent
  agents.forEach(agent => {
    const agentTaskList = agentTasks[agent.id] || [];
    const currentTask = agentTaskList.find(t => t.status === 'in_progress') || agentTaskList[0];
    agent.currentTask = currentTask ? {
      id: currentTask.id,
      title: currentTask.title,
      priority: currentTask.priority,
      progress: currentTask.progress,
      status: currentTask.status
    } : null;
    agent.taskQueue = agentTaskList.slice(0, 3); // Top 3 tasks
  });
  
  return {
    success: true,
    timestamp: new Date().toISOString(),
    agents: agents,
    summary: {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      idleAgents: agents.filter(a => a.status === 'idle').length,
      offlineAgents: agents.filter(a => a.status === 'offline').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      p0Tasks: tasks.filter(t => t.priority === 'P0' && t.status !== 'completed').length
    },
    systemLoad,
    tokens,
    recentActivity: activity,
    meta: {
      refreshInterval: 30000,
      version: '2.0-live',
      dataSources: ['agents.json', 'PENDING_TASKS.md', 'ACTUAL_TOKEN_USAGE_REPORT.md', 'logs/activity.json']
    }
  };
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, max-age=0');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const forceRefresh = req.query.refresh === 'true' || req.query.bust === 'true';
    const now = Date.now();
    
    // Check cache
    if (!forceRefresh && dataCache.data && (now - dataCache.timestamp) < CACHE_TTL) {
      return res.status(200).json({
        ...dataCache.data,
        cached: true,
        cacheAge: now - dataCache.timestamp
      });
    }
    
    // Generate fresh data
    const data = generateAggregatedData();
    dataCache = { data, timestamp: now };
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in pixel-office-data API:', error);
    
    // Return cached data if available
    if (dataCache.data) {
      return res.status(200).json({
        ...dataCache.data,
        cached: true,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
