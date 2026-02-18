/**
 * Mission Control Dashboard API - Enhanced Server
 * 
 * Backend API with File Watcher and Task Queue services
 * Integrates with Code's main API for unified Mission Control experience
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');

// Import services
const FileWatcher = require('./fileWatcher');
const TaskQueue = require('./taskQueue');
const tokenTracker = require('../../api/tokens');
const { startWebSocketServer } = require('../../api/websocket-integration');

// Configuration
const CONFIG = {
  port: process.env.MC_API_PORT || 3001,
  workspaceRoot: '/root/.openclaw/workspace',
  missionControlDir: '/root/.openclaw/workspace/mission-control',
  agentsDir: '/root/.openclaw/workspace/mission-control/agents',
  logsDir: '/root/.openclaw/workspace/mission-control/logs'
};

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Initialize services
const fileWatcher = new FileWatcher({
  workspaceRoot: CONFIG.workspaceRoot,
  agentsDir: CONFIG.agentsDir
});

const taskQueue = new TaskQueue({
  workspaceRoot: CONFIG.workspaceRoot,
  missionControlDir: CONFIG.missionControlDir
});

// Event log for real-time updates
const eventLog = [];
const MAX_EVENTS = 100;

function logEvent(type, data) {
  const event = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    type,
    data,
    timestamp: new Date().toISOString()
  };
  
  eventLog.unshift(event);
  if (eventLog.length > MAX_EVENTS) {
    eventLog.pop();
  }
  
  return event;
}

// Set up event listeners
fileWatcher.on('fileCreated', (data) => {
  logEvent('file:created', data);
  console.log(`📄 New file: ${data.relativePath}`);
});

fileWatcher.on('fileModified', (data) => {
  logEvent('file:modified', data);
  console.log(`📝 Modified: ${data.relativePath}`);
});

fileWatcher.on('fileDeleted', (data) => {
  logEvent('file:deleted', data);
  console.log(`🗑️  Deleted: ${data.relativePath}`);
});

taskQueue.on('taskCreated', (data) => {
  logEvent('task:created', data);
});

taskQueue.on('taskUpdated', (data) => {
  logEvent('task:updated', data);
});

taskQueue.on('taskCompleted', (data) => {
  logEvent('task:completed', data);
});

taskQueue.on('statusChanged', (data) => {
  logEvent('task:statusChanged', data);
});

/**
 * Parse request body
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

/**
 * Parse SOUL.md to extract agent identity
 */
function parseSoulMd(content) {
  const identity = {
    name: null,
    role: null,
    codename: null,
    division: null,
    specialties: [],
    status: 'unknown'
  };
  
  const nameMatch = content.match(/\*\*Name:\*\*\s*(.+)/i) || 
                    content.match(/Name:\s*(.+)/i) ||
                    content.match(/^#\s+(.+?)\s+[-–]/m);
  if (nameMatch) identity.name = nameMatch[1].trim();
  
  const roleMatch = content.match(/\*\*Role:\*\*\s*(.+)/i) ||
                    content.match(/Role:\s*(.+)/i);
  if (roleMatch) identity.role = roleMatch[1].trim();
  
  const codenameMatch = content.match(/\*\*Codename:\*\*\s*"(.+)"/i) ||
                       content.match(/Codename:\s*"(.+)"/i);
  if (codenameMatch) identity.codename = codenameMatch[1].trim();
  
  const divisionMatch = content.match(/\*\*Division:\*\*\s*(.+)/i) ||
                       content.match(/Division:\s*(.+)/i);
  if (divisionMatch) identity.division = divisionMatch[1].trim();
  
  const specialtiesMatch = content.match(/\*\*Specialties\*\*[:\s]*\n((?:- .+\n)+)/i);
  if (specialtiesMatch) {
    identity.specialties = specialtiesMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());
  }
  
  return identity;
}

/**
 * Get all agents with their status
 */
