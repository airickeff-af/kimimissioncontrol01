// Vercel Serverless API: /api/pixel-office-data.js
// Returns REAL data for pixel office visualization
// Version: 3.0 - Uses bundled data files for Vercel deployment

const fs = require('fs');
const path = require('path');

// Cache configuration - 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
let dataCache = {
  data: null,
  timestamp: 0
};

function loadJsonFile(filename) {
  const filePath = path.join(__dirname, '..', 'data', filename);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return null;
  }
}

function getOfficeData() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (dataCache.data && (now - dataCache.timestamp) < CACHE_TTL) {
    return {
      ...dataCache.data,
      cached: true,
      cacheAge: Math.round((now - dataCache.timestamp) / 1000)
    };
  }
  
  // Load data from bundled files
  const agentsData = loadJsonFile('agents.json');
  const tasksData = loadJsonFile('tasks.json');
  
  if (!agentsData) {
    return {
      generated: new Date().toISOString(),
      source: 'fallback',
      agents: [],
      tasks: [],
      cached: false,
      error: 'Failed to load data files'
    };
  }
  
  // Transform agents for pixel office
  const agents = agentsData.agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    role: agent.role,
    team: agent.team || 'Unknown',
    status: agent.status,
    emoji: agent.emoji,
    x: getAgentX(agent.team),
    y: getAgentY(agent.team),
    tasksCompleted: agent.tasksCompleted || 0,
    tokensUsed: agent.tokensUsed || 0,
    successRate: agent.successRate || 0
  }));
  
  // Get active tasks
  const activeTasks = tasksData ? tasksData.tasks.filter(t => 
    t.status === 'in_progress' || t.status === 'critical'
  ).slice(0, 10) : [];
  
  const result = {
    generated: new Date().toISOString(),
    source: 'data_files',
    agents,
    tasks: activeTasks,
    summary: {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      busyAgents: agents.filter(a => a.status === 'busy').length,
      activeTasks: activeTasks.length
    }
  };
  
  dataCache = {
    data: result,
    timestamp: now
  };
  
  return {
    ...result,
    cached: false,
    cacheAge: 0
  };
}

// Helper functions for office layout
function getAgentX(team) {
  const teamX = {
    'Leadership': 400,
    'AI': 300,
    'Dev': 200,
    'Design': 500,
    'Research': 100,
    'Sales': 600,
    'Audit': 700,
    'Ops': 350,
    'Content': 450,
    'Marketing': 550,
    'Legal': 750,
    'R&D': 800
  };
  return teamX[team] || 400 + Math.random() * 200;
}

function getAgentY(team) {
  const teamY = {
    'Leadership': 100,
    'AI': 200,
    'Dev': 300,
    'Design': 300,
    'Research': 400,
    'Sales': 400,
    'Audit': 500,
    'Ops': 500,
    'Content': 200,
    'Marketing': 200,
    'Legal': 600,
    'R&D': 600
  };
  return teamY[team] || 300 + Math.random() * 200;
}

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const data = getOfficeData();
    
    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.setHeader('X-Cache-Status', data.cached ? 'HIT' : 'MISS');
    
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      ...data
    });
  } catch (error) {
    console.error('Error in /api/pixel-office-data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
