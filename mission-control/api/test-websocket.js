/**
 * WebSocket Server Test
 * 
 * Simple test script to verify WebSocket functionality
 */

const WebSocket = require('ws');

async function testWebSocketServer() {

  // Start the server
  const { wsServer, EVENT_TYPES } = require('../api/websocket');
  
  try {
    await wsServer.start();

    // Wait a moment for server to be ready
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 1: Health check endpoint
    const http = require('http');
    
    const healthCheck = await new Promise((resolve, reject) => {
      http.get('http://localhost:3002/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });
    

    // Test 2: WebSocket connection and welcome message
    
    const ws = new WebSocket('ws://localhost:3002/api/ws');
    
    const welcomeMessage = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Message timeout')), 5000);
      
      // Set up message handler BEFORE waiting for open
      ws.on('message', (data) => {
        clearTimeout(timeout);
        resolve(JSON.parse(data.toString()));
      });
      
      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
    

    // Test 3: Subscription
    
    ws.send(JSON.stringify({
      type: 'subscribe',
      events: ['agent:statusChange', 'task:completed']
    }));
    
    const subscriptionResult = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Subscription timeout')), 5000);
      
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'subscribed') {
          clearTimeout(timeout);
          resolve(msg);
        }
      });
    });
    

    // Test 4: Broadcast
    
    // Set up broadcast listener first
    const broadcastPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Broadcast timeout')), 5000);
      
      const onMessage = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'agent:statusChange') {
          clearTimeout(timeout);
          ws.off('message', onMessage);
          resolve(msg);
        }
      };
      
      ws.on('message', onMessage);
    });
    
    // Then broadcast
    wsServer.broadcastAgentStatus('test-agent', 'online', { test: true });
    
    const broadcastReceived = await broadcastPromise;
    

    // Test 5: Ping/Pong
    
    ws.send(JSON.stringify({ type: 'ping' }));
    
    const pongReceived = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Pong timeout')), 5000);
      
      const onMessage = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'pong') {
          clearTimeout(timeout);
          ws.off('message', onMessage);
          resolve(msg);
        }
      };
      
      ws.on('message', onMessage);
    });
    

    // Test 6: Multiple clients
    
    const ws2 = new WebSocket('ws://localhost:3002/api/ws');
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Second client timeout')), 5000);
      ws2.on('message', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    
    
    ws2.close();

    // Cleanup
    ws.close();
    

  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  } finally {
    // Stop server
    await wsServer.stop();
  }
}

// Run tests
testWebSocketServer().catch(console.error);