function getAgents() {
  const agents = [];
  
  try {
    const agentDirs = fs.readdirSync(CONFIG.agentsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const agentId of agentDirs) {
      const agentPath = path.join(CONFIG.agentsDir, agentId);
      const soulPath = path.join(agentPath, 'SOUL.md');
      const statePath = path.join(agentPath, 'state.json');
      
      let agent = {
        id: agentId,
        name: agentId,
        role: 'Unknown',
        codename: null,
        division: null,
        specialties: [],
        status: 'offline',
        lastActive: null,
        stats: {
          tasksCompleted: 0,
          tasksActive: 0
        }
      };
      
      if (fs.existsSync(soulPath)) {
        const soulContent = fs.readFileSync(soulPath, 'utf-8');
        const identity = parseSoulMd(soulContent);
        agent = { ...agent, ...identity };
      }
      
      if (fs.existsSync(statePath)) {
        try {
          const stateContent = fs.readFileSync(statePath, 'utf-8');
          const state = JSON.parse(stateContent);
          agent.status = state.status || agent.status;
          agent.lastActive = state.lastActive || state.lastUpdated;
          if (state.stats) {
            agent.stats = { ...agent.stats, ...state.stats };
          }
          if (state.active_projects) {
            agent.stats.tasksActive = state.active_projects.length;
          }
        } catch (e) {
          console.error(`Error parsing state for ${agentId}:`, e.message);
        }
      }
      
      agents.push(agent);
    }
  } catch (e) {
    console.error('Error reading agents:', e.message);
  }
  
  return agents;
}

/**
 * Get specific agent details
 */
function getAgent(agentId) {
  const agents = getAgents();
  return agents.find(a => a.id === agentId || a.name?.toLowerCase() === agentId.toLowerCase());
}

/**
 * Get agent files from file watcher
 */
function getAgentFiles(agentId, subPath = '') {
  return fileWatcher.getAgentFiles(agentId, { type: 'all' });
}

/**
 * Get system status
 */
function getSystemStatus() {
  const sentryPath = path.join(CONFIG.agentsDir, 'sentry', 'state.json');
  
  let status = {
    system: { gatewayStatus: 'unknown' },
    sessions: { total: 0, active: 0 },
    agents: { deployed: [], pending: [] },
    alerts: [],
    fileWatcher: fileWatcher.getStatus(),
    taskQueue: taskQueue.getSummary()
  };
  
  if (fs.existsSync(sentryPath)) {
    try {
      const content = fs.readFileSync(sentryPath, 'utf-8');
      const sentryData = JSON.parse(content);
      status.system = sentryData.system || status.system;
      status.sessions = sentryData.sessions || status.sessions;
      status.agents = sentryData.agents || status.agents;
      status.alerts = sentryData.alerts || [];
    } catch (e) {
      console.error('Error reading system status:', e.message);
    }
  }
  
  return status;
}

/**
 * Get token usage data - LIVE from session transcripts
 */
function getTokens() {
  const data = tokenTracker.getTokenData();
  
  return {
    lastUpdated: data.lastUpdated,
    totalTokens: data.total.totalTokens,
    totalCost: data.total.cost,
    period: 'all',
    agents: data.agents.map(a => ({
      name: a.name,
      emoji: getAgentEmoji(a.name),
      role: getAgentRole(a.name),
      tokens: a.totalTokens,
      tokensIn: a.tokensIn,
      tokensOut: a.tokensOut,
      cost: a.cost,
      color: getAgentColor(a.name),
      sessions: a.sessions
    })),
    summary: {
      today: { 
        cost: data.total.cost, 
        tokens: data.total.totalTokens 
      }
    },
    dailyUsage: data.dailyUsage,
    recentSessions: data.recentSessions,
    meta: {
      sessionCount: data.sessionCount,
      agentCount: data.agents.length
    }
  };
}

/**
 * Get leads data - LIVE from scored-leads-v2.json
 */
