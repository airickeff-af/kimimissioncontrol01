/**
 * Lead Enrichment Module
 * Combines email discovery, social discovery, and verification
 * One-stop solution for enriching lead contact data
 * 
 * Usage:
 *   const { enrichLead, enrichLeadsBatch } = require('./lead-enricher');
 *   const enriched = await enrichLead({ name: 'John Doe', company: 'Acme', domain: 'acme.com' });
 */

const { findEmail, verifyEmail, batchFindEmails } = require('./email-finder');
const { findSocialProfiles, verifySocialProfile, batchFindAndVerify } = require('./social-finder');

/**
 * Enrich a single lead with email and social data
 * @param {Object} lead - Lead data
 * @param {string} lead.name - Full name
 * @param {string} lead.company - Company name
 * @param {string} lead.domain - Company domain
 * @param {string} [lead.title] - Job title
 * @param {Object} options - Enrichment options
 * @returns {Promise<Object>} Enriched lead data
 */
async function enrichLead(lead, options = {}) {
  const {
    findEmail: shouldFindEmail = true,
    findSocial = true,
    verifyData = true,
    timeoutMs = 30000
  } = options;

  const startTime = Date.now();
  
  const result = {
    original: lead,
    enriched: {
      name: lead.name,
      company: lead.company,
      domain: lead.domain,
      title: lead.title
    },
    email: null,
    social: null,
    verification: {
      email: null,
      social: null
    },
    confidence: 0,
    completeness: 0,
    enrichmentTime: 0,
    suggestions: [],
    enrichedAt: new Date().toISOString()
  };

  try {
    const [firstName, ...lastParts] = (lead.name || '').split(' ');
    const lastName = lastParts.join(' ');

    // Parallel enrichment
    const enrichmentTasks = [];

    // Email discovery
    if (shouldFindEmail && lead.domain && firstName && lastName) {
      enrichmentTasks.push(
        findEmail({ firstName, lastName, domain: lead.domain }, { timeoutMs })
          .then(emailResult => {
            result.email = emailResult;
            
            // Verify if found
            if (verifyData && emailResult.verified) {
              return verifyEmail(emailResult.verified.email)
                .then(v => { result.verification.email = v; });
            }
          })
          .catch(err => result.suggestions.push(`Email discovery failed: ${err.message}`))
      );
    }

    // Social discovery
    if (findSocial) {
      enrichmentTasks.push(
        findSocialProfiles({ 
          name: lead.name, 
          company: lead.company,
          title: lead.title 
        }, { timeoutMs })
          .then(socialResult => {
            result.social = socialResult;
            
            // Verify found profiles
            if (verifyData && socialResult.profiles) {
              const verificationTasks = Object.entries(socialResult.profiles)
                .map(([platform, profile]) => 
                  verifySocialProfile(platform, profile.handle || profile.identifier)
                    .then(v => {
                      result.verification.social = result.verification.social || {};
                      result.verification.social[platform] = v;
                    })
                );
              return Promise.all(verificationTasks);
            }
          })
          .catch(err => result.suggestions.push(`Social discovery failed: ${err.message}`))
      );
    }

    await Promise.all(enrichmentTasks);

    // Calculate confidence
    let confidence = 0;
    let factors = 0;

    if (result.email?.verified) {
      confidence += result.email.confidence * 0.4;
      factors++;
    } else if (result.email?.bestGuess) {
      confidence += result.email.confidence * 0.2;
      factors++;
    }

    if (result.social?.confidence) {
      confidence += result.social.confidence * 0.4;
      factors++;
    }

    result.confidence = factors > 0 ? Math.round(confidence / factors) : 0;

    // Calculate completeness
    const hasEmail = !!result.email?.verified?.valid;
    const hasLinkedIn = !!result.social?.profiles?.linkedin;
    const hasTwitter = !!result.social?.profiles?.twitter;
    const hasGithub = !!result.social?.profiles?.github;
    
    result.completeness = [hasEmail, hasLinkedIn, hasTwitter, hasGithub]
      .filter(Boolean).length * 25;

    // Quality rating
    if (result.confidence >= 80) {
      result.quality = 'high';
    } else if (result.confidence >= 60) {
      result.quality = 'medium';
    } else if (result.confidence >= 40) {
      result.quality = 'low';
    } else {
      result.quality = 'insufficient';
    }

    result.enrichmentTime = Date.now() - startTime;

  } catch (error) {
    result.error = error.message;
    result.suggestions.push(`Enrichment error: ${error.message}`);
  }

  return result;
}

/**
 * Batch enrich multiple leads
 * @param {Array<Object>} leads - Array of lead objects
 * @param {Object} options - Enrichment options
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array>} Enriched leads
 */
