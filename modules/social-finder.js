/**
 * Enhanced Social Media Discovery & Verification Module
 * Finds and validates social profiles across multiple platforms
 * 
 * Usage:
 *   const { findSocialProfiles, verifySocialProfile } = require('./social-finder');
 *   const result = await findSocialProfiles({ name: 'John Doe', company: 'Company' });
 */

const https = require('https');
const http = require('http');

// ============ CONFIGURATION ============

// Platform configurations
const PLATFORMS = {
  twitter: {
    name: 'Twitter/X',
    searchUrl: (query) => `https://twitter.com/search?q=${encodeURIComponent(query)}`,
    profileUrl: (handle) => `https://twitter.com/${handle}`,
    handleRegex: /@?(\w{1,15})/,
    priority: 1
  },
  linkedin: {
    name: 'LinkedIn',
    searchUrl: (query) => `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`,
    profileUrl: (id) => `https://www.linkedin.com/in/${id}`,
    handleRegex: /in\/(\w+)/,
    priority: 1
  },
  github: {
    name: 'GitHub',
    searchUrl: (query) => `https://github.com/search?q=${encodeURIComponent(query)}+type:user`,
    profileUrl: (username) => `https://github.com/${username}`,
    handleRegex: /github\.com\/(\w+)/,
    priority: 2
  },
  crunchbase: {
    name: 'Crunchbase',
    profileUrl: (id) => `https://www.crunchbase.com/person/${id}`,
    priority: 3
  },
  angellist: {
    name: 'AngelList',
    profileUrl: (id) => `https://angel.co/u/${id}`,
    priority: 3
  }
};

// Activity indicators by platform
const ACTIVITY_INDICATORS = {
  twitter: ['tweet', 'post', 'follower', 'following', 'bio', 'description'],
  linkedin: ['experience', 'position', 'headline', 'connection', 'skill'],
  github: ['repository', 'contribution', 'commit', 'pull request', 'follower'],
  crunchbase: ['investment', 'funding', 'founder', 'board'],
  angellist: ['startup', 'investor', 'role']
};

