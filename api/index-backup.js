// Simple, reliable API using vanilla Node.js
// No frameworks, no complexity - just works

const fs = require('fs');
const path = require('path');

// Read database once at startup
const DB_PATH = path.join(__dirname, '..', 'data', 'mission-control-db.json');
let db = {};

try {
  db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  console.log('Database loaded:', Object.keys(db).join(', '));
} catch (e) {
  console.error('Failed to load database:', e.message);
}

// Simple router
module.exports = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const url = req.url || '/';
  
  // Route based on URL
  if (url === '/agents' || url === '/agents/') {
    return sendAgents(res);
  }
  if (url === '/tasks' || url === '/tasks/') {
    return sendTasks(res, req.query);
  }
  if (url === '/deals' || url === '/deals/') {
    return sendDeals(res, req.query);
  }
  if (url === '/logs' || url === '/logs/' || url === '/logs/activity') {
    return sendLogs(res, req.query);
  }
  if (url === '/stats' || url === '/stats/') {
    return sendStats(res);
  }
  if (url === '/health' || url === '/health/') {
    return sendHealth(res);
  }
  
  // 404 for unknown routes
  res.status(404).json({ error: 'Not found', path: url });
};

function sendAgents(res) {
  const agents = Object.values(db.agents || {});
  res.status(200).json({
    success: true,
    agents,
    total: agents.length,
    timestamp: new Date().toISOString()
  });
}

function sendTasks(res, query = {}) {
  let tasks = db.tasks || [];
  
  if (query.status) tasks = tasks.filter(t => t.status === query.status);
  if (query.priority) tasks = tasks.filter(t => t.priority === query.priority);
  
  res.status(200).json({
    success: true,
    tasks,
    total: tasks.length,
    timestamp: new Date().toISOString()
  });
}

function sendDeals(res, query = {}) {
  let deals = db.deals || [];
  
  if (query.priority) deals = deals.filter(d => d.priority === query.priority);
  if (query.region) deals = deals.filter(d => d.region === query.region);
  
  res.status(200).json({
    success: true,
    deals,
    total: deals.length,
    timestamp: new Date().toISOString()
  });
}

function sendLogs(res, query = {}) {
  let logs = db.logs || [];
  const limit = parseInt(query.limit) || 50;
  
  if (query.agent) logs = logs.filter(l => l.agent === query.agent);
  
  res.status(200).json({
    success: true,
    logs: logs.slice(0, limit),
    total: logs.length,
    timestamp: new Date().toISOString()
  });
}

function sendStats(res) {
  res.status(200).json({
    success: true,
    stats: db.stats || {},
    timestamp: new Date().toISOString()
  });
}

function sendHealth(res) {
  res.status(200).json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
}