async function enrichLeadsBatch(leads, options = {}, onProgress) {
  const { concurrency = 3, delayMs = 1000 } = options;
  const results = [];

  for (let i = 0; i < leads.length; i += concurrency) {
    const batch = leads.slice(i, i + concurrency);
    
    const batchResults = await Promise.all(
      batch.map(lead => enrichLead(lead, options))
    );
    
    results.push(...batchResults);

    if (onProgress) {
      onProgress({
        completed: results.length,
        total: leads.length,
        percent: Math.round((results.length / leads.length) * 100),
        currentBatch: batchResults
      });
    }

    if (delayMs > 0 && i + concurrency < leads.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return results;
}

/**
 * Get enrichment summary statistics
 */
function getEnrichmentSummary(results) {
  const total = results.length;
  
  const withEmail = results.filter(r => r.email?.verified?.valid).length;
  const withLinkedIn = results.filter(r => r.social?.profiles?.linkedin).length;
  const withTwitter = results.filter(r => r.social?.profiles?.twitter).length;
  const withGithub = results.filter(r => r.social?.profiles?.github).length;
  
  const byQuality = {
    high: results.filter(r => r.quality === 'high').length,
    medium: results.filter(r => r.quality === 'medium').length,
    low: results.filter(r => r.quality === 'low').length,
    insufficient: results.filter(r => r.quality === 'insufficient').length
  };

  const avgConfidence = Math.round(
    results.reduce((sum, r) => sum + r.confidence, 0) / total
  );

  const avgCompleteness = Math.round(
    results.reduce((sum, r) => sum + r.completeness, 0) / total
  );

  const avgTime = Math.round(
    results.reduce((sum, r) => sum + r.enrichmentTime, 0) / total
  );

  return {
    total,
    withEmail,
    emailRate: Math.round((withEmail / total) * 100),
    withLinkedIn,
    linkedinRate: Math.round((withLinkedIn / total) * 100),
    withTwitter,
    twitterRate: Math.round((withTwitter / total) * 100),
    withGithub,
    githubRate: Math.round((withGithub / total) * 100),
    byQuality,
    averageConfidence: avgConfidence,
    averageCompleteness: avgCompleteness,
    averageTimeMs: avgTime
  };
}

/**
 * Filter leads by enrichment quality
 */
function filterByQuality(results, minQuality = 'medium') {
  const qualityOrder = { high: 4, medium: 3, low: 2, insufficient: 1 };
  const minLevel = qualityOrder[minQuality] || 3;
  
  return results.filter(r => qualityOrder[r.quality] >= minLevel);
}

/**
 * Sort leads by confidence score
 */
function sortByConfidence(results) {
  return [...results].sort((a, b) => b.confidence - a.confidence);
}

/**
 * Export enriched leads to various formats
 */
function exportLeads(results, format = 'json') {
  switch (format) {
    case 'json':
      return JSON.stringify(results, null, 2);
    
    case 'csv':
      const headers = ['Name', 'Company', 'Domain', 'Email', 'Email Confidence', 
                      'LinkedIn', 'Twitter', 'GitHub', 'Overall Confidence', 'Quality'];
      
      const rows = results.map(r => [
        r.enriched.name,
        r.enriched.company,
        r.enriched.domain,
        r.email?.verified?.email || r.email?.bestGuess?.email || '',
        r.email?.confidence || 0,
        r.social?.profiles?.linkedin?.handle || '',
        r.social?.profiles?.twitter?.handle || '',
        r.social?.profiles?.github?.handle || '',
        r.confidence,
        r.quality
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
      
      return [headers.join(','), ...rows].join('\n');
    
    case 'summary':
      return getEnrichmentSummary(results);
    
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

module.exports = {
  // Main functions
  enrichLead,
  enrichLeadsBatch,
  
  // Analysis
  getEnrichmentSummary,
  filterByQuality,
  sortByConfidence,
  exportLeads
};

// CLI usage
if (require.main === module) {
  const fs = require('fs');
  const path = process.argv[2];

  if (!path) {
    console.log('Usage: node lead-enricher.js <leads.json>');
    console.log('');
    console.log('Example leads.json:');
    console.log(JSON.stringify([{
      name: 'John Doe',
      company: 'Acme Inc',
      domain: 'acme.com',
      title: 'CEO'
    }], null, 2));
    process.exit(1);
  }

  const leads = JSON.parse(fs.readFileSync(path, 'utf8'));
  
  console.log(`Enriching ${leads.length} leads...\n`);

  enrichLeadsBatch(leads, {}, (progress) => {
    console.log(`Progress: ${progress.completed}/${progress.total} (${progress.percent}%)`);
  })
    .then(results => {
      console.log('\n=== ENRICHMENT SUMMARY ===');
      console.log(JSON.stringify(getEnrichmentSummary(results), null, 2));
      
      console.log('\n=== CSV EXPORT ===');
      console.log(exportLeads(results, 'csv'));
      
      console.log('\n=== FULL RESULTS ===');
      console.log(JSON.stringify(results, null, 2));
    })
    .catch(console.error);
}
