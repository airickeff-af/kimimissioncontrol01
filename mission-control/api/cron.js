// Vercel Serverless Function: /api/cron.js
// Returns cron job status

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const cron = {
    jobs: [
      { name: 'agent-health-check', schedule: '*/30 * * * *', status: 'active', lastRun: '2 min ago' },
      { name: 'task-queue-sync', schedule: '*/20 * * * *', status: 'active', lastRun: '5 min ago' },
      { name: 'token-usage-update', schedule: '0 * * * *', status: 'active', lastRun: '12 min ago' },
      { name: 'lead-enrichment', schedule: '0 */6 * * *', status: 'active', lastRun: '3 hours ago' }
    ],
    total: 4,
    active: 4,
    failed: 0,
    timestamp: new Date().toISOString()
  };

  res.status(200).json({
    success: true,
    cron
  });
};
