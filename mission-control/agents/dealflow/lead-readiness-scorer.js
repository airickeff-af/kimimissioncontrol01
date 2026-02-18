/**
 * Lead Readiness Scorer
 * 
 * Evaluates leads for outreach readiness based on:
 * - Contact completeness (email, LinkedIn, phone)
 * - Research quality (recent news, insights)
 * - Priority level (P0/P1/P2)
 * - Industry fit
 * - Timing signals
 * - Engagement history
 * 
 * @module LeadReadinessScorer
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

class LeadReadinessScorer {
  constructor() {
    this.weights = {
      contactCompleteness: 0.25,
      researchQuality: 0.20,
      priorityLevel: 0.20,
      industryFit: 0.15,
      timingSignals: 0.10,
      engagementHistory: 0.10
    };
    
    this.industryScores = {
      'Exchange': 100,
      'Payment Processor': 95,
      'DeFi Protocol': 90,
      'GameFi/NFT': 85,
      'Infrastructure': 80,
      'Fintech': 85,
      'Bank': 90,
      'Other': 60
    };
  }

  /**
   * Calculate contact completeness score (0-100)
   * @param {Object} lead - Lead object
   * @returns {number} Score 0-100
   */
  calculateContactScore(lead) {
    let score = 0;
    let maxScore = 0;
    
    // Email (40 points)
    maxScore += 40;
    if (lead.email) {
      score += 40;
      if (lead.email_verified) {
        score += 10; // Bonus for verified
      }
    }
    
    // LinkedIn (25 points)
    maxScore += 25;
    if (lead.linkedin) {
      score += 15;
    }
    if (lead.linkedin_personal) {
      score += 10;
    }
    
    // Twitter (10 points)
    maxScore += 10;
    if (lead.twitter) {
      score += 10;
    }
    
    // Phone (15 points)
    maxScore += 15;
    if (lead.phone) {
      score += 15;
    }
    
    // Telegram (10 points)
    maxScore += 10;
    if (lead.telegram) {
      score += 10;
    }
    
    return Math.round((score / maxScore) * 100);
  }

  /**
   * Calculate research quality score (0-100)
   * @param {Object} lead - Lead object
   * @returns {number} Score 0-100
   */
  calculateResearchScore(lead) {
    let score = 0;
    
    // Has notes/research (40 points)
    if (lead.notes && lead.notes.length > 50) {
      score += 40;
    } else if (lead.notes) {
      score += 20;
    }
    
    // Has research sources (30 points)
    if (lead.research_sources && lead.research_sources.length > 0) {
      score += Math.min(30, lead.research_sources.length * 10);
    }
    
    // Recent research (20 points)
    if (lead.last_researched) {
      const daysSince = Math.floor(
        (Date.now() - new Date(lead.last_researched).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince <= 7) {
        score += 20;
      } else if (daysSince <= 30) {
        score += 10;
      }
    }
    
    // Has recent news signal (10 points)
    if (lead.notes && this.hasRecentNewsSignal(lead.notes)) {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  /**
   * Check if notes contain recent news signals
   * @param {string} notes - Lead notes
   * @returns {boolean}
   */
  hasRecentNewsSignal(notes) {
    const signals = [
      'funding', 'raised', 'series', 'announced', 'launched',
      'expansion', 'partnership', 'acquired', 'merged', 'appointed',
      '2025', '2026', 'recent', 'new', 'just'
    ];
    const lowerNotes = notes.toLowerCase();
    return signals.some(signal => lowerNotes.includes(signal));
  }

  /**
   * Calculate priority level score (0-100)
   * @param {Object} lead - Lead object
   * @returns {number} Score 0-100
   */
  calculatePriorityScore(lead) {
    const priorityMap = {
      'P0': 100,
      'P1': 75,
      'P2': 50,
      'P3': 25
    };
    return priorityMap[lead.priority] || 50;
  }

  /**
   * Calculate industry fit score (0-100)
   * @param {Object} lead - Lead object
   * @returns {number} Score 0-100
   */
  calculateIndustryScore(lead) {
    // Try to determine industry from notes or company name
    const notes = (lead.notes || '').toLowerCase();
    const company = (lead.company || '').toLowerCase();
    
    if (notes.includes('exchange') || company.includes('exchange')) {
      return this.industryScores['Exchange'];
    }
    if (notes.includes('payment') || company.includes('pay')) {
      return this.industryScores['Payment Processor'];
    }
    if (notes.includes('defi') || notes.includes('protocol')) {
      return this.industryScores['DeFi Protocol'];
    }
    if (notes.includes('game') || notes.includes('nft') || notes.includes('gaming')) {
      return this.industryScores['GameFi/NFT'];
    }
    if (notes.includes('bank') || company.includes('bank')) {
      return this.industryScores['Bank'];
    }
    if (notes.includes('fintech') || notes.includes('financial')) {
      return this.industryScores['Fintech'];
    }
    if (notes.includes('infrastructure') || notes.includes('api')) {
      return this.industryScores['Infrastructure'];
    }
    
    return this.industryScores['Other'];
  }

  /**
   * Calculate timing signals score (0-100)
   * @param {Object} lead - Lead object
   * @returns {number} Score 0-100
   */
  calculateTimingScore(lead) {
    let score = 50; // Base score
    const notes = (lead.notes || '').toLowerCase();
    
    // Recent funding (strong signal)
    if (notes.includes('funding') || notes.includes('raised') || notes.includes('series')) {
      score += 30;
    }
    
    // Expansion signals
    if (notes.includes('expansion') || notes.includes('launch') || notes.includes('new market')) {
      score += 20;
    }
    
    // Partnership appetite
    if (notes.includes('partnership') || notes.includes('partner')) {
      score += 15;
    }
    
    // Recent executive change
    if (notes.includes('appointed') || notes.includes('hired') || notes.includes('joined')) {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  /**
   * Calculate engagement history score (0-100)
   * @param {Object} lead - Lead object
   * @returns {number} Score 0-100
   */
  calculateEngagementScore(lead) {
    let score = 50; // Neutral base
    
    // Check for previous outreach
    if (lead.outreach_history && lead.outreach_history.length > 0) {
      const history = lead.outreach_history;
      const lastInteraction = history[history.length - 1];
      
      // Previous positive interaction
      if (lastInteraction.sentiment === 'positive') {
        score = 90;
      }
      // Previous neutral interaction
      else if (lastInteraction.sentiment === 'neutral') {
        score = 70;
      }
      // Previous negative interaction
      else if (lastInteraction.sentiment === 'negative') {
        score = 20;
      }
      
      // Time since last contact
      const daysSince = Math.floor(
        (Date.now() - new Date(lastInteraction.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If contacted recently, reduce score
      if (daysSince < 30) {
        score -= 20;
      } else if (daysSince < 90) {
        score -= 10;
      }
    }
    
    // Warm intro available
    if (lead.warm_intro) {
      score += 20;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate overall readiness score for a lead
   * @param {Object} lead - Lead object
   * @returns {Object} Scoring result with breakdown
   */
  calculateScore(lead) {
    const scores = {
      contactCompleteness: this.calculateContactScore(lead),
      researchQuality: this.calculateResearchScore(lead),
      priorityLevel: this.calculatePriorityScore(lead),
      industryFit: this.calculateIndustryScore(lead),
      timingSignals: this.calculateTimingScore(lead),
      engagementHistory: this.calculateEngagementScore(lead)
    };
    
    // Calculate weighted total
    const totalScore = Math.round(
      scores.contactCompleteness * this.weights.contactCompleteness +
      scores.researchQuality * this.weights.researchQuality +
      scores.priorityLevel * this.weights.priorityLevel +
      scores.industryFit * this.weights.industryFit +
      scores.timingSignals * this.weights.timingSignals +
      scores.engagementHistory * this.weights.engagementHistory
    );
    
    // Determine readiness tier
    let tier, action;
    if (totalScore >= 90) {
      tier = 'ready';
      action = 'Auto-queue for outreach';
    } else if (totalScore >= 70) {
      tier = 'ready_with_prep';
      action = 'Minor preparation needed';
    } else if (totalScore >= 50) {
      tier = 'needs_enrichment';
      action = 'Research and enrich';
    } else {
      tier = 'not_ready';
      action = 'Significant research required';
    }
    
    return {
      leadId: lead.id,
      company: lead.company,
      contact: lead.contact_name,
      totalScore,
      tier,
      action,
      breakdown: scores,
      recommendedTemplate: this.recommendTemplate(lead, totalScore),
      priority: lead.priority,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Recommend template based on lead characteristics
   * @param {Object} lead - Lead object
   * @param {number} score - Readiness score
   * @returns {string} Recommended template
   */
  recommendTemplate(lead, score) {
    if (score >= 90) {
      return 'initial-cold-outreach';
    } else if (score >= 70) {
      return 'initial-cold-outreach';
    }
    return null; // Not ready for outreach
  }

  /**
   * Score multiple leads
   * @param {Array} leads - Array of lead objects
   * @returns {Array} Scored leads
   */
  scoreLeads(leads) {
    return leads.map(lead => this.calculateScore(lead));
  }

  /**
   * Get leads ready for outreach
   * @param {Array} scoredLeads - Array of scored leads
   * @param {number} minScore - Minimum score threshold (default: 70)
   * @returns {Array} Ready leads sorted by score
   */
  getReadyLeads(scoredLeads, minScore = 70) {
    return scoredLeads
      .filter(lead => lead.totalScore >= minScore)
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Generate readiness report
   * @param {Array} scoredLeads - Array of scored leads
   * @returns {Object} Report summary
   */
  generateReport(scoredLeads) {
    const tiers = {
      ready: scoredLeads.filter(l => l.tier === 'ready'),
      ready_with_prep: scoredLeads.filter(l => l.tier === 'ready_with_prep'),
      needs_enrichment: scoredLeads.filter(l => l.tier === 'needs_enrichment'),
      not_ready: scoredLeads.filter(l => l.tier === 'not_ready')
    };
    
    const avgScore = Math.round(
      scoredLeads.reduce((sum, l) => sum + l.totalScore, 0) / scoredLeads.length
    );
    
    return {
      timestamp: new Date().toISOString(),
      totalLeads: scoredLeads.length,
      averageScore: avgScore,
      distribution: {
        ready: tiers.ready.length,
        ready_with_prep: tiers.ready_with_prep.length,
        needs_enrichment: tiers.needs_enrichment.length,
        not_ready: tiers.not_ready.length
      },
      readyLeads: tiers.ready,
      readyWithPrep: tiers.ready_with_prep,
      recommendations: this.generateRecommendations(tiers)
    };
  }

  /**
   * Generate recommendations based on tier distribution
   * @param {Object} tiers - Tier distribution
   * @returns {Array} Recommendations
   */
  generateRecommendations(tiers) {
    const recommendations = [];
    
    if (tiers.ready.length === 0) {
      recommendations.push({
        priority: 'high',
        message: 'No leads are fully ready for outreach. Focus on enriching existing leads.'
      });
    }
    
    if (tiers.ready_with_prep.length > 5) {
      recommendations.push({
        priority: 'medium',
        message: `${tiers.ready_with_prep.length} leads need minor prep. Allocate 2-3 hours to prepare these for outreach.`
      });
    }
    
    if (tiers.needs_enrichment.length > 10) {
      recommendations.push({
        priority: 'medium',
        message: `${tiers.needs_enrichment.length} leads need enrichment. Consider delegating research tasks.`
      });
    }
    
    return recommendations;
  }
}

// Export for use in other modules
module.exports = LeadReadinessScorer;

// CLI usage
if (require.main === module) {
  const scorer = new LeadReadinessScorer();
  
  // Load leads from file
  const leadsPath = process.argv[2] || './leads_complete_26.json';
  
  try {
    const leadsData = fs.readFileSync(leadsPath, 'utf8');
    const leads = JSON.parse(leadsData);
    
    // Score all leads
    const scoredLeads = scorer.scoreLeads(leads);
    
    // Generate report
    const report = scorer.generateReport(scoredLeads);
    
    // Save results
    const outputPath = './readiness-report.json';
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    
    // Console output
    console.log('\n📊 LEAD READINESS REPORT\n');
    console.log(`Total Leads: ${report.totalLeads}`);
    console.log(`Average Score: ${report.averageScore}/100`);
    console.log('\nDistribution:');
    console.log(`  ✅ Ready for Outreach: ${report.distribution.ready}`);
    console.log(`  🟡 Ready with Prep: ${report.distribution.ready_with_prep}`);
    console.log(`  🟠 Needs Enrichment: ${report.distribution.needs_enrichment}`);
    console.log(`  🔴 Not Ready: ${report.distribution.not_ready}`);
    
    if (report.readyLeads.length > 0) {
      console.log('\n🎯 Ready for Outreach:');
      report.readyLeads.forEach(lead => {
        console.log(`  • ${lead.company} (${lead.contact}) - Score: ${lead.totalScore}`);
      });
    }
    
    console.log(`\n✅ Report saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}
