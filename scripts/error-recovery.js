/**
 * Error Recovery System - Main Recovery Logic
 * TASK-CI-008: Error Recovery System
 * 
 * Provides:
 * - API Failure Fallback with exponential backoff
 * - Agent Crash Recovery with context preservation
 * - Data Corruption Detection with checksum validation
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Configuration
const CONFIG = {
  // Retry configuration
  maxRetries: 5,
  baseDelay: 1000, // 1 second
  maxDelay: 60000, // 60 seconds
  
  // Agent monitoring
  heartbeatInterval: 30000, // 30 seconds
  heartbeatTimeout: 60000,  // 60 seconds
  maxRestarts: 3,
  restartWindow: 300000,    // 5 minutes
  
  // Data integrity
  checksumAlgorithm: 'sha256',
  backupDir: path.join(__dirname, '..', 'data', 'backups'),
  dataDir: path.join(__dirname, '..', 'data'),
  checksumFile: path.join(__dirname, '..', 'data', '.checksums.json'),
  
  // Alerting
  alertWebhook: process.env.ALERT_WEBHOOK || null,
  adminContact: process.env.ADMIN_CONTACT || 'EricF',
  
  // Logging
  logDir: path.join(__dirname, '..', 'logs'),
  logFile: path.join(__dirname, '..', 'logs', 'error-recovery.log')
};

// State tracking
const state = {
  agents: new Map(), // agentId -> { lastHeartbeat, restartCount, lastRestart, context }
  retryAttempts: new Map(), // operationId -> { count, lastAttempt }
  circuitBreakers: new Map(), // service -> { failures, lastFailure, open }
  checksums: new Map()
};

// ============================================================================
// LOGGING
// ============================================================================

async function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level,
    message,
    ...meta
  };
  
  const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logLine, Object.keys(meta).length ? meta : '');
  
  try {
    await fs.mkdir(CONFIG.logDir, { recursive: true });
    await fs.appendFile(CONFIG.logFile, JSON.stringify(entry) + '\n');
  } catch (err) {
    console.error('Failed to write to log file:', err.message);
  }
}

// ============================================================================
// ALERTING
// ============================================================================

async function sendAlert(level, message, details = {}) {
  await log('alert', `[${level.toUpperCase()}] ${message}`, details);
  
  // Console alert
  console.error(`🚨 ALERT [${level.toUpperCase()}]: ${message}`);
  
  // Webhook alert if configured
  if (CONFIG.alertWebhook) {
    try {
      const payload = {
        level,
        message,
        timestamp: new Date().toISOString(),
        details,
        admin: CONFIG.adminContact
      };
      
      // Using curl for webhook delivery
      const curlCmd = `curl -s -X POST -H "Content-Type: application/json" -d '${JSON.stringify(payload)}' "${CONFIG.alertWebhook}"`;
      await execAsync(curlCmd, { timeout: 10000 });
    } catch (err) {
      await log('error', 'Failed to send webhook alert', { error: err.message });
    }
  }
  
  // Critical alerts need escalation
  if (level === 'critical') {
    await escalateToAdmin(message, details);
  }
}

async function escalateToAdmin(message, details) {
  await log('critical', `Escalating to ${CONFIG.adminContact}`, { message, details });
  
  // Create escalation file for admin review
  const escalationFile = path.join(CONFIG.logDir, `escalation-${Date.now()}.json`);
  const escalation = {
    timestamp: new Date().toISOString(),
    admin: CONFIG.adminContact,
    message,
    details,
    requiresAction: true
  };
  
  try {
    await fs.writeFile(escalationFile, JSON.stringify(escalation, null, 2));
    console.error(`📋 Escalation logged to: ${escalationFile}`);
  } catch (err) {
    console.error('Failed to write escalation file:', err.message);
  }
}

// ============================================================================
// 1. API FAILURE FALLBACK
// ============================================================================

/**
 * Calculate exponential backoff delay with jitter
 */
function getBackoffDelay(attempt) {
  const exponential = Math.min(
    CONFIG.baseDelay * Math.pow(2, attempt),
    CONFIG.maxDelay
  );
  // Add jitter (±25%) to prevent thundering herd
  const jitter = exponential * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(exponential + jitter);
}

