/**
 * Mission Control - File Watcher Service
 * 
 * Monitors agent workspace folders for new files and outputs
 * Triggers automatic updates when changes are detected
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

class FileWatcher extends EventEmitter {
  constructor(options = {}) {
    super();
    this.workspaceRoot = options.workspaceRoot || '/root/.openclaw/workspace';
    this.agentsDir = options.agentsDir || path.join(this.workspaceRoot, 'mission-control/agents');
    this.watchInterval = options.watchInterval || 5000; // 5 seconds
    this.intervals = new Map();
    this.fileCache = new Map(); // Store file hashes for change detection
    this.watchers = new Map(); // Store fs.watch instances
    this.isWatching = false;
  }

  /**
   * Calculate file hash for change detection
   */
  getFileHash(filePath) {
    try {
      const content = fs.readFileSync(filePath);
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (e) {
      return null;
    }
  }

  /**
   * Get file metadata
   */
  getFileMetadata(filePath) {
    try {
      const stat = fs.statSync(filePath);
      return {
        path: filePath,
        relativePath: path.relative(this.workspaceRoot, filePath),
        size: stat.size,
        modified: stat.mtime,
        created: stat.birthtime,
        extension: path.extname(filePath),
        name: path.basename(filePath)
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Scan directory for files
   */
  scanDirectory(dirPath, recursive = true) {
    const files = [];
    
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory() && recursive) {
          // Skip hidden directories and node_modules
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            files.push(...this.scanDirectory(fullPath, recursive));
          }
        } else if (entry.isFile()) {
          files.push(this.getFileMetadata(fullPath));
        }
      }
    } catch (e) {
      console.error(`Error scanning ${dirPath}:`, e.message);
    }
    
    return files;
  }

  /**
   * Get all agent directories
   */
  getAgentDirectories() {
    try {
      return fs.readdirSync(this.agentsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => ({
          name: dirent.name,
          path: path.join(this.agentsDir, dirent.name)
        }));
    } catch (e) {
      console.error('Error reading agents directory:', e.message);
      return [];
    }
  }

  /**
   * Get agent output directories
   */
  getAgentOutputDirs(agentId) {
    const agentPath = path.join(this.agentsDir, agentId);
    const outputDirs = [];
    
    const possibleDirs = ['output', 'outputs', 'reports', 'deliverables', 'results', 'memory', 'logs'];
    
    for (const dir of possibleDirs) {
      const dirPath = path.join(agentPath, dir);
      if (fs.existsSync(dirPath)) {
        outputDirs.push({
          name: dir,
          path: dirPath
        });
      }
    }
    
    return outputDirs;
  }

  /**
   * Watch a specific directory
   */
  watchDirectory(dirPath, agentId = null) {
    if (this.watchers.has(dirPath)) {
      return; // Already watching
    }

    try {
      if (!fs.existsSync(dirPath)) {
        return;
      }

      // Initial scan to establish baseline
      const initialFiles = this.scanDirectory(dirPath);
      for (const file of initialFiles) {
        this.fileCache.set(file.path, {
          hash: this.getFileHash(file.path),
          modified: file.modified
        });
      }

      // Set up fs.watch for real-time monitoring
      const watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        
        const filePath = path.join(dirPath, filename);
        
        // Skip hidden files and temp files
        if (path.basename(filename).startsWith('.') || filename.endsWith('~')) {
          return;
        }

        this.handleFileChange(eventType, filePath, agentId);
      });

      this.watchers.set(dirPath, watcher);
      console.log(`👁️  Watching: ${path.relative(this.workspaceRoot, dirPath)}`);
      
    } catch (e) {
      console.error(`Error watching ${dirPath}:`, e.message);
    }
  }

  /**
   * Handle file change event
   */
  handleFileChange(eventType, filePath, agentId) {
    try {
      const exists = fs.existsSync(filePath);
      const cached = this.fileCache.get(filePath);
      
      if (!exists) {
        // File was deleted
        if (cached) {
          this.fileCache.delete(filePath);
          this.emit('fileDeleted', {
            path: filePath,
            relativePath: path.relative(this.workspaceRoot, filePath),
            agentId,
            timestamp: new Date().toISOString()
          });
        }
        return;
      }

      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        return; // Skip directories in change events
      }

      const newHash = this.getFileHash(filePath);
      
      if (!cached) {
        // New file detected
        const metadata = this.getFileMetadata(filePath);
        this.fileCache.set(filePath, {
          hash: newHash,
          modified: stat.mtime
        });
        
        this.emit('fileCreated', {
          ...metadata,
          agentId,
          eventType: 'created',
          timestamp: new Date().toISOString()
        });
        
      } else if (cached.hash !== newHash) {
        // File was modified
        const metadata = this.getFileMetadata(filePath);
        this.fileCache.set(filePath, {
          hash: newHash,
          modified: stat.mtime
        });
        
        this.emit('fileModified', {
          ...metadata,
          agentId,
          eventType: 'modified',
          previousModified: cached.modified,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (e) {
      console.error(`Error handling change for ${filePath}:`, e.message);
    }
  }

  /**
   * Start watching all agent directories
   */
  start() {
    if (this.isWatching) {
      console.log('File watcher already running');
      return;
    }

    console.log('🔍 Starting File Watcher Service...');
    this.isWatching = true;

    // Watch each agent directory
    const agents = this.getAgentDirectories();
    
    for (const agent of agents) {
      // Watch main agent directory
      this.watchDirectory(agent.path, agent.name);
      
      // Watch output subdirectories
      const outputDirs = this.getAgentOutputDirs(agent.name);
      for (const dir of outputDirs) {
        this.watchDirectory(dir.path, agent.name);
      }
    }

    // Also watch mission-control root for system-level changes
    const missionControlDir = path.join(this.workspaceRoot, 'mission-control');
    if (fs.existsSync(missionControlDir)) {
      this.watchDirectory(missionControlDir, 'system');
    }

    this.emit('started', { 
      timestamp: new Date().toISOString(),
      agentsWatched: agents.length 
    });
    
    console.log(`✅ File Watcher active - monitoring ${agents.length} agents`);
  }

  /**
   * Stop all watchers
   */
  stop() {
    console.log('🛑 Stopping File Watcher Service...');
    
    for (const [dirPath, watcher] of this.watchers) {
      watcher.close();
      console.log(`  Stopped watching: ${path.relative(this.workspaceRoot, dirPath)}`);
    }
    
    this.watchers.clear();
    this.fileCache.clear();
    this.isWatching = false;
    
    this.emit('stopped', { timestamp: new Date().toISOString() });
    console.log('✅ File Watcher stopped');
  }

  /**
   * Get current watch status
   */
  getStatus() {
    return {
      isWatching: this.isWatching,
      watchedDirectories: Array.from(this.watchers.keys()).map(p => ({
        path: p,
        relativePath: path.relative(this.workspaceRoot, p)
      })),
      trackedFiles: this.fileCache.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get recent file activity (last N changes)
   */
  getRecentActivity(limit = 50) {
    // This would need a persistent store in production
    // For now, return current cache state
    const files = [];
    for (const [filePath, data] of this.fileCache) {
      files.push({
        path: filePath,
        relativePath: path.relative(this.workspaceRoot, filePath),
        modified: data.modified,
        hash: data.hash
      });
    }
    
    return files
      .sort((a, b) => new Date(b.modified) - new Date(a.modified))
      .slice(0, limit);
  }

  /**
   * Get files for a specific agent
   */
  getAgentFiles(agentId, options = {}) {
    const agentPath = path.join(this.agentsDir, agentId);
    
    if (!fs.existsSync(agentPath)) {
      return [];
    }

    const { type = 'all', since = null } = options;
    const files = [];

    for (const [filePath, data] of this.fileCache) {
      if (filePath.startsWith(agentPath)) {
        if (since && new Date(data.modified) < new Date(since)) {
          continue;
        }
        
        const metadata = this.getFileMetadata(filePath);
        if (metadata) {
          files.push({
            ...metadata,
            agentId
          });
        }
      }
    }

    return files.sort((a, b) => new Date(b.modified) - new Date(a.modified));
  }

  /**
   * Force refresh of a directory
   */
  refreshDirectory(dirPath) {
    console.log(`🔄 Refreshing: ${path.relative(this.workspaceRoot, dirPath)}`);
    
    // Remove old cache entries for this directory
    for (const filePath of this.fileCache.keys()) {
      if (filePath.startsWith(dirPath)) {
        this.fileCache.delete(filePath);
      }
    }

    // Re-scan
    const files = this.scanDirectory(dirPath);
    for (const file of files) {
      this.fileCache.set(file.path, {
        hash: this.getFileHash(file.path),
        modified: file.modified
      });
    }

    return files;
  }
}

module.exports = FileWatcher;