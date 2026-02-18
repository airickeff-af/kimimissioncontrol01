/**
 * Agent Audit Reporting Helper
 * 
 * Usage:
 *   const { reportToAudit } = require('./report-to-audit');
 *   await reportToAudit('Forge-1', 'TASK-067', 50, 'in_progress', 'Theme applied to 4 pages');
 */

const fs = require('fs');
const path = require('path');

const AUDIT_REPORT_DIR = '/mission-control/audit/progress-reports';

/**
 * Report progress to audit system
 * @param {string} agent - Agent name (e.g., 'Forge-1')
 * @param {string} task - Task ID (e.g., 'TASK-067')
 * @param {number} progress - Progress percentage (0-100)
 * @param {string} status - Status: started, in_progress, blocked, completed, failed
 * @param {string} details - What was accomplished
 * @param {string[]} issues - Any issues encountered (optional)
 * @param {string} nextSteps - What's next (optional)
 */
async function reportToAudit(agent, task, progress, status, details, issues = [], nextSteps = '') {
  const report = {
    agent,
    task,
    timestamp: new Date().toISOString(),
    progress,
    status,
    details,
    issues,
    next_steps: nextSteps,
    estimated_completion: estimateCompletion(progress)
  };

  // Ensure directory exists
  if (!fs.existsSync(AUDIT_REPORT_DIR)) {
    fs.mkdirSync(AUDIT_REPORT_DIR, { recursive: true });
  }

  // Save report
  const filename = `${task}-${Date.now()}.json`;
  const filepath = path.join(AUDIT_REPORT_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  
  console.log(`[Audit Report] ${agent} - ${task} - ${progress}% - ${status}`);
  
  return report;
}

/**
 * Estimate remaining time based on progress
 */
function estimateCompletion(progress) {
  if (progress >= 100) return 'Complete';
  if (progress >= 75) return '30 minutes';
  if (progress >= 50) return '1-2 hours';
  if (progress >= 25) return '2-4 hours';
  return '4+ hours';
}

/**
 * Quick report functions for common checkpoints
 */
const reportStarted = (agent, task, details) => 
  reportToAudit(agent, task, 0, 'started', details);

const report25Percent = (agent, task, details, issues = []) => 
  reportToAudit(agent, task, 25, 'in_progress', details, issues);

const report50Percent = (agent, task, details, issues = []) => 
  reportToAudit(agent, task, 50, 'in_progress', details, issues);

const report75Percent = (agent, task, details, issues = []) => 
  reportToAudit(agent, task, 75, 'in_progress', details, issues);

const reportCompleted = (agent, task, details) => 
  reportToAudit(agent, task, 100, 'completed', details);

const reportBlocked = (agent, task, details, issues) => 
  reportToAudit(agent, task, 0, 'blocked', details, issues);

module.exports = {
  reportToAudit,
  reportStarted,
  report25Percent,
  report50Percent,
  report75Percent,
  reportCompleted,
  reportBlocked
};