function getLeads() {
  const leadsPath = path.join(CONFIG.missionControlDir, 'data', 'scored-leads-v2.json');
  
  try {
    if (fs.existsSync(leadsPath)) {
      const content = fs.readFileSync(leadsPath, 'utf-8');
      const data = JSON.parse(content);
      return {
        success: true,
        ...data,
        lastUpdated: data.summary?.scoredAt || new Date().toISOString()
      };
    }
  } catch (e) {
    console.error('Error reading leads data:', e.message);
  }
  
  // Fallback to leads.json if scored-leads-v2.json doesn't exist
  const fallbackPath = path.join(CONFIG.missionControlDir, 'data', 'leads.json');
  try {
    if (fs.existsSync(fallbackPath)) {
      const content = fs.readFileSync(fallbackPath, 'utf-8');
      const data = JSON.parse(content);
      return {
        success: true,
        scoredLeads: data.leads || [],
        summary: {
          totalLeads: data.leads?.length || 0,
          averageScore: data.averageScore || 0,
          tierDistribution: data.tierDistribution || {},
          scoredAt: new Date().toISOString()
        },
        lastUpdated: new Date().toISOString()
      };
    }
  } catch (e) {
    console.error('Error reading fallback leads data:', e.message);
  }
  
  return {
    success: false,
    error: 'No leads data available',
    scoredLeads: [],
    summary: {
      totalLeads: 0,
      averageScore: 0,
      tierDistribution: {},
      scoredAt: new Date().toISOString()
    },
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Get activity logs from session transcripts and agent activities
 * Returns structured log entries for the logs-view.html frontend
 */
function getActivityLogs(limit = 100) {
  const logs = [];
  
  // Scan for session transcript files
  const memoryDir = path.join(CONFIG.workspaceRoot, 'memory');
  if (fs.existsSync(memoryDir)) {
    try {
      const files = fs.readdirSync(memoryDir)
        .filter(f => f.endsWith('.json') || f.endsWith('.md'))
        .sort()
        .reverse()
        .slice(0, 50); // Limit files to scan
      
      for (const file of files) {
        const filePath = path.join(memoryDir, file);
        try {
          const stat = fs.statSync(filePath);
          const content = fs.readFileSync(filePath, 'utf-8');
          
          // Try to parse as JSON (session transcript)
          if (file.endsWith('.json')) {
            try {
              const session = JSON.parse(content);
              if (session.messages && Array.isArray(session.messages)) {
                for (const msg of session.messages) {
                  if (msg.role === 'user') {
                    logs.push({
                      timestamp: msg.timestamp || stat.mtime.toISOString(),
                      agent: session.agent || 'ericf',
                      type: 'user_message',
                      message: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content).substring(0, 200),
                      sessionId: session.sessionId || file.replace('.json', '')
                    });
                  } else if (msg.role === 'assistant') {
                    logs.push({
                      timestamp: msg.timestamp || stat.mtime.toISOString(),
                      agent: session.agent || 'nexus',
                      type: 'agent_response',
                      message: typeof msg.content === 'string' ? msg.content.substring(0, 200) : 'Response...',
                      sessionId: session.sessionId || file.replace('.json', '')
                    });
                  }
                }
              }
            } catch (e) {
              // Not valid JSON, skip
            }
          } else if (file.endsWith('.md')) {
            // Parse markdown memory files
            const lines = content.split('\n').slice(0, 20);
            const firstLine = lines[0] || '';
            logs.push({
              timestamp: stat.mtime.toISOString(),
              agent: 'system',
              type: 'system',
              message: firstLine.substring(0, 200),
              sessionId: file.replace('.md', '')
            });
          }
        } catch (e) {
          // Skip problematic files
        }
      }
    } catch (e) {
      console.error('Error reading memory directory:', e.message);
    }
  }
  
  // Also check agent activity from fileWatcher
  try {
    const recentActivity = fileWatcher.getRecentActivity ? fileWatcher.getRecentActivity(50) : [];
    for (const activity of recentActivity) {
      if (activity.agent) {
        logs.push({
          timestamp: activity.timestamp || new Date().toISOString(),
          agent: activity.agent,
          type: activity.type || 'task_complete',
          message: activity.message || `Activity: ${activity.type}`,
          sessionId: activity.sessionId || '-'
        });
      }
    }
  } catch (e) {
    // fileWatcher might not have getRecentActivity
  }
  
  // Parse log files from logs directory
  if (fs.existsSync(CONFIG.logsDir)) {
    try {
      const logFiles = fs.readdirSync(CONFIG.logsDir)
        .filter(f => f.endsWith('.log'))
        .sort()
        .reverse();
      
      for (const logFile of logFiles.slice(0, 5)) {
        const filePath = path.join(CONFIG.logsDir, logFile);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());
        
        for (const line of lines.slice(-30)) { // Last 30 lines from each file
          // Parse format: [2026-02-17T22:40:48.062Z] LEVEL: message
          const match = line.match(/^\[(.+?)\]\s*(\w+):\s*(.+)/);
          if (match) {
            const level = match[2].toUpperCase();
            const typeMap = {
              'INFO': 'system',
              'SUCCESS': 'task_complete',
              'ERROR': 'error',
              'WARN': 'system',
              'WATCH': 'system',
              'ENRICH': 'tool_call'
            };
            
            // Try to determine agent from message content
            let agent = 'system';
            const agentMatch = line.match(/\b(Nexus|Code|Scout|Pixel|Forge|DealFlow|Audit|Cipher|Glasses|Sentry|Quill|Gary|Larry|ColdCall|Spark|Enrichment)\b/i);
            if (agentMatch) {
              agent = agentMatch[1].toLowerCase();
            } else if (logFile.includes('enrichment')) {
              agent = 'scout';
            } else if (logFile.includes('office')) {
              agent = 'pixel';
            }
            
            logs.push({
              timestamp: match[1],
              agent: agent,
              type: typeMap[level] || 'system',
              message: match[3].substring(0, 200),
              sessionId: logFile.replace('.log', '')
            });
          }
        }
      }
    } catch (e) {
      console.error('Error reading log files:', e.message);
    }
  }
  
  // Sort by timestamp descending
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return logs.slice(0, limit);
}

