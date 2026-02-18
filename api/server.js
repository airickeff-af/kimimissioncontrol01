/**
 * Mission Control Dashboard API
 * 
 * Backend API for serving agent data, tasks, and system status
 * to the Mission Control Dashboard frontend.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');

// Import token tracker
const tokenTracker = require('../../api/tokens.js');

// Configuration
const CONFIG = {
  port: 3001,
  workspaceRoot: '/root/.openclaw/workspace',
  missionControlDir: '/root/.openclaw/workspace/mission-control',
  agentsDir: '/root/.openclaw/workspace/mission-control/agents',
  logsDir: '/root/.openclaw/workspace/mission-control/logs'
};

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

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
  
  // Extract name
  const nameMatch = content.match(/\*\*Name:\*\*\s*(.+)/i) || 
                    content.match(/Name:\s*(.+)/i) ||
                    content.match(/^#\s+(.+?)\s+[-–]/m);
  if (nameMatch) identity.name = nameMatch[1].trim();
  
  // Extract role
  const roleMatch = content.match(/\*\*Role:\*\*\s*(.+)/i) ||
                    content.match(/Role:\s*(.+)/i);
  if (roleMatch) identity.role = roleMatch[1].trim();
  
  // Extract codename
  const codenameMatch = content.match(/\*\*Codename:\*\*\s*"(.+)"/i) ||
                       content.match(/Codename:\s*"(.+)"/i);
  if (codenameMatch) identity.codename = codenameMatch[1].trim();
  
  // Extract division
  const divisionMatch = content.match(/\*\*Division:\*\*\s*(.+)/i) ||
                       content.match(/Division:\s*(.+)/i);
  if (divisionMatch) identity.division = divisionMatch[1].trim();
  
  // Extract specialties
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
      
      // Parse SOUL.md for identity
      if (fs.existsSync(soulPath)) {
        const soulContent = fs.readFileSync(soulPath, 'utf-8');
        const identity = parseSoulMd(soulContent);
        agent = { ...agent, ...identity };
      }
      
      // Parse state.json for status
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
  return agents.find(a => a.id === agentId || a.name.toLowerCase() === agentId.toLowerCase());
}

/**
 * Get agent activity history
 */
function getAgentActivity(agentId) {
  const activities = [];
  const agentPath = path.join(CONFIG.agentsDir, agentId);
  
  // Check for memory files
  const memoryPath = path.join(agentPath, 'memory');
  if (fs.existsSync(memoryPath)) {
    try {
      const files = fs.readdirSync(memoryPath);
      for (const file of files) {
        if (file.endsWith('.md') || file.endsWith('.json')) {
          activities.push({
            type: 'memory',
            file: file,
            timestamp: fs.statSync(path.join(memoryPath, file)).mtime,
            agent: agentId
          });
        }
      }
    } catch (e) {
      console.error(`Error reading memory for ${agentId}:`, e.message);
    }
  }
  
  // Check for logs
  const logsPath = path.join(agentPath, 'logs');
  if (fs.existsSync(logsPath)) {
    try {
      const files = fs.readdirSync(logsPath);
      for (const file of files) {
        activities.push({
          type: 'log',
          file: file,
          timestamp: fs.statSync(path.join(logsPath, file)).mtime,
          agent: agentId
        });
      }
    } catch (e) {
      console.error(`Error reading logs for ${agentId}:`, e.message);
    }
  }
  
  return activities.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get agent output files
 */
function getAgentFiles(agentId, subPath = '') {
  const files = [];
  const agentPath = path.join(CONFIG.agentsDir, agentId);
  const targetPath = path.join(agentPath, subPath);
  
  if (!fs.existsSync(targetPath)) {
    return files;
  }
  
  try {
    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(targetPath, entry.name);
      const relativePath = path.join(subPath, entry.name);
      
      if (entry.isDirectory()) {
        files.push({
          name: entry.name,
          type: 'directory',
          path: relativePath,
          modified: fs.statSync(fullPath).mtime
        });
      } else {
        const stat = fs.statSync(fullPath);
        files.push({
          name: entry.name,
          type: 'file',
          path: relativePath,
          size: stat.size,
          modified: stat.mtime,
          extension: path.extname(entry.name)
        });
      }
    }
  } catch (e) {
    console.error(`Error reading files for ${agentId}:`, e.message);
  }
  
  return files;
}

