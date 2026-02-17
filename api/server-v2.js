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

server.listen(CONFIG.port, () => {
  console.log(`🚀 Mission Control API Server v2.0`);
  console.log(`📡 Port: ${CONFIG.port}`);
  console.log(`📊 Health: http://localhost:${CONFIG.port}/api/health`);
  console.log(`🤖 Agents: http://localhost:${CONFIG.port}/api/agents`);
  console.log(`📋 Tasks: http://localhost:${CONFIG.port}/api/tasks`);
  console.log(`📁 Files: http://localhost:${CONFIG.port}/api/files/watch`);
  
  // Start file watcher
  fileWatcher.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  fileWatcher.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  fileWatcher.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { server, fileWatcher, taskQueue };