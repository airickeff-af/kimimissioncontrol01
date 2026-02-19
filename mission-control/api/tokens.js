/**
 * Token Tracker API
 * 
 * Provides live token usage data parsed from session transcripts.
 * Calculates tokens in/out, cost estimates by agent.
 * 
 * Endpoint: GET /api/tokens
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  sessionsDir: '/root/.openclaw/agents/main/sessions',
  cacheFile: '/root/.openclaw/workspace/mission-control/data/token-cache.json',
  updateInterval: 15 * 60 * 1000, // 15 minutes
  // Pricing per 1K tokens (approximate for Kimi k2p5)
  pricing: {
    input: 0.0001,      // $0.10 per 1M tokens
    output: 0.0004,     // $0.40 per 1M tokens
    cacheRead: 0.000025, // $0.025 per 1M tokens
    cacheWrite: 0.0001   // $0.10 per 1M tokens
  }
};

// Complete list of all 22 agents with proper mappings
const ALL_AGENTS = [
  'Nexus', 'Code', 'Scout', 'Pixel', 'Forge', 'DealFlow', 'Audit',
  'Quill', 'Gary', 'Larry', 'Sentry', 'Cipher', 'Glasses', 'Buzz', 'PIE',
  'Code-1', 'Code-2', 'Code-3',
  'Forge-1', 'Forge-2', 'Forge-3'
];

// Agent name mappings from session labels and content patterns
const AGENT_MAPPINGS = {
  // Core agents
  'nexus': 'Nexus',
  'code': 'Code',
  'scout': 'Scout',
  'pixel': 'Pixel',
  'forge': 'Forge',
  'dealflow': 'DealFlow',
  'audit': 'Audit',
  
  // Additional agents (the missing 14)
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
  
  // Sub-agent variants
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
  // Try to find agent name from first user message
  for (const entry of sessionData) {
    if (entry.type === 'message' && entry.message?.role === 'user') {
      const content = entry.message.content?.[0]?.text || '';
      
      // Look for "You are [Name]" pattern
      const youAreMatch = content.match(/You are\s+([A-Za-z0-9-]+)/i);
      if (youAreMatch) {
        const name = youAreMatch[1].toLowerCase();
        const mapped = AGENT_MAPPINGS[name];
        if (mapped) return mapped;
        // Capitalize first letter if not in mappings
        return youAreMatch[1].charAt(0).toUpperCase() + youAreMatch[1].slice(1);
      }
      
      // Look for agent name in brackets at start [Agent Name]
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
      
      // Check for agent names in the content with "you are" phrase
      for (const [key, value] of Object.entries(AGENT_MAPPINGS)) {
        if (content.toLowerCase().includes(`you are ${key}`) ||
            content.toLowerCase().includes(`agent: ${key}`) ||
            content.toLowerCase().includes(`${key} agent`)) {
          return value;
        }
      }
    }
    
    // Check session label if present
    if (entry.type === 'session' && entry.label) {
      const label = entry.label.toLowerCase();
      for (const [key, value] of Object.entries(AGENT_MAPPINGS)) {
        if (label.includes(key)) {
          return value;
        }
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
        
        // Get session timestamp from first entry
        if (!stats.timestamp && entry.timestamp) {
          stats.timestamp = entry.timestamp;
        }
        
        // Extract usage from assistant messages
        if (entry.type === 'message' && entry.message?.role === 'assistant') {
          const usage = entry.message.usage;
          if (usage) {
            stats.tokensIn += usage.input || 0;
            stats.tokensOut += usage.output || 0;
            stats.cacheRead += usage.cacheRead || 0;
            stats.cacheWrite += usage.cacheWrite || 0;
            stats.totalTokens += usage.totalTokens || (usage.input + usage.output) || 0;
            
            // Use provided cost or calculate
            if (usage.cost && usage.cost.total) {
              stats.cost += usage.cost.total;
            } else {
              // Calculate cost based on token counts
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
    
    // Extract agent name from session content
    stats.agentName = extractAgentName(sessionData);
    
  } catch (e) {
    console.error(`Error parsing ${filePath}:`, e.message);
  }
  
  return stats;
}

/**
 * Get all session files (excluding deleted and lock files)
 */
