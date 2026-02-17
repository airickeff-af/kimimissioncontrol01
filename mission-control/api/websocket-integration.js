/**
 * Mission Control WebSocket Integration
 * 
 * Integrates WebSocket server with existing API services
 * Broadcasts events from FileWatcher and TaskQueue to connected clients
 */

const { wsServer, EVENT_TYPES } = require('./websocket');
const path = require('path');

/**
 * Setup WebSocket integration with existing services
 */
function setupWebSocketIntegration(fileWatcher, taskQueue, tokenTracker) {
  console.log('🔌 Setting up WebSocket integration...');

  // ==================== FILE WATCHER EVENTS ====================
  
  if (fileWatcher) {
    fileWatcher.on('fileCreated', (data) => {
      wsServer.broadcastFileChange('created', data.relativePath, {
        agentId: data.agentId,
        size: data.size,
        extension: data.extension
      });
    });

    fileWatcher.on('fileModified', (data) => {
      wsServer.broadcastFileChange('modified', data.relativePath, {
        agentId: data.agentId,
        size: data.size,
        extension: data.extension
      });
    });

    fileWatcher.on('fileDeleted', (data) => {
      wsServer.broadcastFileChange('deleted', data.relativePath, {
        agentId: data.agentId
      });
    });

    fileWatcher.on('agentActivity', (data) => {
      wsServer.broadcast({
        type: EVENT_TYPES.AGENT_ACTIVITY,
        data: {
          agentId: data.agentId,
          fileCount: data.fileCount,
          lastActivity: data.lastActivity
        }
      });
    });
  }

  // ==================== TASK QUEUE EVENTS ====================

  if (taskQueue) {
    taskQueue.on('taskCreated', (data) => {
      wsServer.broadcastTaskCreated(data.task);
    });

    taskQueue.on('taskUpdated', (data) => {
      wsServer.broadcastTaskUpdated(data.taskId, data.updates);
    });

    taskQueue.on('taskCompleted', (data) => {
      wsServer.broadcastTaskCompleted(data.taskId, data.result);
    });

    taskQueue.on('taskAssigned', (data) => {
      wsServer.broadcastTaskAssigned(data.taskId, data.agentId, data.assignedBy);
    });

    taskQueue.on('statusChanged', (data) => {
      wsServer.broadcastTaskUpdated(data.taskId, { status: data.status });
    });
  }

  // ==================== TOKEN TRACKER EVENTS ====================

  if (tokenTracker) {
    // Hook into token tracker updates
    const originalUpdate = tokenTracker.updateTokenData;
    if (originalUpdate) {
      tokenTracker.updateTokenData = function(...args) {
        const result = originalUpdate.apply(this, args);
        
        // Broadcast token usage after update
        const data = tokenTracker.getTokenData();
        if (data.agents && data.agents.length > 0) {
          const latestAgent = data.agents[data.agents.length - 1];
          wsServer.broadcastTokenUsage(
            latestAgent.name,
            latestAgent.totalTokens,
            latestAgent.cost,
            { sessions: latestAgent.sessions }
          );
        }
        
        return result;
      };
    }

    // Monitor for threshold alerts
    const THRESHOLDS = {
      WARNING: 0.8,  // 80%
      CRITICAL: 1.0  // 100%
    };

    // Check thresholds periodically
    setInterval(() => {
      const data = tokenTracker.getTokenData();
      const dailyBudget = 10; // $10 daily budget example
      
      data.agents.forEach(agent => {
        const percentUsed = (agent.cost / dailyBudget) * 100;
        
        if (percentUsed >= THRESHOLDS.WARNING * 100) {
          wsServer.broadcastTokenThreshold(
            agent.name,
            agent.cost,
            dailyBudget,
            percentUsed
          );
        }
      });
    }, 60000); // Check every minute
  }

  // ==================== AGENT STATUS MONITORING ====================

  // Watch for agent state changes
  const agentStates = new Map();
  const AGENTS_DIR = '/root/.openclaw/workspace/mission-control/agents';

  function checkAgentStates() {
    const fs = require('fs');
    
    try {
      const agentDirs = fs.readdirSync(AGENTS_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const agentId of agentDirs) {
        const statePath = path.join(AGENTS_DIR, agentId, 'state.json');
        
        if (fs.existsSync(statePath)) {
          try {
            const content = fs.readFileSync(statePath, 'utf-8');
            const state = JSON.parse(content);
            const previousState = agentStates.get(agentId);

            // Check if status changed
            if (previousState && previousState.status !== state.status) {
              wsServer.broadcastAgentStatus(agentId, state.status, {
                previousStatus: previousState.status,
                lastActive: state.lastActive,
                stats: state.stats
              });
            }

            agentStates.set(agentId, state);
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    } catch (e) {
      // Ignore read errors
    }
  }

  // Check agent states every 5 seconds
  setInterval(checkAgentStates, 5000);

  // ==================== SYSTEM STATUS MONITORING ====================

  // Monitor gateway status
  let lastGatewayStatus = null;
  
  setInterval(() => {
    const fs = require('fs');
    const sentryPath = path.join(AGENTS_DIR, 'sentry', 'state.json');
    
    if (fs.existsSync(sentryPath)) {
      try {
        const content = fs.readFileSync(sentryPath, 'utf-8');
        const sentryData = JSON.parse(content);
        const currentStatus = sentryData.system?.gatewayStatus;

        if (lastGatewayStatus && lastGatewayStatus !== currentStatus) {
          wsServer.broadcastSystemStatus(currentStatus, {
            previousStatus: lastGatewayStatus,
            sessions: sentryData.sessions,
            agents: sentryData.agents
          });

          // Alert on critical status changes
          if (currentStatus !== 'running' && lastGatewayStatus === 'running') {
            wsServer.broadcastSystemAlert('critical', 
              `Gateway status changed to ${currentStatus}`,
              { previousStatus: lastGatewayStatus }
            );
          }
        }

        lastGatewayStatus = currentStatus;
      } catch (e) {
        // Ignore errors
      }
    }
  }, 10000); // Check every 10 seconds

  // ==================== LEAD MONITORING ====================

  // Watch for lead file changes
  const LEADS_FILE = '/root/.openclaw/workspace/mission-control/dashboard/data/leads.json';
  let lastLeadsMtime = null;

  setInterval(() => {
    const fs = require('fs');
    
    if (fs.existsSync(LEADS_FILE)) {
      try {
        const stat = fs.statSync(LEADS_FILE);
        
        if (lastLeadsMtime && stat.mtime > lastLeadsMtime) {
          const content = fs.readFileSync(LEADS_FILE, 'utf-8');
          const leads = JSON.parse(content);
          
          // Find new leads (assuming they have an id or timestamp)
          wsServer.broadcast({
            type: EVENT_TYPES.LEAD_UPDATED,
            data: {
              leadCount: Array.isArray(leads) ? leads.length : 0,
              timestamp: new Date().toISOString()
            }
          });
        }
        
        lastLeadsMtime = stat.mtime;
      } catch (e) {
        // Ignore errors
      }
    }
  }, 5000);

  console.log('✅ WebSocket integration setup complete');
}

/**
 * Start WebSocket server with integration
 */
async function startWebSocketServer(options = {}) {
  const { fileWatcher, taskQueue, tokenTracker } = options;

  // Start WebSocket server
  await wsServer.start();

  // Setup integrations
  setupWebSocketIntegration(fileWatcher, taskQueue, tokenTracker);

  return wsServer;
}

module.exports = {
  setupWebSocketIntegration,
  startWebSocketServer,
  wsServer,
  EVENT_TYPES
};