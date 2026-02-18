// Vercel Serverless API: Activity Logs
// Returns agent activity logs for the logs-view dashboard

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  workspaceRoot: '/root/.openclaw',
  missionControlDir: '/root/.openclaw/workspace/mission-control',
  agentsDir: '/root/.openclaw/workspace/mission-control/agents',
  logsDir: '/root/.openclaw/workspace/logs',
  sessionsDir: '/root/.openclaw/agents/main/sessions'
};

/**
 * Parse session transcript files for activity data
 */
function parseSessionTranscripts() {
  const activities = [];
  const sessionsDir = CONFIG.sessionsDir;
  
  // Check if sessions directory exists
  if (!fs.existsSync(sessionsDir)) {
    console.log('Sessions directory not found:', sessionsDir);
    return activities;
  }
  
  try {
    const files = fs.readdirSync(sessionsDir)
      .filter(f => f.endsWith('.jsonl') || f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, 10); // Last 10 session files
    
    for (const file of files) {
      const filePath = path.join(sessionsDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());
        
        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (entry.timestamp || entry.time || entry.created_at) {
              activities.push({
                timestamp: entry.timestamp || entry.time || entry.created_at,
                agent: entry.agent || entry.agent_id || entry.source || 'system',
                type: entry.type || entry.event_type || 'system',
                message: entry.message || entry.content || entry.text || JSON.stringify(entry).slice(0, 200),
                sessionId: entry.session_id || entry.sessionId || file.replace('.jsonl', '').replace('.json', '')
              });
            }
          } catch (e) {
            // Skip malformed lines
          }
        }
      } catch (e) {
        console.error(`Error reading ${file}:`, e.message);
      }
    }
  } catch (e) {
    console.error('Error reading sessions:', e.message);
  }
  
  return activities;
}

/**
 * Parse agent state files for activity
 */
function parseAgentStates() {
  const activities = [];
  
  try {
    if (!fs.existsSync(CONFIG.agentsDir)) {
      return activities;
    }
    
    const agentDirs = fs.readdirSync(CONFIG.agentsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const agentId of agentDirs) {
      const statePath = path.join(CONFIG.agentsDir, agentId, 'state.json');
      const memoryPath = path.join(CONFIG.agentsDir, agentId, 'memory');
      
      // Check state file
      if (fs.existsSync(statePath)) {
        try {
          const content = fs.readFileSync(statePath, 'utf-8');
          const state = JSON.parse(content);
          
          if (state.lastActive || state.lastUpdated) {
            activities.push({
              timestamp: state.lastActive || state.lastUpdated,
              agent: agentId,
              type: 'agent_response',
              message: `Agent ${agentId} status: ${state.status || 'unknown'}`,
              sessionId: state.currentSession || 'unknown'
            });
          }
          
          // Check for completed tasks
          if (state.stats && state.stats.tasksCompleted > 0) {
            activities.push({
              timestamp: state.lastActive || new Date().toISOString(),
              agent: agentId,
              type: 'task_complete',
              message: `Agent ${agentId} completed ${state.stats.tasksCompleted} tasks`,
              sessionId: 'system'
            });
          }
        } catch (e) {
          // Skip malformed state
        }
      }
      
      // Check memory files for recent activity
      if (fs.existsSync(memoryPath)) {
        try {
          const memFiles = fs.readdirSync(memoryPath)
            .filter(f => f.endsWith('.md'))
            .sort()
            .reverse()
            .slice(0, 3);
          
          for (const memFile of memFiles) {
            const memFilePath = path.join(memoryPath, memFile);
            const stat = fs.statSync(memFilePath);
            
            activities.push({
              timestamp: stat.mtime.toISOString(),
              agent: agentId,
              type: 'system',
              message: `Memory file updated: ${memFile}`,
              sessionId: 'memory'
            });
          }
        } catch (e) {
          // Skip memory errors
        }
      }
    }
  } catch (e) {
    console.error('Error reading agent states:', e.message);
  }
  
  return activities;
}

/**
 * Parse system logs
 */
function parseSystemLogs() {
  const activities = [];
  
  try {
    if (!fs.existsSync(CONFIG.logsDir)) {
      return activities;
    }
    
    const logFiles = fs.readdirSync(CONFIG.logsDir)
      .filter(f => f.endsWith('.log') || f.endsWith('.md'))
      .sort()
      .reverse()
      .slice(0, 5);
    
    for (const logFile of logFiles) {
      const logPath = path.join(CONFIG.logsDir, logFile);
      try {
        const content = fs.readFileSync(logPath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim()).slice(-20);
        
        for (const line of lines) {
          // Try to parse log line: [timestamp] [AGENT] LEVEL: message
          const match = line.match(/\[(.+?)\]\s*\[(.+?)\]\s*(\w+):\s*(.+)/);
          if (match) {
            activities.push({
              timestamp: match[1],
              agent: match[2],
              type: match[3].toLowerCase() === 'error' ? 'error' : 'system',
              message: match[4],
              sessionId: 'system'
            });
          }
        }
      } catch (e) {
        console.error(`Error reading log ${logFile}:`, e.message);
      }
    }
  } catch (e) {
    console.error('Error reading system logs:', e.message);
  }
  
  return activities;
}

/**
 * Generate sample/demo data if no real data exists
 */
function generateDemoData() {
  const now = new Date();
  const agents = ['Nexus', 'Code', 'Scout', 'Pixel', 'Forge', 'DealFlow', 'Audit', 'Glasses', 'Quill'];
  const types = ['user_message', 'agent_response', 'task_complete', 'system'];
  
  const demoActivities = [];
  
  for (let i = 0; i < 50; i++) {
    const time = new Date(now.getTime() - i * 5 * 60 * 1000); // 5 min intervals
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let message = '';
    switch (type) {
      case 'user_message':
        message = `User requested ${agent} to perform task ${100 + i}`;
        break;
      case 'agent_response':
        message = `${agent} responded with status update and progress report`;
        break;
      case 'task_complete':
        message = `${agent} completed task ${100 + i} successfully`;
        break;
      default:
        message = `System event: ${agent} heartbeat check`;
    }
    
    demoActivities.push({
      timestamp: time.toISOString(),
      agent: agent,
      type: type,
      message: message,
      sessionId: `demo-${Math.floor(i / 10)}`
    });
  }
  
  return demoActivities;
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    // Collect activities from various sources
    let allActivities = [];
    
    // Try to get real data
    const sessionActivities = parseSessionTranscripts();
    const agentActivities = parseAgentStates();
    const systemActivities = parseSystemLogs();
    
    allActivities = [...sessionActivities, ...agentActivities, ...systemActivities];
    
    // If no real data, use demo data
    if (allActivities.length === 0) {
      allActivities = generateDemoData();
    }
    
    // Sort by timestamp descending
    allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply limit
    const limitedActivities = allActivities.slice(0, limit);
    
    res.status(200).json({
      success: true,
      logs: limitedActivities,
      meta: {
        total: allActivities.length,
        returned: limitedActivities.length,
        limit: limit,
        timestamp: new Date().toISOString(),
        sources: {
          sessions: sessionActivities.length,
          agents: agentActivities.length,
          system: systemActivities.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      logs: generateDemoData().slice(0, 50)
    });
  }
};
