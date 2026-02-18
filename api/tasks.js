// /api/tasks.js - Returns all tasks from PENDING_TASKS.md with filtering

const fs = require('fs');
const path = require('path');

function parsePendingTasks(content) {
  const tasks = [];
  const lines = content.split('\n');
  
  let currentTask = null;
  let inTaskSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match task headers like "### **TASK-070: P0 - Fix Complete Deployment Failure**"
    const taskMatch = line.match(/###\s*\*\*TASK-(\d+):\s*(P\d+)\s*-\s*(.+?)\*\*/);
    if (taskMatch) {
      if (currentTask) {
        tasks.push(currentTask);
      }
      currentTask = {
        id: `TASK-${taskMatch[1]}`,
        priority: taskMatch[2],
        title: taskMatch[3].trim(),
        status: 'pending',
        assigned: '',
        due: '',
        progress: 0,
        description: ''
      };
      inTaskSection = true;
      continue;
    }
    
    if (currentTask && inTaskSection) {
      // Parse assigned
      if (line.includes('**Assigned:**') || line.includes('- **Assigned:**')) {
        const assignedMatch = line.match(/Assigned:\*\*\s*(.+)/);
        if (assignedMatch) {
          currentTask.assigned = assignedMatch[1].trim().replace(/\s*✅.*$/, '').replace(/\s*⏳.*$/, '');
        }
      }
      
      // Parse due date
      if (line.includes('**Due:**') || line.includes('- **Due:**')) {
        const dueMatch = line.match(/Due:\*\*\s*(.+)/);
        if (dueMatch) {
          currentTask.due = dueMatch[1].trim().replace(/\s*-\s*.*$/, '');
        }
      }
      
      // Parse status
      if (line.includes('**Status:**') || line.includes('- **Status:**')) {
        const statusMatch = line.match(/Status:\*\*\s*(.+)/);
        if (statusMatch) {
          const statusText = statusMatch[1].toLowerCase();
          if (statusText.includes('completed') || statusText.includes('✅')) {
            currentTask.status = 'completed';
            currentTask.progress = 100;
          } else if (statusText.includes('in progress') || statusText.includes('🟡') || statusText.includes('🔴')) {
            currentTask.status = 'in_progress';
            currentTask.progress = 50;
          } else if (statusText.includes('blocked')) {
            currentTask.status = 'blocked';
            currentTask.progress = 25;
          } else if (statusText.includes('planned') || statusText.includes('⏳')) {
            currentTask.status = 'planned';
            currentTask.progress = 0;
          }
        }
      }
      
      // Collect description from bullet points
      if (line.trim().startsWith('- ') && !line.includes('**Assigned:**') && !line.includes('**Due:**') && !line.includes('**Status:**') && !line.includes('**Priority:**')) {
        currentTask.description += line.trim().substring(2) + ' ';
      }
      
      // Empty line or new section header ends the task
      if (line.trim() === '' || line.match(/^##+\s/)) {
        inTaskSection = false;
      }
    }
  }
  
  if (currentTask) {
    tasks.push(currentTask);
  }
  
  return tasks;
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { status, priority, agent, limit = 50, page = 1 } = req.query;
    
    // Read from PENDING_TASKS.md
    const pendingTasksPath = path.join(process.cwd(), '..', '..', 'PENDING_TASKS.md');
    let tasks = [];
    let source = 'file';
    
    try {
      const content = fs.readFileSync(pendingTasksPath, 'utf-8');
      tasks = parsePendingTasks(content);
      source = 'PENDING_TASKS.md';
    } catch (fileError) {
      console.error('Error reading PENDING_TASKS.md:', fileError.message);
      // Fallback to mission-control-db.json if PENDING_TASKS.md fails
      try {
        const dbPath = path.join(process.cwd(), 'mission-control/dashboard/data/mission-control-db.json');
        const dbContent = fs.readFileSync(dbPath, 'utf-8');
        const db = JSON.parse(dbContent);
        tasks = db.tasks || [];
        source = 'mission-control-db.json (fallback)';
      } catch (dbError) {
        tasks = [];
        source = 'error - no data source available';
      }
    }
    
    let filtered = tasks;
    
    if (status) filtered = filtered.filter(t => t.status === status);
    if (priority) filtered = filtered.filter(t => t.priority === priority);
    if (agent) filtered = filtered.filter(t => t.assigned && t.assigned.toLowerCase().includes(agent.toLowerCase()));
    
    // Calculate summary
    const summary = {
      total: tasks.length,
      p0: tasks.filter(t => t.priority === 'P0').length,
      p1: tasks.filter(t => t.priority === 'P1').length,
      p2: tasks.filter(t => t.priority === 'P2').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      pending: tasks.filter(t => t.status === 'pending' || t.status === 'planned').length
    };
    
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + parseInt(limit));
    
    res.status(200).json({
      success: true,
      tasks: paginated,
      total: filtered.length,
      page: parseInt(page),
      pages: Math.ceil(filtered.length / limit),
      summary,
      source,
      filters: { status, priority, agent },
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
