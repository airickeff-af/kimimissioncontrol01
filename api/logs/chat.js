// API endpoint for chat logs
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    success: true,
    logs: [
      { id: 1, agent: 'Nexus', message: 'Deployment complete', timestamp: '2026-02-18T21:00:00Z' },
      { id: 2, agent: 'DealFlow', message: 'Lead enriched', timestamp: '2026-02-18T20:45:00Z' },
      { id: 3, agent: 'Audit', message: 'Quality gate passed', timestamp: '2026-02-18T20:30:00Z' }
    ],
    timestamp: new Date().toISOString()
  });
};
