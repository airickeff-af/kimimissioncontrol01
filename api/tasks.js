// API Endpoint: /api/tasks
// Returns task queue data

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const tasks = [
      { id: 'TASK-093', title: 'HQ Refresh Button', priority: 'P0', status: 'in-progress', assignee: 'Forge' },
      { id: 'TASK-095', title: 'Real API Integration', priority: 'P0', status: 'in-progress', assignee: 'CodeMaster' },
      { id: 'TASK-094', title: 'Pixel Office Hierarchy', priority: 'P0', status: 'pending', assignee: 'Forge' },
      { id: 'TASK-070', title: 'Deployment Fix', priority: 'P0', status: 'in-progress', assignee: 'Code-1' },
      { id: 'TASK-120', title: '404 Fix Solutions', priority: 'P0', status: 'pending', assignee: 'Sentry' },
      { id: 'TASK-071', title: 'Header Standardization', priority: 'P0', status: 'pending', assignee: 'Forge-1' },
      { id: 'TASK-008', title: 'Regional Leads - HK', priority: 'P1', status: 'completed', assignee: 'Glasses' },
      { id: 'TASK-009', title: 'Regional Leads - Singapore', priority: 'P1', status: 'in-progress', assignee: 'Scout' },
      { id: 'TASK-064', title: 'ColdCall Outreach', priority: 'P1', status: 'pending', assignee: 'ColdCall' },
      { id: 'TASK-055', title: 'PIE Radar Dashboard', priority: 'P2', status: 'pending', assignee: 'PIE' },
      { id: 'TASK-059', title: 'Dark Mode Toggle', priority: 'P2', status: 'pending', assignee: 'Forge-2' },
      { id: 'TASK-058', title: 'Agent Interactions', priority: 'P2', status: 'pending', assignee: 'Pixel' }
    ];
    
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    
    res.status(200).json({
      success: true,
      tasks,
      total: tasks.length,
      pending,
      inProgress,
      completed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
