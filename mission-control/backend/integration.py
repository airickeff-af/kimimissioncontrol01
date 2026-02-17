"""
Mission Control Backend Integration Script
Connects backend services to the dashboard frontend
"""

import json
import os

def generate_dashboard_config():
    """Generate dashboard configuration with backend endpoints"""
    
    config = {
        "backend": {
            "enabled": True,
            "websocket_url": "ws://localhost:8765",
            "api_url": "http://localhost:8080",
            "version": "1.0.0"
        },
        "features": {
            "real_time_updates": True,
            "agent_tracking": True,
            "metrics_collection": True,
            "automated_backups": True,
            "notifications": True
        },
        "refresh_intervals": {
            "agent_status": 5000,  # 5 seconds
            "metrics": 30000,      # 30 seconds
            "task_queue": 10000    # 10 seconds
        }
    }
    
    return config

def inject_websocket_client(html_path):
    """Inject WebSocket client into dashboard HTML"""
    
    ws_client_script = '''
    <!-- Mission Control WebSocket Client -->
    <script src="backend/websocket-client.js"></script>
    <script>
        // Initialize WebSocket connection
        (function() {
            const ws = new MCWebSocketClient('ws://localhost:8765');
            const dashboard = new MCDashboardIntegration(ws);
            
            // Connection status indicator
            ws.on('connected', () => {
                console.log('[MC] Connected to backend');
                const indicator = document.getElementById('connection-status');
                if (indicator) {
                    indicator.className = 'status-connected';
                    indicator.textContent = '● Live';
                }
            });
            
            ws.on('disconnected', () => {
                console.log('[MC] Disconnected from backend');
                const indicator = document.getElementById('connection-status');
                if (indicator) {
                    indicator.className = 'status-disconnected';
                    indicator.textContent = '● Offline';
                }
            });
            
            // Connect and initialize
            ws.connect();
            dashboard.init();
            
            // Expose for debugging
            window.mcWebSocket = ws;
            window.mcDashboard = dashboard;
        })();
    </script>
    '''
    
    # Read existing HTML
    if os.path.exists(html_path):
        with open(html_path, 'r') as f:
            content = f.read()
        
        # Check if already injected
        if 'MCWebSocketClient' not in content:
            # Inject before closing body tag
            if '</body>' in content:
                content = content.replace('</body>', ws_client_script + '\n</body>')
            else:
                content += ws_client_script
            
            # Write back
            with open(html_path, 'w') as f:
                f.write(content)
            
            print(f"✓ WebSocket client injected into {html_path}")
        else:
            print(f"✓ WebSocket client already present in {html_path}")
    else:
        print(f"✗ File not found: {html_path}")

def create_status_indicator_css():
    """Create CSS for connection status indicator"""
    
    css = '''
/* Mission Control Connection Status */
#connection-status {
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    z-index: 10000;
    transition: all 0.3s ease;
}

.status-connected {
    background: #4ade80;
    color: #064e3b;
}

.status-disconnected {
    background: #f87171;
    color: #7f1d1d;
}

.status-connecting {
    background: #fbbf24;
    color: #78350f;
}

/* Agent card update animation */
.agent-card.updated {
    animation: pulse-update 1s ease;
}

@keyframes pulse-update {
    0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(74, 222, 128, 0); }
    100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
}

/* Toast notifications */
.toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    background: #1f2937;
    color: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transform: translateX(400px);
    transition: transform 0.3s ease;
    z-index: 10001;
    max-width: 300px;
}

.toast.show {
    transform: translateX(0);
}

.toast-title {
    font-weight: bold;
    margin-bottom: 5px;
}

.toast-message {
    font-size: 14px;
    opacity: 0.9;
}

.toast-info { border-left: 4px solid #3b82f6; }
.toast-success { border-left: 4px solid #4ade80; }
.toast-warning { border-left: 4px solid #fbbf24; }
.toast-error { border-left: 4px solid #f87171; }

/* Activity log */
.activity-log {
    max-height: 300px;
    overflow-y: auto;
    font-family: monospace;
    font-size: 12px;
}

.activity-entry {
    padding: 5px;
    border-bottom: 1px solid #374151;
    display: flex;
    gap: 10px;
}

.activity-time {
    color: #9ca3af;
    min-width: 80px;
}

.activity-agent {
    color: #60a5fa;
    min-width: 100px;
}

.activity-action {
    color: #e5e7eb;
}
'''
    
    return css

def main():
    """Main integration function"""
    
    workspace = os.path.expanduser("~/.openclaw/workspace")
    dashboard_dir = os.path.join(workspace, "mission-control/dashboard")
    
    print("=" * 60)
    print("Mission Control Backend Integration")
    print("=" * 60)
    
    # Generate config
    config = generate_dashboard_config()
    config_path = os.path.join(dashboard_dir, "backend-config.json")
    
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"✓ Dashboard config saved to {config_path}")
    
    # Inject WebSocket client into main dashboard
    dashboard_html = os.path.join(dashboard_dir, "index.html")
    if os.path.exists(dashboard_html):
        inject_websocket_client(dashboard_html)
    
    # Create status indicator CSS
    css = create_status_indicator_css()
    css_path = os.path.join(dashboard_dir, "backend-styles.css")
    
    with open(css_path, 'w') as f:
        f.write(css)
    
    print(f"✓ Backend styles saved to {css_path}")
    
    # Add CSS link to dashboard if not present
    if os.path.exists(dashboard_html):
        with open(dashboard_html, 'r') as f:
            content = f.read()
        
        if 'backend-styles.css' not in content:
            # Add before closing head
            if '</head>' in content:
                content = content.replace(
                    '</head>',
                    '    <link rel="stylesheet" href="backend-styles.css">\n</head>'
                )
                with open(dashboard_html, 'w') as f:
                    f.write(content)
                print(f"✓ Backend styles linked in dashboard")
    
    print("=" * 60)
    print("Integration complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Start backend: ./mission-control/backend/start-backend.sh start")
    print("2. Open dashboard: mission-control/dashboard/index.html")
    print("3. Check status: ./mission-control/backend/start-backend.sh status")
    print("")

if __name__ == "__main__":
    main()
