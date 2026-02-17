/**
 * Social Media Verification Module
 * Validates social media profiles and checks activity/status
 * 
 * Usage:
 *   const { verifyTwitter, verifyLinkedIn, verifyAllSocial } = require('./social-verifier');
 *   const result = await verifyTwitter('@username');
 */

const https = require('https');
const http = require('http');

// Request helper with timeout
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const { timeoutMs = 10000, headers = {} } = options;
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.get(url, { 
      timeout: timeoutMs,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ 
        status: res.statusCode, 
        headers: res.headers,
        body: data 
      }));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Verify Twitter/X profile
 * @param {string} handle - Twitter handle (with or without @)
 * @returns {Promise<Object>} Verification result
 */
async function verifyTwitter(handle) {
  const cleanHandle = handle.replace(/^@/, '').trim();
  const result = {
    platform: 'twitter',
    handle: cleanHandle,
    valid: false,
    exists: false,
    active: false,
    score: 0,
    url: `https://twitter.com/${cleanHandle}`,
    checks: {},
    suggestions: [],
    verifiedAt: new Date().toISOString()
  };

  try {
    // Check profile existence via public page
    const response = await fetch(result.url);
    
    result.checks.pageExists = response.status === 200;
    result.checks.notSuspended = !response.body.includes('suspended');
    result.checks.notProtected = !response.body.includes('protected');

    if (response.status === 404) {
      result.suggestions.push('Profile not found - handle may be incorrect');
      return result;
    }

    if (response.status === 302 || response.status === 301) {
      // Redirect often means suspended or doesn't exist
      result.suggestions.push('Profile redirected - may be suspended or renamed');
      return result;
    }

    if (response.body.includes('suspended')) {
      result.suggestions.push('Account is suspended');
      return result;
    }

    result.exists = true;
    result.score += 40;

    // Analyze profile content for activity indicators
    const body = response.body.toLowerCase();
    
    // Check for recent activity indicators
    const hasBio = body.includes('description') || body.includes('bio');
    const hasTweets = body.includes('tweet') || body.includes('post');
    const hasFollowers = body.match(/(\d+[km]?)\s*followers/i);
    
    result.checks.hasBio = hasBio;
    result.checks.hasTweets = hasTweets;
    result.checks.hasFollowers = !!hasFollowers;

    if (hasBio) result.score += 15;
    if (hasTweets) result.score += 20;
    if (hasFollowers) {
      result.score += 15;
      const followerMatch = hasFollowers[1];
      result.followerCount = followerMatch;
    }

    // Check for verification badge indicators
    result.checks.verified = body.includes('verified') || 
                             body.includes('bluecheck');
    if (result.checks.verified) result.score += 10;

    // Activity assessment
    result.active = hasTweets && hasFollowers;
    if (result.active) result.score += 10;

    result.valid = result.score >= 60;

  } catch (error) {
    result.error = error.message;
    result.suggestions.push(`Verification failed: ${error.message}`);
  }

  return result;
}

/**
 * Verify LinkedIn profile
 * @param {string} identifier - LinkedIn URL or profile identifier
 * @returns {Promise<Object>} Verification result
 */
async function verifyLinkedIn(identifier) {
  // Normalize input
  let url;
  if (identifier.includes('linkedin.com')) {
    url = identifier;
  } else if (identifier.startsWith('in/')) {
    url = `https://www.linkedin.com/${identifier}`;
  } else {
    url = `https://www.linkedin.com/in/${identifier}`;
  }

  const result = {
    platform: 'linkedin',
    identifier,
    valid: false,
    exists: false,
    active: false,
    score: 0,
    url,
    checks: {},
    suggestions: [],
    verifiedAt: new Date().toISOString()
  };

  try {
    const response = await fetch(url);
    
    result.checks.pageExists = response.status === 200;
    result.checks.notRestricted = !response.body.includes('authwall');

    if (response.status === 404 || response.status === 999) {
      result.suggestions.push('Profile not found - may not exist or be private');
      return result;
    }

    if (response.body.includes('authwall') || response.body.includes('sign in')) {
      result.suggestions.push('Profile requires login - likely exists but is private');
      result.checks.requiresAuth = true;
      result.score += 30; // Partial credit
      return result;
    }

    result.exists = true;
    result.score += 40;

    const body = response.body.toLowerCase();

    // Profile completeness indicators
    result.checks.hasPhoto = body.includes('profile-photo') || 
                             body.includes('artdeco-entity-lockup');
    result.checks.hasHeadline = body.includes('headline') || 
                                body.includes('subtitle');
    result.checks.hasExperience = body.includes('experience') || 
                                  body.includes('positions');
    result.checks.hasConnections = body.includes('connections');

    if (result.checks.hasPhoto) result.score += 15;
    if (result.checks.hasHeadline) result.score += 15;
    if (result.checks.hasExperience) result.score += 15;
    if (result.checks.hasConnections) result.score += 10;

    // Premium indicator
    result.checks.premium = body.includes('premium');
    if (result.checks.premium) result.score += 5;

    result.active = result.checks.hasExperience && 
                   (result.checks.hasPhoto || result.checks.hasHeadline);
    
    result.valid = result.score >= 60;

  } catch (error) {
    result.error = error.message;
    result.suggestions.push(`Verification failed: ${error.message}`);
  }

  return result;
}

/**
 * Verify GitHub profile
 * @param {string} username - GitHub username
 * @returns {Promise<Object>} Verification result
 */
