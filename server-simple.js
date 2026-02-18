// Simple Node.js server for testing deployment
// Serves static files and API endpoints

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;

// API handlers
const apiHandlers = {
  '/api/health': require('./api/health.js'),
  '/api/logs/activity': require('./api/logs-activity.js'),
  '/api/agents': require('./api/agents.js'),
  '/api/tasks': require('./api/tasks.js'),
  '/api/deals': require('./api/deals.js'),
  '/api/tokens': require('./api/tokens.js'),
  '/api/metrics': require('./api/metrics.js'),
  '/api/index': require('./api/index.js'),
};

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Check if it's an API endpoint
  if (apiHandlers[pathname]) {
    try {
      // Mock req/res for API handlers
      const mockReq = {
        method: req.method,
        query: parsedUrl.query,
        url: req.url,
      };
      
      const mockRes = {
        setHeader: (key, value) => res.setHeader(key, value),
        status: (code) => ({
          json: (data) => {
            res.writeHead(code, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
          },
          end: () => {
            res.writeHead(code);
            res.end();
          }
        }),
        json: (data) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        },
        end: () => {
          res.writeHead(200);
          res.end();
        }
      };
      
      await apiHandlers[pathname](mockReq, mockRes);
      return;
    } catch (error) {
      console.error('API Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
      return;
    }
  }
  
  // Serve static files
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, filePath);
  
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Page not found
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        // Server error
        res.writeHead(500);
        res.end('Server Error: ' + err.code);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
});
