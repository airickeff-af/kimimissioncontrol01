// API endpoint for system statistics
const { validateQuery, VALIDATION_RULES } = require('./lib/validation');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  // Define validation rules for this endpoint
  const rules = {
    from: VALIDATION_RULES.from,
    to: VALIDATION_RULES.to,
    type: {
      type: 'enum',
      allowed: ['agents', 'tasks', 'tokens', 'deployments', 'all'],
      description: 'Statistics type filter'
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
  const { from, to, type = 'all' } = result.sanitized;
  
  // Build stats response based on type filter
  const stats = {};
  
  if (type === 'all' || type === 'agents') {
    stats.agents = { total: 22, active: 18, idle: 4 };
  }
  
  if (type === 'all' || type === 'tasks') {
    stats.tasks = { total: 60, completed: 31, inProgress: 2, blocked: 27 };
  }
  
  if (type === 'all' || type === 'tokens') {
    stats.tokens = { total: 2475000, cost: 0.76, sessions: 269 };
  }
  
  if (type === 'all' || type === 'deployments') {
    stats.deployments = { total: 47, today: 12 };
  }
  
  stats.uptime = '99.9%';
  
  res.status(200).json({
    success: true,
    stats,
    filters: { from, to, type },
    timestamp: new Date().toISOString()
  });
};
