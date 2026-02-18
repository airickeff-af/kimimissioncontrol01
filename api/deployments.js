// API endpoint for deployment history
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    success: true,
    deployments: [
      { id: 'dep_001', version: '2026.2.18', timestamp: '2026-02-18T21:25:00Z', status: 'success', changes: 'Added overview.html, api/stats, api/deployments' },
      { id: 'dep_002', version: '2026.2.18', timestamp: '2026-02-18T21:14:00Z', status: 'success', changes: 'Fixed task board API path' },
      { id: 'dep_003', version: '2026.2.18', timestamp: '2026-02-18T21:03:00Z', status: 'success', changes: 'Updated token tracker with 20 agents' },
      { id: 'dep_004', version: '2026.2.18', timestamp: '2026-02-18T20:56:00Z', status: 'success', changes: 'Fixed logs-view pixel theme' },
      { id: 'dep_005', version: '2026.2.18', timestamp: '2026-02-18T20:43:00Z', status: 'success', changes: 'Updated living-pixel-office theme' }
    ],
    timestamp: new Date().toISOString()
  });
};
