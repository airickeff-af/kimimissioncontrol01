/**
 * Autonomous Micro-Actions Module
 * 
 * Executes low-risk actions without explicit approval:
 * - Schedule follow-up reminders
 * - Flag outdated contact info
 * - Suggest optimal outreach timing
 * - Enrich lead data from public sources
 * 
 * Safety guardrails ensure only low-risk actions are automated
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class MicroActions extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      dataDir: config.dataDir || path.join(__dirname, '../../data'),
      enabled: config.microActions !== false,
      maxActionsPerHour: config.maxActionsPerHour || 10,
      requireApproval: config.requireApproval || false,
      ...config
    };
    
    this.state = {
      initialized: false,
      running: false,
      actionsQueue: [],
      executedActions: [],
      actionCount: {
        hour: 0,
        lastReset: Date.now()
      }
    };
    
    this.processTimer = null;
    
    // Define allowed autonomous actions
    this.allowedActions = new Set([
      'schedule_reminder',
      'flag_outdated_contact',
      'suggest_timing',
      'enrich_lead_data',
      'update_lead_status',
      'create_task',
      'log_activity'
    ]);
  }
  
  async initialize() {
    
    // Load action history
    await this._loadHistory();
    
    this.state.initialized = true;
    return this;
  }
  
  /**
   * Start processing actions
   */
  start() {
    if (!this.config.enabled) {
      return;
    }
    
    this.state.running = true;
    
    // Process queue every 5 minutes
    this.processTimer = setInterval(() => {
      this._processQueue();
    }, 5 * 60 * 1000);
    
    return this;
  }
  
  /**
   * Stop processing
   */
  stop() {
    this.state.running = false;
    if (this.processTimer) {
      clearInterval(this.processTimer);
      this.processTimer = null;
    }
  }
  
  /**
   * Queue an action for execution
   */
  queueAction(action) {
    // Validate action type
    if (!this.allowedActions.has(action.type)) {
      this.emit('action-rejected', { action, reason: 'not_allowed' });
      return false;
    }
    
    // Add to queue
    const queuedAction = {
      id: `action-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...action,
      status: 'queued',
      queuedAt: new Date().toISOString()
    };
    
    this.state.actionsQueue.push(queuedAction);
    
    
    // Process immediately if high priority
    if (action.priority === 'high') {
      this._executeAction(queuedAction);
    }
    
    return queuedAction.id;
  }
  
  /**
   * Process the action queue
   */
  async _processQueue() {
    if (!this.state.running || this.state.actionsQueue.length === 0) {
      return;
    }
    
    // Reset hourly counter if needed
    if (Date.now() - this.state.actionCount.lastReset > 60 * 60 * 1000) {
      this.state.actionCount.hour = 0;
      this.state.actionCount.lastReset = Date.now();
    }
    
    // Check rate limit
    if (this.state.actionCount.hour >= this.config.maxActionsPerHour) {
      return;
    }
    
    // Process actions
    while (this.state.actionsQueue.length > 0 && 
           this.state.actionCount.hour < this.config.maxActionsPerHour) {
      const action = this.state.actionsQueue.shift();
      await this._executeAction(action);
    }
  }
  
  /**
   * Execute a single action
   */
  async _executeAction(action) {
    
    try {
      let result;
      
      switch (action.type) {
        case 'schedule_reminder':
          result = await this._scheduleReminder(action);
          break;
        case 'flag_outdated_contact':
          result = await this._flagOutdatedContact(action);
          break;
        case 'suggest_timing':
          result = await this._suggestTiming(action);
          break;
        case 'enrich_lead_data':
          result = await this._enrichLeadData(action);
          break;
        case 'update_lead_status':
          result = await this._updateLeadStatus(action);
          break;
        case 'create_task':
          result = await this._createTask(action);
          break;
        case 'log_activity':
          result = await this._logActivity(action);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
      
      // Update action status
      action.status = 'completed';
      action.completedAt = new Date().toISOString();
      action.result = result;
      
      // Track execution
      this.state.executedActions.push(action);
      this.state.actionCount.hour++;
      
      this.emit('action-executed', action);
      
      
    } catch (err) {
      action.status = 'failed';
      action.error = err.message;
      action.failedAt = new Date().toISOString();
      
      this.emit('action-failed', action);
      
      console.error(`⚡ Micro-Actions: ${action.type} failed:`, err.message);
    }
    
    // Persist history
    await this._saveHistory();
  }
  
  /**
   * Schedule a follow-up reminder
   */
  async _scheduleReminder(action) {
    const { leadId, reminderType, dueDate, message } = action.payload;
    
    const reminder = {
      id: `reminder-${Date.now()}`,
      leadId,
      type: reminderType,
      dueDate: dueDate || this._calculateDueDate(reminderType),
      message: message || this._getDefaultReminderMessage(reminderType),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    // Would integrate with calendar/task system
    
    return reminder;
  }
  
  /**
   * Flag outdated contact information
   */
  async _flagOutdatedContact(action) {
    const { leadId, field, oldValue, reason } = action.payload;
    
    const flag = {
      leadId,
      field,
      oldValue,
      reason: reason || 'information may be outdated',
      flaggedAt: new Date().toISOString(),
      suggestedAction: 'Verify and update contact information'
    };
    
    // Would update lead record with flag
    
    return flag;
  }
  
  /**
   * Suggest optimal outreach timing
   */
  async _suggestTiming(action) {
    const { leadId, context } = action.payload;
    
    // Get lead timezone and preferences
    const lead = await this._getLead(leadId);
    
    const suggestion = {
      leadId,
      suggestedTimes: this._calculateOptimalTimes(lead, context),
      reasoning: this._getTimingReasoning(lead, context),
      confidence: 0.75,
      suggestedAt: new Date().toISOString()
    };
    
    this.emit('action-suggested', {
      type: 'outreach_timing',
      leadId,
      suggestion
    });
    
    return suggestion;
  }
  
  /**
   * Enrich lead data from public sources
   */
  async _enrichLeadData(action) {
    const { leadId, sources } = action.payload;
    
    const lead = await this._getLead(leadId);
    const enriched = { ...lead };
    const updates = [];
    
    // Enrich from various sources
    if (sources?.includes('crunchbase') || !sources) {
      const cbData = await this._fetchCrunchbase(lead.company);
      if (cbData) {
        enriched.companyData = cbData;
        updates.push('company_data');
      }
    }
    
    if (sources?.includes('linkedin') || !sources) {
      const liData = await this._fetchLinkedIn(lead.decisionMaker?.linkedin);
      if (liData) {
        enriched.decisionMaker = { ...enriched.decisionMaker, ...liData };
        updates.push('decision_maker');
      }
    }
    
    // Would save enriched data
    
    return { leadId, updates, enriched };
  }
  
  /**
   * Update lead status
   */
  async _updateLeadStatus(action) {
    const { leadId, status, reason } = action.payload;
    
    const update = {
      leadId,
      oldStatus: action.payload.oldStatus,
      newStatus: status,
      reason,
      updatedAt: new Date().toISOString()
    };
    
    // Would update lead in database
    
    return update;
  }
  
  /**
   * Create a task
   */
  async _createTask(action) {
    const { title, description, assignee, dueDate, priority, relatedTo } = action.payload;
    
    const task = {
      id: `task-${Date.now()}`,
      title,
      description,
      assignee: assignee || 'EricF',
      dueDate: dueDate || this._calculateDueDate('task'),
      priority: priority || 'medium',
      status: 'open',
      relatedTo,
      createdAt: new Date().toISOString()
    };
    
    // Would create task in task management system
    
    return task;
  }
  
  /**
   * Log activity
   */
  async _logActivity(action) {
    const { leadId, activityType, details } = action.payload;
    
    const activity = {
      leadId,
      type: activityType,
      details,
      loggedAt: new Date().toISOString(),
      source: 'pie_micro_actions'
    };
    
    // Would log to activity feed
    
    return activity;
  }
  
  /**
   * Auto-detect and queue actions based on lead state
   */
  async autoDetectActions(lead) {
    const actions = [];
    
    // Check for follow-up needed
    if (this._needsFollowUp(lead)) {
      actions.push({
        type: 'schedule_reminder',
        leadId: lead.id,
        priority: 'medium',
        payload: {
          leadId: lead.id,
          reminderType: 'follow_up',
          message: `Follow up with ${lead.company} - no response in ${lead.daysSinceContact} days`
        }
      });
    }
    
    // Check for outdated contact info
    if (this._isContactOutdated(lead)) {
      actions.push({
        type: 'flag_outdated_contact',
        leadId: lead.id,
        priority: 'low',
        payload: {
          leadId: lead.id,
          field: 'contact_info',
          reason: 'Last verified > 90 days ago'
        }
      });
    }
    
    // Suggest timing for new outreach
    if (lead.status === 'new' || lead.status === 'nurture') {
      actions.push({
        type: 'suggest_timing',
        leadId: lead.id,
        priority: 'low',
        payload: {
          leadId: lead.id,
          context: 'initial_outreach'
        }
      });
    }
    
    // Enrich if data is sparse
    if (this._needsEnrichment(lead)) {
      actions.push({
        type: 'enrich_lead_data',
        leadId: lead.id,
        priority: 'medium',
        payload: {
          leadId: lead.id,
          sources: ['crunchbase', 'linkedin']
        }
      });
    }
    
    // Queue detected actions
    for (const action of actions) {
      this.queueAction(action);
    }
    
    return actions;
  }
  
  /**
   * Check if lead needs follow-up
   */
  _needsFollowUp(lead) {
    if (!lead.lastContact) return false;
    
    const daysSince = Math.floor(
      (Date.now() - new Date(lead.lastContact).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Follow up if no response after 7 days
    if (daysSince >= 7 && lead.emailsReplied === 0) return true;
    
    // Follow up if no activity after 14 days
    if (daysSince >= 14) return true;
    
    return false;
  }
  
  /**
   * Check if contact info is outdated
   */
  _isContactOutdated(lead) {
    if (!lead.lastVerified) return true;
    
    const daysSince = Math.floor(
      (Date.now() - new Date(lead.lastVerified).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSince > 90;
  }
  
  /**
   * Check if lead needs enrichment
   */
  _needsEnrichment(lead) {
    const requiredFields = ['industry', 'employees', 'fundingStage'];
    const missing = requiredFields.filter(f => !lead[f]);
    
    return missing.length >= 2;
  }
  
  /**
   * Calculate due date based on type
   */
  _calculateDueDate(type) {
    const now = new Date();
    
    switch (type) {
      case 'follow_up':
        now.setDate(now.getDate() + 3);
        break;
      case 'task':
        now.setDate(now.getDate() + 7);
        break;
      case 'reminder':
        now.setDate(now.getDate() + 1);
        break;
      default:
        now.setDate(now.getDate() + 7);
    }
    
    return now.toISOString();
  }
  
  /**
   * Get default reminder message
   */
  _getDefaultReminderMessage(type) {
    const messages = {
      follow_up: 'Follow up on outreach',
      meeting_prep: 'Prepare for upcoming meeting',
      contract_review: 'Review partnership agreement',
      check_in: 'Quarterly partnership check-in'
    };
    
    return messages[type] || 'Follow up required';
  }
  
  /**
   * Calculate optimal outreach times
   */
  _calculateOptimalTimes(lead, context) {
    const timezone = lead.timezone || 'Asia/Manila';
    const suggestions = [];
    
    // Next Tuesday-Thursday at 10am local time
    const days = ['tuesday', 'wednesday', 'thursday'];
    
    for (const day of days) {
      suggestions.push({
        day,
        time: '10:00',
        timezone,
        confidence: 0.8,
        reason: 'Optimal for B2B outreach'
      });
    }
    
    return suggestions;
  }
  
  /**
   * Get timing reasoning
   */
  _getTimingReasoning(lead, context) {
    const reasons = [
      'Tuesday-Thursday have highest B2B response rates',
      '10am local time avoids morning rush and lunch'
    ];
    
    if (lead.timezone !== 'Asia/Manila') {
      reasons.push(`Adjusted for ${lead.timezone} timezone`);
    }
    
    return reasons;
  }
  
  /**
   * Get lead data
   */
  async _getLead(leadId) {
    // Would fetch from database
    return { id: leadId, timezone: 'Asia/Manila' };
  }
  
  /**
   * Fetch from Crunchbase
   */
  async _fetchCrunchbase(company) {
    // Placeholder
    return null;
  }
  
  /**
   * Fetch from LinkedIn
   */
  async _fetchLinkedIn(url) {
    // Placeholder
    return null;
  }
  
  /**
   * Load action history
   */
  async _loadHistory() {
    try {
      const filepath = path.join(this.config.dataDir, 'micro-actions-history.json');
      const data = await fs.readFile(filepath, 'utf8');
      const parsed = JSON.parse(data);
      this.state.executedActions = parsed.actions || [];
    } catch (err) {
      // No history yet
    }
  }
  
  /**
   * Save action history
   */
  async _saveHistory() {
    const filepath = path.join(this.config.dataDir, 'micro-actions-history.json');
    const data = {
      actions: this.state.executedActions.slice(-100), // Keep last 100
      updatedAt: new Date().toISOString()
    };
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  }
  
  /**
   * Get recent actions
   */
  async getRecentActions(limit = 10) {
    return this.state.executedActions
      .sort((a, b) => new Date(b.completedAt || b.queuedAt) - new Date(a.completedAt || a.queuedAt))
      .slice(0, limit);
  }
  
  /**
   * Get module status
   */
  getStatus() {
    return {
      initialized: this.state.initialized,
      running: this.state.running,
      queueLength: this.state.actionsQueue.length,
      executedCount: this.state.executedActions.length,
      hourlyCount: this.state.actionCount.hour
    };
  }
}

module.exports = MicroActions;
