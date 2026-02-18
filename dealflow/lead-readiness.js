/**
 * DealFlow Lead Readiness Scoring Module
 * Determines which leads are ready for ColdCall handoff
 * 
 * @module lead-readiness
 * @version 1.0.0
 * @author DealFlow Agent
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// READINESS CRITERIA CONFIGURATION
// ============================================================================

const READINESS_CONFIG = {
  // Criteria weights (must sum to 100)
  criteria: {
    contactVerified: {
      weight: 30,
      description: 'Has verified email or reliable contact channel',
      minimumScore: 50
    },
    decisionMakerConfirmed: {
      weight: 25,
      description: 'Contact is confirmed decision maker',
      minimumScore: 70
    },
    companyIntelComplete: {
      weight: 20,
      description: 'Complete company intelligence (funding, market, traction)',
      minimumScore: 60
    },
    outreachTimingIdentified: {
      weight: 15,
      description: 'Optimal outreach timing identified by PIE',
      minimumScore: 50
    },
    personalizationAngle: {
      weight: 10,
      description: 'Has personalization angle for outreach',
      minimumScore: 50
    }
  },
  
  // Readiness thresholds
  thresholds: {
    READY: { min: 80, action: 'Immediate handoff to ColdCall' },
    NEEDS_MINOR_WORK: { min: 60, action: 'Quick research then handoff' },
    NEEDS_WORK: { min: 40, action: 'Additional research required' },
    NOT_READY: { min: 0, action: 'Nurture or archive' }
  },
  
  // Decision maker titles
  decisionMakerTitles: {
    high: ['ceo', 'founder', 'co-founder', 'chief executive', 'managing director', 'president'],
    medium: ['cto', 'cfo', 'coo', 'chief', 'vp', 'vice president', 'head of', 'director'],
    low: ['manager', 'lead', 'senior', 'associate', 'analyst']
  }
};

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Calculate comprehensive lead readiness score
 * @param {Object} lead - Lead object
 * @param {Object} options - Scoring options
 * @returns {Object} Complete readiness assessment
 */
function calculateReadiness(lead, options = {}) {
  const {
    accessibilityScore = 0,
    pieIntel = {},
    strictMode = false
  } = options;
  
  // Score each criterion
  const contactScore = scoreContactVerification(lead, accessibilityScore);
  const decisionMakerScore = scoreDecisionMaker(lead);
  const intelScore = scoreCompanyIntel(lead, pieIntel);
  const timingScore = scoreOutreachTiming(pieIntel);
  const personalizationScore = scorePersonalization(lead, pieIntel);
  
  // Calculate weighted total
  const criteria = {
    contactVerified: {
      score: contactScore,
      weight: READINESS_CONFIG.criteria.contactVerified.weight,
      weighted: Math.round(contactScore * READINESS_CONFIG.criteria.contactVerified.weight / 100),
      met: contactScore >= READINESS_CONFIG.criteria.contactVerified.minimumScore
    },
    decisionMakerConfirmed: {
      score: decisionMakerScore,
      weight: READINESS_CONFIG.criteria.decisionMakerConfirmed.weight,
      weighted: Math.round(decisionMakerScore * READINESS_CONFIG.criteria.decisionMakerConfirmed.weight / 100),
      met: decisionMakerScore >= READINESS_CONFIG.criteria.decisionMakerConfirmed.minimumScore
    },
    companyIntelComplete: {
      score: intelScore,
      weight: READINESS_CONFIG.criteria.companyIntelComplete.weight,
      weighted: Math.round(intelScore * READINESS_CONFIG.criteria.companyIntelComplete.weight / 100),
      met: intelScore >= READINESS_CONFIG.criteria.companyIntelComplete.minimumScore
    },
    outreachTimingIdentified: {
      score: timingScore,
      weight: READINESS_CONFIG.criteria.outreachTimingIdentified.weight,
      weighted: Math.round(timingScore * READINESS_CONFIG.criteria.outreachTimingIdentified.weight / 100),
      met: timingScore >= READINESS_CONFIG.criteria.outreachTimingIdentified.minimumScore
    },
    personalizationAngle: {
      score: personalizationScore,
      weight: READINESS_CONFIG.criteria.personalizationAngle.weight,
      weighted: Math.round(personalizationScore * READINESS_CONFIG.criteria.personalizationAngle.weight / 100),
      met: personalizationScore >= READINESS_CONFIG.criteria.personalizationAngle.minimumScore
    }
  };
  
  // Calculate total score
  const totalScore = Object.values(criteria).reduce((sum, c) => sum + c.weighted, 0);
  
  // Determine status
  const status = determineReadinessStatus(totalScore, criteria, strictMode);
  
  // Generate improvement plan
  const improvementPlan = generateImprovementPlan(criteria);
  
  // Calculate estimated time to ready
  const timeToReady = estimateTimeToReady(improvementPlan);
  
  return {
    leadId: lead.id,
    company: lead.company,
    contactName: lead.contact_name,
    score: totalScore,
    maxScore: 100,
    status: status.status,
    action: status.action,
    priority: calculatePriority(totalScore, criteria),
    criteria,
    improvementPlan,
    timeToReady,
    readyForHandoff: status.status === 'READY',
    scoredAt: new Date().toISOString(),
    version: '1.0.0'
  };
}

