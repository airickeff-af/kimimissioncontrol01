/**
 * Agent Audit Reporting Module
 * 
 * This module provides functions for agents to report their progress
to the audit system.
 * 
 * Usage:
 *   const { reportToAudit } = require('./report-to-audit');
 *   await reportToAudit({ agent: 'Builder-1', task: 'TASK-001', ... });
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration
const AUDIT_DASHBOARD_URL = 'https://dashboard-ten-sand-20.vercel.app';
const FALLBACK_LOG_PATH = path.join(__dirname, '../logs/audit-fallback.log');
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Report task progress to the audit system
 * 
 * @param {Object} report - The audit report
 * @param {string} report.agent - Agent identifier (e.g., 'Builder-1')
 * @param {string} report.task - Task identifier (e.g., 'TASK-001')
 * @param {number} report.progress - Progress percentage (0-100)
 * @param {string} report.status - Task status (started|in_progress|blocked|completed|failed)
 * @param {string} report.details - Description of work done
 * @param {string[]} [report.issues] - List of issues encountered
 * @param {string} [report.next_steps] - Description of next steps
 * @returns {Promise<boolean>} - True if report was successful
 * 
 * @example
 * await reportToAudit({
 *   agent: 'Builder-1',
 *   task: 'TASK-042',
 *   progress: 50,
 *   status: 'in_progress',
 *   details: 'Completed login form UI'
 * });
 */
async function reportToAudit(report) {
  // Validate required fields
  const required = ['agent', 'task', 'progress', 'status', 'details'];
  for (const field of required) {
    if (!(field in report)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Build full report with timestamp
  const fullReport = {
    ...report,
    timestamp: new Date().toISOString()
  };

  // Validate progress range
  if (fullReport.progress < 0 || fullReport.progress > 100) {
    throw new Error('Progress must be between 0 and 100');
  }

  // Validate status
  const validStatuses = ['started', 'in_progress', 'blocked', 'completed', 'failed'];
  if (!validStatuses.includes(fullReport.status)) {
    throw new Error(`Invalid status: ${fullReport.status}. Must be one of: ${validStatuses.join(', ')}`);
  }

  // Attempt to send report with retries
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await sendReport(fullReport);
      return true;
    } catch (error) {
      lastError = error;
      console.warn(`[AUDIT] Attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);
      
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt); // Exponential backoff
      }
    }
  }

  // All retries failed - log to fallback
  console.error(`[AUDIT] Failed to send report after ${MAX_RETRIES} attempts`);
  await logToFallback(fullReport, lastError);
  return false;
}

/**
 * Send report to audit dashboard API
 * @private
 */
async function sendReport(report) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(`${AUDIT_DASHBOARD_URL}/api/audit/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(report),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Log report to local fallback file when API is unavailable
 * @private
 */
async function logToFallback(report, error) {
  try {
    // Ensure logs directory exists
    const logsDir = path.dirname(FALLBACK_LOG_PATH);
    await fs.mkdir(logsDir, { recursive: true });

    const fallbackEntry = {
      ...report,
      _fallback: true,
      _fallback_reason: error?.message || 'Unknown error',
      _logged_at: new Date().toISOString()
    };

    await fs.appendFile(
      FALLBACK_LOG_PATH,
      JSON.stringify(fallbackEntry) + '\n',
      'utf8'
    );

  } catch (fallbackError) {
    console.error('[AUDIT] CRITICAL: Failed to write fallback log:', fallbackError);
  }
}

/**
 * Sleep for specified milliseconds
 * @private
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Replay fallback logs to the audit system
 * Call this periodically or when connection is restored
 * 
 * @returns {Promise<number>} - Number of reports replayed
 */
async function replayFallbackLogs() {
  try {
    // Check if fallback file exists
    try {
      await fs.access(FALLBACK_LOG_PATH);
    } catch {
      return 0; // No fallback file
    }

    const content = await fs.readFile(FALLBACK_LOG_PATH, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    
    if (lines.length === 0) {
      return 0;
    }

    
    let replayed = 0;
    const failed = [];

    for (const line of lines) {
      try {
        const report = JSON.parse(line);
        // Remove fallback metadata
        delete report._fallback;
        delete report._fallback_reason;
        delete report._logged_at;
        
        await sendReport(report);
        replayed++;
      } catch (error) {
        failed.push(line);
      }
    }

    // Rewrite fallback file with only failed entries
    if (failed.length > 0) {
      await fs.writeFile(FALLBACK_LOG_PATH, failed.join('\n') + '\n', 'utf8');
    } else {
      await fs.unlink(FALLBACK_LOG_PATH);
    }

    return replayed;
  } catch (error) {
    console.error('[AUDIT] Failed to replay fallback logs:', error);
    return 0;
  }
}

/**
 * Get audit status for a task
 * 
 * @param {string} taskId - Task identifier
 * @returns {Promise<Object|null>} - Task audit status or null
 */
async function getTaskAuditStatus(taskId) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${AUDIT_DASHBOARD_URL}/api/audit/task/${taskId}`, {
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeout);
    console.error(`[AUDIT] Failed to get status for ${taskId}:`, error.message);
    return null;
  }
}

/**
 * Quick report helpers for common milestones
 */
const quickReports = {
  /**
   * Report task started
   */
  started: (agent, task, details, options = {}) => 
    reportToAudit({ agent, task, progress: 0, status: 'started', details, ...options }),
  
  /**
   * Report 25% complete
   */
  quarter: (agent, task, details, options = {}) => 
    reportToAudit({ agent, task, progress: 25, status: 'in_progress', details, ...options }),
  
  /**
   * Report 50% complete
   */
  half: (agent, task, details, options = {}) => 
    reportToAudit({ agent, task, progress: 50, status: 'in_progress', details, ...options }),
  
  /**
   * Report 75% complete
   */
  threeQuarter: (agent, task, details, options = {}) => 
    reportToAudit({ agent, task, progress: 75, status: 'in_progress', details, ...options }),
  
  /**
   * Report task completed
   */
  completed: (agent, task, details, options = {}) => 
    reportToAudit({ agent, task, progress: 100, status: 'completed', details, ...options }),
  
  /**
   * Report task blocked
   */
  blocked: (agent, task, details, issues, options = {}) => 
    reportToAudit({ agent, task, progress: options.progress || 0, status: 'blocked', details, issues, ...options }),
  
  /**
   * Report task failed
   */
  failed: (agent, task, details, issues, options = {}) => 
    reportToAudit({ agent, task, progress: options.progress || 0, status: 'failed', details, issues, ...options })
};

// Export module
module.exports = {
  reportToAudit,
  replayFallbackLogs,
  getTaskAuditStatus,
  quickReports,
  AUDIT_DASHBOARD_URL
};

// If run directly, show usage
if (require.main === module) {
}
