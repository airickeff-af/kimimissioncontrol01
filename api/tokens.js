// Vercel Serverless API: /api/tokens.js
// Returns REAL token usage data parsed from live session transcripts
// Version: 4.0 - Fixed to read from actual session files

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  sessionsDir: '/root/.openclaw/agents/main/sessions',
  cacheFile: '/tmp/token-cache.json', // Use /tmp for Vercel
  updateInterval: 5 * 60 * 1000, // 5 minutes for serverless
  // Pricing per 1K tokens (approximate for Kimi k2p5)
  pricing: {
    input: 0.0001,
    output: 0.0004,
    cacheRead: 0.000025,
    cacheWrite: 0.0001
  }
};

// Complete list of all 22 agents
const ALL_AGENTS = [
  'Nexus', 'Code', 'Scout', 'Pixel', 'Forge', 'DealFlow', 'Audit',
  'Quill', 'Gary', 'Larry', 'Sentry', 'Cipher', 'Glasses', 'Buzz', 'PIE',
  'Code-1', 'Code-2', 'Code-3',
  'Forge-1', 'Forge-2', 'Forge-3'
];

// Agent name mappings
const AGENT_MAPPINGS = {
  'nexus': 'Nexus',
  'code': 'Code',
  'scout': 'Scout',
  'pixel': 'Pixel',
  'forge': 'Forge',
  'dealflow': 'DealFlow',
  'audit': 'Audit',
  'quill': 'Quill',
  'gary': 'Gary',
  'larry': 'Larry',
  'sentry': 'Sentry',
  'cipher': 'Cipher',
  'glasses': 'Glasses',
  'buzz': 'Buzz',
  'pie': 'PIE',
  'coldcall': 'ColdCall',
  'spark': 'Spark',
  'deal': 'DealFlow',
  'pixel-2': 'Pixel',
  'code-1': 'Code-1',
  'code-2': 'Code-2',
  'code-3': 'Code-3',
  'forge-1': 'Forge-1',
  'forge-2': 'Forge-2',
  'forge-3': 'Forge-3'
};

/**
 * Extract agent name from session content
 */
function extractAgentName(sessionData) {
  for (const entry of sessionData) {
    if (entry.type === 'message' && entry.message?.role === 'user') {
      const content = entry.message.content?.[0]?.text || '';
      
      // Look for "You are [Name]" pattern
      const youAreMatch = content.match(/You are\s+([A-Za-z0-9-]+)/i);
      if (youAreMatch) {
        const name = youAreMatch[1].toLowerCase();
        const mapped = AGENT_MAPPINGS[name];
        if (mapped) return mapped;
        return youAreMatch[1].charAt(0).toUpperCase() + youAreMatch[1].slice(1);
      }
      
      // Look for agent name in brackets at start
      const bracketMatch = content.match(/^\[([A-Za-z0-9-]+)\]/i);
      if (bracketMatch) {
        const name = bracketMatch[1].toLowerCase();
        const mapped = AGENT_MAPPINGS[name];
        if (mapped) return mapped;
        return bracketMatch[1];
      }
      
      // Look for "Agent: Name" pattern
      const agentColonMatch = content.match(/Agent:\s*([A-Za-z0-9-]+)/i);
      if (agentColonMatch) {
        const name = agentColonMatch[1].toLowerCase();
        const mapped = AGENT_MAPPINGS[name];
        if (mapped) return mapped;
        return agentColonMatch[1];
      }
    }
    
    if (entry.type === 'session' && entry.label) {
      const label = entry.label.toLowerCase();
      for (const [key, value] of Object.entries(AGENT_MAPPINGS)) {
        if (label.includes(key)) return value;
      }
    }
  }
  
  return 'Unknown';
}

/**
 * Parse a single session file for token usage
 */