function getSessionFiles() {
  try {
    if (!fs.existsSync(CONFIG.sessionsDir)) {
      console.error(`Sessions directory not found: ${CONFIG.sessionsDir}`);
      return [];
    }
    
    return fs.readdirSync(CONFIG.sessionsDir)
      .filter(f => f.endsWith('.jsonl') && !f.includes('.deleted.') && !f.includes('.lock'))
      .map(f => path.join(CONFIG.sessionsDir, f));
  } catch (e) {
    console.error('Error reading sessions directory:', e.message);
    return [];
  }
}

/**
 * Aggregate token stats by agent
 */
function aggregateByAgent(sessionStats) {
  const agentMap = new Map();
  
  // Initialize all 22 agents with zero values
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
  
  // Add Unknown category for unmapped sessions
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
    
    // Map to known agent if possible
    if (!agentMap.has(agentName)) {
      // Try to find a match in mappings
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
  
  // Filter out agents with zero tokens, but keep all 22 if they have data
  return Array.from(agentMap.values())
    .filter(a => a.totalTokens > 0 || ALL_AGENTS.includes(a.name))
    .sort((a, b) => b.totalTokens - a.totalTokens);
}

/**
 * Get daily token usage for trend chart
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
    .slice(-7); // Last 7 days
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

/**
 * Get recent sessions for timeline
 */
function getRecentSessions(sessionStats, limit = 10) {
  return sessionStats
    .filter(s => s.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
    .map(s => ({
      sessionId: s.sessionId,
      agent: s.agentName,
      timestamp: s.timestamp,
      tokens: s.totalTokens,
      cost: s.cost,
      messages: s.messageCount
    }));
}

/**
 * Main function to collect all token data
 */
function collectTokenData() {
  const sessionFiles = getSessionFiles();
  console.log(`Found ${sessionFiles.length} session files`);
  
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
  const recentSessions = getRecentSessions(sessionStats);
  
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
    recentSessions,
    lastUpdated: new Date().toISOString(),
    sessionCount: sessionStats.length,
    allAgents: ALL_AGENTS
  };
}

/**
 * Save data to cache file
 */
function saveCache(data) {
  try {
    const cacheDir = path.dirname(CONFIG.cacheFile);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG.cacheFile, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error saving cache:', e.message);
  }
}

/**
 * Load data from cache
 */
function loadCache() {
  try {
    if (fs.existsSync(CONFIG.cacheFile)) {
      const content = fs.readFileSync(CONFIG.cacheFile, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error loading cache:', e.message);
  }
  return null;
}

/**
 * Check if cache is stale (older than update interval)
 */
function isCacheStale(cachedData) {
  if (!cachedData || !cachedData.lastUpdated) return true;
  
  const lastUpdate = new Date(cachedData.lastUpdated).getTime();
  const now = Date.now();
  return (now - lastUpdate) > CONFIG.updateInterval;
}

/**
 * Get token data (from cache or fresh)
 */
function getTokenData(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = loadCache();
    if (cached && !isCacheStale(cached)) {
      console.log('Returning cached token data');
      return cached;
    }
  }
  
  console.log('Collecting fresh token data...');
  const data = collectTokenData();
  saveCache(data);
  return data;
}

/**
 * HTTP request handler for /api/tokens endpoint
 */
function handleTokensRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const forceRefresh = url.searchParams.get('refresh') === 'true';
  
  const data = getTokenData(forceRefresh);
  
  // Calculate summary for response
  const activeAgents = data.agents.filter(a => a.totalTokens > 0);
  const dailyAvg = data.dailyUsage.length > 0 
    ? Math.round(data.dailyUsage.reduce((sum, d) => sum + d.tokens, 0) / data.dailyUsage.length)
    : 0;
  
  // Format response according to spec
  const response = {
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
  };
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.writeHead(200);
  res.end(JSON.stringify(response, null, 2));
}

// Export for use in server.js
module.exports = {
  getTokenData,
  handleTokensRequest,
  collectTokenData
};

// If run directly, print token data
if (require.main === module) {
  const data = collectTokenData();
  console.log(JSON.stringify(data, null, 2));
}
