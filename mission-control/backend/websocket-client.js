/**
 * Mission Control WebSocket Client
 * Real-time updates for the dashboard
 * 
 * Usage:
 *   const ws = new MCWebSocketClient();
 *   ws.connect();
 *   ws.on('agent_status', (data) => console.log(data));
 */

class MCWebSocketClient extends EventTarget {
    constructor(url = 'ws://localhost:8765') {
        super();
        this.url = url;
        this.ws = null;
        this.reconnectInterval = 5000;
        this.heartbeatInterval = 30000;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.isConnected = false;
        this.messageQueue = [];
        
        // Event handlers map
        this.handlers = new Map();
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log('[MC-WS] Already connected');
            return;
        }

        console.log(`[MC-WS] Connecting to ${this.url}...`);
        
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
            console.log('[MC-WS] Connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.dispatchEvent(new CustomEvent('connected'));
            
            // Send queued messages
            while (this.messageQueue.length > 0) {
                const msg = this.messageQueue.shift();
                this.send(msg);
            }
            
            // Start heartbeat
            this.startHeartbeat();
            
            // Subscribe to channels
            this.subscribe('agent_status');
            this.subscribe('agent_activity');
            this.subscribe('notifications');
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (e) {
                console.error('[MC-WS] Failed to parse message:', e);
            }
        };

        this.ws.onclose = () => {
            console.log('[MC-WS] Disconnected');
            this.isConnected = false;
            this.dispatchEvent(new CustomEvent('disconnected'));
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('[MC-WS] Error:', error);
            this.dispatchEvent(new CustomEvent('error', { detail: error }));
        };
    }

    /**
     * Handle incoming messages
     */
    handleMessage(message) {
        const { type, data, timestamp, source } = message;
        
        // Dispatch specific event
        this.dispatchEvent(new CustomEvent(type, { detail: data }));
        
        // Call registered handlers
        if (this.handlers.has(type)) {
            this.handlers.get(type).forEach(handler => {
                try {
                    handler(data, timestamp, source);
                } catch (e) {
                    console.error(`[MC-WS] Handler error for ${type}:`, e);
                }
            });
        }
        
        // Log for debugging
        if (type !== 'heartbeat') {
            console.log(`[MC-WS] ${type}:`, data);
        }
    }

    /**
     * Register event handler
     */
    on(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType).push(handler);
        
        // Return unsubscribe function
        return () => {
            const handlers = this.handlers.get(eventType);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        };
    }

    /**
     * Send message to server
     */
    send(data) {
        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            this.messageQueue.push(data);
        }
    }

    /**
     * Subscribe to a channel
     */
    subscribe(channel) {
        this.send({ type: 'subscribe', channel });
    }

    /**
     * Request agent status
     */
    requestAgentStatus(agentId) {
        this.send({ type: 'request_agent_status', agent_id: agentId });
    }

    /**
     * Start heartbeat
     */
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            this.send({ type: 'ping' });
        }, this.heartbeatInterval);
    }

    /**
     * Attempt to reconnect
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[MC-WS] Max reconnect attempts reached');
            this.dispatchEvent(new CustomEvent('max_reconnect_reached'));
            return;
        }

        this.reconnectAttempts++;
        console.log(`[MC-WS] Reconnecting in ${this.reconnectInterval}ms (attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            this.connect();
        }, this.reconnectInterval);
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
        
        if (this.ws) {
            this.ws.close();
        }
        
        this.isConnected = false;
    }
}

/**
 * Dashboard integration helper
 */
class MCDashboardIntegration {
    constructor(wsClient) {
        this.ws = wsClient;
        this.unsubscribers = [];
    }

    /**
     * Initialize dashboard real-time updates
     */
    init() {
        // Agent status updates
        this.unsubscribers.push(
            this.ws.on('agent_status', (data) => {
                this.updateAgentCard(data.agent, data.state);
            })
        );

        // Agent position updates
        this.unsubscribers.push(
            this.ws.on('agent_position', (data) => {
                this.updateOfficeMap(data);
            })
        );

        // Notifications
        this.unsubscribers.push(
            this.ws.on('notification', (data) => {
                this.showNotification(data.title, data.message, data.level);
            })
        );

        // Task updates
        this.unsubscribers.push(
            this.ws.on('task_update', (data) => {
                this.refreshTaskQueue();
            })
        );

        // System metrics
        this.unsubscribers.push(
            this.ws.on('system_metric', (data) => {
                this.updateMetric(data.metric, data.value, data.unit);
            })
        );

        // Agent activity
        this.unsubscribers.push(
            this.ws.on('agent_activity', (data) => {
                this.addActivityLog(data.agent, data.activity);
            })
        );
    }

    /**
     * Update agent card in UI
     */
    updateAgentCard(agentId, state) {
        const card = document.querySelector(`[data-agent="${agentId}"]`);
        if (card) {
            // Update status indicator
            const statusEl = card.querySelector('.agent-status');
            if (statusEl) {
                statusEl.className = `agent-status status-${state.status}`;
                statusEl.textContent = state.status;
            }
            
            // Update task count
            const taskEl = card.querySelector('.task-count');
            if (taskEl && state.current_tasks) {
                taskEl.textContent = state.current_tasks.length;
            }
            
            // Add update animation
            card.classList.add('updated');
            setTimeout(() => card.classList.remove('updated'), 1000);
        }
    }

    /**
     * Update office map positions
     */
    updateOfficeMap(data) {
        if (data.positions) {
            Object.entries(data.positions).forEach(([agentId, position]) => {
                const avatar = document.querySelector(`[data-agent-avatar="${agentId}"]`);
                if (avatar) {
                    avatar.style.left = `${position.x}%`;
                    avatar.style.top = `${position.y}%`;
                    avatar.setAttribute('data-zone', position.zone);
                }
            });
        }
    }

    /**
     * Show notification toast
     */
    showNotification(title, message, level = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${level}`;
        toast.innerHTML = `
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    /**
     * Refresh task queue display
     */
    refreshTaskQueue() {
        // Trigger task queue refresh
        const event = new CustomEvent('mc:refresh-tasks');
        document.dispatchEvent(event);
    }

    /**
     * Update metric display
     */
    updateMetric(name, value, unit) {
        const metricEl = document.querySelector(`[data-metric="${name}"]`);
        if (metricEl) {
            metricEl.textContent = `${value}${unit ? ' ' + unit : ''}`;
            metricEl.classList.add('updated');
            setTimeout(() => metricEl.classList.remove('updated'), 500);
        }
    }

    /**
     * Add activity log entry
     */
    addActivityLog(agentId, activity) {
        const logContainer = document.querySelector('.activity-log');
        if (logContainer) {
            const entry = document.createElement('div');
            entry.className = 'activity-entry';
            entry.innerHTML = `
                <span class="activity-time">${new Date().toLocaleTimeString()}</span>
                <span class="activity-agent">${agentId}</span>
                <span class="activity-action">${activity.action}</span>
            `;
            logContainer.insertBefore(entry, logContainer.firstChild);
            
            // Keep only last 50 entries
            while (logContainer.children.length > 50) {
                logContainer.removeChild(logContainer.lastChild);
            }
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MCWebSocketClient, MCDashboardIntegration };
}