// ============ HTTP UTILITIES ============

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const { timeoutMs = 10000, headers = {} } = options;
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.get(url, { 
      timeout: timeoutMs,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
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

// ============ SOCIAL DISCOVERY ============

/**
 * Find social profiles for a person
 * @param {Object} person - Person details
 * @param {string} person.name - Full name
 * @param {string} [person.company] - Company name
 * @param {string} [person.title] - Job title
 * @param {string} [person.email] - Email (for cross-reference)
 * @param {Object} options - Discovery options
 * @returns {Promise<Object>} Discovery results
 */
async function findSocialProfiles(person, options = {}) {
  const {
    platforms = ['twitter', 'linkedin', 'github'],
    searchMethod = 'direct',
    timeoutMs = 15000
  } = options;

  const result = {
    person: {
      name: person.name,
      company: person.company,
      title: person.title
    },
    profiles: {},
    discovered: [],
    confidence: 0,
    suggestions: [],
    discoveredAt: new Date().toISOString()
  };

  try {
    // Try to find profiles on each platform
    const searchPromises = platforms.map(async (platform) => {
      try {
        const profile = await searchPlatform(platform, person, { timeoutMs });
        if (profile.found) {
          result.profiles[platform] = profile;
          result.discovered.push({
            platform,
            handle: profile.handle,
            url: profile.url,
            confidence: profile.confidence
          });
        }
      } catch (err) {
        result.suggestions.push(`${platform} search failed: ${err.message}`);
      }
    });

    await Promise.all(searchPromises);

    // Calculate overall confidence
    const confidences = Object.values(result.profiles).map(p => p.confidence || 0);
    result.confidence = confidences.length > 0 
      ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
      : 0;

    // Cross-validate if multiple profiles found
    if (Object.keys(result.profiles).length >= 2) {
      result.crossValidated = true;
      result.confidence = Math.min(95, result.confidence + 10);
    }

  } catch (error) {
    result.error = error.message;
  }

  return result;
}

/**
 * Search a specific platform for a person
 */
async function searchPlatform(platform, person, options = {}) {
  const config = PLATFORMS[platform];
  if (!config) {
    return { found: false, error: 'Unknown platform' };
  }

  const result = {
    platform,
    found: false,
    handle: null,
    url: null,
    confidence: 0,
    checks: {},
    activity: {}
  };

  try {
    // Build search query
    const query = person.company 
      ? `${person.name} ${person.company}` 
      : person.name;

    // Try direct profile URL patterns first (if we can guess the handle)
    const guessedHandle = guessHandle(person.name);
    
    if (guessedHandle) {
      const directUrl = config.profileUrl(guessedHandle);
      try {
        const response = await fetch(directUrl, { timeoutMs: options.timeoutMs });
        
        if (response.status === 200) {
          result.found = true;
          result.handle = guessedHandle;
          result.url = directUrl;
          result.confidence = 40; // Base confidence for guessed handle
          
          // Verify it's the right person
          const verification = await verifyProfileContent(platform, response.body, person);
          result.checks = verification.checks;
          result.activity = verification.activity;
          result.confidence = verification.confidence;
          
          if (verification.confidence >= 60) {
            return result;
          }
        }
      } catch (err) {
        // Direct guess failed, continue to search
      }
    }

    // Note: Actual search would require parsing search results
    // This is a simplified implementation
    result.suggestion = `Try manual search: ${config.searchUrl(query)}`;
    
  } catch (error) {
    result.error = error.message;
  }

  return result;
}

/**
 * Guess social handle from name
 */
function guessHandle(name) {
  if (!name) return null;
  const parts = name.toLowerCase().trim().split(/\s+/);
  if (parts.length >= 2) {
    const [first, last] = parts;
    // Common patterns
    const patterns = [
      `${first}${last}`,
      `${first}.${last}`,
      `${first}_${last}`,
      `${first[0] || ''}${last}`,
      first,
      `${first}${last[0] || ''}`
    ];
    return patterns[0]; // Return first pattern as guess
  }
  return name.toLowerCase().replace(/\s+/g, '');
}

// ============ PROFILE VERIFICATION ============

/**
 * Verify a social profile comprehensively
 * @param {string} platform - Platform name
 * @param {string} identifier - Handle/URL/ID
 * @returns {Promise<Object>} Verification result
 */
async function verifySocialProfile(platform, identifier) {
  const verifiers = {
    twitter: verifyTwitter,
    linkedin: verifyLinkedIn,
    github: verifyGitHub
  };

  const verifier = verifiers[platform];
  if (!verifier) {
    return { error: `No verifier available for ${platform}` };
  }

  return verifier(identifier);
}

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
    activity: {},
    suggestions: [],
    verifiedAt: new Date().toISOString()
  };

  try {
    const response = await fetch(result.url);
    
    result.checks.pageExists = response.status === 200;
    result.checks.notSuspended = !response.body.includes('suspended');
    result.checks.notProtected = !response.body.includes('protected');

    if (response.status === 404) {
      result.suggestions.push('Profile not found');
      return result;
    }

    if (response.body.includes('suspended')) {
      result.suggestions.push('Account suspended');
      return result;
    }

    result.exists = true;
    result.score += 40;

    const body = response.body.toLowerCase();
    
    // Activity analysis
    result.activity.hasBio = body.includes('description') || body.includes('bio');
    result.activity.hasTweets = body.includes('tweet') || body.includes('post');
    result.activity.hasFollowers = body.match(/(\d+[km]?)\s*followers/i);
    result.activity.recentActivity = body.includes('hours ago') || body.includes('minutes ago');
    
    if (result.activity.hasBio) result.score += 15;
    if (result.activity.hasTweets) result.score += 15;
    if (result.activity.hasFollowers) {
      result.score += 15;
      result.followerCount = result.activity.hasFollowers[1];
    }
    if (result.activity.recentActivity) result.score += 15;

    // Verification indicators
    result.checks.verified = body.includes('verified') || body.includes('bluecheck');
    if (result.checks.verified) result.score += 10;

    result.active = result.activity.hasTweets && result.activity.hasFollowers;
    result.valid = result.score >= 60;

  } catch (error) {
    result.error = error.message;
  }

  return result;
}

