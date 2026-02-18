// /api/tasks.js - Returns all tasks with filtering
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const { status, priority, agent, limit = 50, page = 1 } = req.query;
  
  const tasks = [
    { id: 'TASK-001', title: 'Fix Code API 404 Errors', status: 'in_progress', priority: 'P0', assigned: 'Code-1', due: '2026-02-18', progress: 75 },
    { id: 'TASK-013', title: 'Larry API Credentials', status: 'blocked', priority: 'P1', assigned: 'EricF', due: '2026-02-18', progress: 0 },
    { id: 'TASK-019', title: 'ColdCall Schedule Approval', status: 'blocked', priority: 'P1', assigned: 'EricF', due: '2026-02-18', progress: 0 },
    { id: 'TASK-036', title: 'Telegram Channels Setup', status: 'blocked', priority: 'P1', assigned: 'EricF', due: '2026-02-18', progress: 0 },
    { id: 'TASK-043', title: 'DealFlow + PIE Integration', status: 'in_progress', priority: 'P0', assigned: 'DealFlow', due: '2026-02-19', progress: 85 },
    { id: 'TASK-046', title: 'Update Overview Page', status: 'completed', priority: 'P1', assigned: 'Forge-2', due: '2026-02-18', progress: 100 },
    { id: 'TASK-047', title: 'Unified Kairosoft Theme + DealFlow', status: 'completed', priority: 'P1', assigned: 'Forge-1', due: '2026-02-18', progress: 100 },
    { id: 'TASK-066', title: 'Fix API Endpoints', status: 'in_progress', priority: 'P0', assigned: 'Code-1,2,3', due: '2026-02-18', progress: 60 },
    { id: 'TASK-067', title: 'Unified Theme All Pages', status: 'in_progress', priority: 'P1', assigned: 'Forge-1,2,3', due: '2026-02-19', progress: 40 },
    { id: 'TASK-068', title: 'Agent Work Cards Enhancement', status: 'in_progress', priority: 'P1', assigned: 'Forge-2', due: '2026-02-19', progress: 35 }
  ];
  
  let filtered = tasks;
  
  if (status) filtered = filtered.filter(t => t.status === status);
  if (priority) filtered = filtered.filter(t => t.priority === priority);
  if (agent) filtered = filtered.filter(t => t.assigned.includes(agent));
  
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + parseInt(limit));
  
  res.status(200).json({
    success: true,
    tasks: paginated,
    total: filtered.length,
    page: parseInt(page),
    pages: Math.ceil(filtered.length / limit),
    filters: { status, priority, agent },
    timestamp: new Date().toISOString()
  });
};