// Vercel Serverless Function: /api/agents.js
// Returns list of all Mission Control agents with status tracking

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const agents = [
    {
      id: 'nexus',
      name: 'Nexus',
      emoji: '👑',
      role: 'Orchestrator',
      status: 'active',
      color: 'linear-gradient(135deg, #ffd700, #ffaa00)',
      description: 'Main coordinator for Mission Control',
      tasksCompleted: 156,
      tokens: 125000,
      files: 89,
      tasks: 45,
      lastActive: new Date().toISOString()
    },
    {
      id: 'glasses',
      name: 'Glasses',
      emoji: '🔍',
      role: 'Researcher',
      status: 'active',
      color: 'linear-gradient(135deg, #00d4ff, #0099cc)',
      description: 'Daily briefings and research tasks',
      tasksCompleted: 89,
      tokens: 98000,
      files: 56,
      tasks: 32,
      lastActive: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'quill',
      name: 'Quill',
      emoji: '✍️',
      role: 'Writer',
      status: 'idle',
      color: 'linear-gradient(135deg, #ff6b9d, #e94560)',
      description: 'Content creation specialist',
      tasksCompleted: 67,
      tokens: 76000,
      files: 42,
      tasks: 28,
      lastActive: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'pixel',
      name: 'Pixel',
      emoji: '🎨',
      role: 'Designer',
      status: 'busy',
      color: 'linear-gradient(135deg, #a855f7, #7c3aed)',
      description: 'Visual design and UI/UX',
      tasksCompleted: 45,
      tokens: 54000,
      files: 78,
      tasks: 35,
      lastActive: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'gary',
      name: 'Gary',
      emoji: '📢',
      role: 'Marketing',
      status: 'idle',
      color: 'linear-gradient(135deg, #f97316, #ea580c)',
      description: 'Strategy and campaigns',
      tasksCompleted: 34,
      tokens: 43000,
      files: 23,
      tasks: 18,
      lastActive: new Date(Date.now() - 5400000).toISOString()
    },
    {
      id: 'larry',
      name: 'Larry',
      emoji: '🐦',
      role: 'Social',
      status: 'active',
      color: 'linear-gradient(135deg, #1da1f2, #0d8bd9)',
      description: 'Social media management',
      tasksCompleted: 78,
      tokens: 87000,
      files: 45,
      tasks: 52,
      lastActive: new Date(Date.now() - 900000).toISOString()
    },
    {
      id: 'sentry',
      name: 'Sentry',
      emoji: '🛡️',
      role: 'DevOps',
      status: 'active',
      color: 'linear-gradient(135deg, #00ff88, #00cc6a)',
      description: 'System monitoring',
      tasksCompleted: 123,
      tokens: 67000,
      files: 34,
      tasks: 67,
      lastActive: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: 'audit',
      name: 'Audit',
      emoji: '✅',
      role: 'QA',
      status: 'busy',
      color: 'linear-gradient(135deg, #22c55e, #16a34a)',
      description: 'Quality reviews',
      tasksCompleted: 92,
      tokens: 45000,
      files: 67,
      tasks: 41,
      lastActive: new Date(Date.now() - 600000).toISOString()
    },
    {
      id: 'cipher',
      name: 'Cipher',
      emoji: '🔐',
      role: 'Security',
      status: 'active',
      color: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      description: 'Security monitoring',
      tasksCompleted: 56,
      tokens: 38000,
      files: 29,
      tasks: 22,
      lastActive: new Date(Date.now() - 1200000).toISOString()
    },
    {
      id: 'dealflow',
      name: 'DealFlow',
      emoji: '💼',
      role: 'Lead Gen',
      status: 'busy',
      color: 'linear-gradient(135deg, #14b8a6, #0d9488)',
      description: 'Lead generation and qualification',
      tasksCompleted: 41,
      tokens: 72000,
      files: 38,
      tasks: 45,
      lastActive: new Date(Date.now() - 2400000).toISOString()
    },
    {
      id: 'scout',
      name: 'Scout',
      emoji: '🕵️',
      role: 'Researcher',
      status: 'active',
      color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      description: 'Market research and scouting',
      tasksCompleted: 38,
      tokens: 89000,
      files: 52,
      tasks: 31,
      lastActive: new Date(Date.now() - 4800000).toISOString()
    },
    {
      id: 'coldcall',
      name: 'ColdCall',
      emoji: '📞',
      role: 'Outreach',
      status: 'idle',
      color: 'linear-gradient(135deg, #ec4899, #db2777)',
      description: 'Meeting booking and outreach',
      tasksCompleted: 29,
      tokens: 34000,
      files: 18,
      tasks: 24,
      lastActive: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'code-1',
      name: 'Code-1',
      emoji: '💻',
      role: 'Developer',
      status: 'busy',
      color: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      description: 'Backend development',
      tasksCompleted: 78,
      tokens: 112000,
      files: 89,
      tasks: 56,
      lastActive: new Date(Date.now() - 60000).toISOString()
    },
    {
      id: 'forge',
      name: 'Forge',
      emoji: '🔨',
      role: 'Design Lead',
      status: 'busy',
      color: 'linear-gradient(135deg, #f59e0b, #d97706)',
      description: 'Design system and UI architecture',
      tasksCompleted: 67,
      tokens: 54000,
      files: 72,
      tasks: 38,
      lastActive: new Date(Date.now() - 120000).toISOString()
    },
    {
      id: 'pie',
      name: 'PIE',
      emoji: '🧠',
      role: 'Intelligence',
      status: 'active',
      color: 'linear-gradient(135deg, #84cc16, #65a30d)',
      description: 'AI intelligence and analysis',
      tasksCompleted: 52,
      tokens: 98000,
      files: 41,
      tasks: 33,
      lastActive: new Date(Date.now() - 900000).toISOString()
    },
    {
      id: 'buzz',
      name: 'Buzz',
      emoji: '🔔',
      role: 'Notifications',
      status: 'active',
      color: 'linear-gradient(135deg, #ef4444, #dc2626)',
      description: 'Alert and notification system',
      tasksCompleted: 145,
      tokens: 23000,
      files: 12,
      tasks: 89,
      lastActive: new Date(Date.now() - 180000).toISOString()
    }
  ];

  // Calculate stats
  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    busy: agents.filter(a => a.status === 'busy').length,
    idle: agents.filter(a => a.status === 'idle').length
  };

  res.status(200).json({
    success: true,
    agents: agents,
    stats: stats,
    total: agents.length,
    timestamp: new Date().toISOString()
  });
};