/**
 * Check if circuit breaker is open for a service
 */
function isCircuitOpen(service) {
  const cb = state.circuitBreakers.get(service);
  if (!cb) return false;
  
  if (cb.open) {
    // Check if we should half-open (after 60 seconds)
    if (Date.now() - cb.lastFailure > 60000) {
      cb.open = false;
      cb.failures = 0;
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Record failure for circuit breaker
 */
function recordFailure(service) {
  let cb = state.circuitBreakers.get(service);
  if (!cb) {
    cb = { failures: 0, lastFailure: null, open: false };
    state.circuitBreakers.set(service, cb);
  }
  
  cb.failures++;
  cb.lastFailure = Date.now();
  
  // Open circuit after 5 failures
  if (cb.failures >= 5) {
    cb.open = true;
    log('warning', `Circuit breaker opened for ${service}`);
  }
}

/**
 * Record success for circuit breaker
 */
function recordSuccess(service) {
  const cb = state.circuitBreakers.get(service);
  if (cb) {
    cb.failures = 0;
    cb.open = false;
  }
}

/**
 * Execute API call with retry and fallback
 * @param {Function} apiCall - Async function to execute
 * @param {Object} options - Configuration options
 * @returns {Promise<any>} - API result or fallback value
 */
async function withRetry(apiCall, options = {}) {
  const {
    operationId = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    service = 'default',
    fallback = null,
    cacheKey = null,
    maxRetries = CONFIG.maxRetries,
    onRetry = null,
    onFallback = null
  } = options;
  
  // Check circuit breaker
  if (isCircuitOpen(service)) {
    await log('warning', `Circuit breaker open for ${service}, using fallback`);
    return await getFallback(fallback, cacheKey, service);
  }
  
  let lastError = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await apiCall();
      recordSuccess(service);
      
      // Cache successful result if cacheKey provided
      if (cacheKey) {
        await cacheResult(cacheKey, result);
      }
      
      await log('info', `API call succeeded`, { operationId, service, attempt });
      return result;
      
    } catch (error) {
      lastError = error;
      recordFailure(service);
      
      const isLastAttempt = attempt === maxRetries - 1;
      
      await log('warning', `API call failed`, {
        operationId,
        service,
        attempt: attempt + 1,
        maxRetries,
        error: error.message,
        isLastAttempt
      });
      
      if (onRetry) {
        try {
          await onRetry(error, attempt + 1);
        } catch (cbErr) {
          await log('error', 'Retry callback failed', { error: cbErr.message });
        }
      }
      
      if (!isLastAttempt) {
        const delay = getBackoffDelay(attempt);
        await log('info', `Retrying in ${delay}ms`, { operationId, attempt: attempt + 1 });
        await sleep(delay);
      }
    }
  }
  
  // All retries exhausted
  await log('error', `All retries exhausted for ${service}`, {
    operationId,
    error: lastError.message
  });
  
  await sendAlert('error', `API failures for ${service}`, {
    operationId,
    attempts: maxRetries,
    error: lastError.message
  });
  
  // Return fallback
  return await getFallback(fallback, cacheKey, service, lastError);
}

async function getFallback(fallback, cacheKey, service, error = null) {
  // Use provided fallback function/value
  if (fallback !== null) {
    if (typeof fallback === 'function') {
      try {
        const result = await fallback(error);
        await log('info', `Fallback function executed for ${service}`);
        return result;
      } catch (fallbackError) {
        await log('error', `Fallback function failed`, { error: fallbackError.message });
      }
    } else {
      await log('info', `Returning static fallback for ${service}`);
      return fallback;
    }
  }
  
  // Try to return cached data
  if (cacheKey) {
    const cached = await getCachedResult(cacheKey);
    if (cached !== null) {
      await log('info', `Returning cached data for ${service}`);
      return cached;
    }
  }
  
  // No fallback available
  throw error || new Error(`All retries failed and no fallback available for ${service}`);
}

async function cacheResult(key, data) {
  const cacheFile = path.join(CONFIG.dataDir, `.cache-${key}.json`);
  try {
    await fs.mkdir(CONFIG.dataDir, { recursive: true });
    await fs.writeFile(cacheFile, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (err) {
    await log('error', `Failed to cache result for ${key}`, { error: err.message });
  }
}

async function getCachedResult(key) {
  const cacheFile = path.join(CONFIG.dataDir, `.cache-${key}.json`);
  try {
    const content = await fs.readFile(cacheFile, 'utf8');
    const cached = JSON.parse(content);
    await log('info', `Cache hit for ${key}`, { age: Date.now() - cached.timestamp });
    return cached.data;
  } catch (err) {
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// 2. AGENT CRASH RECOVERY
// ============================================================================

/**
 * Register an agent for health monitoring
 */
async function registerAgent(agentId, options = {}) {
  const agentInfo = {
    id: agentId,
    lastHeartbeat: Date.now(),
    restartCount: 0,
    lastRestart: null,
    context: options.context || {},
    command: options.command || null,
    args: options.args || [],
    env: options.env || {},
    cwd: options.cwd || process.cwd(),
    process: null,
    status: 'registered'
  };
  
  state.agents.set(agentId, agentInfo);
  await log('info', `Agent registered`, { agentId, context: agentInfo.context });
  
  return agentInfo;
}

/**
 * Record heartbeat from an agent
 */
async function recordHeartbeat(agentId, context = {}) {
  const agent = state.agents.get(agentId);
  if (!agent) {
    await log('warning', `Heartbeat from unknown agent`, { agentId });
    return false;
  }
  
  agent.lastHeartbeat = Date.now();
  agent.status = 'healthy';
  
  // Merge context updates
  if (Object.keys(context).length > 0) {
    agent.context = { ...agent.context, ...context };
  }
  
  return true;
}

/**
 * Check agent health and restart if needed
 */
async function checkAgentHealth(agentId) {
  const agent = state.agents.get(agentId);
  if (!agent) {
    await log('error', `Cannot check health of unknown agent`, { agentId });
    return { healthy: false, error: 'Agent not registered' };
  }
  
  const now = Date.now();
  const timeSinceHeartbeat = now - agent.lastHeartbeat;
  
  if (timeSinceHeartbeat > CONFIG.heartbeatTimeout) {
    await log('warning', `Agent heartbeat timeout`, {
      agentId,
      timeSinceHeartbeat,
      timeout: CONFIG.heartbeatTimeout
    });
    
    // Attempt restart
    const restartResult = await restartAgent(agentId);
    return { healthy: false, restartResult };
  }
  
  return { healthy: true, timeSinceHeartbeat };
}

/**
 * Restart an agent with context preservation
 */
async function restartAgent(agentId) {
  const agent = state.agents.get(agentId);
  if (!agent) {
    return { success: false, error: 'Agent not found' };
  }
  
  // Check restart limit
  const now = Date.now();
  if (agent.lastRestart && (now - agent.lastRestart) < CONFIG.restartWindow) {
    agent.restartCount++;
  } else {
    agent.restartCount = 1;
  }
  
  agent.lastRestart = now;
  
  if (agent.restartCount > CONFIG.maxRestarts) {
    await log('critical', `Agent restart limit exceeded`, {
      agentId,
      restartCount: agent.restartCount,
      maxRestarts: CONFIG.maxRestarts
    });
    
    await sendAlert('critical', `Agent ${agentId} failed to restart after ${CONFIG.maxRestarts} attempts`, {
      agentId,
      context: agent.context,
      restartHistory: agent.restartCount
    });
    
    agent.status = 'failed';
    return { success: false, error: 'Max restarts exceeded', escalated: true };
  }
  
  await log('info', `Restarting agent`, {
    agentId,
    attempt: agent.restartCount,
    context: agent.context
  });
  
  // Kill existing process if running
  if (agent.process && !agent.process.killed) {
    try {
      agent.process.kill('SIGTERM');
      await sleep(5000); // Give it time to shutdown gracefully
      
      if (!agent.process.killed) {
        agent.process.kill('SIGKILL');
      }
    } catch (err) {
      await log('warning', `Error killing agent process`, { agentId, error: err.message });
    }
  }
  
  // Save context for recovery
  const contextFile = path.join(CONFIG.dataDir, `.agent-${agentId}-context.json`);
  try {
    await fs.writeFile(contextFile, JSON.stringify({
      agentId,
      timestamp: Date.now(),
      restartCount: agent.restartCount,
      context: agent.context
    }, null, 2));
  } catch (err) {
    await log('error', `Failed to save agent context`, { agentId, error: err.message });
  }
  
  // Restart the agent
  if (agent.command) {
    try {
      // Prepare environment with context
      const env = {
        ...process.env,
        ...agent.env,
        AGENT_ID: agentId,
        AGENT_CONTEXT: JSON.stringify(agent.context),
        AGENT_RESTART_COUNT: agent.restartCount.toString()
      };
      
      const child = spawn(agent.command, agent.args, {
        cwd: agent.cwd,
        env,
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      agent.process = child;
      agent.lastHeartbeat = Date.now();
      agent.status = 'restarting';
      
      // Log output
      child.stdout.on('data', (data) => {
        log('info', `[${agentId}] ${data.toString().trim()}`);
      });
      
      child.stderr.on('data', (data) => {
        log('error', `[${agentId}] ${data.toString().trim()}`);
      });
      
      child.on('exit', (code) => {
        log('warning', `Agent process exited`, { agentId, code });
        agent.status = code === 0 ? 'stopped' : 'crashed';
      });
      
      await log('info', `Agent restarted successfully`, {
        agentId,
        pid: child.pid,
        attempt: agent.restartCount
      });
      
      return {
        success: true,
        pid: child.pid,
        attempt: agent.restartCount,
        context: agent.context
      };
      
    } catch (err) {
      await log('error', `Failed to restart agent`, { agentId, error: err.message });
      return { success: false, error: err.message };
    }
  }
  
  return { success: false, error: 'No command configured for agent' };
}

/**
 * Start health monitoring loop
 */
function startHealthMonitoring() {
  setInterval(async () => {
    for (const [agentId, agent] of state.agents) {
      if (agent.status !== 'stopped' && agent.status !== 'failed') {
        await checkAgentHealth(agentId);
      }
    }
  }, CONFIG.heartbeatInterval);
  
  log('info', `Health monitoring started`, { interval: CONFIG.heartbeatInterval });
}

/**
 * Unregister an agent
 */
async function unregisterAgent(agentId) {
  const agent = state.agents.get(agentId);
  if (!agent) return false;
  
  if (agent.process && !agent.process.killed) {
    agent.process.kill('SIGTERM');
  }
  
  state.agents.delete(agentId);
  await log('info', `Agent unregistered`, { agentId });
  return true;
}

// ============================================================================
// 3. DATA CORRUPTION DETECTION
// ============================================================================

/**
 * Calculate checksum for a file
 */
async function calculateChecksum(filePath) {
  try {
    const content = await fs.readFile(filePath);
    return crypto.createHash(CONFIG.checksumAlgorithm).update(content).digest('hex');
  } catch (err) {
    throw new Error(`Failed to calculate checksum for ${filePath}: ${err.message}`);
  }
}

/**
 * Generate checksums for all files in a directory
 */
async function generateChecksums(dirPath, pattern = null) {
  const checksums = {};
  
  async function traverse(currentPath, relativePath = '') {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relPath = path.join(relativePath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip hidden directories and backups
        if (entry.name.startsWith('.') || entry.name === 'backups') continue;
        await traverse(fullPath, relPath);
      } else if (entry.isFile()) {
        // Skip hidden files and checksum file itself
        if (entry.name.startsWith('.') || entry.name === '.checksums.json') continue;
        
        // Apply pattern filter if provided
        if (pattern && !entry.name.match(pattern)) continue;
        
        try {
          const checksum = await calculateChecksum(fullPath);
          checksums[relPath] = {
            checksum,
            algorithm: CONFIG.checksumAlgorithm,
            timestamp: Date.now()
          };
        } catch (err) {
          await log('error', `Failed to checksum ${relPath}`, { error: err.message });
        }
      }
    }
  }
  
  await traverse(dirPath);
  return checksums;
}

/**
 * Save checksums to file
 */
async function saveChecksums(checksums) {
  try {
    await fs.mkdir(CONFIG.dataDir, { recursive: true });
    await fs.writeFile(CONFIG.checksumFile, JSON.stringify(checksums, null, 2));
    state.checksums = new Map(Object.entries(checksums));
    await log('info', `Checksums saved`, { count: Object.keys(checksums).length });
    return true;
  } catch (err) {
    await log('error', `Failed to save checksums`, { error: err.message });
    return false;
  }
}

/**
 * Load checksums from file
 */
async function loadChecksums() {
  try {
    const content = await fs.readFile(CONFIG.checksumFile, 'utf8');
    const checksums = JSON.parse(content);
    state.checksums = new Map(Object.entries(checksums));
    return checksums;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {};
    }
    throw err;
  }
}

/**
 * Validate data files against stored checksums
 */
async function validateDataIntegrity(options = {}) {
  const {
    autoRestore = true,
    onCorruption = null
  } = options;
  
  await log('info', `Starting data integrity validation`);
  
  const storedChecksums = await loadChecksums();
  const currentChecksums = await generateChecksums(CONFIG.dataDir);
  
  const results = {
    valid: [],
    corrupted: [],
    missing: [],
    new: [],
    restored: []
  };
  
  // Check existing files
  for (const [filePath, stored] of Object.entries(storedChecksums)) {
    const current = currentChecksums[filePath];
    const fullPath = path.join(CONFIG.dataDir, filePath);
    
    if (!current) {
      results.missing.push(filePath);
      
      // Attempt restore from backup
      if (autoRestore) {
        const restored = await restoreFromBackup(filePath);
        if (restored) {
          results.restored.push(filePath);
        }
      }
      continue;
    }
    
    if (current.checksum !== stored.checksum) {
      results.corrupted.push({
        file: filePath,
        expected: stored.checksum,
        actual: current.checksum
      });
      
      await log('error', `Data corruption detected`, {
        file: filePath,
        expected: stored.checksum,
        actual: current.checksum
      });
      
      // Attempt restore from backup
      if (autoRestore) {
        const restored = await restoreFromBackup(filePath);
        if (restored) {
          results.restored.push(filePath);
        }
      }
      
      if (onCorruption) {
        try {
          await onCorruption(filePath, stored.checksum, current.checksum);
        } catch (err) {
          await log('error', `Corruption callback failed`, { error: err.message });
        }
      }
    } else {
      results.valid.push(filePath);
    }
  }
  
  // Find new files
  for (const filePath of Object.keys(currentChecksums)) {
    if (!storedChecksums[filePath]) {
      results.new.push(filePath);
    }
  }
  
  // Alert on issues
  if (results.corrupted.length > 0 || results.missing.length > 0) {
    await sendAlert('warning', `Data integrity issues detected`, {
      corrupted: results.corrupted.length,
      missing: results.missing.length,
      restored: results.restored.length
    });
  }
  
  await log('info', `Data integrity validation complete`, {
    valid: results.valid.length,
    corrupted: results.corrupted.length,
    missing: results.missing.length,
    new: results.new.length,
    restored: results.restored.length
  });
  
  return results;
}

/**
 * Create backup of a file
 */
async function createBackup(filePath) {
  try {
    await fs.mkdir(CONFIG.backupDir, { recursive: true });
    
    const fullPath = path.join(CONFIG.dataDir, filePath);
    const backupPath = path.join(CONFIG.backupDir, `${filePath}.${Date.now()}.bak`);
    
    // Ensure backup directory exists for nested paths
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    
    await fs.copyFile(fullPath, backupPath);
    await log('info', `Backup created`, { file: filePath, backup: backupPath });
    return backupPath;
  } catch (err) {
    await log('error', `Failed to create backup`, { file: filePath, error: err.message });
    return null;
  }
}

/**
 * Restore file from backup
 */
async function restoreFromBackup(filePath) {
  try {
    const backupPattern = path.join(CONFIG.backupDir, `${filePath}.*.bak`);
    const { stdout } = await execAsync(`ls -t ${backupPattern} 2>/dev/null | head -1`);
    const latestBackup = stdout.trim();
    
    if (!latestBackup) {
      await log('warning', `No backup found for ${filePath}`);
      return false;
    }
    
    const targetPath = path.join(CONFIG.dataDir, filePath);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(latestBackup, targetPath);
    
    await log('info', `File restored from backup`, {
      file: filePath,
      backup: latestBackup
    });
    
    return true;
  } catch (err) {
    await log('error', `Failed to restore from backup`, { file: filePath, error: err.message });
    return false;
  }
}

/**
 * Initialize checksums for all data files
 */
async function initializeChecksums() {
  await log('info', `Initializing data checksums`);
  const checksums = await generateChecksums(CONFIG.dataDir);
  await saveChecksums(checksums);
  return checksums;
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'init-checksums':
      await initializeChecksums();
      break;
      
    case 'validate':
      const results = await validateDataIntegrity();
      console.log('Validation Results:', JSON.stringify(results, null, 2));
      process.exit(results.corrupted.length > 0 ? 1 : 0);
      break;
      
    case 'monitor':
      startHealthMonitoring();
      console.log('Health monitoring started. Press Ctrl+C to stop.');
      // Keep process alive
      setInterval(() => {}, 1000);
      break;
      
    case 'register-agent':
      const agentId = args[1];
      const cmd = args[2];
      const cmdArgs = args.slice(3);
      if (!agentId) {
        console.error('Usage: error-recovery.js register-agent <agent-id> [command] [args...]');
        process.exit(1);
      }
      await registerAgent(agentId, { command: cmd, args: cmdArgs });
      break;
      
    case 'heartbeat':
      const hbAgentId = args[1];
      if (!hbAgentId) {
        console.error('Usage: error-recovery.js heartbeat <agent-id>');
        process.exit(1);
      }
      await recordHeartbeat(hbAgentId);
      break;
      
    case 'backup':
      const fileToBackup = args[1];
      if (!fileToBackup) {
        console.error('Usage: error-recovery.js backup <file-path>');
        process.exit(1);
      }
      await createBackup(fileToBackup);
      break;
      
    case 'test-retry':
      // Test the retry mechanism
      let attempt = 0;
      const testCall = async () => {
        attempt++;
        if (attempt < 3) {
          throw new Error(`Simulated failure (attempt ${attempt})`);
        }
        return { success: true, attempts: attempt };
      };
      
      const result = await withRetry(testCall, {
        service: 'test',
        operationId: 'test-retry',
        fallback: { success: false, usedFallback: true }
      });
      console.log('Test result:', result);
      break;
      
    default:
      console.log(`
Error Recovery System - TASK-CI-008

Usage: node error-recovery.js <command> [options]

Commands:
  init-checksums          Initialize checksums for all data files
  validate                Validate data integrity
  monitor                 Start health monitoring daemon
  register-agent <id>     Register an agent for monitoring
  heartbeat <id>          Record heartbeat for an agent
  backup <file>           Create backup of a file
  test-retry              Test the retry mechanism

Environment Variables:
  ALERT_WEBHOOK           Webhook URL for alerts
  ADMIN_CONTACT           Admin contact for escalations (default: EricF)
      `);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // API Failure Fallback
  withRetry,
  getBackoffDelay,
  cacheResult,
  getCachedResult,
  
  // Agent Crash Recovery
  registerAgent,
  unregisterAgent,
  recordHeartbeat,
  checkAgentHealth,
  restartAgent,
  startHealthMonitoring,
  
  // Data Corruption Detection
  calculateChecksum,
  generateChecksums,
  saveChecksums,
  loadChecksums,
  validateDataIntegrity,
  createBackup,
  restoreFromBackup,
  initializeChecksums,
  
  // Utilities
  log,
  sendAlert,
  escalateToAdmin,
  CONFIG,
  state
};

// Run CLI if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
