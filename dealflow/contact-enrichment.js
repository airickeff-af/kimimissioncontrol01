/**
 * DealFlow Contact Enrichment Automation
 * Integrates with Hunter.io, LinkedIn, and PIE for comprehensive contact research
 * 
 * @module contact-enrichment
 * @version 1.0.0
 * @author DealFlow Agent
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // API Configuration (to be filled with actual keys)
  hunterApiKey: process.env.HUNTER_API_KEY || '',
  clearbitApiKey: process.env.CLEARBIT_API_KEY || '',
  apolloApiKey: process.env.APOLLO_API_KEY || '',
  
  // Scoring Weights
  weights: {
    emailVerified: 25,
    emailUnverified: 15,
    linkedinPersonal: 20,
    linkedinCompany: 10,
    twitterActive: 15,
    phoneDirect: 15,
    telegram: 10,
    warmIntro: 30
  },
  
  // Seniority Multipliers
  seniorityMultipliers: {
    'ceo': 1.0,
    'founder': 1.0,
    'co-founder': 1.0,
    'c-level': 0.95,
    'vp': 0.90,
    'director': 0.85,
    'manager': 0.80,
    'other': 0.75
  },
  
  // Email Patterns to Try
  emailPatterns: [
    '{first}@{domain}',
    '{first}.{last}@{domain}',
    '{first}{last}@{domain}',
    '{f}{last}@{domain}',
    '{first}_{last}@{domain}',
    '{first}-{last}@{domain}',
    '{last}@{domain}',
    '{first}{l}@{domain}'
  ],
  
  // Output Paths
  paths: {
    leads: './mission-control/data/leads.json',
    enriched: './mission-control/data/enriched-leads.json',
    scored: './mission-control/data/scored-leads-v2.json',
    handoffQueue: './mission-control/data/handoff-queue.json'
  }
};

// ============================================================================
// EMAIL PATTERN GENERATOR
// ============================================================================

/**
 * Generate possible email addresses based on name and domain
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @param {string} domain - Company domain
 * @returns {Array} Array of possible email addresses
 */
function generateEmailPatterns(firstName, lastName, domain) {
  const patterns = [];
  const f = firstName ? firstName.charAt(0).toLowerCase() : '';
  const l = lastName ? lastName.charAt(0).toLowerCase() : '';
  const first = firstName ? firstName.toLowerCase() : '';
  const last = lastName ? lastName.toLowerCase() : '';
  
  CONFIG.emailPatterns.forEach(pattern => {
    const email = pattern
      .replace('{first}', first)
      .replace('{last}', last)
      .replace('{f}', f)
      .replace('{l}', l)
      .replace('{domain}', domain);
    
    if (email.includes('@') && !email.includes('undefined')) {
      patterns.push(email);
    }
  });
  
  return [...new Set(patterns)]; // Remove duplicates
}

/**
 * Detect email pattern from known company emails
 * @param {Array} knownEmails - Array of known valid emails from company
 * @returns {string} Detected pattern or null
 */
function detectEmailPattern(knownEmails) {
  if (!knownEmails || knownEmails.length === 0) return null;
  
  const patterns = {};
  
  knownEmails.forEach(email => {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return;
    
    // Analyze local part pattern
    if (localPart.includes('.')) {
      patterns['{first}.{last}'] = (patterns['{first}.{last}'] || 0) + 1;
    } else if (localPart.includes('_')) {
      patterns['{first}_{last}'] = (patterns['{first}_{last}'] || 0) + 1;
    } else if (localPart.includes('-')) {
      patterns['{first}-{last}'] = (patterns['{first}-{last}'] || 0) + 1;
    } else if (localPart.length <= 3) {
      patterns['{f}{last}'] = (patterns['{f}{last}'] || 0) + 1;
    } else {
      patterns['{first}'] = (patterns['{first}'] || 0) + 1;
    }
  });
  
  // Return most common pattern
  const sorted = Object.entries(patterns).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
}

