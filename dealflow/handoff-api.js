/**
 * DealFlow → ColdCall Handoff API
 * Manages the transfer of ready leads from DealFlow to ColdCall
 * 
 * @module handoff-api
 * @version 1.0.0
 * @author DealFlow Agent
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  paths: {
    handoffQueue: '/mission-control/data/handoff-queue.json',
    handoffArchive: '/mission-control/data/handoff-archive.json',
    coldCallInbox: '/mission-control/agents/coldcall/inbox/',
    leads: '/mission-control/data/enriched-leads.json'
  },
  
  // Handoff settings
  settings: {
    autoApproveThreshold: 85,  // Auto-approve leads with readiness >= 85
    maxHandoffsPerDay: 10,
    minReadinessScore: 75,
    requireVerifiedEmail: true
  },
  
  // Status workflow
  statusWorkflow: {
    PENDING: ['APPROVED', 'REJECTED', 'NEEDS_INFO'],
    APPROVED: ['IN_PROGRESS', 'CONTACTED', 'NO_RESPONSE'],
    IN_PROGRESS: ['MEETING_SCHEDULED', 'NOT_INTERESTED', 'FOLLOW_UP'],
    CONTACTED: ['RESPONDED', 'NO_RESPONSE', 'BOUNCED'],
    RESPONDED: ['MEETING_SCHEDULED', 'NOT_INTERESTED', 'NURTURE'],
    MEETING_SCHEDULED: ['DEAL_WON', 'DEAL_LOST', 'NURTURE'],
    REJECTED: ['REASSIGNED', 'ARCHIVED'],
    NEEDS_INFO: ['PENDING']
  }
};

// ============================================================================
// HANDOFF CREATION
// ============================================================================

/**
 * Create a new handoff package for ColdCall
 * @param {Object} enrichedLead - Enriched lead from DealFlow
 * @param {Object} options - Handoff options
 * @returns {Object} Handoff package
 */
function createHandoff(enrichedLead, options = {}) {
  const lead = enrichedLead;
  const enrichment = lead.enrichment || {};
  const readiness = enrichment.readiness || {};
  const pieIntel = enrichment.pie_intel || {};
  
  const handoff = {
    // Metadata
    handoff_id: generateHandoffId(),
    created_at: new Date().toISOString(),
    version: '1.0.0',
    
    // Status
    status: 'PENDING',
    status_history: [{
      status: 'PENDING',
      timestamp: new Date().toISOString(),
      note: 'Created by DealFlow'
    }],
    
    // Lead identification
    lead: {
      id: lead.id,
      company: lead.company,
      company_domain: lead.company_domain,
      contact_name: lead.contact_name,
      title: lead.title,
      region: lead.region,
      industry: lead.industry
    },
    
    // Contact information
    contact: {
      email: {
        address: lead.email,
        verified: lead.email_verified || false,
        confidence: enrichment.accessibility?.details?.email?.score > 0 ? 'high' : 'medium',
        alternative_patterns: lead.email_patterns || []
      },
      linkedin: {
        url: lead.linkedin_personal || lead.linkedin,
        type: lead.linkedin_personal ? 'personal' : 'company'
      },
      phone: lead.phone || null,
      telegram: lead.telegram || null,
      twitter: lead.twitter || null,
      preferred_channel: determinePreferredChannel(enrichment.accessibility),
      backup_channels: getBackupChannels(enrichment.accessibility)
    },
    
    // Company intelligence
    company_intel: {
      funding: lead.funding || pieIntel.funding,
      employees: lead.employees || pieIntel.employees,
      market: lead.region || pieIntel.market,
      recent_news: pieIntel.recent_news || extractRecentNews(lead),
      partnership_angles: pieIntel.partnership_angles || extractPartnershipAngles(lead),
      competitors: pieIntel.competitors || [],
      key_customers: pieIntel.key_customers || []
    },
    
    // Outreach intelligence
    outreach: {
      optimal_timing: {
        day: pieIntel.optimal_day || 'Tuesday',
        time: pieIntel.optimal_time || '10:00 AM PHT',
        timezone: lead.timezone || 'Asia/Manila',
        reasoning: pieIntel.timing_reasoning || 'Based on industry patterns'
      },
      personalization: {
        hook: pieIntel.personalization_hook || generatePersonalizationHook(lead),
        mutual_connections: lead.mutual_connections || [],
        recent_activity: pieIntel.recent_activity,
        shared_interests: pieIntel.shared_interests || []
      },
      messaging: {
        suggested_subject: generateSubjectLine(lead),
        opening_line: generateOpeningLine(lead, pieIntel),
        key_talking_points: generateTalkingPoints(lead, pieIntel),
        value_proposition: generateValueProp(lead),
        call_to_action: 'Request 15-min call to explore partnership'
      }
    },
    
    // Scoring
    scores: {
      readiness: readiness.score || 0,
      accessibility: enrichment.accessibility?.score || 0,
      lead_quality: lead.totalScore || lead.score || 0,
      pie_signal_strength: pieIntel.signal_strength || 0
    },
    
    // Priority and routing
    priority: readiness.priority || calculatePriority(readiness.score),
    assigned_to: options.assignedTo || null,
    due_date: calculateDueDate(readiness.priority),
    
    // DealFlow notes
    dealflow_notes: {
      research_summary: enrichment.accessibility?.recommendations || [],
      data_gaps: readiness.improvementPlan || [],
      confidence_level: readiness.score >= 80 ? 'high' : readiness.score >= 60 ? 'medium' : 'low'
    },
    
    // PIE signals
    pie_signals: {
      type: pieIntel.signal_type,
      strength: pieIntel.signal_strength,
      predicted_response: pieIntel.predicted_response,
      friction_forecast: pieIntel.friction_forecast
    },
    
    // ColdCall workspace
    coldcall_workspace: {
      outreach_attempts: [],
      responses: [],
      notes: [],
      meetings: [],
      next_action: null
    }
  };
  
  return handoff;
}