function parseSessionFile(filePath) {
  const stats = {
    tokensIn: 0,
    tokensOut: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: 0,
    messageCount: 0,
    agentName: 'Unknown',
    sessionId: path.basename(filePath, '.jsonl'),
    timestamp: null
  };
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const sessionData = [];
    
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        sessionData.push(entry);
        
        if (!stats.timestamp && entry.timestamp) {
          stats.timestamp = entry.timestamp;
        }
        
        if (entry.type === 'message' && entry.message?.role === 'assistant') {
          const usage = entry.message.usage;
          if (usage) {
            stats.tokensIn += usage.input || 0;
            stats.tokensOut += usage.output || 0;
            stats.cacheRead += usage.cacheRead || 0;
            stats.cacheWrite += usage.cacheWrite || 0;
            stats.totalTokens += usage.totalTokens || (usage.input + usage.output) || 0;
            
            if (usage.cost && usage.cost.total) {
              stats.cost += usage.cost.total;
            } else {
              const inputCost = (usage.input || 0) * CONFIG.pricing.input / 1000;
              const outputCost = (usage.output || 0) * CONFIG.pricing.output / 1000;
              const cacheReadCost = (usage.cacheRead || 0) * CONFIG.pricing.cacheRead / 1000;
              const cacheWriteCost = (usage.cacheWrite || 0) * CONFIG.pricing.cacheWrite / 1000;
              stats.cost += inputCost + outputCost + cacheReadCost + cacheWriteCost;
            }
            
            stats.messageCount++;
          }
        }
      } catch (e) {
        // Skip malformed lines
      }
    }
    
    stats.agentName = extractAgentName(sessionData);
  } catch (e) {
    console.error(`Error parsing ${filePath}:`, e.message);
  }
  
  return stats;
}

/**
 * Get all session files
 */
function getSessionFiles() {
  try {
    if (!fs.existsSync(CONFIG.sessionsDir)) {
      return [];
    }
    
    return fs.readdirSync(CONFIG.sessionsDir)
      .filter(f => f.endsWith('.jsonl') && !f.includes('.deleted.') && !f.includes('.lock'))
      .map(f => path.join(CONFIG.sessionsDir, f));
  } catch (e) {
    return [];
  }
}

/**
 * Aggregate token stats by agent
 */
function aggregateByAgent(sessionStats) {
  const agentMap = new Map();
  
  // Initialize all 22 agents
  for (const agentName of ALL_AGENTS) {
    agentMap.set(agentName, {
      name: agentName,
      tokensIn: 0,
      tokensOut: 0,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 0,
      cost: 0,
      sessions: 0,
      messages: 0
    });
  }
  
  // Add Unknown category
  agentMap.set('Unknown', {
    name: 'Unknown',
    tokensIn: 0,
    tokensOut: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: 0,
    sessions: 0,
    messages: 0
  });
  
  for (const stats of sessionStats) {
    let agentName = stats.agentName;
    
    if (!agentMap.has(agentName)) {
      const lowerName = agentName.toLowerCase();
      if (AGENT_MAPPINGS[lowerName]) {
        agentName = AGENT_MAPPINGS[lowerName];
      } else {
        agentName = 'Unknown';
      }
    }
    
    const agent = agentMap.get(agentName);
    if (agent) {
      agent.tokensIn += stats.tokensIn;
      agent.tokensOut += stats.tokensOut;
      agent.cacheRead += stats.cacheRead;
      agent.cacheWrite += stats.cacheWrite;
      agent.totalTokens += stats.totalTokens;
      agent.cost += stats.cost;
      agent.sessions++;
      agent.messages += stats.messageCount;
    }
  }
  
  return Array.from(agentMap.values())
    .filter(a => a.totalTokens > 0 || ALL_AGENTS.includes(a.name))
    .sort((a, b) => b.totalTokens - a.totalTokens);
}

/**
 * Get daily token usage
 */
function getDailyUsage(sessionStats) {
  const dailyMap = new Map();
  
  for (const stats of sessionStats) {
    if (!stats.timestamp) continue;
    
    const date = new Date(stats.timestamp).toISOString().split('T')[0];
    
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { date, tokens: 0, cost: 0, sessions: 0 });
    }
    
    const day = dailyMap.get(date);
    day.tokens += stats.totalTokens;
    day.cost += stats.cost;
    day.sessions++;
  }
  
  return Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);
}