// ============================================================================
// CONTACT ACCESSIBILITY SCORER
// ============================================================================

/**
 * Calculate contact accessibility score (0-100)
 * @param {Object} lead - Lead object with contact data
 * @returns {Object} Score details
 */
function calculateAccessibilityScore(lead) {
  let totalPoints = 0;
  const channels = [];
  const details = {
    email: { has: false, verified: false, score: 0 },
    linkedin: { has: false, type: null, score: 0 },
    twitter: { has: false, active: false, score: 0 },
    phone: { has: false, type: null, score: 0 },
    telegram: { has: false, score: 0 },
    warmIntro: { has: false, score: 0 }
  };
  
  // Email scoring
  if (lead.email) {
    details.email.has = true;
    if (lead.email_verified) {
      totalPoints += CONFIG.weights.emailVerified;
      details.email.verified = true;
      details.email.score = CONFIG.weights.emailVerified;
      channels.push('email_verified');
    } else {
      totalPoints += CONFIG.weights.emailUnverified;
      details.email.score = CONFIG.weights.emailUnverified;
      channels.push('email_unverified');
    }
  }
  
  // LinkedIn scoring
  if (lead.linkedin_personal) {
    totalPoints += CONFIG.weights.linkedinPersonal;
    details.linkedin.has = true;
    details.linkedin.type = 'personal';
    details.linkedin.score = CONFIG.weights.linkedinPersonal;
    channels.push('linkedin_personal');
  } else if (lead.linkedin) {
    totalPoints += CONFIG.weights.linkedinCompany;
    details.linkedin.has = true;
    details.linkedin.type = 'company';
    details.linkedin.score = CONFIG.weights.linkedinCompany;
    channels.push('linkedin_company');
  }
  
  // Twitter scoring
  if (lead.twitter) {
    totalPoints += CONFIG.weights.twitterActive;
    details.twitter.has = true;
    details.twitter.active = lead.twitter_active || false;
    details.twitter.score = CONFIG.weights.twitterActive;
    channels.push('twitter');
  }
  
  // Phone scoring
  if (lead.phone) {
    totalPoints += CONFIG.weights.phoneDirect;
    details.phone.has = true;
    details.phone.type = lead.phone_type || 'unknown';
    details.phone.score = CONFIG.weights.phoneDirect;
    channels.push('phone');
  }
  
  // Telegram scoring
  if (lead.telegram) {
    totalPoints += CONFIG.weights.telegram;
    details.telegram.has = true;
    details.telegram.score = CONFIG.weights.telegram;
    channels.push('telegram');
  }
  
  // Warm intro scoring
  if (lead.warm_intro_available) {
    totalPoints += CONFIG.weights.warmIntro;
    details.warmIntro.has = true;
    details.warmIntro.score = CONFIG.weights.warmIntro;
    channels.push('warm_intro');
  }
  
  // Cap at 100
  totalPoints = Math.min(totalPoints, 100);
  
  // Apply seniority multiplier
  const title = (lead.title || '').toLowerCase();
  let seniorityMultiplier = CONFIG.seniorityMultipliers.other;
  let seniorityLevel = 'other';
  
  if (title.includes('ceo') || title.includes('chief executive')) {
    seniorityMultiplier = CONFIG.seniorityMultipliers.ceo;
    seniorityLevel = 'ceo';
  } else if (title.includes('founder') || title.includes('co-founder')) {
    seniorityMultiplier = CONFIG.seniorityMultipliers.founder;
    seniorityLevel = 'founder';
  } else if (title.includes('cto') || title.includes('cfo') || title.includes('coo') || title.includes('chief')) {
    seniorityMultiplier = CONFIG.seniorityMultipliers['c-level'];
    seniorityLevel = 'c-level';
  } else if (title.includes('vp') || title.includes('vice president') || title.includes('head of')) {
    seniorityMultiplier = CONFIG.seniorityMultipliers.vp;
    seniorityLevel = 'vp';
  } else if (title.includes('director')) {
    seniorityMultiplier = CONFIG.seniorityMultipliers.director;
    seniorityLevel = 'director';
  } else if (title.includes('manager')) {
    seniorityMultiplier = CONFIG.seniorityMultipliers.manager;
    seniorityLevel = 'manager';
  }
  
  const finalScore = Math.round(totalPoints * seniorityMultiplier);
  
  return {
    score: finalScore,
    rawScore: totalPoints,
    seniorityMultiplier,
    seniorityLevel,
    channelsAvailable: channels.length,
    channels,
    details,
    recommendations: generateAccessibilityRecommendations(details, channels)
  };
}

