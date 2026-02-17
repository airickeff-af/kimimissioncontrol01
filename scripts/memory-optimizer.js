#!/usr/bin/env node
/**
 * Memory Optimizer Script
 * TASK-CI-006: Automated memory cleanup and optimization
 * 
 * Features:
 * - Compress old session transcripts
 * - Archive completed tasks from memory
 * - LRU cache implementation for frequent data
 * - Smart memory eviction
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  memoryDir: '/root/.openclaw/workspace/memory',
  archiveDir: '/root/.openclaw/workspace/memory/archive',
  cacheDir: '/root/.openclaw/workspace/memory/cache',
  maxCacheSize: 50, // Max number of cached items
  maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  archiveThreshold: 2 * 24 * 60 * 60 * 1000, // Archive files older than 2 days
  compressionThreshold: 100 * 1024, // Compress files > 100KB
  tokenWarningThreshold: 150000,
  tokenCriticalThreshold: 200000
};

// LRU Cache Implementation
class LRUCache {
  constructor(maxSize = CONFIG.maxCacheSize) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      // Move to front (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
      this.stats.hits++;
      return value;
    }
    this.stats.misses++;
    return null;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : 'N/A'
    };
  }

  toJSON() {
    return {
      cache: Array.from(this.cache.entries()),
      stats: this.stats
    };
  }

  fromJSON(data) {
    this.cache = new Map(data.cache);
    this.stats = data.stats;
  }
}

// Global cache instance
const globalCache = new LRUCache();

// Utility: Calculate file hash for deduplication
function getFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

// Utility: Get file size in human readable format
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Utility: Parse memory file to extract metadata
function parseMemoryFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const stats = fs.statSync(filePath);
  
  const metadata = {
    path: filePath,
    size: stats.size,
    mtime: stats.mtime,
    ctime: stats.ctime,
    isTask: content.includes('TASK-'),
    isCompleted: content.includes('Status: Completed') || content.includes('✅ Complete'),
    isAborted: content.includes('Status: Aborted') || content.includes('❌ Aborted'),
    tokenEstimate: Math.ceil(content.length / 4), // Rough estimate: 4 chars ≈ 1 token
    topics: []
  };

  // Extract topics/keywords
  const topicMatches = content.match(/#{2,3}\s+(.+)/g);
  if (topicMatches) {
    metadata.topics = topicMatches.map(t => t.replace(/#{2,3}\s+/, '').trim());
  }

  return metadata;
}

// Action 1: Compress old session transcripts
async function compressOldTranscripts() {
  console.log('📦 Compressing old session transcripts...');
  
  const results = {
    compressed: 0,
    skipped: 0,
    errors: 0,
    saved: 0
  };

  try {
    const files = fs.readdirSync(CONFIG.memoryDir)
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(CONFIG.memoryDir, f));

    for (const file of files) {
      try {
        const stats = fs.statSync(file);
        const age = Date.now() - stats.mtime.getTime();
        
        // Skip files that are too new or already compressed
        if (age < CONFIG.archiveThreshold) {
          results.skipped++;
          continue;
        }

        // Compress if file is large
        if (stats.size > CONFIG.compressionThreshold) {
          const content = fs.readFileSync(file, 'utf8');
          
          // Simple compression: remove redundant whitespace, normalize headers
          const compressed = content
            .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
            .replace(/#{4,}/g, '###') // Normalize deep headers
            .replace(/\[\s*\]/g, '[]') // Normalize empty checkboxes
            .replace(/\[x\]/gi, '[x]') // Normalize checked boxes
            .trim();

          const originalSize = stats.size;
          const compressedSize = Buffer.byteLength(compressed, 'utf8');
          const saved = originalSize - compressedSize;

          if (saved > 1000) { // Only save if meaningful compression
            // Move original to archive
            const archivePath = path.join(CONFIG.archiveDir, path.basename(file) + '.original');
            fs.renameSync(file, archivePath);
            
            // Write compressed version
            fs.writeFileSync(file, compressed);
            
            results.compressed++;
            results.saved += saved;
            console.log(`  ✓ Compressed ${path.basename(file)}: ${formatBytes(saved)} saved`);
          } else {
            results.skipped++;
          }
        } else {
          results.skipped++;
        }
      } catch (err) {
        results.errors++;
        console.error(`  ✗ Error processing ${file}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Error in compressOldTranscripts:', err);
  }

  console.log(`  Compressed: ${results.compressed}, Skipped: ${results.skipped}, Errors: ${results.errors}`);
  console.log(`  Total space saved: ${formatBytes(results.saved)}`);
  return results;
}

// Action 2: Archive completed tasks from memory
async function archiveCompletedTasks() {
  console.log('📁 Archiving completed tasks...');
  
  const results = {
    archived: 0,
    skipped: 0,
    errors: 0,
    tokensFreed: 0
  };

  try {
    const files = fs.readdirSync(CONFIG.memoryDir)
      .filter(f => f.endsWith('.md') && !f.startsWith('ARCHIVED'))
      .map(f => path.join(CONFIG.memoryDir, f));

    for (const file of files) {
      try {
        const metadata = parseMemoryFile(file);
        const age = Date.now() - metadata.mtime.getTime();
        
        // Archive criteria: completed task AND older than threshold
        if (metadata.isTask && metadata.isCompleted && age > CONFIG.archiveThreshold) {
          const archiveName = `ARCHIVED-${path.basename(file)}`;
          const archivePath = path.join(CONFIG.archiveDir, archiveName);
          
          // Add archive header
          const content = fs.readFileSync(file, 'utf8');
          const archivedContent = `---\nARCHIVED: ${new Date().toISOString()}\nORIGINAL: ${path.basename(file)}\nTOKENS_EST: ${metadata.tokenEstimate}\n---\n\n${content}`;
          
          fs.writeFileSync(archivePath, archivedContent);
          fs.unlinkSync(file);
          
          results.archived++;
          results.tokensFreed += metadata.tokenEstimate;
          console.log(`  ✓ Archived ${path.basename(file)} (~${metadata.tokenEstimate} tokens freed)`);
        } else {
          results.skipped++;
        }
      } catch (err) {
        results.errors++;
        console.error(`  ✗ Error archiving ${file}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Error in archiveCompletedTasks:', err);
  }

  console.log(`  Archived: ${results.archived}, Skipped: ${results.skipped}, Errors: ${results.errors}`);
  console.log(`  Estimated tokens freed: ~${results.tokensFreed}`);
  return results;
}

// Action 3: Implement LRU cache for frequent data
async function optimizeCache() {
  console.log('🗂️  Optimizing LRU cache...');
  
  const results = {
    loaded: 0,
    cleaned: 0,
    errors: 0
  };

  try {
    // Ensure cache directory exists
    if (!fs.existsSync(CONFIG.cacheDir)) {
      fs.mkdirSync(CONFIG.cacheDir, { recursive: true });
    }

    const cacheFile = path.join(CONFIG.cacheDir, 'lru-cache.json');
    
    // Load existing cache if present
    if (fs.existsSync(cacheFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        globalCache.fromJSON(data);
        results.loaded = globalCache.cache.size;
      } catch (err) {
        console.log('  Cache file corrupted, starting fresh');
      }
    }

    // Pre-populate cache with frequently accessed data
    const frequentFiles = [
      'HEARTBEAT.md',
      'MEMORY.md',
      'TASK_QUEUE.md',
      'PENDING_TASKS.md'
    ];

    for (const filename of frequentFiles) {
      const filePath = path.join('/root/.openclaw/workspace', filename);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const key = `file:${filename}`;
        globalCache.set(key, {
          content: content.substring(0, 10000), // Cache first 10KB
          mtime: fs.statSync(filePath).mtime,
          tokens: Math.ceil(content.length / 4)
        });
      }
    }

    // Clean old cache entries
    const cacheEntries = Array.from(globalCache.cache.entries());
    for (const [key, value] of cacheEntries) {
      if (value.mtime && (Date.now() - new Date(value.mtime).getTime() > CONFIG.maxCacheAge)) {
        globalCache.cache.delete(key);
        results.cleaned++;
      }
    }

    // Save cache state
    fs.writeFileSync(cacheFile, JSON.stringify(globalCache.toJSON(), null, 2));

    console.log(`  Cache entries: ${globalCache.cache.size}`);
    console.log(`  Stats: ${JSON.stringify(globalCache.getStats())}`);
  } catch (err) {
    results.errors++;
    console.error('Error in optimizeCache:', err);
  }

  return results;
}

// Action 4: Optimize context window usage
async function optimizeContextWindow() {
  console.log('🪟 Optimizing context window usage...');
  
  const results = {
    tokenReduction: 0,
    recommendations: []
  };

  try {
    // Analyze current memory files for token usage
    const files = fs.readdirSync(CONFIG.memoryDir)
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(CONFIG.memoryDir, f));

    let totalTokens = 0;
    const fileTokens = [];

    for (const file of files) {
      const metadata = parseMemoryFile(file);
      totalTokens += metadata.tokenEstimate;
      fileTokens.push({
        file: path.basename(file),
        tokens: metadata.tokenEstimate,
        age: Date.now() - metadata.mtime.getTime()
      });
    }

    // Sort by token usage (highest first)
    fileTokens.sort((a, b) => b.tokens - a.tokens);

    console.log(`  Current memory token usage: ~${totalTokens}`);
    console.log(`  Top consumers:`);
    fileTokens.slice(0, 5).forEach((f, i) => {
      console.log(`    ${i + 1}. ${f.file}: ~${f.tokens} tokens`);
    });

    // Generate recommendations
    if (totalTokens > CONFIG.tokenWarningThreshold) {
      results.recommendations.push(`⚠️ Memory token usage (${totalTokens}) exceeds warning threshold (${CONFIG.tokenWarningThreshold})`);
      
      // Suggest archiving old large files
      const oldLargeFiles = fileTokens.filter(f => f.age > CONFIG.archiveThreshold && f.tokens > 1000);
      if (oldLargeFiles.length > 0) {
        const potentialSavings = oldLargeFiles.reduce((sum, f) => sum + f.tokens, 0);
        results.recommendations.push(`💡 Archive ${oldLargeFiles.length} old large files to save ~${potentialSavings} tokens`);
      }
    }

    if (totalTokens > CONFIG.tokenCriticalThreshold) {
      results.recommendations.push(`🚨 CRITICAL: Memory token usage (${totalTokens}) exceeds critical threshold (${CONFIG.tokenCriticalThreshold})`);
      results.recommendations.push(`📝 Immediate action: Archive all completed tasks and compress transcripts`);
    }

    results.tokenReduction = totalTokens;
  } catch (err) {
    console.error('Error in optimizeContextWindow:', err);
  }

  results.recommendations.forEach(r => console.log(`  ${r}`));
  return results;
}

// Action 5: Smart memory eviction
async function smartMemoryEviction() {
  console.log('🧹 Smart memory eviction...');
  
  const results = {
    evicted: 0,
    preserved: 0,
    errors: 0,
    tokensSaved: 0
  };

  try {
    const files = fs.readdirSync(CONFIG.memoryDir)
      .filter(f => f.endsWith('.md') && !f.startsWith('ARCHIVED'))
      .map(f => path.join(CONFIG.memoryDir, f));

    // Priority scoring for each file
    const fileScores = files.map(file => {
      const metadata = parseMemoryFile(file);
      const age = Date.now() - metadata.mtime.getTime();
      const ageDays = age / (24 * 60 * 60 * 1000);
      
      // Priority score (higher = more important to keep)
      let score = 0;
      
      // Boost for recent files
      if (ageDays < 1) score += 50;
      else if (ageDays < 2) score += 30;
      else if (ageDays < 7) score += 10;
      
      // Boost for incomplete tasks
      if (metadata.isTask && !metadata.isCompleted) score += 40;
      
      // Boost for files with important keywords
      const importantKeywords = ['HEARTBEAT', 'MEMORY', 'TASK_QUEUE', 'PENDING'];
      if (importantKeywords.some(k => path.basename(file).includes(k))) score += 100;
      
      // Penalty for completed old tasks
      if (metadata.isTask && metadata.isCompleted && ageDays > 2) score -= 50;
      
      // Penalty for aborted sessions
      if (metadata.isAborted) score -= 30;
      
      return { file, metadata, score, ageDays };
    });

    // Sort by score (lowest first = candidates for eviction)
    fileScores.sort((a, b) => a.score - b.score);

    // Evict low-priority files
    const evictionThreshold = -20; // Score below this gets evicted
    for (const item of fileScores) {
      if (item.score < evictionThreshold) {
        try {
          const archiveName = `EVICTED-${path.basename(item.file)}`;
          const archivePath = path.join(CONFIG.archiveDir, archiveName);
          
          fs.copyFileSync(item.file, archivePath);
          fs.unlinkSync(item.file);
          
          results.evicted++;
          results.tokensSaved += item.metadata.tokenEstimate;
          console.log(`  ✓ Evicted ${path.basename(item.file)} (score: ${item.score}, ~${item.metadata.tokenEstimate} tokens)`);
        } catch (err) {
          results.errors++;
          console.error(`  ✗ Error evicting ${item.file}: ${err.message}`);
        }
      } else {
        results.preserved++;
      }
    }
  } catch (err) {
    console.error('Error in smartMemoryEviction:', err);
  }

  console.log(`  Evicted: ${results.evicted}, Preserved: ${results.preserved}, Errors: ${results.errors}`);
  console.log(`  Tokens saved: ~${results.tokensSaved}`);
  return results;
}

// Main execution
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Memory Optimizer - TASK-CI-006');
  console.log('  Started:', new Date().toISOString());
  console.log('═══════════════════════════════════════════════\n');

  // Ensure directories exist
  [CONFIG.archiveDir, CONFIG.cacheDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const startTime = Date.now();
  const results = {};

  // Run all optimization actions
  results.compression = await compressOldTranscripts();
  results.archival = await archiveCompletedTasks();
  results.cache = await optimizeCache();
  results.context = await optimizeContextWindow();
  results.eviction = await smartMemoryEviction();

  const duration = Date.now() - startTime;
  
  // Calculate total tokens saved
  const totalTokensSaved = 
    (results.archival.tokensFreed || 0) + 
    (results.eviction.tokensSaved || 0);

  console.log('\n═══════════════════════════════════════════════');
  console.log('  Optimization Complete');
  console.log('  Duration:', (duration / 1000).toFixed(2) + 's');
  console.log('  Total tokens saved: ~' + totalTokensSaved);
  console.log('═══════════════════════════════════════════════');

  // Update heartbeat state with memory stats
  const statePath = path.join(CONFIG.memoryDir, 'heartbeat-state.json');
  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    state.memoryOptimization = {
      lastRun: Math.floor(Date.now() / 1000),
      tokensSaved: totalTokensSaved,
      filesArchived: results.archival.archived + results.eviction.evicted,
      cacheStats: globalCache.getStats()
    };
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (err) {
    console.log('Note: Could not update heartbeat state');
  }

  return results;
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { LRUCache, main, parseMemoryFile };