/**
 * Calculate total stats
 */
function calculateTotals(agents) {
  return agents.reduce((totals, agent) => ({
    tokensIn: totals.tokensIn + agent.tokensIn,
    tokensOut: totals.tokensOut + agent.tokensOut,
    cacheRead: totals.cacheRead + agent.cacheRead,
    cacheWrite: totals.cacheWrite + agent.cacheWrite,
    totalTokens: totals.totalTokens + agent.totalTokens,
    cost: totals.cost + agent.cost,
    sessions: totals.sessions + agent.sessions,
    messages: totals.messages + agent.messages
  }), {
    tokensIn: 0, tokensOut: 0, cacheRead: 0, cacheWrite: 0,
    totalTokens: 0, cost: 0, sessions: 0, messages: 0
  });
}

/**
 * Collect all token data
 */
function collectTokenData() {
  const sessionFiles = getSessionFiles();
  
  const sessionStats = [];
  for (const filePath of sessionFiles) {
    const stats = parseSessionFile(filePath);
    if (stats.totalTokens > 0 || stats.agentName !== 'Unknown') {
      sessionStats.push(stats);
    }
  }
  
  const agents = aggregateByAgent(sessionStats);
  const dailyUsage = getDailyUsage(sessionStats);
  const total = calculateTotals(agents);
  
  return {
    agents: agents.map(a => ({
      name: a.name,
      tokensIn: a.tokensIn,
      tokensOut: a.tokensOut,
      cacheRead: a.cacheRead,
      cacheWrite: a.cacheWrite,
      totalTokens: a.totalTokens,
      cost: Math.round(a.cost * 10000) / 10000,
      sessions: a.sessions,
      messages: a.messages,
      percentage: total.totalTokens > 0 ? Math.round((a.totalTokens / total.totalTokens) * 1000) / 10 : 0
    })),
    total: {
      tokensIn: total.tokensIn,
      tokensOut: total.tokensOut,
      cacheRead: total.cacheRead,
      cacheWrite: total.cacheWrite,
      totalTokens: total.totalTokens,
      cost: Math.round(total.cost * 10000) / 10000,
      sessions: total.sessions,
      messages: total.messages
    },
    dailyUsage,
    lastUpdated: new Date().toISOString(),
    sessionCount: sessionStats.length,
    allAgents: ALL_AGENTS
  };
}

// Cache for serverless
let memoryCache = {
  data: null,
  timestamp: 0
};

function getCachedData() {
  const now = Date.now();
  if (memoryCache.data && (now - memoryCache.timestamp) < CONFIG.updateInterval) {
    return memoryCache.data;
  }
  return null;
}

function setCachedData(data) {
  memoryCache = {
    data,
    timestamp: Date.now()
  };
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
    const url = new URL(req.url, `http://${req.headers.host}`);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    let data;
    if (!forceRefresh) {
      data = getCachedData();
    }
    
    if (!data) {
      data = collectTokenData();
      setCachedData(data);
    }
    
    const activeAgents = data.agents.filter(a => a.totalTokens > 0);
    const dailyAvg = data.dailyUsage.length > 0 
      ? Math.round(data.dailyUsage.reduce((sum, d) => sum + d.tokens, 0) / data.dailyUsage.length)
      : 0;
    
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      source: 'live',
      summary: {
        totalTokens: data.total.totalTokens,
        totalCost: data.total.cost,
        totalSessions: data.sessionCount,
        activeAgents: activeAgents.length,
        totalAgents: data.allAgents.length,
        dailyAverage: dailyAvg
      },
      agents: data.agents.map(a => ({
        name: a.name,
        tokens: a.totalTokens,
        tokensIn: a.tokensIn,
        tokensOut: a.tokensOut,
        cost: a.cost,
        sessions: a.sessions,
        percentage: a.percentage
      })),
      timeline: data.dailyUsage,
      meta: {
        lastUpdated: data.lastUpdated,
        sessionCount: data.sessionCount,
        agentCount: data.agents.length,
        allAgents: data.allAgents
      }
    });
  } catch (error) {
    console.error('Error in /api/tokens:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