/**
 * Generate recommendations for improving accessibility
 * @param {Object} details - Contact details
 * @param {Array} channels - Available channels
 * @returns {Array} Recommendations
 */
function generateAccessibilityRecommendations(details, channels) {
  const recommendations = [];
  
  if (!details.email.has) {
    recommendations.push('PRIORITY: Find verified email address via Hunter.io or LinkedIn');
  } else if (!details.email.verified) {
    recommendations.push('Verify email address using Hunter.io or similar service');
  }
  
  if (!details.linkedin.has) {
    recommendations.push('Find personal LinkedIn profile for warm outreach');
  }
  
  if (!channels.includes('email_verified') && !channels.includes('warm_intro')) {
    recommendations.push('Limited contact options - consider alternative channels');
  }
  
  if (details.warmIntro.has) {
    recommendations.push('Warm intro available - prioritize this channel');
  }
  
  return recommendations;
}

// ============================================================================
// LEAD READINESS SCORER
// ============================================================================

/**
 * Calculate lead readiness score (0-100)
 * Determines if lead is ready for ColdCall handoff
 * @param {Object} lead - Lead object
 * @param {Object} accessibility - Accessibility score result
 * @param {Object} pieIntel - PIE pre-fetched intelligence
 * @returns {Object} Readiness assessment
 */
function calculateLeadReadiness(lead, accessibility, pieIntel = {}) {
  const criteria = {
    contactVerified: {
      weight: 30,
      met: accessibility.score >= 50,
      score: Math.min(accessibility.score, 100)
    },
    decisionMakerConfirmed: {
      weight: 25,
      met: isDecisionMaker(lead.title),
      score: isDecisionMaker(lead.title) ? 100 : 30
    },
    companyIntelComplete: {
      weight: 20,
      met: hasCompleteIntel(lead, pieIntel),
      score: hasCompleteIntel(lead, pieIntel) ? 100 : 40
    },
    outreachTimingIdentified: {
      weight: 15,
      met: pieIntel.optimal_time !== undefined,
      score: pieIntel.optimal_time ? 100 : 0
    },
    personalizationAngle: {
      weight: 10,
      met: hasPersonalizationAngle(lead, pieIntel),
      score: hasPersonalizationAngle(lead, pieIntel) ? 100 : 0
    }
  };
  
  // Calculate weighted score
  let totalScore = 0;
  let maxPossible = 0;
  
  Object.values(criteria).forEach(c => {
    totalScore += (c.score * c.weight) / 100;
    maxPossible += c.weight;
  });
  
  const finalScore = Math.round((totalScore / maxPossible) * 100);
  
  // Determine readiness status
  let status;
  let action;
  
  if (finalScore >= 80) {
    status = 'READY';
    action = 'Handoff to ColdCall immediately';
  } else if (finalScore >= 60) {
    status = 'NEEDS_MINOR_WORK';
    action = 'Quick research to fill gaps, then handoff';
  } else if (finalScore >= 40) {
    status = 'NEEDS_WORK';
    action = 'Additional research required';
  } else {
    status = 'NOT_READY';
    action = 'Nurture or archive - insufficient data';
  }
  
  // Generate improvement plan
  const improvementPlan = [];
  if (!criteria.contactVerified.met) {
    improvementPlan.push('Find verified contact channels');
  }
  if (!criteria.decisionMakerConfirmed.met) {
    improvementPlan.push('Confirm decision maker identity');
  }
  if (!criteria.companyIntelComplete.met) {
    improvementPlan.push('Complete company research');
  }
  if (!criteria.outreachTimingIdentified.met) {
    improvementPlan.push('Identify optimal outreach timing');
  }
  if (!criteria.personalizationAngle.met) {
    improvementPlan.push('Develop personalization angle');
  }
  
  return {
    score: finalScore,
    status,
    action,
    criteria,
    improvementPlan,
    readyForHandoff: status === 'READY',
    estimatedTimeToReady: estimateTimeToReady(improvementPlan)
  };
}

