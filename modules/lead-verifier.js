/**
 * Lead Verification Integration Module
 * Combines email and social verification for DealFlow lead generation
 * 
 * Usage:
 *   const { verifyLead, verifyLeadBatch, enrichLeadData } = require('./lead-verifier');
 *   const verified = await verifyLead(lead);
 */

const { verifyEmail, batchVerifyEmails, generateEmailPatterns } = require('./email-verifier');
const { verifyAllSocial, batchVerifySocial } = require('./social-verifier');

/**
 * Verify a single lead comprehensively
 * @param {Object} lead - Lead object with email and/or social profiles
 * @param {Object} options - Verification options
 * @returns {Promise<Object>} Complete verification result
 */
async function verifyLead(lead, options = {}) {
  const {
    verifyEmail: doEmail = true,
    verifySocial: doSocial = true,
    generatePatterns = true
  } = options;

  const result = {
    leadId: lead.id || lead.name || 'unknown',
    name: lead.name,
    company: lead.company,
    verifiedAt: new Date().toISOString(),
    email: null,
    social: null,
    overallScore: 0,
    trustLevel: 'unknown', // high, medium, low, unknown
    recommendations: []
  };

  // Email verification
  if (doEmail && lead.email) {
    result.email = await verifyEmail(lead.email, {
      checkSyntax: true,
      checkDisposable: true,
      checkRoleBased: true,
      checkMX: true,
      checkSMTP: false
    });

    if (!result.email.valid) {
      result.recommendations.push('Email verification failed - consider alternative contact method');
    }
    if (result.email.checks.roleBased === false) {
      result.recommendations.push('Role-based email detected - try to find personal email');
    }
  }

  // Generate email patterns if no email but have name + domain
  if (generatePatterns && !lead.email && lead.firstName && lead.lastName && lead.domain) {
    result.generatedEmails = generateEmailPatterns(
      lead.firstName,
      lead.lastName,
      lead.domain
    );
    result.recommendations.push(`No email found - try patterns: ${result.generatedEmails.slice(0, 3).join(', ')}`);
  }

  // Social verification
  if (doSocial) {
    result.social = await verifyAllSocial({
      twitter: lead.twitter || lead.twitterHandle,
      linkedin: lead.linkedin || lead.linkedinUrl,
      github: lead.github || lead.githubUsername
    });

    if (result.social.summary.valid === 0 && result.social.summary.total > 0) {
      result.recommendations.push('No valid social profiles found - verify handles manually');
    }
  }

  // Calculate overall score
  let score = 0;
  let factors = 0;

  if (result.email) {
    score += result.email.score * 0.4; // 40% weight
    factors++;
  }
  if (result.social) {
    score += result.social.summary.averageScore * 0.4; // 40% weight
    factors++;
  }
  // Company presence (20% weight - assumed if provided)
  if (lead.company) {
    score += 20;
  }

  result.overallScore = Math.round(score);

  // Determine trust level
  if (result.overallScore >= 80) {
    result.trustLevel = 'high';
  } else if (result.overallScore >= 60) {
    result.trustLevel = 'medium';
  } else if (result.overallScore >= 40) {
    result.trustLevel = 'low';
  } else {
    result.trustLevel = 'unknown';
  }

  // Final recommendations based on trust level
  if (result.trustLevel === 'high') {
    result.recommendations.unshift('✅ High confidence - proceed with outreach');
  } else if (result.trustLevel === 'medium') {
    result.recommendations.unshift('⚠️ Medium confidence - verify before major investment');
  } else if (result.trustLevel === 'low') {
    result.recommendations.unshift('❌ Low confidence - find alternative contacts or verify manually');
  }

  return result;
}

/**
 * Verify a batch of leads
 * @param {Array<Object>} leads - Array of lead objects
 * @param {Object} options - Options
 * @returns {Promise<Array>} Verification results
 */
