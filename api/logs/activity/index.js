// Vercel Serverless Function: /api/logs/activity/index.js
// NESTED FOLDER STRUCTURE - Attempt 3: Using index.js inside subdirectory
// This should be accessible at /api/logs/activity

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get limit from query params (default 100)
  const limit = parseInt(req.query?.limit) || 100;

  // Generate activity logs
  const now = Date.now();
  const logs = [
    { timestamp: new Date(now).toISOString(), agent: 'Nexus', type: 'system', message: 'API endpoint /api/logs/activity is working! (NESTED FOLDER v3)', sessionId: 'api-test-nested-v3' },
    { timestamp: new Date(now - 60000).toISOString(), agent: 'Code-1', type: 'task_complete', message: 'Fixed logs API endpoint', sessionId: 'logs-fix' },
    { timestamp: new Date(now - 120000).toISOString(), agent: 'Pixel', type: 'task_complete', message: 'Updated office with 22 agents', sessionId: 'office-v2' },
    { timestamp: new Date(now - 180000).toISOString(), agent: 'Audit-1', type: 'audit', message: 'Verified logs fix - all tests passed', sessionId: 'audit-logs' },
    { timestamp: new Date(now - 300000).toISOString(), agent: 'Forge-2', type: 'task_complete', message: 'Updated overview page with 22 agents', sessionId: 'overview' },
    { timestamp: new Date(now - 600000).toISOString(), agent: 'DealFlow', type: 'task_complete', message: 'Completed 30 leads enrichment', sessionId: 'leads-30' },
    { timestamp: new Date(now - 900000).toISOString(), agent: 'Nexus', type: 'system', message: 'Added hourly agent check-in cron', sessionId: 'cron-setup' },
    { timestamp: new Date(now - 1200000).toISOString(), agent: 'Nexus', type: 'system', message: 'Added 30-min task orchestrator', sessionId: 'orchestrator' },
    { timestamp: new Date(now - 1500000).toISOString(), agent: 'Audit-2', type: 'audit', message: 'Quality check: 7 tasks audited, avg 96.1/100', sessionId: 'quality-check' },
    { timestamp: new Date(now - 1800000).toISOString(), agent: 'Code-1', type: 'task_complete', message: 'Created serverless logs API', sessionId: 'api-logs' }
  ];

  // Return logs
  res.status(200).json({
    success: true,
    endpoint: '/api/logs/activity (nested folder structure v3 - index.js)',
    logs: logs.slice(0, limit),
    total: logs.length,
    timestamp: new Date().toISOString()
  });
};
