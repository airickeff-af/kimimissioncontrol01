// /api/tasks.js - Returns all tasks from PENDING_TASKS.md with filtering and caching
// Requirements:
// 1. Read PENDING_TASKS.md from various possible locations
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

// Embedded fallback data in case file is not found
// This is a subset of critical tasks to ensure the API always returns data
const FALLBACK_TASKS = [
  {
    id: "TASK-093",
    priority: "P0",
    title: "Fix HQ Refresh Button + Add Auto-Refresh to All Pages",
    status: "in_progress",
    assignee: "Forge",
    dueDate: "Feb 19, 9:00 AM",
    description: "Add working refresh button and auto-refresh every 30 min to all pages",
    progress: 50
  },
  {
    id: "TASK-095",
    priority: "P0",
    title: "URGENT: Real API Integration + Missing Pages Fix",
    status: "in_progress",
    assignee: "CodeMaster + Forge",
    dueDate: "Feb 19, 9:00 AM",
    description: "Fix API endpoints and create missing pages for dashboard",
    progress: 50
  },
  {
    id: "TASK-092",
    priority: "P0",
    title: "Isometric Pixel Office with Real Agent Activity",
    status: "in_progress",
    assignee: "CodeMaster + Forge + Pixel",
    dueDate: "Feb 19, 9:00 AM",
    description: "Build isometric pixel office with real-time agent activity",
    progress: 50
  },
  {
    id: "TASK-102",
    priority: "P0",
    title: "Connect Tasks API to PENDING_TASKS.md",
    status: "in_progress",
    assignee: "CodeMaster",
    dueDate: "Feb 19, 5:00 PM",
    description: "Fix /api/tasks endpoint to return real task data from PENDING_TASKS.md",
    progress: 75
  }
];

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
      const priority = taskMatch[2] ? taskMatch[2].trim() : 'P2';
      const title = taskMatch[3].trim();
      
      currentTask = {
        id: taskId,
        priority: priority,
        title: title,
        status: 'pending',
        assignee: '',
        dueDate: '',
        description: '',
        progress: 0
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
      
      // Check for end of task section
      if (line.match(/^##+\s/) || (line.trim() === '' && i > taskStartLine + 10)) {
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
 * Find PENDING_TASKS.md file in various possible locations
 * @returns {string|null} File path or null if not found
 */
function findPendingTasksFile() {
  const possiblePaths = [
    // Local development paths
    path.join(process.cwd(), 'PENDING_TASKS.md'),
    path.join(process.cwd(), '..', 'PENDING_TASKS.md'),
    path.join(process.cwd(), '..', '..', 'PENDING_TASKS.md'),
    // Vercel deployment paths - serverless functions run from /var/task
    path.join('/var/task', 'PENDING_TASKS.md'),
    path.join('/var/task', '..', 'PENDING_TASKS.md'),
    path.join('/var/task', 'api', '..', 'PENDING_TASKS.md'),
    // Other possible paths
    '/root/.openclaw/workspace/PENDING_TASKS.md',
    '/workspace/PENDING_TASKS.md',
    '/PENDING_TASKS.md'
  ];
  
  for (const tryPath of possiblePaths) {
    try {
      if (fs.existsSync(tryPath)) {
        return tryPath;
      }
    } catch (e) {
      // Continue to next path
    }
  }
  
  return null;
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
      cacheAge: Math.round((now - taskCache.timestamp) / 1000),
      fromFallback: taskCache.source === 'fallback'
    };
  }
  
  const filePath = findPendingTasksFile();
  
  if (!filePath) {
    // Use fallback data if file not found
    taskCache = {
      data: FALLBACK_TASKS,
      timestamp: now,
      source: 'fallback'
    };
    
    return {
      tasks: FALLBACK_TASKS,
      source: 'fallback - PENDING_TASKS.md not found',
      cached: false,
      cacheAge: 0,
      fromFallback: true,
      warning: 'Using fallback task data. PENDING_TASKS.md not found in deployment.'
    };
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const tasks = parsePendingTasks(content);
    
    // If no tasks parsed, use fallback
    if (tasks.length === 0) {
      taskCache = {
        data: FALLBACK_TASKS,
        timestamp: now,
        source: 'fallback'
      };
      
      return {
        tasks: FALLBACK_TASKS,
        source: 'fallback - parsing returned no tasks',
        cached: false,
        cacheAge: 0,
        fromFallback: true,
        warning: 'Using fallback task data. File parsing returned no tasks.'
      };
    }
    
    // Update cache
    taskCache = {
      data: tasks,
      timestamp: now,
      source: filePath
    };
    
    return {
      tasks: tasks,
      source: filePath,
      cached: false,
      cacheAge: 0,
      fromFallback: false
    };
  } catch (error) {
    // Use fallback on error
    taskCache = {
      data: FALLBACK_TASKS,
      timestamp: now,
      source: 'fallback'
    };
    
    return {
      tasks: FALLBACK_TASKS,
      source: 'fallback - read error',
      cached: false,
      cacheAge: 0,
      fromFallback: true,
      warning: `Using fallback task data. Error: ${error.message}`
    };
  }
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
    const { tasks, source, cached, cacheAge, fromFallback, warning } = getTasksData();
    
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
    
    const response = {
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
        fromFallback: fromFallback || false,
        timestamp: new Date().toISOString()
      }
    };
    
    if (warning) {
      response.meta.warning = warning;
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in /api/tasks:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