/**
 * Score contact verification criterion
 * @param {Object} lead - Lead object
 * @param {number} accessibilityScore - Pre-calculated accessibility score
 * @returns {number} Score 0-100
 */
function scoreContactVerification(lead, accessibilityScore) {
  // If we have accessibility score, use it
  if (accessibilityScore > 0) {
    return Math.min(accessibilityScore, 100);
  }
  
  // Otherwise calculate from lead data
  let score = 0;
  
  if (lead.email_verified) {
    score = 95;
  } else if (lead.email) {
    score = 60;
  }
  
  // Bonus for multiple channels
  if (lead.linkedin_personal) score += 10;
  if (lead.twitter) score += 5;
  if (lead.phone) score += 10;
  if (lead.warm_intro_available) score += 20;
  
  return Math.min(score, 100);
}

/**
 * Score decision maker criterion
 * @param {Object} lead - Lead object
 * @returns {number} Score 0-100
 */
function scoreDecisionMaker(lead) {
  const title = (lead.title || '').toLowerCase();
  
  if (!title) return 20;
  
  // Check high-value titles
  if (READINESS_CONFIG.decisionMakerTitles.high.some(t => title.includes(t))) {
    return 100;
  }
  
  // Check medium-value titles
  if (READINESS_CONFIG.decisionMakerTitles.medium.some(t => title.includes(t))) {
    return 75;
  }
  
  // Check low-value titles
  if (READINESS_CONFIG.decisionMakerTitles.low.some(t => title.includes(t))) {
    return 40;
  }
  
  // Unknown title
  return 30;
}

/**
 * Score company intelligence completeness
 * @param {Object} lead - Lead object
 * @param {Object} pieIntel - PIE intelligence
 * @returns {number} Score 0-100
 */
function scoreCompanyIntel(lead, pieIntel) {
  let score = 0;
  let factors = 0;
  
  // Funding information
  if (lead.funding || pieIntel.funding) {
    score += 25;
  }
  factors++;
  
  // Employee count
  if (lead.employees || pieIntel.employees) {
    score += 15;
  }
  factors++;
  
  // Market/region
  if (lead.region || lead.market || pieIntel.market) {
    score += 15;
  }
  factors++;
  
  // Recent news
  if (lead.recent_news || pieIntel.recent_news) {
    score += 20;
  }
  factors++;
  
  // Partnership angles
  if (pieIntel.partnership_angles || lead.partnership_angles) {
    score += 15;
  }
  factors++;
  
  // Company notes/description
  if (lead.notes && lead.notes.length > 100) {
    score += 10;
  }
  factors++;
  
  return Math.min(score, 100);
}

