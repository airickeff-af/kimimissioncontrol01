// Vercel Serverless API: Task Queue
// Returns current tasks and priorities

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  res.status(200).json({
    tasks: [
      { id: "TASK-001", name: "Fix Code API 404", priority: "P0", status: "in-progress", assignee: "Code" },
      { id: "TASK-019", name: "Cold Call Approval", priority: "P0", status: "waiting", assignee: "EricF" },
      { id: "TASK-036", name: "Telegram Channels", priority: "P0", status: "waiting", assignee: "EricF" },
      { id: "TASK-005", name: "Regional Leads - Australia", priority: "P1", status: "not-started", assignee: "DealFlow" },
      { id: "TASK-006", name: "Regional Leads - Brazil", priority: "P1", status: "not-started", assignee: "DealFlow" }
    ],
    summary: {
      total: 47,
      p0: 4,
      p1: 8,
      p2: 10,
      completed: 20
    },
    timestamp: new Date().toISOString()
  });
};
