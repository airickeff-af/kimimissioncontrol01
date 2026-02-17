// Vercel Serverless API: Agent Status
// Returns current agent status and health

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  // Return current agent status (this would connect to your agent system)
  res.status(200).json({
    agents: [
      { name: "Nexus", status: "active", tasks: 5, lastActive: "2 min ago" },
      { name: "DealFlow", status: "active", tasks: 3, lastActive: "5 min ago" },
      { name: "Scout", status: "active", tasks: 7, lastActive: "1 min ago" },
      { name: "Forge", status: "active", tasks: 4, lastActive: "3 min ago" },
      { name: "Code", status: "active", tasks: 2, lastActive: "8 min ago" },
      { name: "Quill", status: "idle", tasks: 0, lastActive: "1 hour ago" },
      { name: "Glasses", status: "active", tasks: 1, lastActive: "just now" },
      { name: "Pixel", status: "idle", tasks: 0, lastActive: "2 hours ago" },
      { name: "Larry", status: "blocked", tasks: 1, lastActive: "waiting for API keys" }
    ],
    summary: {
      total: 9,
      active: 7,
      idle: 2,
      blocked: 1
    },
    timestamp: new Date().toISOString()
  });
};