/**
 * Generate unique handoff ID
 * @returns {string} Handoff ID
 */
function generateHandoffId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HO-${timestamp}-${random}`;
}

/**
 * Determine preferred contact channel
 * @param {Object} accessibility - Accessibility details
 * @returns {string} Preferred channel
 */
function determinePreferredChannel(accessibility) {
  if (!accessibility) return 'email';
  
  const channels = accessibility.channels || [];
  
  if (channels.includes('email_verified')) return 'email';
  if (channels.includes('warm_intro')) return 'linkedin';
  if (channels.includes('linkedin_personal')) return 'linkedin';
  if (channels.includes('twitter')) return 'twitter';
  if (channels.includes('email_unverified')) return 'email';
  
  return 'email';
}

/**
 * Get backup contact channels
 * @param {Object} accessibility - Accessibility details
 * @returns {Array} Backup channels
 */
function getBackupChannels(accessibility) {
  if (!accessibility) return [];
  
  const channels = accessibility.channels || [];
  const backups = [];
  
  if (channels.includes('linkedin_personal')) backups.push('linkedin');
  if (channels.includes('twitter')) backups.push('twitter');
  if (channels.includes('telegram')) backups.push('telegram');
  if (channels.includes('phone')) backups.push('phone');
  
  return backups;
}

// ============================================================================
// CONTENT GENERATION
// ============================================================================

function generatePersonalizationHook(lead) {
  if (lead.funding) {
    return `Congratulations on ${lead.funding}`;
  }
  if (lead.recent_expansion) {
    return `Saw your expansion into ${lead.recent_expansion}`;
  }
  return `Noticed ${lead.company}'s innovative work`;
}

function generateSubjectLine(lead) {
  const subjects = [
    `Partnership: ${lead.company} + coins.ph`,
    `Quick question about ${lead.company}'s expansion`,
    `Crypto payments for ${lead.company}`,
    `SEA partnership opportunity`,
    `${lead.company} + Philippines market`
  ];
  return subjects[Math.floor(Math.random() * subjects.length)];
}

function generateOpeningLine(lead, pieIntel) {
  const hook = pieIntel.personalization_hook || generatePersonalizationHook(lead);
  return `${hook}. I'm reaching out from coins.ph, the leading crypto exchange in the Philippines with 18M+ users.`;
}

function generateTalkingPoints(lead, pieIntel) {
  return [
    `coins.ph: 18M+ users, #1 crypto exchange in Philippines`,
    `Recently launched coins.xyz for international expansion`,
    `Looking for strategic partners in ${lead.region || 'Southeast Asia'}`,
    `Potential synergies with ${lead.company}'s ${lead.industry || 'business'}`,
    ...(pieIntel.partnership_angles || [])
  ];
}

function generateValueProp(lead) {
  return `Partner with coins.ph to access 18M+ crypto-native users in the Philippines and leverage our regulatory licenses for Southeast Asian expansion.`;
}

function extractRecentNews(lead) {
  return lead.recent_news || null;
}

function extractPartnershipAngles(lead) {
  const angles = [];
  const notes = (lead.notes || '').toLowerCase();
  
  if (notes.includes('exchange')) angles.push('Crypto payment integration');
  if (notes.includes('payment')) angles.push('Cross-border payments');
  if (notes.includes('wallet')) angles.push('Wallet partnership');
  if (notes.includes('defi')) angles.push('DeFi integration');
  
  return angles.length > 0 ? angles : ['Strategic partnership exploration'];
}

