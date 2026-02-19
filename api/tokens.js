// Vercel Serverless API: /api/tokens.js
// Returns REAL token usage data parsed from ACTUAL session transcript files
// Reads from: /root/.openclaw/agents/main/sessions/*.jsonl and /root/.openclaw/cron/runs/*.jsonl

const fs = require('fs');
const path = require('path');

// Token cost configuration - Kimi K2.5: ~$0.002 per 1K tokens
const TOKEN_COST_PER_1K = 0.002;
const DAILY_BUDGET_LIMIT = 500000; // 500K tokens daily budget

// Known agent names for classification
const KNOWN_AGENTS = [
  'DealFlow', 'Nexus', 'Forge', 'Code', 'Pixel', 'Audit', 
  'ColdCall', 'Scout', 'Glasses', 'Quill', 'Gary', 'Larry', 
  'Sentry', 'Cipher', 'PIE', 'cron', 'subagent', 'main',
  'heartbeat', 'sentry-deployment', 'quality-gate'
];

// Extract agent name from various sources
function extractAgentName(sessionKey, firstMessageText, fileName) {
  // Try sessionKey first
  if (sessionKey) {
    const parts = sessionKey.split(':');
    if (parts.length >= 3) {
      const potentialName = parts[2];
      
      // Direct match
      if (KNOWN_AGENTS.includes(potentialName)) {
        return potentialName;
      }
      
      // Cron job classification
      if (potentialName === 'cron' && parts.length >= 4) {
        const jobId = parts[3].toLowerCase();
        if (jobId.includes('heartbeat')) return 'Nexus';
        if (jobId.includes('sentry')) return 'Sentry';
        if (jobId.includes('audit')) return 'Audit';
        if (jobId.includes('deploy')) return 'Sentry';
        if (jobId.includes('quality')) return 'Audit';
        if (jobId.includes('health')) return 'Nexus';
        return 'cron';
      }
      
      if (potentialName === 'subagent') return 'subagent';
      if (potentialName.length > 2 && potentialName.length < 20) {
        return potentialName;
      }
    }
  }
  
  // Try first message text (contains agent designation)
  if (firstMessageText) {
    const text = firstMessageText.toLowerCase();
    
    // Check for explicit agent mentions
    for (const agent of KNOWN_AGENTS) {
      if (text.includes(agent.toLowerCase())) return agent;
    }
    
    // Check for patterns like "You are AgentName"
    const youAreMatch = firstMessageText.match(/You are\s+(\w+)/i);
    if (youAreMatch) {
      const name = youAreMatch[1];
      if (KNOWN_AGENTS.includes(name)) return name;
    }
    
    // Check for agent label in brackets
    const bracketMatch = firstMessageText.match(/\[([^\]]+)\]/);
    if (bracketMatch) {
      const content = bracketMatch[1].toLowerCase();
      for (const agent of KNOWN_AGENTS) {
        if (content.includes(agent.toLowerCase())) return agent;
      }
    }
  }
  
  // Try filename
  if (fileName) {
    const fileLower = fileName.toLowerCase();
    for (const agent of KNOWN_AGENTS) {
      if (fileLower.includes(agent.toLowerCase())) return agent;
    }
  }
  
  return 'unknown';
}

