// API endpoint for deployment history
const { validateQuery, VALIDATION_RULES } = require('./lib/validation');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  // Define validation rules for this endpoint
  const rules = {
    limit: VALIDATION_RULES.limit,
    status: {
      type: 'enum',
      allowed: ['success', 'failed', 'pending', 'rollback'],
      description: 'Deployment status filter'
    },
    from: VALIDATION_RULES.from,
    to: VALIDATION_RULES.to,
    version: {
      type: 'string',
      maxLength: 50,
      pattern: /^[0-9.]+$/,
      description: 'Version number filter'
    }
  };

  // Validate and sanitize query parameters
  const result = validateQuery(req.query || {}, rules);
  
  if (!result.valid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      details: result.errors,
      timestamp: new Date().toISOString()
    });
  }

  // Use sanitized values
  const { limit = 50, status, from, to, version } = result.sanitized;
  
  let deployments = [
    { id: 'dep_001', version: '2026.2.18', timestamp: '2026-02-18T21:25:00Z', status: 'success', changes: 'Added overview.html, api/stats, api/deployments' },
    { id: 'dep_002', version: '2026.2.18', timestamp: '2026-02-18T21:14:00Z', status: 'success', changes: 'Fixed task board API path' },
    { id: 'dep_003', version: '2026.2.18', timestamp: '2026-02-18T21:03:00Z', status: 'success', changes: 'Updated token tracker with 20 agents' },
    { id: 'dep_004', version: '2026.2.18', timestamp: '2026-02-18T20:56:00Z', status: 'success', changes: 'Fixed logs-view pixel theme' },
    { id: 'dep_005', version: '2026.2.18', timestamp: '2026-02-18T20:43:00Z', status: 'success', changes: 'Updated living-pixel-office theme' }
  ];
  
  // Apply filters
  if (status) {
    deployments = deployments.filter(d => d.status === status);
  }
  
  if (version) {
    deployments = deployments.filter(d => d.version.includes(version));
  }
  
  if (from) {
    const fromDate = new Date(from);
    deployments = deployments.filter(d => new Date(d.timestamp) >= fromDate);
  }
  
  if (to) {
    const toDate = new Date(to);
    deployments = deployments.filter(d => new Date(d.timestamp) <= toDate);
  }
  
  res.status(200).json({
    success: true,
    deployments: deployments.slice(0, limit),
    total: deployments.length,
    filters: { status, from, to, version, limit },
    timestamp: new Date().toISOString()
  });
};
