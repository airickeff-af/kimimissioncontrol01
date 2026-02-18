// /api/agents.js - Returns all 22 agents with full data
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const agents = [
      { id: 'ericf', name: 'EricF', role: 'Commander', status: 'active', emoji: '👑', tasksCompleted: 0, tokensUsed: 0, lastActive: '2026-02-18T15:00:00Z', successRate: 100 },
      { id: 'nexus', name: 'Nexus', role: 'Orchestrator', status: 'active', emoji: '🤖', tasksCompleted: 45, tokensUsed: 8400000, lastActive: '2026-02-18T15:00:00Z', successRate: 94 },
      { id: 'codemaster', name: 'CodeMaster', role: 'Backend Lead', status: 'busy', emoji: '💻', tasksCompleted: 35, tokensUsed: 1200000, lastActive: '2026-02-18T14:58:00Z', successRate: 93 },
      { id: 'code-1', name: 'Code-1', role: 'Backend Engineer', status: 'busy', emoji: '⚡', tasksCompleted: 29, tokensUsed: 880000, lastActive: '2026-02-18T14:58:00Z', successRate: 92 },
      { id: 'code-2', name: 'Code-2', role: 'Backend Engineer', status: 'busy', emoji: '🔧', tasksCompleted: 12, tokensUsed: 450000, lastActive: '2026-02-18T14:57:00Z', successRate: 89 },
      { id: 'code-3', name: 'Code-3', role: 'Backend Engineer', status: 'busy', emoji: '🔌', tasksCompleted: 8, tokensUsed: 320000, lastActive: '2026-02-18T14:56:00Z', successRate: 87 },
      { id: 'forge', name: 'Forge', role: 'UI/Frontend Lead', status: 'active', emoji: '🔨', tasksCompleted: 38, tokensUsed: 1350000, lastActive: '2026-02-18T14:59:00Z', successRate: 93 },
      { id: 'forge-2', name: 'Forge-2', role: 'UI/Frontend', status: 'active', emoji: '🎨', tasksCompleted: 22, tokensUsed: 500000, lastActive: '2026-02-18T14:58:00Z', successRate: 91 },
      { id: 'forge-3', name: 'Forge-3', role: 'UI/Frontend', status: 'active', emoji: '✨', tasksCompleted: 18, tokensUsed: 720000, lastActive: '2026-02-18T14:57:00Z', successRate: 90 },
      { id: 'pixel', name: 'Pixel', role: 'Designer', status: 'active', emoji: '🎨', tasksCompleted: 31, tokensUsed: 2500000, lastActive: '2026-02-18T14:59:00Z', successRate: 92 },
      { id: 'glasses', name: 'Glasses', role: 'Researcher', status: 'active', emoji: '🔍', tasksCompleted: 31, tokensUsed: 2000000, lastActive: '2026-02-18T14:45:00Z', successRate: 94 },
      { id: 'quill', name: 'Quill', role: 'Writer', status: 'idle', emoji: '✍️', tasksCompleted: 27, tokensUsed: 380000, lastActive: '2026-02-18T14:25:00Z', successRate: 89 },
      { id: 'gary', name: 'Gary', role: 'Marketing', status: 'idle', emoji: '📢', tasksCompleted: 19, tokensUsed: 340000, lastActive: '2026-02-18T14:20:00Z', successRate: 86 },
      { id: 'larry', name: 'Larry', role: 'Social Media', status: 'idle', emoji: '📱', tasksCompleted: 24, tokensUsed: 420000, lastActive: '2026-02-18T14:15:00Z', successRate: 85 },
      { id: 'buzz', name: 'Buzz', role: 'Social Media', status: 'active', emoji: '🐝', tasksCompleted: 20, tokensUsed: 350000, lastActive: '2026-02-18T14:30:00Z', successRate: 88 },
      { id: 'sentry', name: 'Sentry', role: 'DevOps', status: 'active', emoji: '🛡️', tasksCompleted: 42, tokensUsed: 560000, lastActive: '2026-02-18T14:59:00Z', successRate: 96 },
      { id: 'audit', name: 'Audit', role: 'QA Lead', status: 'active', emoji: '🔍', tasksCompleted: 28, tokensUsed: 770000, lastActive: '2026-02-18T14:55:00Z', successRate: 96 },
      { id: 'cipher', name: 'Cipher', role: 'Security', status: 'idle', emoji: '🔐', tasksCompleted: 15, tokensUsed: 280000, lastActive: '2026-02-18T14:30:00Z', successRate: 88 },
      { id: 'dealflow', name: 'DealFlow', role: 'Lead Gen', status: 'busy', emoji: '🤝', tasksCompleted: 52, tokensUsed: 7510000, lastActive: '2026-02-18T14:59:00Z', successRate: 95 },
      { id: 'coldcall', name: 'ColdCall', role: 'Outreach', status: 'idle', emoji: '📞', tasksCompleted: 8, tokensUsed: 180000, lastActive: '2026-02-18T14:10:00Z', successRate: 84 },
      { id: 'scout', name: 'Scout', role: 'Intel', status: 'active', emoji: '🔭', tasksCompleted: 15, tokensUsed: 80000, lastActive: '2026-02-18T14:55:00Z', successRate: 87 },
      { id: 'pie', name: 'PIE', role: 'Predictive Intelligence', status: 'active', emoji: '🧠', tasksCompleted: 18, tokensUsed: 890000, lastActive: '2026-02-18T14:58:00Z', successRate: 93 }
    ];
    
    res.status(200).json({
      success: true,
      agents: agents,
      total: agents.length,
      active: agents.filter(a => a.status === 'active').length,
      busy: agents.filter(a => a.status === 'busy').length,
      idle: agents.filter(a => a.status === 'idle').length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
