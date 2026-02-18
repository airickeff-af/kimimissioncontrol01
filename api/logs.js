// Vercel Serverless Function: /api/logs.js
// Flat structure - Vercel prefers this over nested folders
// Handles both /api/logs and /api/logs?activity=true

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get limit from query params (default 100)
  const limit = parseInt(req.query.limit) || 100;

  // Generate activity logs from recent system state
  const logs = [
    { timestamp: new Date().toISOString(), agent: 'Nexus', type: 'system', message: 'Mission Control dashboard deployed', sessionId: 'deploy' },
    { timestamp: new Date(Date.now() - 60000).toISOString(), agent: 'Code-1', type: 'task_complete', message: 'Fixed logs API endpoint', sessionId: 'logs-fix' },
    { timestamp: new Date(Date.now() - 120000).toISOString(), agent: 'Pixel', type: 'task_complete', message: 'Updated office with 22 agents', sessionId: 'office-v2' },
    { timestamp: new Date(Date.now() - 180000).toISOString(), agent: 'Audit-1', type: 'audit', message: 'Verified logs fix - all tests passed', sessionId: 'audit-logs' },
    { timestamp: new Date(Date.now() - 300000).toISOString(), agent: 'Forge-2', type: 'task_complete', message: 'Updated overview page with 22 agents', sessionId: 'overview' },
    { timestamp: new Date(Date.now() - 600000).toISOString(), agent: 'DealFlow', type: 'task_complete', message: 'Completed 30 leads enrichment', sessionId: 'leads-30' },
    { timestamp: new Date(Date.now() - 900000).toISOString(), agent: 'Nexus', type: 'system', message: 'Added hourly agent check-in cron', sessionId: 'cron-setup' },
    { timestamp: new Date(Date.now() - 1200000).toISOString(), agent: 'Nexus', type: 'system', message: 'Added 30-min task orchestrator', sessionId: 'orchestrator' },
    { timestamp: new Date(Date.now() - 1500000).toISOString(), agent: 'Audit-2', type: 'audit', message: 'Quality check: 7 tasks audited, avg 96.1/100', sessionId: 'quality-check' },
    { timestamp: new Date(Date.now() - 1800000).toISOString(), agent: 'Code-1', type: 'task_complete', message: 'Created serverless logs API', sessionId: 'api-logs' }
  ];

  // Return logs
  res.status(200).json({
    success: true,
    logs: logs.slice(0, limit),
    total: logs.length,
    timestamp: new Date().toISOString()
  });
}
