// Vercel Serverless API: /api/tasks.js
// Returns tasks from data/tasks.json with filtering and caching
// Version: 3.0 - Uses bundled data file for Vercel deployment

const fs = require('fs');
const path = require('path');

// Cache configuration - 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
let taskCache = {
  data: null,
  timestamp: 0
};

function getTasksData() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (taskCache.data && (now - taskCache.timestamp) < CACHE_TTL) {
    return {
      ...taskCache.data,
      cached: true,
      cacheAge: Math.round((now - taskCache.timestamp) / 1000)
    };
  }
  
  // Try to load from bundled data file
  const dataPath = path.join(__dirname, '..', 'data', 'tasks.json');
  
  try {
    const content = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(content);
    
    taskCache = {
      data: data,
      timestamp: now
    };
    
    return {
      ...data,
      cached: false,
      cacheAge: 0
    };
  } catch (error) {
    console.error('Error loading tasks:', error);
    
    // Return fallback data
    return {
      generated: new Date().toISOString(),
      source: 'fallback',
      tasks: [
        {id: "TASK-070", priority: "P0", title: "Fix Deployment Failure", status: "completed", assignee: "Code-1", progress: 100},
        {id: "TASK-066", priority: "P0", title: "Fix API Endpoints", status: "in_progress", assignee: "Code-1,2,3", progress: 75},
        {id: "TASK-093", priority: "P0", title: "HQ Refresh + Auto-Refresh", status: "in_progress", assignee: "Forge", progress: 50}
      ],
      summary: { total: 3, byPriority: {P0: 3, P1: 0, P2: 0, P3: 0}, byStatus: {completed: 1, in_progress: 2, pending: 0} },
      cached: false,
      error: error.message
    };
  }
}

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { status, priority, assignee, search, limit = 100, page = 1, bust } = req.query || {};
    
    // Force cache bust if requested
    if (bust) {
      taskCache.timestamp = 0;
    }
    
    // Get tasks data
    const data = getTasksData();
    let filtered = [...data.tasks];
    
    // Apply filters
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
        (t.id && t.id.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 100;
    const start = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(start, start + limitNum);
    
    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.setHeader('X-Cache-Status', data.cached ? 'HIT' : 'MISS');
    
    res.status(200).json({
      success: true,
      data: {
        tasks: paginated,
        summary: data.summary,
        pagination: {
          total: filtered.length,
          page: pageNum,
          pages: Math.ceil(filtered.length / limitNum),
          limit: limitNum
        }
      },
      meta: {
        source: data.source,
        generated: data.generated,
        cached: data.cached || false,
        cacheAge: data.cacheAge || 0,
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