function calculatePriority(readinessScore) {
  if (readinessScore >= 90) return 'P0';
  if (readinessScore >= 75) return 'P1';
  if (readinessScore >= 60) return 'P2';
  return 'P3';
}

function calculateDueDate(priority) {
  const date = new Date();
  switch (priority) {
    case 'P0': date.setDate(date.getDate() + 1); break;
    case 'P1': date.setDate(date.getDate() + 3); break;
    case 'P2': date.setDate(date.getDate() + 7); break;
    default: date.setDate(date.getDate() + 14);
  }
  return date.toISOString().split('T')[0];
}

// ============================================================================
// HANDOFF QUEUE MANAGEMENT
// ============================================================================

/**
 * Add handoff to queue
 * @param {Object} handoff - Handoff package
 * @returns {Object} Queue result
 */
function addToQueue(handoff) {
  const queue = loadQueue();
  
  // Check for duplicates
  const exists = queue.packages.some(p => p.lead.id === handoff.lead.id);
  if (exists) {
    return { success: false, error: 'Lead already in queue' };
  }
  
  // Add to queue
  queue.packages.push(handoff);
  queue.total_ready = queue.packages.length;
  queue.updated_at = new Date().toISOString();
  
  // Save queue
  saveQueue(queue);
  
  return { success: true, handoff_id: handoff.handoff_id };
}

/**
 * Load handoff queue
 * @returns {Object} Queue data
 */
function loadQueue() {
  try {
    const data = fs.readFileSync(CONFIG.paths.handoffQueue, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_ready: 0,
      packages: []
    };
  }
}

/**
 * Save handoff queue
 * @param {Object} queue - Queue data
 */
function saveQueue(queue) {
  fs.writeFileSync(CONFIG.paths.handoffQueue, JSON.stringify(queue, null, 2));
}

/**
 * Get handoff by ID
 * @param {string} handoffId - Handoff ID
 * @returns {Object|null} Handoff package
 */
function getHandoff(handoffId) {
  const queue = loadQueue();
  return queue.packages.find(p => p.handoff_id === handoffId) || null;
}

/**
 * Update handoff status
 * @param {string} handoffId - Handoff ID
 * @param {string} newStatus - New status
 * @param {string} note - Status change note
 * @returns {Object} Update result
 */
function updateStatus(handoffId, newStatus, note = '') {
  const queue = loadQueue();
  const handoff = queue.packages.find(p => p.handoff_id === handoffId);
  
  if (!handoff) {
    return { success: false, error: 'Handoff not found' };
  }
  
  // Validate status transition
  const validTransitions = CONFIG.statusWorkflow[handoff.status];
  if (!validTransitions || !validTransitions.includes(newStatus)) {
    return { 
      success: false, 
      error: `Invalid transition: ${handoff.status} -> ${newStatus}` 
    };
  }
  
  // Update status
  handoff.status = newStatus;
  handoff.status_history.push({
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: note || `Status changed to ${newStatus}`
  });
  
  saveQueue(queue);
  
  return { success: true, handoff };
}

// ============================================================================
// COLDCALL INTEGRATION
// ============================================================================

/**
 * Deliver handoff to ColdCall inbox
 * @param {string} handoffId - Handoff ID
 * @returns {Object} Delivery result
 */
function deliverToColdCall(handoffId) {
  const handoff = getHandoff(handoffId);
  
  if (!handoff) {
    return { success: false, error: 'Handoff not found' };
  }
  
  // Update status
  updateStatus(handoffId, 'APPROVED', 'Approved and delivered to ColdCall');
  
  // Create ColdCall inbox file
  const inboxPath = path.join(CONFIG.paths.coldCallInbox, `${handoffId}.json`);
  
  // Ensure directory exists
  if (!fs.existsSync(CONFIG.paths.coldCallInbox)) {
    fs.mkdirSync(CONFIG.paths.coldCallInbox, { recursive: true });
  }
  
  // Write to ColdCall inbox
  fs.writeFileSync(inboxPath, JSON.stringify(handoff, null, 2));
  
  return { 
    success: true, 
    message: `Delivered to ColdCall inbox: ${inboxPath}` 
  };
}

/**
 * Process all ready leads and create handoffs
 * @param {Array} enrichedLeads - Array of enriched leads
 * @returns {Object} Processing results
 */