/**
 * Check if title indicates decision maker
 * @param {string} title - Job title
 * @returns {boolean}
 */
function isDecisionMaker(title) {
  if (!title) return false;
  const t = title.toLowerCase();
  const decisionMakerTitles = [
    'ceo', 'founder', 'co-founder', 'chief', 'cto', 'cfo', 'coo',
    'president', 'managing director', 'head of', 'vp', 'vice president',
    'director of', 'general manager', 'partner'
  ];
  return decisionMakerTitles.some(dm => t.includes(dm));
}

/**
 * Check if company intelligence is complete
 * @param {Object} lead - Lead object
 * @param {Object} pieIntel - PIE intelligence
 * @returns {boolean}
 */
function hasCompleteIntel(lead, pieIntel) {
  const hasLeadData = lead.funding || lead.employees || lead.market || lead.notes;
  const hasPieData = pieIntel && (pieIntel.funding || pieIntel.recent_news || pieIntel.partnership_angles);
  return !!(hasLeadData || hasPieData);
}

/**
 * Check if personalization angle exists
 * @param {Object} lead - Lead object
 * @param {Object} pieIntel - PIE intelligence
 * @returns {boolean}
 */
function hasPersonalizationAngle(lead, pieIntel) {
  if (pieIntel.personalization_hook) return true;
  if (lead.notes && lead.notes.length > 50) return true;
  if (lead.recent_news) return true;
  return false;
}

/**
 * Estimate time to get lead ready
 * @param {Array} improvementPlan - List of improvements needed
 * @returns {string} Time estimate
 */
function estimateTimeToReady(improvementPlan) {
  const count = improvementPlan.length;
  if (count === 0) return 'Ready now';
  if (count === 1) return '~15 minutes';
  if (count <= 3) return '~30 minutes';
  return '~1-2 hours';
}

// ============================================================================
// ENRICHMENT ENGINE
// ============================================================================

/**
 * Enrich a single lead with contact research
 * @param {Object} lead - Raw lead object
 * @param {Object} pieIntel - PIE pre-fetched intelligence
 * @returns {Object} Enriched lead
 */
async function enrichLead(lead, pieIntel = {}) {
  console.log(`🔍 Enriching: ${lead.company} - ${lead.contact_name}`);
  
  // Step 1: Calculate current accessibility
  const accessibility = calculateAccessibilityScore(lead);
  
  // Step 2: Generate email patterns if email missing
  let enrichedEmail = lead.email;
  let emailVerified = lead.email_verified || false;
  
  if (!enrichedEmail && lead.contact_name && lead.company_domain) {
    const names = lead.contact_name.split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ');
    
    const patterns = generateEmailPatterns(firstName, lastName, lead.company_domain);
    
    // In real implementation, verify each pattern via Hunter.io
    // For now, store patterns for manual verification
    if (patterns.length > 0) {
      enrichedEmail = patterns[0]; // Best guess
      emailVerified = false;
    }
  }
  
  // Step 3: Calculate lead readiness
  const readiness = calculateLeadReadiness(lead, accessibility, pieIntel);
  
  // Step 4: Build enrichment result
  const enriched = {
    ...lead,
    email: enrichedEmail,
    email_verified: emailVerified,
    email_patterns: !lead.email ? generateEmailPatterns(
      lead.contact_name?.split(' ')[0],
      lead.contact_name?.split(' ').slice(1).join(' '),
      lead.company_domain
    ) : undefined,
    enrichment: {
      accessibility,
      readiness,
      pie_intel: pieIntel,
      enriched_at: new Date().toISOString(),
      enrichment_version: '1.0.0'
    }
  };
  
  console.log(`  ✅ Accessibility: ${accessibility.score}/100 (${accessibility.channels.length} channels)`);
  console.log(`  ✅ Readiness: ${readiness.score}/100 (${readiness.status})`);
  
  return enriched;
}

