// Vercel Serverless Function for /api/logs/activity
// Uses FLAT FILE approach - file is at /api/logs-activity.js
// Maps to endpoint: /api/logs/activity via vercel.json rewrite

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get limit from query params
  const limit = parseInt(req.query?.limit) || 50;

  // Generate sample activity logs
  const now = Date.now();
  const agents = ['Nexus', 'Glasses', 'Quill', 'Pixel', 'Gary', 'Larry', 'Sentry', 'Audit', 'Cipher', 'Forge', 'Scout', 'Buzz'];
  const types = ['task_start', 'task_complete', 'research', 'write', 'design', 'code', 'deploy', 'audit', 'security_scan', 'system'];
  
  const logs = [];
  for (let i = 0; i < Math.min(limit, 100); i++) {
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const timeOffset = i * 300000; // 5 min intervals
    
    logs.push({
      id: `log-${Date.now()}-${i}`,
      timestamp: new Date(now - timeOffset).toISOString(),
      agent: agent,
      type: type,
      message: `${agent} completed ${type} activity`,
      sessionId: `session-${Math.floor(Math.random() * 1000)}`,
      metadata: {
        duration: Math.floor(Math.random() * 300) + 30,
        status: 'success'
      }
    });
  }

  // Return response
  res.status(200).json({
    success: true,
    endpoint: '/api/logs/activity',
    timestamp: new Date().toISOString(),
    count: logs.length,
    logs: logs
  });
};
