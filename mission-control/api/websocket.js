/**
 * Mission Control WebSocket Server
 * 
 * Real-time updates for dashboard clients
 * Broadcasts events when data changes:
 * - New leads added
 * - Agent status changes
 * - Token usage updates
 * - Task completions
 * 
 * Reference: Socket.IO-style event broadcasting with native ws
 */

const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const EventEmitter = require('events');

// Configuration
const CONFIG = {
  port: process.env.WS_PORT || 3002,
  heartbeatInterval: 30000,
  reconnectTimeout: 5000,
  maxClients: 100
};

// Event types for broadcasting
const EVENT_TYPES = {
  // Agent events
  AGENT_STATUS_CHANGE: 'agent:statusChange',
  AGENT_ACTIVITY: 'agent:activity',
  
  // Lead/Deal events
  LEAD_ADDED: 'lead:added',
  LEAD_UPDATED: 'lead:updated',
  LEAD_SCORED: 'lead:scored',
  
  // Task events
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_COMPLETED: 'task:completed',
  TASK_ASSIGNED: 'task:assigned',
  
  // Token events
  TOKEN_USAGE: 'token:usage',
  TOKEN_THRESHOLD: 'token:threshold',
  
  // System events
  SYSTEM_ALERT: 'system:alert',
  SYSTEM_STATUS: 'system:status',
  FILE_CHANGE: 'file:change',
  
  // Connection events
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  PING: 'ping',
  PONG: 'pong'
};

/**
 * WebSocket Server with broadcasting capabilities
 */