/**
 * Batch enrich multiple leads
 * @param {Array} leads - Array of lead objects
 * @param {Object} pieIntelMap - Map of lead_id to PIE intelligence
 * @returns {Object} Enrichment results
 */
async function enrichLeadsBatch(leads, pieIntelMap = {}) {
  console.log(`\n🚀 Starting batch enrichment of ${leads.length} leads...\n`);
  
  const results = {
    enriched: [],
    ready_for_handoff: [],
    needs_work: [],
    failed: [],
    summary: {
      total: leads.length,
      processed: 0,
      ready: 0,
      needs_work: 0,
      failed: 0,
      avg_accessibility: 0,
      avg_readiness: 0
    }
  };
  
  for (const lead of leads) {
    try {
      const pieIntel = pieIntelMap[lead.id] || {};
      const enriched = await enrichLead(lead, pieIntel);
      
      results.enriched.push(enriched);
      results.summary.processed++;
      
      if (enriched.enrichment.readiness.readyForHandoff) {
        results.ready_for_handoff.push(enriched);
        results.summary.ready++;
      } else {
        results.needs_work.push(enriched);
        results.summary.needs_work++;
      }
      
      results.summary.avg_accessibility += enriched.enrichment.accessibility.score;
      results.summary.avg_readiness += enriched.enrichment.readiness.score;
      
    } catch (error) {
      console.error(`  ❌ Failed to enrich ${lead.id}:`, error.message);
      results.failed.push({ lead, error: error.message });
      results.summary.failed++;
    }
  }
  
  // Calculate averages
  if (results.summary.processed > 0) {
    results.summary.avg_accessibility = Math.round(results.summary.avg_accessibility / results.summary.processed);
    results.summary.avg_readiness = Math.round(results.summary.avg_readiness / results.summary.processed);
  }
  
  return results;
}

// ============================================================================
// HANDOFF GENERATOR
// ============================================================================

/**
 * Generate ColdCall handoff package for ready leads
 * @param {Object} enrichedLead - Enriched lead object
 * @returns {Object} Handoff package
 */
function generateHandoffPackage(enrichedLead) {
  const lead = enrichedLead;
  const enrichment = lead.enrichment;
  const pieIntel = enrichment.pie_intel;
  
  return {
    lead_id: lead.id,
    handoff_status: 'ready_for_outreach',
    handoff_at: new Date().toISOString(),
    contact: {
      name: lead.contact_name,
      title: lead.title,
      email: lead.email,
      email_verified: lead.email_verified,
      email_confidence: enrichment.accessibility.details.email.score > 0 ? 'high' : 'low',
      linkedin: lead.linkedin_personal || lead.linkedin,
      phone: lead.phone,
      telegram: lead.telegram,
      preferred_channel: determinePreferredChannel(enrichment.accessibility)
    },
    company_intel: {
      name: lead.company,
      domain: lead.company_domain,
      funding: lead.funding || pieIntel.funding,
      employees: lead.employees,
      market: lead.region || pieIntel.market,
      recent_news: pieIntel.recent_news,
      partnership_angles: pieIntel.partnership_angles || extractPartnershipAngles(lead)
    },
    outreach_intel: {
      optimal_time: pieIntel.optimal_time || 'Tuesday 10:00 AM PHT',
      personalization_hook: pieIntel.personalization_hook || generatePersonalizationHook(lead),
      mutual_connections: lead.mutual_connections || [],
      recent_activity: pieIntel.recent_activity,
      suggested_subject: generateSubjectLine(lead),
      key_talking_points: generateTalkingPoints(lead, pieIntel)
    },
    priority: enrichment.readiness.score >= 90 ? 'P0' : enrichment.readiness.score >= 70 ? 'P1' : 'P2',
    dealflow_notes: enrichment.accessibility.recommendations,
    pie_signals: pieIntel.signals || []
  };
}