function processReadyLeads(enrichedLeads) {
  const results = {
    processed: 0,
    created: 0,
    rejected: 0,
    handoffs: []
  };
  
  enrichedLeads.forEach(lead => {
    results.processed++;
    
    const readiness = lead.enrichment?.readiness;
    if (!readiness) return;
    
    // Check if ready for handoff
    if (readiness.readyForHandoff || readiness.score >= CONFIG.settings.minReadinessScore) {
      
      // Check verified email requirement
      if (CONFIG.settings.requireVerifiedEmail && !lead.email_verified) {
        results.rejected++;
        return;
      }
      
      // Create handoff
      const handoff = createHandoff(lead);
      const added = addToQueue(handoff);
      
      if (added.success) {
        results.created++;
        results.handoffs.push(handoff);
        
        // Auto-approve high-scoring leads
        if (handoff.scores.readiness >= CONFIG.settings.autoApproveThreshold) {
          deliverToColdCall(handoff.handoff_id);
        }
      }
    }
  });
  
  return results;
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Generate handoff pipeline report
 * @returns {Object} Pipeline report
 */
function generatePipelineReport() {
  const queue = loadQueue();
  
  const statusCounts = {
    PENDING: 0,
    APPROVED: 0,
    IN_PROGRESS: 0,
    CONTACTED: 0,
    RESPONDED: 0,
    MEETING_SCHEDULED: 0,
    REJECTED: 0,
    NEEDS_INFO: 0
  };
  
  const priorityCounts = {
    P0: 0,
    P1: 0,
    P2: 0,
    P3: 0
  };
  
  queue.packages.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    priorityCounts[p.priority] = (priorityCounts[p.priority] || 0) + 1;
  });
  
  return {
    generated_at: new Date().toISOString(),
    total_handoffs: queue.packages.length,
    status_breakdown: statusCounts,
    priority_breakdown: priorityCounts,
    pending_approval: statusCounts.PENDING,
    in_progress: statusCounts.IN_PROGRESS + statusCounts.CONTACTED + statusCounts.RESPONDED,
    meetings_scheduled: statusCounts.MEETING_SCHEDULED,
    conversion_rate: queue.packages.length > 0 
      ? Math.round((statusCounts.MEETING_SCHEDULED / queue.packages.length) * 100)
      : 0
  };
}

/**
 * Print pipeline report
 */
function printPipelineReport() {
  const report = generatePipelineReport();
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   COLDCALL HANDOFF PIPELINE REPORT                         ║');
  console.log('╚════════════════════════════════════════════════════════════\n');
  
  console.log(`📊 Total Handoffs: ${report.total_handoffs}`);
  console.log(`⏳ Pending Approval: ${report.pending_approval}`);
  console.log(`🔄 In Progress: ${report.in_progress}`);
  console.log(`📅 Meetings Scheduled: ${report.meetings_scheduled}`);
  console.log(`📈 Conversion Rate: ${report.conversion_rate}%\n`);
  
  console.log('🎯 Priority Distribution:');
  console.log(`   P0 (Immediate): ${report.priority_breakdown.P0}`);
  console.log(`   P1 (This Week): ${report.priority_breakdown.P1}`);
  console.log(`   P2 (This Month): ${report.priority_breakdown.P2}`);
  console.log(`   P3 (Nurture): ${report.priority_breakdown.P3}\n`);
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Core functions
  createHandoff,
  addToQueue,
  getHandoff,
  updateStatus,
  deliverToColdCall,
  processReadyLeads,
  
  // Queue management
  loadQueue,
  saveQueue,
  
  // Reporting
  generatePipelineReport,
  printPipelineReport,
  
  // Config
  CONFIG
};

// ============================================================================
// CLI EXECUTION
// ============================================================================

if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'report':
      printPipelineReport();
      break;
      
    case 'process':
      // Load enriched leads and process
      try {
        const data = fs.readFileSync(CONFIG.paths.leads, 'utf8');
        const leads = JSON.parse(data).leads || [];
        const results = processReadyLeads(leads);
        
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║   HANDOFF PROCESSING COMPLETE                              ║');
        console.log('╚════════════════════════════════════════════════════════════\n');
        
        console.log(`📊 Results:`);
        console.log(`   Processed: ${results.processed}`);
        console.log(`   Created: ${results.created}`);
        console.log(`   Rejected: ${results.rejected}\n`);
        
        if (results.handoffs.length > 0) {
          console.log('🎯 New Handoffs:');
          results.handoffs.forEach(h => {
            console.log(`   ${h.handoff_id}: ${h.lead.company} (${h.priority})`);
          });
        }
        
        console.log('');
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
      break;
      
    default:
      console.log('\nDealFlow → ColdCall Handoff API\n');
      console.log('Usage:');
      console.log('  node handoff-api.js report     - Show pipeline report');
      console.log('  node handoff-api.js process    - Process ready leads\n');
  }
}
