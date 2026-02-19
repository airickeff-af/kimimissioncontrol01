// /api/tasks.js - Returns all tasks from PENDING_TASKS.md with filtering and caching
// Requirements:
// 1. Read /root/.openclaw/workspace/PENDING_TASKS.md
// 2. Parse task structure (P0/P1/P2/P3, status, assignee, due dates)
// 3. Return structured JSON from /api/tasks endpoint
// 4. Include: task ID, title, priority, status, assignee, due date
// 5. Handle file not found gracefully
// 6. Add caching (refresh every 5 minutes = 300 seconds)

const fs = require('fs');
const path = require('path');

// Cache configuration - 5 minutes as per requirements
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
let taskCache = {
  data: null,
  timestamp: 0,
  source: null
};

/**
 * Parse PENDING_TASKS.md and extract structured task data
 * @param {string} content - File content
 * @returns {Array} Array of task objects
 */
function parsePendingTasks(content) {
  const tasks = [];
  const lines = content.split('\n');
  
  let currentTask = null;
  let inTaskSection = false;
  let taskStartLine = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match task headers like "### **TASK-070: P0 - Fix Complete Deployment Failure**"
    // or "### **TASK-070: Fix Complete Deployment Failure**"
    const taskMatch = line.match(/###\s*\*\*TASK-(\d+):\s*(?:(P\d+)\s*-\s*)?(.+?)\*\*/);
    if (taskMatch) {
      // Save previous task if exists
      if (currentTask) {
        tasks.push(currentTask);
      }
      
      const taskId = `TASK-${taskMatch[1]}`;
      const priority = taskMatch[2] ? taskMatch[2].trim() : 'P2'; // Default to P2 if not specified
      const title = taskMatch[3].trim();
      
      currentTask = {
        id: taskId,
        priority: priority,
        title: title,
        status: 'pending',
        assignee: '',
        dueDate: '',
        description: '',
        progress: 0,
        created: '',
        completed: ''
      };
      inTaskSection = true;
      taskStartLine = i;
      continue;
    }
    
    if (currentTask && inTaskSection) {
      // Parse assigned
      if (line.match(/[-\s]*\*\*Assigned:\*\*/i)) {
        const assignedMatch = line.match(/Assigned:\*\*\s*(.+)/i);
        if (assignedMatch) {
          currentTask.assignee = assignedMatch[1].trim()
            .replace(/\s*✅.*$/, '')
            .replace(/\s*⏳.*$/, '')
            .replace(/\s*🟡.*$/, '')
            .replace(/\s*🔴.*$/, '');
        }
      }
      
      // Parse due date
      if (line.match(/[-\s]*\*\*Due:\*\*/i)) {
        const dueMatch = line.match(/Due:\*\*\s*(.+)/i);
        if (dueMatch) {
          currentTask.dueDate = dueMatch[1].trim()
            .replace(/\s*-\s*.*$/, '')
            .replace(/\s*\(.*\)$/, '');
        }
      }
      
      // Parse status
      if (line.match(/[-\s]*\*\*Status:\*\*/i)) {
        const statusMatch = line.match(/Status:\*\*\s*(.+)/i);
        if (statusMatch) {
          const statusText = statusMatch[1].toLowerCase();
          if (statusText.includes('completed') || statusText.includes('✅') || statusText.includes('done')) {
            currentTask.status = 'completed';
            currentTask.progress = 100;
          } else if (statusText.includes('in progress') || statusText.includes('🟡') || statusText.includes('progress')) {
            currentTask.status = 'in_progress';
            currentTask.progress = 50;
          } else if (statusText.includes('blocked') || statusText.includes('🚫') || statusText.includes('❌')) {
            currentTask.status = 'blocked';
            currentTask.progress = 25;
          } else if (statusText.includes('planned') || statusText.includes('⏳') || statusText.includes('not started')) {
            currentTask.status = 'planned';
            currentTask.progress = 0;
          } else if (statusText.includes('critical') || statusText.includes('🔴')) {
            currentTask.status = 'critical';
            currentTask.progress = 10;
          } else {
            currentTask.status = 'pending';
            currentTask.progress = 0;
          }
        }
      }
      
      // Parse description
      if (line.match(/[-\s]*\*\*Description:\*\*/i)) {
        const descMatch = line.match(/Description:\*\*\s*(.+)/i);
        if (descMatch) {
          currentTask.description = descMatch[1].trim();
        }
      }
      
      // Check for end of task section (new header or empty line followed by new section)
      if (line.match(/^##+\s/) || (line.trim() === '' && i > taskStartLine + 10)) {
        // Check if next non-empty line starts a new task or section
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === '') j++;
        if (j < lines.length) {
          const nextLine = lines[j];
          if (nextLine.match(/^##+\s/) || nextLine.match(/###\s*\*\*TASK-/)) {
            inTaskSection = false;
            if (currentTask) {
              tasks.push(currentTask);
              currentTask = null;
            }
          }
        }
      }
    }
  }
  
  // Don't forget the last task
  if (currentTask) {
    tasks.push(currentTask);
  }
  
  return tasks;
}

/**
 * Get tasks from cache or reload from file
 * @returns {Object} Tasks data with metadata
 */
function getTasksData() {
  const now = Date.now();
  
  // Check if cache is still valid (5 minute TTL)
  if (taskCache.data && (now - taskCache.timestamp) < CACHE_TTL) {
    return {
      tasks: taskCache.data,
      source: taskCache.source,
      cached: true,
      cacheAge: Math.round((now - taskCache.timestamp) / 1000)
    };
  }
  
  // Try multiple possible paths for PENDING_TASKS.md
  const possiblePaths = [
    path.join(process.cwd(), 'PENDING_TASKS.md'),
    path.join(process.cwd(), '..', 'PENDING_TASKS.md'),
    path.join(process.cwd(), '..', '..', 'PENDING_TASKS.md'),
    '/root/.openclaw/workspace/PENDING_TASKS.md',
    '/workspace/PENDING_TASKS.md'
  ];
  
  let content = null;
  let foundPath = null;
  
  for (const tryPath of possiblePaths) {
    try {
      if (fs.existsSync(tryPath)) {
        content = fs.readFileSync(tryPath, 'utf-8');
        foundPath = tryPath;
        break;
      }
    } catch (e) {
      // Continue to next path
    }
  }
  
  if (!content) {
    return {
      tasks: [],
      source: 'error - no data source available',
      cached: false,
      error: 'PENDING_TASKS.md not found in any expected location'
    };
  }
  
  // Parse tasks from content
  const tasks = parsePendingTasks(content);
  
  // Update cache
  taskCache = {
    data: tasks,
    timestamp: now,
    source: foundPath
  };
  
  return {
    tasks: tasks,
    source: foundPath,
    cached: false,
    cacheAge: 0
  };
}

/**
 * Calculate summary statistics from tasks
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Summary statistics
 */
function calculateSummary(tasks) {
  return {
    total: tasks.length,
    byPriority: {
      P0: tasks.filter(t => t.priority === 'P0').length,
      P1: tasks.filter(t => t.priority === 'P1').length,
      P2: tasks.filter(t => t.priority === 'P2').length,
      P3: tasks.filter(t => t.priority === 'P3').length
    },
    byStatus: {
      completed: tasks.filter(t => t.status === 'completed').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      planned: tasks.filter(t => t.status === 'planned').length,
      critical: tasks.filter(t => t.status === 'critical').length
    }
  };
}

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Get query parameters for filtering
    const { status, priority, assignee, search, limit = 100, page = 1, bust } = req.query || {};
    
    // Force cache bust if requested
    if (bust) {
      taskCache.timestamp = 0;
    }
    
    // Get tasks data (from cache or file)
    const { tasks, source, cached, cacheAge, error } = getTasksData();
    
    if (error) {
      return res.status(500).json({
        success: false,
        error: error,
        timestamp: new Date().toISOString()
      });
    }
    
    // Apply filters
    let filtered = [...tasks];
    
    if (status) {
      filtered = filtered.filter(t => t.status.toLowerCase() === status.toLowerCase());
    }
    
    if (priority) {
      filtered = filtered.filter(t => t.priority.toUpperCase() === priority.toUpperCase());
    }
    
    if (assignee) {
      const assigneeLower = assignee.toLowerCase();
      filtered = filtered.filter(t => 
        t.assignee && t.assignee.toLowerCase().includes(assigneeLower)
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(t => 
        (t.title && t.title.toLowerCase().includes(searchLower)) ||
        (t.description && t.description.toLowerCase().includes(searchLower)) ||
        (t.id && t.id.toLowerCase().includes(searchLower))
      );
    }
    
    // Calculate summary
    const summary = calculateSummary(tasks);
    const filteredSummary = calculateSummary(filtered);
    
    // Apply pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 100;
    const start = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(start, start + limitNum);
    
    // Set cache headers (5 minutes)
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.setHeader('X-Cache-Status', cached ? 'HIT' : 'MISS');
    res.setHeader('X-Cache-Age', cacheAge.toString());
    
    res.status(200).json({
      success: true,
      data: {
        tasks: paginated,
        summary: summary,
        filteredSummary: filteredSummary,
        pagination: {
          total: filtered.length,
          page: pageNum,
          pages: Math.ceil(filtered.length / limitNum),
          limit: limitNum
        }
      },
      meta: {
        source: source,
        cached: cached,
        cacheAge: cacheAge,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in /api/tasks:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