async function verifyLeadBatch(leads, options = {}) {
  const { 
    concurrency = 5,
    onProgress = null 
  } = options;

  const results = [];
  
  for (let i = 0; i < leads.length; i += concurrency) {
    const batch = leads.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(lead => verifyLead(lead, options))
    );
    
    results.push(...batchResults);
    
    if (onProgress) {
      onProgress({
        completed: results.length,
        total: leads.length,
        percent: Math.round((results.length / leads.length) * 100)
      });
    }
  }

  return results;
}

/**
 * Enrich lead data with verification results
 * Adds verification metadata to existing lead object
 */
async function enrichLeadData(lead, options = {}) {
  const verification = await verifyLead(lead, options);
  
  return {
    ...lead,
    _verification: {
      score: verification.overallScore,
      trustLevel: verification.trustLevel,
      emailValid: verification.email?.valid || false,
      emailScore: verification.email?.score || 0,
      socialValid: verification.social?.summary.valid || 0,
      socialScore: verification.social?.summary.averageScore || 0,
      verifiedAt: verification.verifiedAt,
      recommendations: verification.recommendations
    }
  };
}

/**
 * Get batch verification summary
 */
function getBatchSummary(results) {
  const total = results.length;
  const byTrustLevel = {
    high: results.filter(r => r.trustLevel === 'high').length,
    medium: results.filter(r => r.trustLevel === 'medium').length,
    low: results.filter(r => r.trustLevel === 'low').length,
    unknown: results.filter(r => r.trustLevel === 'unknown').length
  };

  const avgScore = Math.round(
    results.reduce((sum, r) => sum + r.overallScore, 0) / total
  );

  const withValidEmail = results.filter(r => r.email?.valid).length;
  const withValidSocial = results.filter(r => r.social?.summary.valid > 0).length;

  return {
    total,
    byTrustLevel,
    percentages: {
      high: Math.round((byTrustLevel.high / total) * 100),
      medium: Math.round((byTrustLevel.medium / total) * 100),
      low: Math.round((byTrustLevel.low / total) * 100),
      unknown: Math.round((byTrustLevel.unknown / total) * 100)
    },
    averageScore: avgScore,
    validEmailRate: Math.round((withValidEmail / total) * 100),
    validSocialRate: Math.round((withValidSocial / total) * 100),
    readyForOutreach: byTrustLevel.high + byTrustLevel.medium
  };
}

/**
 * Filter leads by quality threshold
 */
function filterLeadsByQuality(results, minScore = 60) {
  return results.filter(r => r.overallScore >= minScore);
}

/**
 * Sort leads by quality (highest first)
 */
function sortLeadsByQuality(results) {
  return [...results].sort((a, b) => b.overallScore - a.overallScore);
}

module.exports = {
  verifyLead,
  verifyLeadBatch,
  enrichLeadData,
  getBatchSummary,
  filterLeadsByQuality,
  sortLeadsByQuality
};

// CLI usage
if (require.main === module) {
  const fs = require('fs');
  const path = process.argv[2];

  if (!path) {
    console.log('Usage: node lead-verifier.js <leads.json>');
    console.log('');
    console.log('Example leads.json:');
    console.log(JSON.stringify([{
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Example Inc',
      twitter: '@johndoe',
      linkedin: 'johndoe'
    }], null, 2));
    process.exit(1);
  }

  const leads = JSON.parse(fs.readFileSync(path, 'utf8'));
  
  console.log(`Verifying ${leads.length} leads...\n`);

  verifyLeadBatch(leads, {
    onProgress: (p) => console.log(`Progress: ${p.completed}/${p.total} (${p.percent}%)`)
  })
    .then(results => {
      console.log('\n=== SUMMARY ===');
      console.log(JSON.stringify(getBatchSummary(results), null, 2));
      console.log('\n=== DETAILED RESULTS ===');
      console.log(JSON.stringify(results, null, 2));
    })
    .catch(console.error);
}