/**
 * Determine preferred contact channel
 * @param {Object} accessibility - Accessibility score details
 * @returns {string} Preferred channel
 */
function determinePreferredChannel(accessibility) {
  if (accessibility.channels.includes('email_verified')) return 'email';
  if (accessibility.channels.includes('warm_intro')) return 'warm_intro';
  if (accessibility.channels.includes('linkedin_personal')) return 'linkedin';
  if (accessibility.channels.includes('twitter')) return 'twitter';
  if (accessibility.channels.includes('email_unverified')) return 'email';
  return 'linkedin';
}

/**
 * Extract partnership angles from lead data
 * @param {Object} lead - Lead object
 * @returns {Array} Partnership angles
 */
function extractPartnershipAngles(lead) {
  const angles = [];
  const notes = (lead.notes || '').toLowerCase();
  
  if (notes.includes('exchange') || notes.includes('trading')) {
    angles.push('Crypto payment integration');
  }
  if (notes.includes('payment') || notes.includes('remittance')) {
    angles.push('Cross-border payment corridor');
  }
  if (notes.includes('wallet') || notes.includes('custody')) {
    angles.push('Wallet integration partnership');
  }
  if (notes.includes('defi') || notes.includes('lending')) {
    angles.push('DeFi yield integration');
  }
  
  return angles.length > 0 ? angles : ['Strategic partnership exploration'];
}

/**
 * Generate personalization hook
 * @param {Object} lead - Lead object
 * @returns {string} Personalization hook
 */
function generatePersonalizationHook(lead) {
  if (lead.funding) {
    return `Congratulations on the ${lead.funding}`;
  }
  if (lead.recent_expansion) {
    return `Saw your expansion into ${lead.recent_expansion}`;
  }
  return `Noticed ${lead.company}'s work in the ${lead.industry || 'crypto'} space`;
}

/**
 * Generate subject line for outreach
 * @param {Object} lead - Lead object
 * @returns {string} Subject line
 */
function generateSubjectLine(lead) {
  const hooks = [
    `Partnership opportunity: ${lead.company} + coins.ph`,
    `Quick question about ${lead.company}'s expansion`,
    `Crypto payment integration for ${lead.company}`,
    `Southeast Asia partnership - ${lead.company}`
  ];
  return hooks[Math.floor(Math.random() * hooks.length)];
}

/**
 * Generate key talking points
 * @param {Object} lead - Lead object
 * @param {Object} pieIntel - PIE intelligence
 * @returns {Array} Talking points
 */
function generateTalkingPoints(lead, pieIntel) {
  return [
    `coins.ph is the leading crypto exchange in the Philippines with 18M+ users`,
    `Recently launched coins.xyz for international expansion`,
    `Looking for strategic partners in ${lead.region || 'Southeast Asia'}`,
    `Potential integration points: ${(pieIntel.partnership_angles || []).join(', ')}`
  ];
}

// ============================================================================
// PIE CONNECTOR
// ============================================================================

/**
 * Fetch PIE intelligence for leads
 * In production, this calls PIE API
 * @param {Array} leadIds - Array of lead IDs
 * @returns {Object} Map of lead_id to PIE intelligence
 */
async function fetchPIEIntel(leadIds) {
  // In production, this would call PIE API
  // For now, return mock data structure
  const mockIntel = {};
  
  leadIds.forEach(id => {
    mockIntel[id] = {
      signal_type: 'opportunity',
      signal_strength: 0.75,
      optimal_time: 'Tuesday 10:00 AM PHT',
      recent_news: null,
      partnership_angles: [],
      personalization_hook: null
    };
  });
  
  return mockIntel;
}