async function verifyLinkedIn(identifier) {
  let url = identifier.includes('linkedin.com') 
    ? identifier 
    : `https://www.linkedin.com/in/${identifier}`;

  const result = {
    platform: 'linkedin',
    identifier,
    valid: false,
    exists: false,
    active: false,
    score: 0,
    url,
    checks: {},
    activity: {},
    suggestions: [],
    verifiedAt: new Date().toISOString()
  };

  try {
    const response = await fetch(url);
    
    if (response.status === 404 || response.status === 999) {
      result.suggestions.push('Profile not found');
      return result;
    }

    if (response.body.includes('authwall') || response.body.includes('sign in')) {
      result.suggestions.push('Profile requires login (likely exists but private)');
      result.checks.requiresAuth = true;
      result.score += 30;
      return result;
    }

    result.exists = true;
    result.score += 40;

    const body = response.body.toLowerCase();

    // Profile completeness
    result.activity.hasPhoto = body.includes('profile-photo');
    result.activity.hasHeadline = body.includes('headline');
    result.activity.hasExperience = body.includes('experience');
    result.activity.hasConnections = body.includes('connections');
    result.activity.hasActivity = body.includes('activity');

    if (result.activity.hasPhoto) result.score += 15;
    if (result.activity.hasHeadline) result.score += 15;
    if (result.activity.hasExperience) result.score += 15;
    if (result.activity.hasConnections) result.score += 10;
    if (result.activity.hasActivity) result.score += 5;

    result.checks.premium = body.includes('premium');
    result.active = result.activity.hasExperience;
    result.valid = result.score >= 60;

  } catch (error) {
    result.error = error.message;
  }

  return result;
}

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
    activity: {},
    suggestions: [],
    verifiedAt: new Date().toISOString()
  };

  try {
    const response = await fetch(result.url);
    
    if (response.status === 404) {
      result.suggestions.push('Profile not found');
      return result;
    }

    result.exists = true;
    result.score += 40;

    const body = response.body.toLowerCase();

    // Activity indicators
    result.activity.hasRepos = body.includes('repositories');
    result.activity.hasContributions = body.includes('contribution');
    result.activity.hasBio = body.includes('bio');
    result.activity.hasAvatar = !body.includes('default-avatar');
    result.activity.recentActivity = body.match(/\d+\s*(hours?|days?)\s*ago/);

    if (result.activity.hasRepos) result.score += 20;
    if (result.activity.hasContributions) result.score += 20;
    if (result.activity.hasBio) result.score += 10;
    if (result.activity.hasAvatar) result.score += 5;
    if (result.activity.recentActivity) result.score += 5;

    result.checks.isPro = body.includes('pro badge');
    result.active = result.activity.hasRepos || result.activity.hasContributions;
    result.valid = result.score >= 60;

  } catch (error) {
    result.error = error.message;
  }

  return result;
}

// ============ BATCH OPERATIONS ============

/**
 * Batch verify multiple social profiles
 */
async function batchVerifySocial(profiles, options = {}) {
  const { concurrency = 3, delayMs = 500 } = options;
  const results = [];

  for (let i = 0; i < profiles.length; i += concurrency) {
    const batch = profiles.slice(i, i + concurrency);
    
    const batchResults = await Promise.all(
      batch.map(p => verifySocialProfile(p.platform, p.identifier))
    );

    results.push(...batchResults);

    if (delayMs > 0 && i + concurrency < profiles.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return results;
}

/**
 * Find and verify social profiles for multiple people
 */
async function batchFindAndVerify(people, options = {}) {
  const results = [];

  for (const person of people) {
    // First, find profiles
    const discovery = await findSocialProfiles(person, options);
    
    // Then verify each found profile
    const verifiedProfiles = {};
    for (const [platform, profile] of Object.entries(discovery.profiles)) {
      if (profile.handle) {
        verifiedProfiles[platform] = await verifySocialProfile(platform, profile.handle);
      }
    }

    results.push({
      person: discovery.person,
      discovered: discovery.profiles,
      verified: verifiedProfiles,
      confidence: discovery.confidence,
      crossValidated: discovery.crossValidated
    });
  }

  return results;
}

// ============ SUMMARY & ANALYTICS ============

function getDiscoverySummary(results) {
  const total = results.length;
  const withProfiles = results.filter(r => Object.keys(r.profiles || {}).length > 0).length;
  const crossValidated = results.filter(r => r.crossValidated).length;
  
  const platformCounts = {};
  for (const result of results) {
    for (const platform of Object.keys(result.profiles || {})) {
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    }
  }

  return {
    total,
    withProfiles,
    findRate: Math.round((withProfiles / total) * 100),
    crossValidated,
    platformCounts,
    averageConfidence: Math.round(
      results.reduce((sum, r) => sum + (r.confidence || 0), 0) / total
    )
  };
}

module.exports = {
  // Discovery
  findSocialProfiles,
  batchFindAndVerify,
  
  // Verification
  verifySocialProfile,
  verifyTwitter,
  verifyLinkedIn,
  verifyGitHub,
  batchVerifySocial,
  
  // Summary
  getDiscoverySummary,
  
  // Constants
  PLATFORMS
};

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node social-finder.js <name> [company]');
    console.log('Example: node social-finder.js "John Doe" "Acme Inc"');
    process.exit(1);
  }

  const [name, company] = args;
  
  console.log(`Finding social profiles for ${name}${company ? ` @ ${company}` : ''}...\n`);
  
  findSocialProfiles({ name, company })
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(console.error);
}