class MCWebSocketServer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = { ...CONFIG, ...options };
    this.clients = new Map(); // clientId -> { ws, subscriptions, lastPing }
    this.server = null;
    this.wss = null;
    this.heartbeatTimer = null;
    this.messageHistory = []; // Last 100 messages for replay
    this.maxHistory = 100;
  }

  /**
   * Start the WebSocket server
   */
  start() {
    return new Promise((resolve, reject) => {
      // Create HTTP server for health checks and upgrade handling
      this.server = http.createServer((req, res) => {
        this.handleHttpRequest(req, res);
      });

      // Create WebSocket server
      this.wss = new WebSocket.Server({ 
        server: this.server,
        path: '/api/ws',
        perMessageDeflate: {
          zlibDeflateOptions: {
            chunkSize: 1024,
            memLevel: 7,
            level: 3
          },
          zlibInflateOptions: {
            chunkSize: 10 * 1024
          },
          clientNoContextTakeover: true,
          serverNoContextTakeover: true,
          serverMaxWindowBits: 10,
          concurrencyLimit: 10
        }
      });

      // Handle connections
      this.wss.on('connection', (ws, req) => {
        this.handleConnection(ws, req);
      });

      // Handle errors
      this.wss.on('error', (err) => {
        console.error('WebSocket Server Error:', err);
        this.emit('error', err);
      });

      // Start listening
      this.server.listen(this.config.port, () => {
        this.startHeartbeat();
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  /**
   * Handle HTTP requests (health check, metrics)
   */
  handleHttpRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    let response = { error: 'Not found' };
    let statusCode = 404;

    if (parsedUrl.pathname === '/health') {
      response = {
        status: 'ok',
        wsClients: this.clients.size,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };
      statusCode = 200;
    } else if (parsedUrl.pathname === '/metrics') {
      response = this.getMetrics();
      statusCode = 200;
    } else if (parsedUrl.pathname === '/api/ws') {
      response = {
        message: 'WebSocket endpoint',
        protocol: 'ws',
        events: Object.keys(EVENT_TYPES)
      };
      statusCode = 200;
    }

    res.writeHead(statusCode);
    res.end(JSON.stringify(response, null, 2));
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    // Check client limit
    if (this.clients.size >= this.config.maxClients) {
      ws.close(1013, 'Server capacity reached');
      return;
    }

    // Generate client ID
    const clientId = this.generateClientId();
    const clientInfo = {
      id: clientId,
      ws,
      subscriptions: new Set(), // Event types this client wants
      lastPing: Date.now(),
      connectedAt: Date.now(),
      ip: req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    };

    this.clients.set(clientId, clientInfo);


    // Send welcome message
    setImmediate(() => {
      this.sendToClient(clientId, {
        type: EVENT_TYPES.CONNECTED,
        data: {
          clientId,
          serverTime: new Date().toISOString(),
          availableEvents: Object.keys(EVENT_TYPES),
          message: 'Connected to Mission Control WebSocket'
        }
      });
    });

    // Handle messages
    ws.on('message', (data) => {
      this.handleClientMessage(clientId, data);
    });

    // Handle close
    ws.on('close', (code, reason) => {
      this.handleDisconnect(clientId, code, reason);
    });

    // Handle errors
    ws.on('error', (err) => {
      console.error(`WebSocket error for ${clientId}:`, err.message);
      this.emit('clientError', { clientId, error: err });
    });

    // Emit connection event
    this.emit('clientConnected', { clientId, clientInfo });
    this.broadcast({
      type: 'client:connected',
      data: { clientCount: this.clients.size }
    }, { exclude: clientId });
  }

  /**
   * Handle message from client
   */
  handleClientMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'subscribe':
          // Subscribe to specific event types
          if (message.events && Array.isArray(message.events)) {
            message.events.forEach(event => client.subscriptions.add(event));
            this.sendToClient(clientId, {
              type: 'subscribed',
              data: { events: Array.from(client.subscriptions) }
            });
          }
          break;

        case 'unsubscribe':
          // Unsubscribe from events
          if (message.events && Array.isArray(message.events)) {
            message.events.forEach(event => client.subscriptions.delete(event));
          }
          break;

        case 'ping':
          client.lastPing = Date.now();
          this.sendToClient(clientId, { type: EVENT_TYPES.PONG, data: { time: Date.now() } });
          break;

        case 'getHistory':
          // Send recent message history
          const limit = message.limit || 50;
          this.sendToClient(clientId, {
            type: 'history',
            data: this.messageHistory.slice(0, limit)
          });
          break;

        default:
          // Custom message handling
          this.emit('message', { clientId, message });
      }
    } catch (err) {
      console.error(`Invalid message from ${clientId}:`, err.message);
      this.sendToClient(clientId, {
        type: 'error',
        data: { message: 'Invalid JSON message' }
      });
    }
  }

  /**
   * Handle client disconnect
   */
  handleDisconnect(clientId, code, reason) {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.clients.delete(clientId);

    this.emit('clientDisconnected', { clientId, code, reason });
    this.broadcast({
      type: 'client:disconnected',
      data: { clientCount: this.clients.size }
    });
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error(`Failed to send to ${clientId}:`, err.message);
      return false;
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message, options = {}) {
    const { exclude, filter } = options;
    
    // Store in history
    this.addToHistory(message);

    let sentCount = 0;
    for (const [clientId, client] of this.clients) {
      // Skip excluded client
      if (exclude && clientId === exclude) continue;

      // Apply filter if provided
      if (filter && !filter(client, message)) continue;

      // Check if client is subscribed to this event type
      if (client.subscriptions.size > 0 && message.type) {
        const eventCategory = message.type.split(':')[0];
        if (!client.subscriptions.has(message.type) && 
            !client.subscriptions.has(eventCategory) &&
            !client.subscriptions.has('*')) {
          continue;
        }
      }

      if (this.sendToClient(clientId, message)) {
        sentCount++;
      }
    }

    return sentCount;
  }

  /**
   * Add message to history buffer
   */
  addToHistory(message) {
    this.messageHistory.unshift({
      ...message,
      _timestamp: new Date().toISOString()
    });
    if (this.messageHistory.length > this.maxHistory) {
      this.messageHistory.pop();
    }
  }

  /**
   * Start heartbeat to detect dead connections
   */
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      const timeout = this.config.heartbeatInterval * 2;

      for (const [clientId, client] of this.clients) {
        if (now - client.lastPing > timeout) {
          client.ws.terminate();
          this.clients.delete(clientId);
        } else {
          // Send ping
          this.sendToClient(clientId, { type: EVENT_TYPES.PING });
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop the server
   */
  stop() {
    return new Promise((resolve) => {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }

      // Close all client connections
      for (const [clientId, client] of this.clients) {
        client.ws.close(1000, 'Server shutting down');
      }
      this.clients.clear();

      if (this.wss) {
        this.wss.close(() => {
          if (this.server) {
            this.server.close(resolve);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `ws_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get server metrics
   */
  getMetrics() {
    return {
      clients: {
        total: this.clients.size,
        max: this.config.maxClients
      },
      messages: {
        historySize: this.messageHistory.length,
        maxHistory: this.maxHistory
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }

  // ==================== EVENT BROADCAST HELPERS ====================

  /**
   * Broadcast agent status change
   */
  broadcastAgentStatus(agentId, status, details = {}) {
    return this.broadcast({
      type: EVENT_TYPES.AGENT_STATUS_CHANGE,
      data: {
        agentId,
        status,
        timestamp: new Date().toISOString(),
        ...details
      }
    });
  }

  /**
   * Broadcast new lead added
   */
  broadcastLeadAdded(leadData) {
    return this.broadcast({
      type: EVENT_TYPES.LEAD_ADDED,
      data: {
        lead: leadData,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast lead updated
   */
  broadcastLeadUpdated(leadId, updates) {
    return this.broadcast({
      type: EVENT_TYPES.LEAD_UPDATED,
      data: {
        leadId,
        updates,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast lead scored
   */
  broadcastLeadScored(leadId, score, factors) {
    return this.broadcast({
      type: EVENT_TYPES.LEAD_SCORED,
      data: {
        leadId,
        score,
        factors,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast task created
   */
  broadcastTaskCreated(task) {
    return this.broadcast({
      type: EVENT_TYPES.TASK_CREATED,
      data: {
        task,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast task updated
   */
  broadcastTaskUpdated(taskId, updates) {
    return this.broadcast({
      type: EVENT_TYPES.TASK_UPDATED,
      data: {
        taskId,
        updates,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast task completed
   */
  broadcastTaskCompleted(taskId, result) {
    return this.broadcast({
      type: EVENT_TYPES.TASK_COMPLETED,
      data: {
        taskId,
        result,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast task assigned
   */
  broadcastTaskAssigned(taskId, agentId, assignedBy) {
    return this.broadcast({
      type: EVENT_TYPES.TASK_ASSIGNED,
      data: {
        taskId,
        agentId,
        assignedBy,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast token usage update
   */
  broadcastTokenUsage(agentName, tokens, cost, sessionInfo = {}) {
    return this.broadcast({
      type: EVENT_TYPES.TOKEN_USAGE,
      data: {
        agent: agentName,
        tokens,
        cost,
        session: sessionInfo,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast token threshold alert
   */
  broadcastTokenThreshold(agentName, currentCost, threshold, percentUsed) {
    return this.broadcast({
      type: EVENT_TYPES.TOKEN_THRESHOLD,
      data: {
        agent: agentName,
        currentCost,
        threshold,
        percentUsed,
        alert: percentUsed >= 100 ? 'critical' : percentUsed >= 80 ? 'warning' : 'info',
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast system alert
   */
  broadcastSystemAlert(level, message, details = {}) {
    return this.broadcast({
      type: EVENT_TYPES.SYSTEM_ALERT,
      data: {
        level, // critical, warning, info
        message,
        details,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast system status change
   */
  broadcastSystemStatus(status, details = {}) {
    return this.broadcast({
      type: EVENT_TYPES.SYSTEM_STATUS,
      data: {
        status,
        details,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast file change
   */
  broadcastFileChange(action, filePath, details = {}) {
    return this.broadcast({
      type: EVENT_TYPES.FILE_CHANGE,
      data: {
        action, // created, modified, deleted
        path: filePath,
        ...details,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Export singleton instance and class
const wsServer = new MCWebSocketServer();

module.exports = {
  MCWebSocketServer,
  wsServer,
  EVENT_TYPES
};

// Start if run directly
if (require.main === module) {
  wsServer.start().catch(err => {
    console.error('Failed to start WebSocket server:', err);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    wsServer.stop().then(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    wsServer.stop().then(() => process.exit(0));
  });
}