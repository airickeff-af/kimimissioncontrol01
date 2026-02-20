const WebSocket = require('ws');
const http = require('http');

// WebSocket server for real-time updates
function setupWebSocket(server) {
    const wss = new WebSocket.Server({ server });
    
    const clients = new Set();
    
    wss.on('connection', (ws, req) => {
        console.log('🔌 New WebSocket connection');
        clients.add(ws);
        
        // Send initial stats
        ws.send(JSON.stringify({
            type: 'init',
            stats: {
                health: 50,
                wealth: 50,
                energy: 50
            }
        }));
        
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                
                // Broadcast to all clients
                if (data.type === 'stats_update') {
                    broadcast({
                        type: 'stats_update',
                        stats: data.stats
                    }, ws);
                }
            } catch (e) {
                console.error('WebSocket message error:', e);
            }
        });
        
        ws.on('close', () => {
            console.log('🔌 WebSocket disconnected');
            clients.delete(ws);
        });
        
        ws.on('error', (err) => {
            console.error('WebSocket error:', err);
            clients.delete(ws);
        });
    });
    
    // Broadcast to all connected clients
    function broadcast(data, exclude = null) {
        const message = JSON.stringify(data);
        clients.forEach(client => {
            if (client !== exclude && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    // Simulate periodic updates (for demo)
    setInterval(() => {
        broadcast({
            type: 'ping',
            timestamp: Date.now()
        });
    }, 30000);
    
    console.log('✅ WebSocket server ready');
    return { wss, broadcast };
}

module.exports = { setupWebSocket };
