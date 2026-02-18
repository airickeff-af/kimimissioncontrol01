/**
 * Mission Control Real-Time Client
 * 
 * WebSocket client library for dashboard real-time updates
 * Features:
 * - Auto-reconnect with exponential backoff
 * - Event subscription management
 * - Fallback to polling if WebSocket fails
 * - Message history replay
 * - Connection state tracking
 * 
 * Reference: Socket.IO client patterns with native WebSocket
 */

(function(global) {
  'use strict';

  // Default configuration
  const DEFAULT_CONFIG = {
    wsUrl: null, // Auto-detect: ws://localhost:3002/api/ws
    apiUrl: null, // Auto-detect: http://localhost:3001
    reconnectInterval: 1000,
    maxReconnectInterval: 30000,
    reconnectDecay: 1.5,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
    enablePolling: true,
    pollingInterval: 30000,
    messageHistoryLimit: 100,
    debug: false
  };

  // Event types (must match server)
  const EVENT_TYPES = {
    AGENT_STATUS_CHANGE: 'agent:statusChange',
    AGENT_ACTIVITY: 'agent:activity',
    LEAD_ADDED: 'lead:added',
    LEAD_UPDATED: 'lead:updated',
    LEAD_SCORED: 'lead:scored',
    TASK_CREATED: 'task:created',
    TASK_UPDATED: 'task:updated',
    TASK_COMPLETED: 'task:completed',
    TASK_ASSIGNED: 'task:assigned',
    TOKEN_USAGE: 'token:usage',
    TOKEN_THRESHOLD: 'token:threshold',
    SYSTEM_ALERT: 'system:alert',
    SYSTEM_STATUS: 'system:status',
    FILE_CHANGE: 'file:change',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    PING: 'ping',
    PONG: 'pong'
  };

  // Connection states
  const CONNECTION_STATE = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    RECONNECTING: 'reconnecting',
    ERROR: 'error',
    POLLING: 'polling' // Fallback mode
  };

  /**
   * Real-time client for Mission Control
   */
  class MCRealtimeClient extends EventTarget {
    constructor(config = {}) {
      super();
      
      this.config = { ...DEFAULT_CONFIG, ...config };
      
      // Auto-detect URLs if not provided
      if (!this.config.wsUrl) {
        const isLocalhost = typeof window !== 'undefined' && 
                           (window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1');
        const protocol = isLocalhost ? 'ws:' : 'wss:';
        this.config.wsUrl = `${protocol}//${window.location.hostname}:3002/api/ws`;
      }
      
      if (!this.config.apiUrl) {
        const isLocalhost = typeof window !== 'undefined' && 
                           (window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1');
        const protocol = isLocalhost ? 'http:' : 'https:';
        this.config.apiUrl = `${protocol}//${window.location.hostname}:3001`;
      }

      // State
      this.state = CONNECTION_STATE.DISCONNECTED;
      this.ws = null;
      this.clientId = null;
      this.subscriptions = new Set();
      this.messageHistory = [];
      this.reconnectAttempts = 0;
      this.reconnectTimer = null;
      this.heartbeatTimer = null;
      this.pollingTimer = null;
      this.lastEventId = null;
      this.eventHandlers = new Map();
      
      // Metrics
      this.metrics = {
        messagesReceived: 0,
        messagesSent: 0,
        reconnects: 0,
        lastConnectedAt: null,
        totalUptime: 0
      };

      this._log('MCRealtimeClient initialized', this.config);
    }

    // ==================== CONNECTION MANAGEMENT ====================

    /**
     * Connect to WebSocket server
     */
    connect() {
      if (this.state === CONNECTION_STATE.CONNECTED || 
          this.state === CONNECTION_STATE.CONNECTING) {
        this._log('Already connected or connecting');
        return Promise.resolve();
      }

      this.state = CONNECTION_STATE.CONNECTING;
      this._emitStateChange();

      return new Promise((resolve, reject) => {
        try {
          this._log('Connecting to WebSocket...', this.config.wsUrl);
          
          this.ws = new WebSocket(this.config.wsUrl);

          this.ws.onopen = (event) => {
            this._log('WebSocket connected');
            this.state = CONNECTION_STATE.CONNECTED;
            this.reconnectAttempts = 0;
            this.metrics.lastConnectedAt = Date.now();
            this.metrics.reconnects++;
            
            this._emitStateChange();
            this._startHeartbeat();
            this._stopPolling(); // Stop polling if we were in fallback mode
            
            // Re-subscribe to previous subscriptions
            if (this.subscriptions.size > 0) {
              this._subscribe(Array.from(this.subscriptions));
            }

            // Request message history
            this._requestHistory();

            this.dispatchEvent(new CustomEvent('connected', { 
              detail: { clientId: this.clientId } 
            }));
            
            resolve();
          };

          this.ws.onmessage = (event) => {
            this._handleMessage(event.data);
          };

          this.ws.onclose = (event) => {
            this._log('WebSocket closed', event.code, event.reason);
            this._cleanup();
            
            if (!event.wasClean && this.reconnectAttempts < this.config.maxReconnectAttempts) {
              this._scheduleReconnect();
            } else {
              this.state = CONNECTION_STATE.DISCONNECTED;
              this._emitStateChange();
              this._startPolling(); // Fallback to polling
              
              if (event.wasClean) {
                resolve();
              } else {
                reject(new Error(`Connection closed: ${event.reason}`));
              }
            }
          };

          this.ws.onerror = (error) => {
            this._log('WebSocket error', error);
            this.state = CONNECTION_STATE.ERROR;
            this._emitStateChange();
            
            this.dispatchEvent(new CustomEvent('error', { 
              detail: { error, state: this.state } 
            }));
          };

        } catch (err) {
          this._log('Failed to create WebSocket', err);
          this.state = CONNECTION_STATE.ERROR;
          this._emitStateChange();
          this._startPolling(); // Fallback to polling
          reject(err);
        }
      });
    }

    /**
     * Disconnect from server
     */
    disconnect() {
      this._log('Disconnecting...');
      
      this._cleanup();
      this._stopPolling();
      
      if (this.ws) {
        this.ws.close(1000, 'Client disconnect');
        this.ws = null;
      }
      
      this.state = CONNECTION_STATE.DISCONNECTED;
      this._emitStateChange();
      
      this.dispatchEvent(new CustomEvent('disconnected'));
    }

    /**
     * Reconnect to server
     */
    reconnect() {
      this._log('Reconnecting...');
      this.disconnect();
      return this.connect();
    }

    // ==================== MESSAGE HANDLING ====================

    /**
     * Handle incoming message
     */
    _handleMessage(data) {
      try {
        const message = JSON.parse(data);
        this.metrics.messagesReceived++;
        
        this._log('Received message', message.type);

        // Store in history
        this._addToHistory(message);

        // Handle special message types
        switch (message.type) {
          case EVENT_TYPES.CONNECTED:
            this.clientId = message.data?.clientId;
            break;
            
          case EVENT_TYPES.PING:
            this._send({ type: EVENT_TYPES.PONG, time: Date.now() });
            break;
            
          case 'subscribed':
            this._log('Subscribed to events', message.data?.events);
            break;
            
          case 'history':
            this._mergeHistory(message.data);
            break;
        }

        // Dispatch event for this message type
        this.dispatchEvent(new CustomEvent(message.type, { 
          detail: message.data 
        }));

        // Also dispatch generic 'message' event
        this.dispatchEvent(new CustomEvent('message', { 
          detail: message 
        }));

        // Call registered handlers
        const handlers = this.eventHandlers.get(message.type);
        if (handlers) {
          handlers.forEach(handler => {
            try {
              handler(message.data);
            } catch (err) {
              console.error('Event handler error:', err);
            }
          });
        }

      } catch (err) {
        this._log('Failed to parse message', err);
      }
    }

    /**
     * Send message to server
     */
    _send(message) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
        this.metrics.messagesSent++;
        return true;
      }
      return false;
    }

    // ==================== SUBSCRIPTION MANAGEMENT ====================

    /**
     * Subscribe to event types
     */
    subscribe(events) {
      const eventArray = Array.isArray(events) ? events : [events];
      
      eventArray.forEach(event => this.subscriptions.add(event));
      
      if (this.state === CONNECTION_STATE.CONNECTED) {
        this._subscribe(eventArray);
      }
      
      this._log('Subscribed to', eventArray);
      return this;
    }

    /**
     * Unsubscribe from event types
     */
    unsubscribe(events) {
      const eventArray = Array.isArray(events) ? events : [events];
      
      eventArray.forEach(event => this.subscriptions.delete(event));
      
      if (this.state === CONNECTION_STATE.CONNECTED) {
        this._send({ type: 'unsubscribe', events: eventArray });
      }
      
      this._log('Unsubscribed from', eventArray);
      return this;
    }

    /**
     * Subscribe to all events
     */
    subscribeAll() {
      return this.subscribe('*');
    }

    /**
     * Clear all subscriptions
     */
    clearSubscriptions() {
      this.subscriptions.clear();
      if (this.state === CONNECTION_STATE.CONNECTED) {
        this._send({ type: 'unsubscribe', events: ['*'] });
      }
      return this;
    }

    /**
     * Send subscription request to server
     */
    _subscribe(events) {
      this._send({ type: 'subscribe', events });
    }

    /**
     * Register event handler (convenience method)
     */
    on(eventType, handler) {
      if (!this.eventHandlers.has(eventType)) {
        this.eventHandlers.set(eventType, new Set());
      }
      this.eventHandlers.get(eventType).add(handler);
      
      // Auto-subscribe if connected
      if (this.state === CONNECTION_STATE.CONNECTED) {
        this.subscribe(eventType);
      }
      
      return this;
    }

    /**
     * Remove event handler
     */
    off(eventType, handler) {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
      return this;
    }

    // ==================== RECONNECTION ====================

    /**
     * Schedule reconnection with exponential backoff
     */
    _scheduleReconnect() {
      if (this.reconnectTimer) return;

      this.reconnectAttempts++;
      const delay = Math.min(
        this.config.reconnectInterval * Math.pow(this.config.reconnectDecay, this.reconnectAttempts - 1),
        this.config.maxReconnectInterval
      );

      this.state = CONNECTION_STATE.RECONNECTING;
      this._emitStateChange();

      this._log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect().catch(() => {
          // Reconnection failed, will try again if under max attempts
        });
      }, delay);
    }

    // ==================== POLLING FALLBACK ====================

    /**
     * Start polling as fallback when WebSocket fails
     */
    _startPolling() {
      if (!this.config.enablePolling || this.pollingTimer) return;

      this._log('Starting polling fallback');
      this.state = CONNECTION_STATE.POLLING;
      this._emitStateChange();

      const poll = async () => {
        try {
          this._log('Polling for updates...');
          
          // Fetch latest data from REST API
          const [agents, tasks, events] = await Promise.all([
            this._fetch('/api/agents'),
            this._fetch('/api/tasks'),
            this._fetch('/api/system/events?limit=10')
          ]);

          if (agents || tasks || events) {
            this.dispatchEvent(new CustomEvent('poll:update', {
              detail: { agents, tasks, events }
            }));
          }
        } catch (err) {
          this._log('Polling error', err);
        }
      };

      // Poll immediately
      poll();
      
      // Then poll on interval
      this.pollingTimer = setInterval(poll, this.config.pollingInterval);
    }

    /**
     * Stop polling
     */
    _stopPolling() {
      if (this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
        this._log('Stopped polling');
      }
    }

    /**
     * Fetch from REST API
     */
    async _fetch(endpoint) {
      try {
        const response = await fetch(`${this.config.apiUrl}${endpoint}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        this._log('Fetch error', endpoint, err.message);
        return null;
      }
    }

    // ==================== HEARTBEAT ====================

    /**
     * Start heartbeat to keep connection alive
     */
    _startHeartbeat() {
      if (this.heartbeatTimer) return;

      this.heartbeatTimer = setInterval(() => {
        if (this.state === CONNECTION_STATE.CONNECTED) {
          this._send({ type: EVENT_TYPES.PING, time: Date.now() });
        }
      }, this.config.heartbeatInterval);
    }

    /**
     * Stop heartbeat
     */
    _stopHeartbeat() {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    }

    // ==================== MESSAGE HISTORY ====================

    /**
     * Request message history from server
     */
    _requestHistory() {
      this._send({ 
        type: 'getHistory', 
        limit: this.config.messageHistoryLimit 
      });
    }

    /**
     * Add message to local history
     */
    _addToHistory(message) {
      this.messageHistory.unshift(message);
      if (this.messageHistory.length > this.config.messageHistoryLimit) {
        this.messageHistory.pop();
      }
    }

    /**
     * Merge server history with local
     */
    _mergeHistory(serverHistory) {
      if (!Array.isArray(serverHistory)) return;
      
      // Add server messages that we don't have
      const localIds = new Set(this.messageHistory.map(m => m._timestamp));
      const newMessages = serverHistory.filter(m => !localIds.has(m._timestamp));
      
      this.messageHistory = [...newMessages, ...this.messageHistory]
        .slice(0, this.config.messageHistoryLimit);
      
      this._log(`Merged ${newMessages.length} messages from history`);
    }

    /**
     * Get message history
     */
    getHistory(limit = 50) {
      return this.messageHistory.slice(0, limit);
    }

    // ==================== CLEANUP ====================

    /**
     * Cleanup connection resources
     */
    _cleanup() {
      this._stopHeartbeat();
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    }

    // ==================== UTILITY ====================

    /**
     * Emit state change event
     */
    _emitStateChange() {
      this.dispatchEvent(new CustomEvent('stateChange', {
        detail: { state: this.state, clientId: this.clientId }
      }));
    }

    /**
     * Debug logging
     */
    _log(...args) {
      if (this.config.debug) {
        console.log('[MCRealtime]', ...args);
      }
    }

    /**
     * Get current connection state
     */
    getState() {
      return {
        state: this.state,
        clientId: this.clientId,
        subscriptions: Array.from(this.subscriptions),
        metrics: { ...this.metrics },
        connected: this.state === CONNECTION_STATE.CONNECTED
      };
    }

    /**
     * Check if connected
     */
    isConnected() {
      return this.state === CONNECTION_STATE.CONNECTED;
    }

    /**
     * Check if in polling mode
     */
    isPolling() {
      return this.state === CONNECTION_STATE.POLLING;
    }
  }

  // ==================== DASHBOARD INTEGRATION ====================

  /**
   * Dashboard integration helper
   * Connects real-time updates to dashboard UI
   */
  class MCRealtimeDashboard {
    constructor(client, options = {}) {
      this.client = client;
      this.options = {
        updateAgents: true,
        updateTasks: true,
        updateTokens: true,
        updateLeads: true,
        showNotifications: true,
        ...options
      };
      
      this.setupHandlers();
    }

    setupHandlers() {
      // Agent status changes
      if (this.options.updateAgents) {
        this.client.on(EVENT_TYPES.AGENT_STATUS_CHANGE, (data) => {
          this.updateAgentStatus(data);
        });
      }

      // Task updates
      if (this.options.updateTasks) {
        this.client.on(EVENT_TYPES.TASK_CREATED, (data) => {
          this.showNotification('Task Created', data.task?.description);
          this.refreshTasks();
        });

        this.client.on(EVENT_TYPES.TASK_COMPLETED, (data) => {
          this.showNotification('Task Completed', data.taskId);
          this.refreshTasks();
        });

        this.client.on(EVENT_TYPES.TASK_ASSIGNED, (data) => {
          this.showNotification('Task Assigned', `To ${data.agentId}`);
          this.refreshTasks();
        });
      }

      // Token usage
      if (this.options.updateTokens) {
        this.client.on(EVENT_TYPES.TOKEN_USAGE, (data) => {
          this.updateTokenDisplay(data);
        });

        this.client.on(EVENT_TYPES.TOKEN_THRESHOLD, (data) => {
          this.showNotification(
            'Token Alert', 
            `${data.agent}: ${data.percentUsed}% of budget used`,
            data.alert
          );
        });
      }

      // Lead updates
      if (this.options.updateLeads) {
        this.client.on(EVENT_TYPES.LEAD_ADDED, (data) => {
          this.showNotification('New Lead', data.lead?.name || 'Lead added');
          this.refreshLeads();
        });

        this.client.on(EVENT_TYPES.LEAD_SCORED, (data) => {
          this.updateLeadScore(data);
        });
      }

      // System alerts
      this.client.on(EVENT_TYPES.SYSTEM_ALERT, (data) => {
        this.showNotification('System Alert', data.message, data.level);
      });

      // Connection state
      this.client.addEventListener('stateChange', (e) => {
        this.updateConnectionIndicator(e.detail.state);
      });
    }

    updateAgentStatus(data) {
      const el = document.querySelector(`[data-agent-id="${data.agentId}"] .agent-status`);
      if (el) {
        el.textContent = data.status;
        el.className = `agent-status ${data.status.toLowerCase()}`;
      }
    }

    refreshTasks() {
      // Trigger dashboard task refresh
      if (typeof MC_DASHBOARD_V2 !== 'undefined') {
        MC_DASHBOARD_V2.loadTasks();
      }
    }

    refreshLeads() {
      // Trigger lead refresh if function exists
      if (typeof refreshLeadData === 'function') {
        refreshLeadData();
      }
    }

    updateTokenDisplay(data) {
      // Update token display if element exists
      const el = document.querySelector('.token-usage');
      if (el) {
        el.textContent = `${data.tokens.toLocaleString()} tokens`;
      }
    }

    updateLeadScore(data) {
      const el = document.querySelector(`[data-lead-id="${data.leadId}"] .lead-score`);
      if (el) {
        el.textContent = data.score;
        el.className = `lead-score score-${Math.floor(data.score / 20)}`;
      }
    }

    showNotification(title, message, type = 'info') {
      if (!this.options.showNotifications) return;

      // Use existing notification system if available
      if (typeof showNotification === 'function') {
        showNotification(title, message, type);
        return;
      }

      // Simple notification fallback
      console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
      
      // Create toast notification
      const toast = document.createElement('div');
      toast.className = `mc-toast mc-toast-${type}`;
      toast.innerHTML = `
        <strong>${title}</strong>
        <span>${message}</span>
      `;
      
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 5000);
    }

    updateConnectionIndicator(state) {
      const indicator = document.querySelector('.ws-connection-indicator');
      if (!indicator) return;

      const states = {
        [CONNECTION_STATE.CONNECTED]: { class: 'connected', text: '● Live' },
        [CONNECTION_STATE.CONNECTING]: { class: 'connecting', text: '○ Connecting...' },
        [CONNECTION_STATE.RECONNECTING]: { class: 'reconnecting', text: '↻ Reconnecting...' },
        [CONNECTION_STATE.POLLING]: { class: 'polling', text: '◐ Polling' },
        [CONNECTION_STATE.DISCONNECTED]: { class: 'disconnected', text: '○ Offline' },
        [CONNECTION_STATE.ERROR]: { class: 'error', text: '✕ Error' }
      };

      const status = states[state] || states[CONNECTION_STATE.DISCONNECTED];
      indicator.className = `ws-connection-indicator ${status.class}`;
      indicator.textContent = status.text;
    }
  }

  // ==================== EXPORTS ====================

  // Export to global scope
  global.MCRealtimeClient = MCRealtimeClient;
  global.MCRealtimeDashboard = MCRealtimeDashboard;
  global.MC_REALTIME_EVENTS = EVENT_TYPES;
  global.MC_CONNECTION_STATE = CONNECTION_STATE;

  // Create default instance
  global.mcRealtime = new MCRealtimeClient();

})(typeof window !== 'undefined' ? window : global);