/**
 * Get opportunities data - LIVE from opportunities.json
 */
function getOpportunities() {
  const oppPath = path.join(CONFIG.missionControlDir, 'data', 'opportunities.json');
  const reportPath = path.join(CONFIG.missionControlDir, 'reports', 'opportunity-report-2026-02-17.json');
  
  try {
    let opportunities = [];
    let top5 = [];
    let summary = { totalOpportunities: 0, averageScore: 0 };
    
    // Read main opportunities file
    if (fs.existsSync(oppPath)) {
      const content = fs.readFileSync(oppPath, 'utf-8');
      const data = JSON.parse(content);
      opportunities = data.opportunities || [];
      summary = {
        totalOpportunities: opportunities.length,
        averageScore: opportunities.length 
          ? Math.round(opportunities.reduce((sum, o) => sum + (o.score || 0), 0) / opportunities.length)
          : 0,
        highPriority: opportunities.filter(o => (o.score || 0) >= 80).length,
        mediumPriority: opportunities.filter(o => (o.score || 0) >= 60 && (o.score || 0) < 80).length,
        lowPriority: opportunities.filter(o => (o.score || 0) < 60).length
      };
    }
    
    // Read report for top 5
    if (fs.existsSync(reportPath)) {
      const content = fs.readFileSync(reportPath, 'utf-8');
      const data = JSON.parse(content);
      top5 = data.top5 || [];
    }
    
    return {
      success: true,
      opportunities,
      top5,
      summary,
      lastUpdated: new Date().toISOString()
    };
  } catch (e) {
    console.error('Error reading opportunities data:', e.message);
  }
  
  return {
    success: false,
    error: 'No opportunities data available',
    opportunities: [],
    top5: [],
    summary: { totalOpportunities: 0, averageScore: 0 },
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Helper: Get emoji for agent
 */
function getAgentEmoji(name) {
  const emojis = {
    'Nexus': '🤖', 'Code': '💻', 'Scout': '🔭', 'Pixel': '🎨',
    'Forge': '🔨', 'DealFlow': '🤝', 'Audit': '🔍', 'Cipher': '🔒',
    'Glasses': '🥽', 'Sentry': '🛡️', 'Quill': '✍️', 'Gary': '📈',
    'Larry': '📱', 'ColdCall': '📞', 'Spark': '💡'
  };
  return emojis[name] || '🤖';
}

/**
 * Helper: Get role for agent
 */
function getAgentRole(name) {
  const roles = {
    'Nexus': 'Orchestrator', 'Code': 'Backend Lead', 'Scout': 'Researcher',
    'Pixel': 'Designer', 'Forge': 'UI Lead', 'DealFlow': 'BD Lead',
    'Audit': 'QA', 'Cipher': 'Security', 'Glasses': 'Researcher',
    'Sentry': 'DevOps', 'Quill': 'Writer', 'Gary': 'Marketing',
    'Larry': 'Social', 'ColdCall': 'Outreach', 'Spark': 'Innovation'
  };
  return roles[name] || 'Agent';
}

/**
 * Helper: Get color for agent
 */
function getAgentColor(name) {
  const colors = {
    'Nexus': '#ff2a6d', 'Code': '#22c55e', 'Scout': '#00d4ff',
    'Pixel': '#a855f7', 'Forge': '#f97316', 'DealFlow': '#f97316',
    'Audit': '#ff2a6d', 'Cipher': '#a855f7', 'Glasses': '#00d4ff',
    'Sentry': '#fbbf24', 'Quill': '#fbbf24', 'Gary': '#f97316',
    'Larry': '#00d4ff', 'ColdCall': '#22c55e', 'Spark': '#fbbf24'
  };
  return colors[name] || '#00d4ff';
}

/**
 * API Request Handler
 */
async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  const method = req.method;
  
  // Set CORS headers
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // Handle OPTIONS for CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  let response = { error: 'Not found' };
  let statusCode = 404;
  
  try {
    // Health check
    if (pathname === '/api/health') {
      response = { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        services: {
          fileWatcher: fileWatcher.isWatching,
          taskQueue: true
        }
      };
      statusCode = 200;
    }
    
    // Agents API
    else if (pathname === '/api/agents' && method === 'GET') {
      response = getAgents();
      statusCode = 200;
    }
    else if (pathname.match(/^\/api\/agents\/[^\/]+$/) && method === 'GET') {
      const agentId = pathname.split('/')[3];
      response = getAgent(agentId) || { error: 'Agent not found' };
      statusCode = response.error ? 404 : 200;
    }
    else if (pathname.match(/^\/api\/agents\/[^\/]+\/files$/) && method === 'GET') {
      const agentId = pathname.split('/')[3];
      response = getAgentFiles(agentId);
      statusCode = 200;
    }
    
    // System API
    else if (pathname === '/api/system/status' && method === 'GET') {
      response = getSystemStatus();
      statusCode = 200;
    }
    else if (pathname === '/api/system/events' && method === 'GET') {
      const limit = query.limit ? parseInt(query.limit) : 50;
      response = eventLog.slice(0, limit);
      statusCode = 200;
    }
    
    // Tokens API
    else if (pathname === '/api/tokens' && method === 'GET') {
      response = getTokens();
      statusCode = 200;
    }
    
    // Leads API
    else if (pathname === '/api/leads' && method === 'GET') {
      response = getLeads();
      statusCode = 200;
    }
    
    // Opportunities API
    else if (pathname === '/api/opportunities' && method === 'GET') {
      response = getOpportunities();
      statusCode = 200;
    }
    
    // Logs API - for logs-view.html
    else if (pathname === '/api/logs/activity' && method === 'GET') {
      const limit = query.limit ? parseInt(query.limit) : 100;
      const logs = getActivityLogs(limit);
      response = { 
        success: true,
        logs: logs,
        meta: {
          total: logs.length,
          returned: logs.length,
          limit: limit,
          timestamp: new Date().toISOString()
        }
      };
      statusCode = 200;
    }
    
    // File Watcher API
    else if (pathname === '/api/files/watch' && method === 'GET') {
      response = fileWatcher.getStatus();
      statusCode = 200;
    }
    else if (pathname === '/api/files/activity' && method === 'GET') {
      const limit = query.limit ? parseInt(query.limit) : 50;
      response = fileWatcher.getRecentActivity(limit);
      statusCode = 200;
    }
    else if (pathname.match(/^\/api\/files\/agents\/[^\/]+$/) && method === 'GET') {
      const agentId = pathname.split('/')[4];
      const since = query.since || null;
      response = fileWatcher.getAgentFiles(agentId, { since });
      statusCode = 200;
    }
    else if (pathname === '/api/files/refresh' && method === 'POST') {
      const body = await parseBody(req);
      if (body.path) {
        const fullPath = path.join(CONFIG.workspaceRoot, body.path);
        response = fileWatcher.refreshDirectory(fullPath);
        statusCode = 200;
      } else {
        response = { error: 'Path required' };
        statusCode = 400;
      }
    }
    
    // Task Queue API
    else if (pathname === '/api/tasks' && method === 'GET') {
      response = {
        tasks: taskQueue.getAll(query),
        summary: taskQueue.getSummary()
      };
      statusCode = 200;
    }
    else if (pathname === '/api/tasks' && method === 'POST') {
      const body = await parseBody(req);
      response = taskQueue.create(body);
      statusCode = 201;
    }
    else if (pathname.match(/^\/api\/tasks\/[^\/]+$/) && method === 'GET') {
      const taskId = pathname.split('/')[3];
      response = taskQueue.get(taskId);
      statusCode = response ? 200 : 404;
    }
    else if (pathname.match(/^\/api\/tasks\/[^\/]+$/) && method === 'PUT') {
      const taskId = pathname.split('/')[3];
      const body = await parseBody(req);
      response = taskQueue.update(taskId, body);
      statusCode = 200;
    }
    else if (pathname.match(/^\/api\/tasks\/[^\/]+$/) && method === 'PATCH') {
      const taskId = pathname.split('/')[3];
      const body = await parseBody(req);
      response = taskQueue.update(taskId, body);
      statusCode = 200;
    }
    else if (pathname.match(/^\/api\/tasks\/[^\/]+$/) && method === 'DELETE') {
      const taskId = pathname.split('/')[3];
      response = taskQueue.delete(taskId);
      statusCode = 200;
    }
    else if (pathname.match(/^\/api\/tasks\/[^\/]+\/assign$/) && method === 'POST') {
      const taskId = pathname.split('/')[3];
      const body = await parseBody(req);
      response = taskQueue.assign(taskId, body.agentId, body.options || {});
      statusCode = 200;
    }
    else if (pathname.match(/^\/api\/tasks\/[^\/]+\/priority$/) && method === 'PUT') {
      const taskId = pathname.split('/')[3];
      const body = await parseBody(req);
      response = taskQueue.setPriority(taskId, body.priority);
      statusCode = 200;
    }
    else if (pathname.match(/^\/api\/tasks\/[^\/]+\/subtasks$/) && method === 'POST') {
      const taskId = pathname.split('/')[3];
      const body = await parseBody(req);
      response = taskQueue.addSubtask(taskId, body);
      statusCode = 201;
    }
    else if (pathname === '/api/tasks/stats' && method === 'GET') {
      response = taskQueue.getStats();
      statusCode = 200;
    }
    else if (pathname === '/api/tasks/summary' && method === 'GET') {
      response = taskQueue.getSummary();
      statusCode = 200;
    }
    else if (pathname === '/api/tasks/due' && method === 'GET') {
      const hours = query.hours ? parseInt(query.hours) : 24;
      response = taskQueue.getDueSoon(hours);
      statusCode = 200;
    }
    else if (pathname === '/api/tasks/search' && method === 'GET') {
      const q = query.q || '';
      response = taskQueue.search(q);
      statusCode = 200;
    }
    else if (pathname === '/api/tasks/bulk' && method === 'PUT') {
      const body = await parseBody(req);
      response = taskQueue.bulkUpdate(body.ids, body.updates);
      statusCode = 200;
    }
    
    // Export API
    else if (pathname === '/api/export/tasks' && method === 'GET') {
      const format = query.format || 'json';
      if (format === 'markdown') {
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', 'attachment; filename="TASK_QUEUE.md"');
        res.writeHead(200);
        res.end(taskQueue.exportToMarkdown());
        return;
      }
      response = { tasks: taskQueue.getAll(), history: taskQueue.taskHistory };
      statusCode = 200;
    }
    
  } catch (error) {
    console.error('API Error:', error);
    response = { error: error.message };
    statusCode = error.message.includes('not found') ? 404 : 500;
  }
  
  res.writeHead(statusCode);
  res.end(JSON.stringify(response, null, 2));
}

// Start server
const server = http.createServer(handleRequest);

server.listen(CONFIG.port, async () => {
  console.log(`🚀 Mission Control API Server v2.0`);
  console.log(`📡 Port: ${CONFIG.port}`);
  console.log(`📊 Health: http://localhost:${CONFIG.port}/api/health`);
  console.log(`🤖 Agents: http://localhost:${CONFIG.port}/api/agents`);
  console.log(`📋 Tasks: http://localhost:${CONFIG.port}/api/tasks`);
  console.log(`📁 Files: http://localhost:${CONFIG.port}/api/files/watch`);
  console.log(`💰 Tokens: http://localhost:${CONFIG.port}/api/tokens`);
  console.log(`🎯 Leads: http://localhost:${CONFIG.port}/api/leads`);
  console.log(`🔭 Opportunities: http://localhost:${CONFIG.port}/api/opportunities`);
  
  // Start file watcher
  fileWatcher.start();
  
  // Start WebSocket server with integration
  try {
    await startWebSocketServer({
      fileWatcher,
      taskQueue,
      tokenTracker
    });
    console.log(`🔌 WebSocket: ws://localhost:3002/api/ws`);
  } catch (err) {
    console.error('❌ WebSocket server failed to start:', err.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  fileWatcher.stop();
  const { wsServer } = require('../../api/websocket');
  wsServer.stop().then(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  fileWatcher.stop();
  const { wsServer } = require('../../api/websocket');
  wsServer.stop().then(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

module.exports = { server, fileWatcher, taskQueue };