/**
 * Get system status from Sentry
 */
function getSystemStatus() {
  const sentryPath = path.join(CONFIG.agentsDir, 'sentry', 'state.json');
  
  if (fs.existsSync(sentryPath)) {
    try {
      const content = fs.readFileSync(sentryPath, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading system status:', e.message);
    }
  }
  
  return {
    system: { gatewayStatus: 'unknown' },
    sessions: { total: 0, active: 0 },
    agents: { deployed: [], pending: [] },
    alerts: []
  };
}

/**
 * Get task queue from TASK_QUEUE.md
 */
function getTasks() {
  const tasks = {
    pending: [],
    active: [],
    completed: []
  };
  
  // Parse TASK_QUEUE.md
  const taskQueuePath = path.join(CONFIG.missionControlDir, 'TASK_QUEUE.md');
  if (fs.existsSync(taskQueuePath)) {
    try {
      const content = fs.readFileSync(taskQueuePath, 'utf-8');
      
      // Extract active tasks
      const activeMatch = content.match(/## Active Task Queue[\s\S]*?(?=##|$)/);
      if (activeMatch) {
        const lines = activeMatch[0].split('\n');
        for (const line of lines) {
          if (line.includes('|') && !line.includes('---') && !line.includes('ID')) {
            const parts = line.split('|').map(p => p.trim());
            if (parts.length >= 4 && parts[1] && parts[1] !== '-') {
              tasks.pending.push({
                id: parts[1],
                description: parts[2],
                status: parts[3],
                assignedTo: parts[4] || 'Unassigned',
                priority: parts[5] || 'P2'
              });
            }
          }
        }
      }
      
      // Extract completed tasks from history
      const historyMatch = content.match(/## Task History[\s\S]*?(?=##|$)/);
      if (historyMatch) {
        const lines = historyMatch[0].split('\n');
        for (const line of lines) {
          if (line.includes('|') && !line.includes('---') && !line.includes('ID')) {
            const parts = line.split('|').map(p => p.trim());
            if (parts.length >= 4 && parts[1] && parts[1] !== '-') {
              tasks.completed.push({
                id: parts[1],
                description: parts[2],
                status: parts[3],
                completedAt: parts[4] || 'Unknown',
                completedBy: parts[5] || 'Unknown'
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('Error parsing task queue:', e.message);
    }
  }
  
  return tasks;
}

/**
 * Get recent system logs
 */
function getSystemLogs(limit = 50) {
  const logs = [];
  
  if (fs.existsSync(CONFIG.logsDir)) {
    try {
      const files = fs.readdirSync(CONFIG.logsDir)
        .filter(f => f.endsWith('.log') || f.endsWith('.md'))
        .sort()
        .reverse();
      
      for (const file of files.slice(0, 5)) {
        const filePath = path.join(CONFIG.logsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());
        
        for (const line of lines.slice(-20)) {
          // Parse log line format: [timestamp] [AGENT] LEVEL: message
          const match = line.match(/\[(.+?)\]\s*\[(.+?)\]\s*(\w+):\s*(.+)/);
          if (match) {
            logs.push({
              timestamp: match[1],
              agent: match[2],
              level: match[3].toUpperCase(),
              message: match[4]
            });
          } else {
            logs.push({
              timestamp: new Date().toISOString(),
              agent: 'SYSTEM',
              level: 'INFO',
              message: line
            });
          }
        }
      }
    } catch (e) {
      console.error('Error reading logs:', e.message);
    }
  }
  
  return logs.slice(-limit);
}

/**
 * Get global activity feed
 */
function getActivityFeed(limit = 20) {
  const activities = [];
  const agents = getAgents();
  
  for (const agent of agents) {
    const agentActivities = getAgentActivity(agent.id);
    for (const activity of agentActivities.slice(0, 5)) {
      activities.push({
        ...activity,
        agentName: agent.name,
        agentRole: agent.role
      });
    }
  }
  
  // Sort by timestamp descending
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return activities.slice(0, limit);
}

/**
 * Browse file system
 */
function browseFiles(requestPath = '') {
  const targetPath = path.join(CONFIG.workspaceRoot, requestPath);
  
  // Security: prevent directory traversal
  if (!targetPath.startsWith(CONFIG.workspaceRoot)) {
    return { error: 'Access denied' };
  }
  
  if (!fs.existsSync(targetPath)) {
    return { error: 'Path not found' };
  }
  
  const stat = fs.statSync(targetPath);
  
  if (stat.isFile()) {
    return {
      type: 'file',
      path: requestPath,
      content: fs.readFileSync(targetPath, 'utf-8'),
      size: stat.size,
      modified: stat.mtime
    };
  }
  
  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  return {
    type: 'directory',
    path: requestPath || '/',
    entries: entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      path: path.join(requestPath, entry.name)
    }))
  };
}

/**
 * API Request Handler
 */
function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  
  // Set CORS headers
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  let response = { error: 'Not found' };
  let statusCode = 404;
  
  // Route handling
  if (pathname === '/api/agents') {
    response = getAgents();
    statusCode = 200;
  } else if (pathname.match(/^\/api\/agents\/[^\/]+$/)) {
    const agentId = pathname.split('/')[3];
    response = getAgent(agentId) || { error: 'Agent not found' };
    statusCode = response.error ? 404 : 200;
  } else if (pathname.match(/^\/api\/agents\/[^\/]+\/activity$/)) {
    const agentId = pathname.split('/')[3];
    response = getAgentActivity(agentId);
    statusCode = 200;
  } else if (pathname.match(/^\/api\/agents\/[^\/]+\/files$/)) {
    const agentId = pathname.split('/')[3];
    const subPath = query.path || '';
    response = getAgentFiles(agentId, subPath);
    statusCode = 200;
  } else if (pathname === '/api/system/status') {
    response = getSystemStatus();
    statusCode = 200;
  } else if (pathname === '/api/system/logs') {
    response = getSystemLogs(query.limit ? parseInt(query.limit) : 50);
    statusCode = 200;
  } else if (pathname === '/api/system/activity') {
    response = getActivityFeed(query.limit ? parseInt(query.limit) : 20);
    statusCode = 200;
  } else if (pathname === '/api/tasks') {
    response = getTasks();
    statusCode = 200;
  } else if (pathname === '/api/files/browse') {
    response = browseFiles(query.path || '');
    statusCode = response.error ? 404 : 200;
  } else if (pathname === '/api/health') {
    response = { status: 'ok', timestamp: new Date().toISOString() };
    statusCode = 200;
  } else if (pathname === '/api/tokens') {
    // Token usage endpoint
    const forceRefresh = query.refresh === 'true';
    const data = tokenTracker.getTokenData(forceRefresh);
    response = {
      agents: data.agents.map(a => ({
        name: a.name,
        tokensIn: a.tokensIn,
        tokensOut: a.tokensOut,
        cost: a.cost
      })),
      total: {
        tokensIn: data.total.tokensIn,
        cost: data.total.cost
      },
      meta: {
        lastUpdated: data.lastUpdated,
        sessionCount: data.sessionCount,
        agentCount: data.agents.length
      }
    };
    statusCode = 200;
  }
  
  res.writeHead(statusCode);
  res.end(JSON.stringify(response, null, 2));
}

// Start server
const server = http.createServer(handleRequest);

server.listen(CONFIG.port, () => {
  console.log(`🚀 Mission Control API running on port ${CONFIG.port}`);
  console.log(`📊 Health check: http://localhost:${CONFIG.port}/api/health`);
  console.log(`🤖 Agents: http://localhost:${CONFIG.port}/api/agents`);
});

module.exports = { getAgents, getSystemStatus, getTasks };
