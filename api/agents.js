// Vercel Serverless API: /api/agents.js
// Returns REAL agent data from data/agents.json
// Version: 3.0 - Uses bundled data file for Vercel deployment

const fs = require('fs');
const path = require('path');

// Cache configuration - 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
let agentsCache = {
  data: null,
  timestamp: 0
};

function getAgentsData() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (agentsCache.data && (now - agentsCache.timestamp) < CACHE_TTL) {
    return {
      ...agentsCache.data,
      cached: true,
      cacheAge: Math.round((now - agentsCache.timestamp) / 1000)
    };
  }
  
  // Try to load from bundled data file
  const dataPath = path.join(__dirname, '..', 'data', 'agents.json');
  
  try {
    const content = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(content);
    
    agentsCache = {
      data: data,
      timestamp: now
    };
    
    return {
      ...data,
      cached: false,
      cacheAge: 0
    };
  } catch (error) {
    console.error('Error loading agents:', error);
    
    // Return fallback data
    return {
      generated: new Date().toISOString(),
      source: 'fallback',
      agents: [
        {id: "nexus", name: "Nexus", role: "Orchestrator", status: "active", emoji: "🧠", tasksCompleted: 47, tokensUsed: 75300, successRate: 94},
        {id: "codemaster", name: "CodeMaster", role: "Dev Lead", status: "active", emoji: "💻", tasksCompleted: 23, tokensUsed: 15000, successRate: 92},
        {id: "forge", name: "Forge", role: "Design Lead", status: "active", emoji: "🔨", tasksCompleted: 31, tokensUsed: 28000, successRate: 93},
        {id: "dealflow", name: "DealFlow", role: "Pipeline", status: "active", emoji: "💰", tasksCompleted: 28, tokensUsed: 115300, successRate: 89}
      ],
      cached: false,
      error: error.message
    };
  }
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
    const { status, team, limit = 100 } = req.query || {};
    const data = getAgentsData();
    let agents = [...data.agents];
    
    // Apply filters
    if (status) {
      agents = agents.filter(a => a.status.toLowerCase() === status.toLowerCase());
    }
    
    if (team) {
      agents = agents.filter(a => 
        a.team && a.team.toLowerCase() === team.toLowerCase()
      );
    }
    
    // Apply limit
    const limitNum = parseInt(limit, 10) || 100;
    agents = agents.slice(0, limitNum);
    
    // Calculate summary
    const summary = {
      total: data.agents.length,
      active: data.agents.filter(a => a.status === 'active').length,
      busy: data.agents.filter(a => a.status === 'busy').length,
      idle: data.agents.filter(a => a.status === 'idle').length,
      offline: data.agents.filter(a => a.status === 'offline').length,
      totalTokens: data.agents.reduce((sum, a) => sum + (a.tokensUsed || 0), 0),
      totalTasks: data.agents.reduce((sum, a) => sum + (a.tasksCompleted || 0), 0)
    };
    
    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.setHeader('X-Cache-Status', data.cached ? 'HIT' : 'MISS');
    
    res.status(200).json({
      success: true,
      agents,
      summary,
      meta: {
        generated: data.generated,
        source: data.source,
        cached: data.cached || false,
        cacheAge: data.cacheAge || 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in /api/agents:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