/**
 * Score outreach timing criterion
 * @param {Object} pieIntel - PIE intelligence
 * @returns {number} Score 0-100
 */
function scoreOutreachTiming(pieIntel) {
  if (!pieIntel) return 30;
  
  // Optimal time identified
  if (pieIntel.optimal_time) {
    return 100;
  }
  
  // Timing signals present
  if (pieIntel.timing_signals && pieIntel.timing_signals.length > 0) {
    return 70;
  }
  
  // Recent activity noted
  if (pieIntel.recent_activity) {
    return 60;
  }
  
  return 30;
}

/**
 * Score personalization angle criterion
 * @param {Object} lead - Lead object
 * @param {Object} pieIntel - PIE intelligence
 * @returns {number} Score 0-100
 */
function scorePersonalization(lead, pieIntel) {
  let score = 0;
  
  // PIE personalization hook
  if (pieIntel.personalization_hook) {
    score += 40;
  }
  
  // Recent news to reference
  if (pieIntel.recent_news || lead.recent_news) {
    score += 30;
  }
  
  // Mutual connections
  if (lead.mutual_connections && lead.mutual_connections.length > 0) {
    score += 20;
  }
  
  // Detailed notes
  if (lead.notes && lead.notes.length > 200) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

// ============================================================================
// STATUS DETERMINATION
// ============================================================================

/**
 * Determine readiness status based on score and criteria
 * @param {number} totalScore - Total readiness score
 * @param {Object} criteria - Scored criteria
 * @param {boolean} strictMode - If true, require all criteria to be met
 * @returns {Object} Status and action
 */
function determineReadinessStatus(totalScore, criteria, strictMode = false) {
  const { thresholds } = READINESS_CONFIG;
  
  // In strict mode, all criteria must be met
  if (strictMode) {
    const allMet = Object.values(criteria).every(c => c.met);
    if (!allMet) {
      return {
        status: 'NEEDS_WORK',
        action: thresholds.NEEDS_WORK.action
      };
    }
  }
  
  // Determine status based on score
  if (totalScore >= thresholds.READY.min) {
    return {
      status: 'READY',
      action: thresholds.READY.action
    };
  } else if (totalScore >= thresholds.NEEDS_MINOR_WORK.min) {
    return {
      status: 'NEEDS_MINOR_WORK',
      action: thresholds.NEEDS_MINOR_WORK.action
    };
  } else if (totalScore >= thresholds.NEEDS_WORK.min) {
    return {
      status: 'NEEDS_WORK',
      action: thresholds.NEEDS_WORK.action
    };
  } else {
    return {
      status: 'NOT_READY',
      action: thresholds.NOT_READY.action
    };
  }
}

/**
 * Calculate priority tier
 * @param {number} score - Readiness score
 * @param {Object} criteria - Criteria details
 * @returns {string} Priority tier
 */
function calculatePriority(score, criteria) {
  if (score >= 90) return 'P0';
  if (score >= 75) return 'P1';
  if (score >= 60) return 'P2';
  if (score >= 40) return 'P3';
  return 'Cold';
}

// ============================================================================
// IMPROVEMENT PLANNING
// ============================================================================

/**
 * Generate improvement plan for leads not yet ready
 * @param {Object} criteria - Scored criteria
 * @returns {Array} Improvement tasks
 */
function generateImprovementPlan(criteria) {
  const plan = [];
  
  if (!criteria.contactVerified.met) {
    plan.push({
      task: 'Find verified contact channels',
      priority: 'CRITICAL',
      estimatedTime: '15-30 min',
      actions: [
        'Search Hunter.io for email patterns',
        'Check LinkedIn for personal profile',
        'Look for mutual connections',
        'Check company website contact page'
      ]
    });
  }
  
  if (!criteria.decisionMakerConfirmed.met) {
    plan.push({
      task: 'Confirm decision maker identity',
      priority: 'HIGH',
      estimatedTime: '10-15 min',
      actions: [
        'Verify title on LinkedIn',
        'Check if they lead partnerships/BD',
        'Find org chart if available',
        'Look for recent interviews/articles'
      ]
    });
  }
  
  if (!criteria.companyIntelComplete.met) {
    plan.push({
      task: 'Complete company research',
      priority: 'MEDIUM',
      estimatedTime: '20-30 min',
      actions: [
        'Check Crunchbase for funding',
        'Review recent news',
        'Analyze competitive landscape',
        'Identify partnership opportunities'
      ]
    });
  }
  
  if (!criteria.outreachTimingIdentified.met) {
    plan.push({
      task: 'Identify optimal outreach timing',
      priority: 'MEDIUM',
      estimatedTime: '10 min',
      actions: [
        'Check PIE for timing signals',
        'Review contact activity patterns',
        'Consider timezone differences',
        'Avoid holidays/industry events'
      ]
    });
  }
  
  if (!criteria.personalizationAngle.met) {
    plan.push({
      task: 'Develop personalization angle',
      priority: 'LOW',
      estimatedTime: '10-15 min',
      actions: [
        'Find recent company news',
        'Check contact social media',
        'Look for shared connections',
        'Reference recent achievements'
      ]
    });
  }
  
  return plan;
}

/**
 * Estimate time to get lead ready
 * @param {Array} improvementPlan - List of improvements needed
 * @returns {Object} Time estimate details
 */
function estimateTimeToReady(improvementPlan) {
  if (improvementPlan.length === 0) {
    return {
      minutes: 0,
      display: 'Ready now',
      category: 'immediate'
    };
  }
  
  // Parse estimated times
  let totalMinutes = 0;
  improvementPlan.forEach(item => {
    const match = item.estimatedTime.match(/(\d+)(?:-(\d+))?/);
    if (match) {
      const min = parseInt(match[1]);
      const max = match[2] ? parseInt(match[2]) : min;
      totalMinutes += (min + max) / 2; // Average
    }
  });
  
  const minutes = Math.round(totalMinutes);
  
  let display;
  let category;
  
  if (minutes <= 15) {
    display = '~15 minutes';
    category = 'quick';
  } else if (minutes <= 30) {
    display = '~30 minutes';
    category = 'short';
  } else if (minutes <= 60) {
    display = '~1 hour';
    category = 'medium';
  } else {
    display = `~${Math.round(minutes / 60 * 10) / 10} hours`;
    category = 'long';
  }
  
  return { minutes, display, category };
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Process multiple leads for readiness
 * @param {Array} leads - Array of lead objects
 * @param {Object} options - Processing options
 * @returns {Object} Batch results
 */
function processBatch(leads, options = {}) {
  const results = {
    processed: [],
    ready: [],
    needsWork: [],
    notReady: [],
    summary: {
      total: leads.length,
      ready: 0,
      needsMinorWork: 0,
      needsWork: 0,
      notReady: 0,
      avgScore: 0,
      p0Count: 0,
      p1Count: 0,
      p2Count: 0
    }
  };
  
  leads.forEach(lead => {
    const assessment = calculateReadiness(lead, options);
    results.processed.push(assessment);
    results.summary.avgScore += assessment.score;
    
    // Categorize
    switch (assessment.status) {
      case 'READY':
        results.ready.push(assessment);
        results.summary.ready++;
        break;
      case 'NEEDS_MINOR_WORK':
        results.needsWork.push(assessment);
        results.summary.needsMinorWork++;
        break;
      case 'NEEDS_WORK':
        results.needsWork.push(assessment);
        results.summary.needsWork++;
        break;
      case 'NOT_READY':
        results.notReady.push(assessment);
        results.summary.notReady++;
        break;
    }
    
    // Count priorities
    if (assessment.priority === 'P0') results.summary.p0Count++;
    if (assessment.priority === 'P1') results.summary.p1Count++;
    if (assessment.priority === 'P2') results.summary.p2Count++;
  });
  
  // Calculate average
  if (results.summary.total > 0) {
    results.summary.avgScore = Math.round(results.summary.avgScore / results.summary.total);
  }
  
  return results;
}

/**
 * Generate readiness report
 * @param {Object} batchResults - Results from processBatch
 * @returns {string} Formatted report
 */
function generateReport(batchResults) {
  const { summary } = batchResults;
  
  let report = '\n╔════════════════════════════════════════════════════════════╗\n';
  report += '║   LEAD READINESS REPORT                                    ║\n';
  report += '╚════════════════════════════════════════════════════════════\n\n';
  
  report += `📊 Summary:\n`;
  report += `   Total Leads: ${summary.total}\n`;
  report += `   Average Score: ${summary.avgScore}/100\n\n`;
  
  report += `✅ Ready for Handoff: ${summary.ready}\n`;
  report += `🟡 Needs Minor Work: ${summary.needsMinorWork}\n`;
  report += `🟠 Needs Work: ${summary.needsWork}\n`;
  report += `🔴 Not Ready: ${summary.notReady}\n\n`;
  
  report += `🎯 Priority Distribution:\n`;
  report += `   P0 (Immediate): ${summary.p0Count}\n`;
  report += `   P1 (This Week): ${summary.p1Count}\n`;
  report += `   P2 (This Month): ${summary.p2Count}\n\n`;
  
  if (batchResults.ready.length > 0) {
    report += `🏆 Top Ready Leads:\n`;
    batchResults.ready
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .forEach((lead, i) => {
        report += `   ${i + 1}. ${lead.company} (${lead.contactName}) - ${lead.score}/100\n`;
      });
  }
  
  return report;
}

// ============================================================================
// PIE INTEGRATION
// ============================================================================

/**
 * Apply PIE intelligence to enhance readiness scoring
 * @param {Object} readiness - Base readiness assessment
 * @param {Object} pieIntel - PIE intelligence
 * @returns {Object} Enhanced readiness assessment
 */
function applyPIEIntel(readiness, pieIntel) {
  if (!pieIntel) return readiness;
  
  const enhanced = { ...readiness };
  
  // Boost score based on PIE signal strength
  if (pieIntel.signal_strength) {
    const boost = Math.round(pieIntel.signal_strength * 10); // Up to 10 point boost
    enhanced.score = Math.min(enhanced.score + boost, 100);
    enhanced.pieBoost = boost;
  }
  
  // Add PIE-specific insights
  enhanced.pieInsights = {
    signalType: pieIntel.signal_type,
    signalStrength: pieIntel.signal_strength,
    predictedResponse: pieIntel.predicted_response,
    recommendedApproach: pieIntel.recommended_approach
  };
  
  // Recalculate priority if score changed significantly
  if (enhanced.pieBoost >= 5) {
    enhanced.priority = calculatePriority(enhanced.score, enhanced.criteria);
  }
  
  return enhanced;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Core functions
  calculateReadiness,
  processBatch,
  generateReport,
  applyPIEIntel,
  
  // Scoring functions
  scoreContactVerification,
  scoreDecisionMaker,
  scoreCompanyIntel,
  scoreOutreachTiming,
  scorePersonalization,
  
  // Utilities
  determineReadinessStatus,
  calculatePriority,
  generateImprovementPlan,
  estimateTimeToReady,
  
  // Config
  READINESS_CONFIG
};

// ============================================================================
// CLI EXECUTION
// ============================================================================

if (require.main === module) {
  // Load leads and process
  const leadsPath = process.argv[2] || '/mission-control/data/leads.json';
  
  try {
    const leadsData = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));
    const leads = Array.isArray(leadsData) ? leadsData : leadsData.leads || [];
    
    console.log(`\n📥 Loaded ${leads.length} leads from ${leadsPath}\n`);
    
    const results = processBatch(leads);
    console.log(generateReport(results));
    
    // Save results
    const outputPath = '/mission-control/data/readiness-report.json';
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`💾 Full report saved to: ${outputPath}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}
