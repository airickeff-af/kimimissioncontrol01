// API Endpoint: /api/agents
// Returns list of all agents with their status

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Agent data - in production this would come from a database
    const agents = [
      { id: 'nexus', name: 'Nexus', role: 'AI Lead', status: 'active', tasksCompleted: 156, tokensUsed: 125000 },
      { id: 'codemaster', name: 'CodeMaster', role: 'Dev Lead', status: 'active', tasksCompleted: 89, tokensUsed: 98000 },
      { id: 'forge', name: 'Forge', role: 'Design Lead', status: 'active', tasksCompleted: 67, tokensUsed: 45000 },
      { id: 'glasses', name: 'Glasses', role: 'Research Lead', status: 'active', tasksCompleted: 45, tokensUsed: 32000 },
      { id: 'scout', name: 'Scout', role: 'Researcher', status: 'idle', tasksCompleted: 34, tokensUsed: 28000 },
      { id: 'quill', name: 'Quill', role: 'Writer', status: 'active', tasksCompleted: 23, tokensUsed: 19000 },
      { id: 'pixel', name: 'Pixel', role: 'Designer', status: 'active', tasksCompleted: 41, tokensUsed: 35000 },
      { id: 'gary', name: 'Gary', role: 'Marketing', status: 'idle', tasksCompleted: 18, tokensUsed: 15000 },
      { id: 'larry', name: 'Larry', role: 'Social Media', status: 'active', tasksCompleted: 56, tokensUsed: 22000 },
      { id: 'sentry', name: 'Sentry', role: 'DevOps', status: 'active', tasksCompleted: 78, tokensUsed: 41000 },
      { id: 'cipher', name: 'Cipher', role: 'Security', status: 'idle', tasksCompleted: 12, tokensUsed: 8000 },
      { id: 'audit', name: 'Audit', role: 'QA', status: 'active', tasksCompleted: 34, tokensUsed: 25000 },
      { id: 'coldcall', name: 'ColdCall', role: 'Outreach', status: 'idle', tasksCompleted: 8, tokensUsed: 12000 },
      { id: 'dealflow', name: 'DealFlow', role: 'BD', status: 'active', tasksCompleted: 29, tokensUsed: 31000 },
      { id: 'pie', name: 'PIE', role: 'Intelligence', status: 'active', tasksCompleted: 15, tokensUsed: 28000 },
      { id: 'code-1', name: 'Code-1', role: 'Developer', status: 'active', tasksCompleted: 42, tokensUsed: 38000 },
      { id: 'code-2', name: 'Code-2', role: 'Developer', status: 'idle', tasksCompleted: 38, tokensUsed: 34000 },
      { id: 'code-3', name: 'Code-3', role: 'Developer', status: 'active', tasksCompleted: 31, tokensUsed: 29000 },
      { id: 'forge-2', name: 'Forge-2', role: 'Designer', status: 'idle', tasksCompleted: 22, tokensUsed: 21000 },
      { id: 'forge-3', name: 'Forge-3', role: 'Designer', status: 'active', tasksCompleted: 19, tokensUsed: 18000 },
      { id: 'audit-1', name: 'Audit-1', role: 'QA', status: 'active', tasksCompleted: 27, tokensUsed: 23000 },
      { id: 'audit-2', name: 'Audit-2', role: 'QA', status: 'idle', tasksCompleted: 21, tokensUsed: 19000 },
      { id: 'meemo', name: 'Meemo', role: 'PM', status: 'active', tasksCompleted: 12, tokensUsed: 15000 }
    ];
    
    const activeCount = agents.filter(a => a.status === 'active').length;
    
    res.status(200).json({
      success: true,
      agents,
      total: agents.length,
      active: activeCount,
      idle: agents.length - activeCount,
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
