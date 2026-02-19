// Vercel Serverless Function: /api/agents.js
// Returns list of all Mission Control agents

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
      name: 'Nexus (Air1ck3ff)',
      role: 'Orchestrator',
      status: 'active',
      avatar: '👑',
      description: 'Main coordinator for Mission Control',
      tasksCompleted: 156,
      lastActive: new Date().toISOString()
    },
    {
      id: 'glasses',
      name: 'Glasses',
      role: 'Researcher',
      status: 'active',
      avatar: '🔍',
      description: 'Daily briefings and research tasks',
      tasksCompleted: 89,
      lastActive: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'quill',
      name: 'Quill',
      role: 'Writer',
      status: 'active',
      avatar: '✍️',
      description: 'Content creation specialist',
      tasksCompleted: 67,
      lastActive: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'pixel',
      name: 'Pixel',
      role: 'Designer',
      status: 'active',
      avatar: '🎨',
      description: 'Visual design and UI/UX',
      tasksCompleted: 45,
      lastActive: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'gary',
      name: 'Gary',
      role: 'Marketing',
      status: 'active',
      avatar: '📢',
      description: 'Strategy and campaigns',
      tasksCompleted: 34,
      lastActive: new Date(Date.now() - 5400000).toISOString()
    },
    {
      id: 'larry',
      name: 'Larry',
      role: 'Social',
      status: 'active',
      avatar: '🐦',
      description: 'Social media management',
      tasksCompleted: 78,
      lastActive: new Date(Date.now() - 900000).toISOString()
    },
    {
      id: 'sentry',
      name: 'Sentry',
      role: 'DevOps',
      status: 'active',
      avatar: '🛡️',
      description: 'System monitoring',
      tasksCompleted: 123,
      lastActive: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: 'audit',
      name: 'Audit',
      role: 'QA',
      status: 'active',
      avatar: '✅',
      description: 'Quality reviews',
      tasksCompleted: 92,
      lastActive: new Date(Date.now() - 600000).toISOString()
    },
    {
      id: 'cipher',
      name: 'Cipher',
      role: 'Security',
      status: 'active',
      avatar: '🔐',
      description: 'Security monitoring',
      tasksCompleted: 56,
      lastActive: new Date(Date.now() - 1200000).toISOString()
    },
    {
      id: 'dealflow',
      name: 'DealFlow',
      role: 'Lead Gen',
      status: 'active',
      avatar: '💼',
      description: 'Lead generation and qualification',
      tasksCompleted: 41,
      lastActive: new Date(Date.now() - 2400000).toISOString()
    },
    {
      id: 'scout',
      name: 'Scout',
      role: 'Researcher',
      status: 'active',
      avatar: '🕵️',
      description: 'Market research and scouting',
      tasksCompleted: 38,
      lastActive: new Date(Date.now() - 4800000).toISOString()
    },
    {
      id: 'coldcall',
      name: 'ColdCall',
      role: 'Outreach',
      status: 'active',
      avatar: '📞',
      description: 'Meeting booking and outreach',
      tasksCompleted: 29,
      lastActive: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  res.status(200).json({
    success: true,
    agents: agents,
    total: agents.length,
    timestamp: new Date().toISOString()
  });
};