// Parse a single session file for token usage
function parseSessionFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    let totalTokens = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let cacheReadTokens = 0;
    let cacheWriteTokens = 0;
    let agentName = 'unknown';
    let sessionStart = null;
    let sessionEnd = null;
    let sessionKey = null;
    let firstMessageText = null;
    let messageCount = 0;
    let toolCallCount = 0;
    let toolResultCount = 0;
    
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        
        // Track session time
        if (entry.ts || entry.timestamp) {
          const ts = entry.ts || new Date(entry.timestamp).getTime();
          if (!sessionStart || ts < sessionStart) sessionStart = ts;
          if (!sessionEnd || ts > sessionEnd) sessionEnd = ts;
        }
        
        // Extract sessionKey from various locations
        if (entry.sessionKey) {
          sessionKey = entry.sessionKey;
        }
        
        // Extract from message entries
        if (entry.type === 'message' && entry.message) {
          messageCount++;
          
          // Get first message text for agent identification
          if (!firstMessageText && entry.message.content) {
            for (const content of entry.message.content) {
              if (content.type === 'text' && content.text) {
                firstMessageText = content.text;
                break;
              }
            }
          }
          
          // Check for usage data in message
          if (entry.message.usage) {
            const usage = entry.message.usage;
            const input = usage.input || 0;
            const output = usage.output || 0;
            const cacheRead = usage.cacheRead || 0;
            const cacheWrite = usage.cacheWrite || 0;
            const total = usage.totalTokens || (input + output + cacheRead + cacheWrite);
            
            inputTokens += input;
            outputTokens += output;
            cacheReadTokens += cacheRead;
            cacheWriteTokens += cacheWrite;
            totalTokens += total;
          }
          
          // Extract sessionKey from tool results
          if (entry.message.role === 'toolResult' && entry.message.details?.sessionKey) {
            sessionKey = entry.message.details.sessionKey;
          }
        }
        
        // Count tool calls and results
        if (entry.type === 'message' && entry.message?.content) {
          for (const content of entry.message.content) {
            if (content.type === 'toolCall') {
              toolCallCount++;
            } else if (content.type === 'toolResult') {
              toolResultCount++;
            }
          }
        }
        
      } catch (e) {
        // Skip invalid JSON lines
      }
    }
    
    // Extract agent name from all available sources
    agentName = extractAgentName(sessionKey, firstMessageText, path.basename(filePath));
    
    // Get file stats
    const stats = fs.statSync(filePath);
    
    return {
      filePath,
      fileName: path.basename(filePath),
      agentName,
      sessionKey,
      totalTokens,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens,
      messageCount,
      toolCallCount,
      toolResultCount,
      sessionStart,
      sessionEnd,
      mtime: stats.mtime.getTime(),
      size: stats.size
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return null;
  }
}

// Get all session files from directories
function getAllSessionFiles() {
  const sessionDirs = [
    '/root/.openclaw/agents/main/sessions',
    '/root/.openclaw/cron/runs'
  ];
  
  const allFiles = [];
  
  for (const dir of sessionDirs) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir)
          .filter(f => f.endsWith('.jsonl') && !f.includes('.deleted.'))
          .map(f => path.join(dir, f));
        allFiles.push(...files);
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error.message);
    }
  }
  
  return allFiles;
}

// Aggregate tokens by agent
function aggregateByAgent(sessionData) {
  const agentMap = new Map();
  
  for (const session of sessionData) {
    if (!agentMap.has(session.agentName)) {
      agentMap.set(session.agentName, {
        name: session.agentName,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        sessions: 0,
        messages: 0,
        toolCalls: 0,
        toolResults: 0,
        lastActive: 0
      });
    }
    
    const agent = agentMap.get(session.agentName);
    agent.totalTokens += session.totalTokens;
    agent.inputTokens += session.inputTokens;
    agent.outputTokens += session.outputTokens;
    agent.cacheReadTokens += session.cacheReadTokens;
    agent.cacheWriteTokens += session.cacheWriteTokens;
    agent.sessions++;
    agent.messages += session.messageCount;
    agent.toolCalls += session.toolCallCount;
    agent.toolResults += session.toolResultCount;
    
    if (session.mtime > agent.lastActive) {
      agent.lastActive = session.mtime;
    }
  }
  
  return Array.from(agentMap.values());
}

// Calculate cost from tokens
function calculateCost(tokens) {
  return parseFloat(((tokens / 1000) * TOKEN_COST_PER_1K).toFixed(2));
}

// Get timeline data (hourly for last 24h)
function getTimelineData(sessionData) {
  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  const hourlyData = new Map();
  
  // Initialize all 24 hours
  for (let i = 0; i < 24; i++) {
    const hour = new Date(now - (i * 60 * 60 * 1000));
    const hourKey = `${hour.getHours().toString().padStart(2, '0')}:00`;
    hourlyData.set(hourKey, 0);
  }
  
  // Aggregate tokens by hour
  for (const session of sessionData) {
    if (session.mtime >= oneDayAgo && session.totalTokens > 0) {
      const hour = new Date(session.mtime);
      const hourKey = `${hour.getHours().toString().padStart(2, '0')}:00`;
      if (hourlyData.has(hourKey)) {
        hourlyData.set(hourKey, hourlyData.get(hourKey) + session.totalTokens);
      }
    }
  }
  
  // Convert to array and sort by hour
  return Array.from(hourlyData.entries())
    .map(([hour, tokens]) => ({ hour, tokens }))
    .sort((a, b) => a.hour.localeCompare(b.hour));
}

