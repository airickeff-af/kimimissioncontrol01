// Vercel Serverless Function: /api/tasks.js
// Returns task board data

const fs = require('fs');
const path = require('path');

// Load tasks from PENDING_TASKS.md or TASK_QUEUE.json
function loadTasks() {
  try {
    // First try PENDING_TASKS.md (primary source)
    const pendingFile = path.join(process.cwd(), 'PENDING_TASKS.md');
    if (fs.existsSync(pendingFile)) {
      const content = fs.readFileSync(pendingFile, 'utf8');
      const tasks = parsePendingTasks(content);
      if (tasks.length > 0) return tasks;
    }
    
    // Fallback to TASK_QUEUE.json
    const taskFile = path.join(process.cwd(), 'TASK_QUEUE.json');
    if (fs.existsSync(taskFile)) {
      const data = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
      return data.tasks || [];
    }
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
  return getFallbackTasks();
}

// Parse PENDING_TASKS.md to extract tasks
function parsePendingTasks(content) {
  const tasks = [];
  const lines = content.split('\n');
  let currentTask = null;
  
  for (const line of lines) {
    // Match task headers like ### **TASK-XXX: Title**
    const taskMatch = line.match(/###\s+\*\*TASK-([\d-]+):\s+(.+)\*\*/);
    if (taskMatch) {
      if (currentTask) tasks.push(currentTask);
      currentTask = {
        id: `TASK-${taskMatch[1]}`,
        title: taskMatch[2].trim(),
        description: '',
        priority: 'P2',
        status: 'not_started',
        assignee: 'Unassigned',
        dueDate: 'TBD',
        tags: []
      };
    }
    
    // Extract priority
    if (currentTask && line.includes('Priority:')) {
      const pMatch = line.match(/P[0-3]/);
      if (pMatch) currentTask.priority = pMatch[0];
    }
    
    // Extract status
    if (currentTask && line.includes('Status:')) {
      if (line.includes('COMPLETED')) currentTask.status = 'completed';
      else if (line.includes('IN PROGRESS')) currentTask.status = 'in_progress';
      else if (line.includes('BLOCKED')) currentTask.status = 'blocked';
    }
    
    // Extract assignee
    if (currentTask && line.includes('Assigned:')) {
      const assigneeMatch = line.match(/Assigned:\s*\*\*(.+?)\*\*/);
      if (assigneeMatch) currentTask.assignee = assigneeMatch[1].trim();
    }
    
    // Extract due date
    if (currentTask && line.includes('Due:')) {
      const dueMatch = line.match(/Due:\s*(.+?)(?:\s|$)/);
      if (dueMatch) currentTask.dueDate = dueMatch[1].trim();
    }
  }
  
  if (currentTask) tasks.push(currentTask);
  return tasks;
}

function getFallbackTasks() {
  return [
    { id: 'TASK-093', title: 'HQ Refresh Button — verify + finalize', priority: 'P0', status: 'in_progress', assignee: 'Code-1', dueDate: 'Feb 20', tags: ['ui', 'dashboard'] },
    { id: 'TASK-095', title: 'Real API Integration — test all endpoints', priority: 'P0', status: 'in_progress', assignee: 'Code-2', dueDate: 'Feb 20', tags: ['api', 'backend'] },
    { id: 'TASK-094', title: 'Pixel Office Hierarchy — add interactions', priority: 'P0', status: 'in_progress', assignee: 'Pixel', dueDate: 'Feb 20', tags: ['ui', 'office'] },
    { id: 'TASK-092', title: 'Isometric Pixel Office — simplify scope', priority: 'P0', status: 'in_progress', assignee: 'Pixel', dueDate: 'Feb 20', tags: ['ui', 'office'] },
    { id: 'TASK-071', title: 'Standardize Headers — DONE, verify', priority: 'P1', status: 'completed', assignee: 'Forge', dueDate: 'Feb 19', tags: ['ui'] },
    { id: 'TASK-070', title: 'Deployment Fix — verify vercel.json', priority: 'P1', status: 'completed', assignee: 'Sentry', dueDate: 'Feb 19', tags: ['devops'] },
    { id: 'TASK-120', title: '404 Fix Solutions — test all routes', priority: 'P1', status: 'in_progress', assignee: 'Audit', dueDate: 'Feb 20', tags: ['testing'] },
    { id: 'TASK-003', title: 'Singapore Regional Leads', priority: 'P1', status: 'in_progress', assignee: 'Scout', dueDate: 'Feb 21', tags: ['leads'] },
    { id: 'TASK-004', title: 'Session Context Optimization', priority: 'P2', status: 'not_started', assignee: 'Nexus', dueDate: 'Feb 25', tags: ['backend'] },
    { id: 'TASK-005', title: 'Token Usage Predictor', priority: 'P2', status: 'not_started', assignee: 'Code-1', dueDate: 'Feb 26', tags: ['feature'] }
  ];
}

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

  const tasks = loadTasks();
  
  // Calculate stats
  const stats = {
    total: tasks.length,
    p0: tasks.filter(t => t.priority === 'P0').length,
    p1: tasks.filter(t => t.priority === 'P1').length,
    p2: tasks.filter(t => t.priority === 'P2').length,
    p3: tasks.filter(t => t.priority === 'P3').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'pending' || t.status === 'not_started').length
  };

  res.status(200).json({
    success: true,
    data: {
      tasks: tasks,
      stats: stats
    },
    timestamp: new Date().toISOString()
  });
};