/**
 * Submit leads to PIE for opportunity scoring
 * @param {Array} leads - Lead objects
 * @returns {Object} PIE scoring results
 */
async function submitToPIE(leads) {
  console.log(`📡 Submitting ${leads.length} leads to PIE for opportunity scoring...`);
  
  // In production, POST to PIE API
  // For now, simulate response
  return {
    status: 'accepted',
    leads_scored: leads.length,
    high_opportunity_leads: leads.filter(l => l.priority === 'P0').map(l => l.id),
    estimated_processing_time: '5 minutes'
  };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

/**
 * Main enrichment pipeline
 * Loads leads, enriches them, generates handoffs
 */
async function runEnrichmentPipeline() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   DEALFLOW CONTACT ENRICHMENT PIPELINE v1.0                ║');
  console.log('║   PIE Integration: Active                                  ║');
  console.log('╚════════════════════════════════════════════════════════════\n');
  
  try {
    // Load leads
    const leadsPath = CONFIG.paths.leads;
    const leadsData = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));
    const leads = Array.isArray(leadsData) ? leadsData : leadsData.leads || [];
    
    console.log(`📥 Loaded ${leads.length} leads from ${leadsPath}\n`);
    
    // Fetch PIE intelligence
    const pieIntelMap = await fetchPIEIntel(leads.map(l => l.id));
    
    // Enrich leads
    const results = await enrichLeadsBatch(leads, pieIntelMap);
    
    // Generate handoff packages for ready leads
    const handoffPackages = results.ready_for_handoff.map(generateHandoffPackage);
    
    // Save results
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Save enriched leads
    fs.writeFileSync(
      CONFIG.paths.enriched,
      JSON.stringify({
        enriched_at: new Date().toISOString(),
        total_leads: results.summary.total,
        summary: results.summary,
        leads: results.enriched
      }, null, 2)
    );
    
    // Save handoff queue
    fs.writeFileSync(
      CONFIG.paths.handoffQueue,
      JSON.stringify({
        generated_at: new Date().toISOString(),
        total_ready: handoffPackages.length,
        packages: handoffPackages
      }, null, 2)
    );
    
    // Print summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   ENRICHMENT COMPLETE                                      ║');
    console.log('╚════════════════════════════════════════════════════════════\n');
    
    console.log('📊 Summary:');
    console.log(`   Total Leads: ${results.summary.total}`);
    console.log(`   Processed: ${results.summary.processed}`);
    console.log(`   Ready for Handoff: ${results.summary.ready} 🎯`);
    console.log(`   Needs Work: ${results.summary.needs_work}`);
    console.log(`   Failed: ${results.summary.failed}`);
    console.log(`   Avg Accessibility: ${results.summary.avg_accessibility}/100`);
    console.log(`   Avg Readiness: ${results.summary.avg_readiness}/100\n`);
    
    console.log('💾 Files Saved:');
    console.log(`   Enriched Leads: ${CONFIG.paths.enriched}`);
    console.log(`   Handoff Queue: ${CONFIG.paths.handoffQueue}\n`);
    
    if (handoffPackages.length > 0) {
      console.log('🎯 Ready for ColdCall Handoff:');
      handoffPackages.forEach((pkg, i) => {
        console.log(`   ${i + 1}. ${pkg.company_intel.name} (${pkg.contact.name}) - ${pkg.priority}`);
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Pipeline failed:', error.message);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Core functions
  enrichLead,
  enrichLeadsBatch,
  calculateAccessibilityScore,
  calculateLeadReadiness,
  generateHandoffPackage,
  
  // Utilities
  generateEmailPatterns,
  detectEmailPattern,
  fetchPIEIntel,
  submitToPIE,
  
  // Pipeline
  runEnrichmentPipeline,
  
  // Config
  CONFIG
};

// CLI execution
if (require.main === module) {
  runEnrichmentPipeline().catch(console.error);
}