async function verifyGitHub(username) {
  const cleanUsername = username.trim();
  const result = {
    platform: 'github',
    username: cleanUsername,
    valid: false,
    exists: false,
    active: false,
    score: 0,
    url: `https://github.com/${cleanUsername}`,
    checks: {},
    suggestions: [],
    verifiedAt: new Date().toISOString()
  };

  try {
    const response = await fetch(result.url);
    
    result.checks.pageExists = response.status === 200;

    if (response.status === 404) {
      result.suggestions.push('Profile not found');
      return result;
    }

    if (response.status === 451) {
      result.suggestions.push('Profile unavailable (DMCA or legal)');
      return result;
    }

    result.exists = true;
    result.score += 40;

    const body = response.body.toLowerCase();

    // Activity indicators
    result.checks.hasRepos = body.includes('repositories') || 
                             body.match(/\d+\s*repositor/i);
    result.checks.hasContributions = body.includes('contribution') || 
                                     body.includes('activity');
    result.checks.hasBio = body.includes('bio') || 
                           body.includes('user-profile-bio');
    result.checks.hasAvatar = !body.includes('default-avatar');

    if (result.checks.hasRepos) result.score += 20;
    if (result.checks.hasContributions) result.score += 20;
    if (result.checks.hasBio) result.score += 10;
    if (result.checks.hasAvatar) result.score += 10;

    // Pro/Organization indicators
    result.checks.isPro = body.includes('pro badge');
    result.checks.isOrg = body.includes('organization');

    result.active = result.checks.hasRepos || result.checks.hasContributions;
    result.valid = result.score >= 60;

  } catch (error) {
    result.error = error.message;
    result.suggestions.push(`Verification failed: ${error.message}`);
  }

  return result;
}

/**
 * Verify all social profiles for a lead
 * @param {Object} socialProfiles - Object with platform keys
 * @returns {Promise<Object>} Combined verification results
 */
async function verifyAllSocial(socialProfiles) {
  const results = {
    platforms: {},
    summary: {
      total: 0,
      valid: 0,
      active: 0,
      averageScore: 0
    },
    verifiedAt: new Date().toISOString()
  };

  const checks = [];

  if (socialProfiles.twitter) {
    checks.push(verifyTwitter(socialProfiles.twitter).then(r => {
      results.platforms.twitter = r;
    }));
  }

  if (socialProfiles.linkedin) {
    checks.push(verifyLinkedIn(socialProfiles.linkedin).then(r => {
      results.platforms.linkedin = r;
    }));
  }

  if (socialProfiles.github) {
    checks.push(verifyGitHub(socialProfiles.github).then(r => {
      results.platforms.github = r;
    }));
  }

  await Promise.all(checks);

  // Calculate summary
  const platformResults = Object.values(results.platforms);
  results.summary.total = platformResults.length;
  results.summary.valid = platformResults.filter(p => p.valid).length;
  results.summary.active = platformResults.filter(p => p.active).length;
  results.summary.averageScore = platformResults.length > 0
    ? Math.round(platformResults.reduce((sum, p) => sum + p.score, 0) / platformResults.length)
    : 0;

  return results;
}

/**
 * Batch verify multiple social profiles
 * @param {Array<Object>} leads - Array of leads with social profiles
 * @param {Object} options - Options
 * @returns {Promise<Array>} Verification results for each lead
 */
async function batchVerifySocial(leads, options = {}) {
  const { concurrency = 3, delayMs = 500 } = options;
  const results = [];

  for (let i = 0; i < leads.length; i += concurrency) {
    const batch = leads.slice(i, i + concurrency);
    
    const batchResults = await Promise.all(
      batch.map(lead => verifyAllSocial({
        twitter: lead.twitter,
        linkedin: lead.linkedin,
        github: lead.github
      }).then(result => ({
        leadId: lead.id || lead.name,
        ...result
      })))
    );

    results.push(...batchResults);

    if (delayMs > 0 && i + concurrency < leads.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return results;
}

/**
 * Get social verification summary for reporting
 */
function getSocialSummary(allResults) {
  const platformStats = {
    twitter: { total: 0, valid: 0, active: 0 },
    linkedin: { total: 0, valid: 0, active: 0 },
    github: { total: 0, valid: 0, active: 0 }
  };

  for (const result of allResults) {
    for (const [platform, data] of Object.entries(result.platforms)) {
      if (platformStats[platform]) {
        platformStats[platform].total++;
        if (data.valid) platformStats[platform].valid++;
        if (data.active) platformStats[platform].active++;
      }
    }
  }

  return {
    leadsChecked: allResults.length,
    platformStats,
    overall: {
      validRate: Math.round(
        (allResults.filter(r => r.summary.valid > 0).length / allResults.length) * 100
      )
    }
  };
}

module.exports = {
  verifyTwitter,
  verifyLinkedIn,
  verifyGitHub,
  verifyAllSocial,
  batchVerifySocial,
  getSocialSummary
};

// CLI usage
if (require.main === module) {
  const [platform, identifier] = process.argv.slice(2);
  
  if (!platform || !identifier) {
    console.log('Usage: node social-verifier.js <twitter|linkedin|github> <handle>');
    process.exit(1);
  }

  const verifyFn = { twitter: verifyTwitter, linkedin: verifyLinkedIn, github: verifyGitHub }[platform];
  
  if (!verifyFn) {
    console.log('Platform must be: twitter, linkedin, or github');
    process.exit(1);
  }

  verifyFn(identifier)
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(console.error);
}