// Calculate burn rate (tokens per hour)
function calculateBurnRate(sessionData) {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  
  const recentTokens = sessionData
    .filter(s => s.mtime >= oneHourAgo)
    .reduce((sum, s) => sum + s.totalTokens, 0);
  
  return recentTokens;
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const startTime = Date.now();
    
    // Get all session files
    const sessionFiles = getAllSessionFiles();
    
    // Parse all session files
    const sessionData = sessionFiles
      .map(parseSessionFile)
      .filter(s => s !== null);
    
    // Aggregate by agent
    const agentData = aggregateByAgent(sessionData);
    
    // Sort by tokens (descending)
    agentData.sort((a, b) => b.totalTokens - a.totalTokens);
    
    // Calculate totals
    const totalTokens = agentData.reduce((sum, a) => sum + a.totalTokens, 0);
    const totalInputTokens = agentData.reduce((sum, a) => sum + a.inputTokens, 0);
    const totalOutputTokens = agentData.reduce((sum, a) => sum + a.outputTokens, 0);
    const totalCacheRead = agentData.reduce((sum, a) => sum + a.cacheReadTokens, 0);
    const totalCacheWrite = agentData.reduce((sum, a) => sum + a.cacheWriteTokens, 0);
    const totalCost = calculateCost(totalTokens);
    
    // Calculate today's usage (sessions modified today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    const todayTokens = sessionData
      .filter(s => s.mtime >= todayTimestamp)
      .reduce((sum, s) => sum + s.totalTokens, 0);
    const todayCost = calculateCost(todayTokens);
    
    // Calculate active sessions (last 24h)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const activeSessions = sessionData.filter(s => s.mtime >= oneDayAgo).length;
    
    // Get timeline
    const timeline = getTimelineData(sessionData);
    
    // Calculate burn rate
    const burnRate = calculateBurnRate(sessionData);
    
    // Format agents for response
    const agents = agentData.map(agent => ({
      name: agent.name,
      tokens: agent.totalTokens,
      inputTokens: agent.inputTokens,
      outputTokens: agent.outputTokens,
      cacheReadTokens: agent.cacheReadTokens,
      cacheWriteTokens: agent.cacheWriteTokens,
      cost: calculateCost(agent.totalTokens),
      sessions: agent.sessions,
      messages: agent.messages,
      toolCalls: agent.toolCalls,
      toolResults: agent.toolResults,
      efficiency: agent.totalTokens > 0 ? ((agent.toolCalls / agent.totalTokens) * 1000).toFixed(1) : '0.0',
      lastActive: new Date(agent.lastActive).toISOString()
    }));
    
    // Calculate budget usage
    const budgetUsed = totalTokens > 0 ? Math.min(100, parseFloat(((totalTokens / DAILY_BUDGET_LIMIT) * 100).toFixed(1))) : 0;
    
    const responseTime = Date.now() - startTime;
    
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      source: 'live_sessions',
      summary: {
        totalTokens,
        totalInputTokens,
        totalOutputTokens,
        totalCacheRead,
        totalCacheWrite,
        totalCost,
        todayTokens,
        todayCost,
        activeSessions,
        burnRate,
        budgetUsed,
        budgetRemaining: Math.max(0, DAILY_BUDGET_LIMIT - totalTokens),
        totalSessions: sessionData.length,
        totalMessages: agentData.reduce((sum, a) => sum + a.messages, 0),
        totalToolCalls: agentData.reduce((sum, a) => sum + a.toolCalls, 0),
        totalToolResults: agentData.reduce((sum, a) => sum + a.toolResults, 0)
      },
      agents,
      timeline,
      meta: {
        filesAnalyzed: sessionFiles.length,
        sessionsWithTokens: sessionData.filter(s => s.totalTokens > 0).length,
        responseTimeMs: responseTime,
        tokenCostPer1K: TOKEN_COST_PER_1K
      }
    });
    
  } catch (error) {
    console.error('Error in tokens API:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
