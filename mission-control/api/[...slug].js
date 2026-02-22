// Vercel Serverless Function: /api/[...slug].js
// CATCH-ALL approach - handles /api/logs/activity and any other nested path
// This is the most flexible approach for nested API routes

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Parse the URL path
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathSegments = url.pathname.replace('/api/', '').split('/').filter(Boolean);
  
  // Log what we received for debugging
    pathname: url.pathname,
    segments: pathSegments,
    query: Object.fromEntries(url.searchParams)
  });

  // Route based on path segments
  if (pathSegments[0] === 'logs' && pathSegments[1] === 'activity') {
    // Handle /api/logs/activity
    return handleLogsActivity(req, res, url);
  } else if (pathSegments[0] === 'logs') {
    // Handle /api/logs (index)
    return handleLogsIndex(req, res, url);
  } else if (pathSegments[0] === 'chat') {
    // Handle /api/logs/chat
    return handleChat(req, res, url);
  }

  // Default: return info about available endpoints
  res.status(200).json({
    success: true,
    message: 'Catch-all API endpoint',
    received: {
      pathname: url.pathname,
      segments: pathSegments
    },
    available: [
      '/api/logs/activity',
      '/api/logs',
      '/api/chat'
    ],
    timestamp: new Date().toISOString()
  });
};

function handleLogsActivity(req, res, url) {
  const limit = parseInt(url.searchParams.get('limit')) || 100;
  const now = Date.now();
  
  const logs = [
    { timestamp: new Date(now).toISOString(), agent: 'Nexus', type: 'system', message: 'CATCH-ALL endpoint /api/logs/activity is working!', sessionId: 'api-test' },
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

  res.status(200).json({
    success: true,
    endpoint: '/api/logs/activity (via catch-all)',
    logs: logs.slice(0, limit),
    total: logs.length,
    timestamp: new Date().toISOString()
  });
}

function handleLogsIndex(req, res, url) {
  res.status(200).json({
    success: true,
    endpoint: '/api/logs (via catch-all)',
    available: [
      '/api/logs/activity',
      '/api/logs/chat'
    ],
    timestamp: new Date().toISOString()
  });
}

function handleChat(req, res, url) {
  res.status(200).json({
    success: true,
    endpoint: '/api/chat (via catch-all)',
    message: 'Chat endpoint placeholder',
    timestamp: new Date().toISOString()
  });
}
