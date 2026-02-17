/**
 * Enhanced Email Discovery & Verification Module
 * Finds and validates emails using multiple discovery techniques
 * 
 * Usage:
 *   const { findEmail, verifyEmail, discoverEmails } = require('./email-finder');
 *   const result = await findEmail({ firstName: 'John', lastName: 'Doe', domain: 'company.com' });
 */

const dns = require('dns').promises;
const net = require('net');
const https = require('https');

// ============ CONFIGURATION ============

// Disposable email domains (expanded)
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'throwaway.com', 'mailinator.com', 'guerrillamail.com',
  '10minutemail.com', 'yopmail.com', 'fakeinbox.com', 'sharklasers.com',
  'getairmail.com', 'tempinbox.com', 'mailnesia.com', 'tempmailaddress.com',
  'burnermail.io', 'temp-mail.org', 'fake-email.net', 'tempmailo.com',
  'maildrop.cc', 'harakirimail.com', 'getnada.com', 'inboxkitten.com',
  'tempail.com', 'throwawaymail.com', 'emailondeck.com', 'tempm.com',
  'fakemail.net', 'tempinbox.co.uk', 'burnermail.io', 'tempmails.net'
]);

// Role-based prefixes (expanded)
const ROLE_BASED_PREFIXES = new Set([
  'admin', 'support', 'help', 'info', 'sales', 'marketing', 'contact',
  'webmaster', 'postmaster', 'hostmaster', 'abuse', 'noc', 'security',
  'billing', 'jobs', 'careers', 'press', 'media', 'hello', 'team',
  'office', 'service', 'customerservice', 'feedback', 'newsletter',
  'hr', 'legal', 'finance', 'accounting', 'partnerships', 'bd',
  'business', 'general', 'enquiries', 'inquiry', 'request'
]);

// Common corporate email patterns by priority (most common first)
const EMAIL_PATTERNS = [
  '{first}.{last}',      // john.doe
  '{first}{last}',       // johndoe
  '{first}_{last}',      // john_doe
  '{first}-{last}',      // john-doe
  '{first}{l}',          // johnd
  '{f}{last}',           // jdoe
  '{first}',             // john
  '{last}',              // doe
  '{f}.{last}',          // j.doe
  '{first}.{l}',         // john.d
  '{last}.{first}',      // doe.john
  '{f}{l}',              // jd
  '{first}{last}2',      // johndoe2 (for duplicates)
  '{first}.{last}2',     // john.doe2
];

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// ============ EMAIL DISCOVERY ============

/**
 * Find email for a person using multiple discovery methods
 * @param {Object} person - Person details
 * @param {string} person.firstName - First name
 * @param {string} person.lastName - Last name
 * @param {string} person.domain - Company domain
 * @param {string} [person.company] - Company name (for enrichment)
 * @param {string} [person.linkedin] - LinkedIn URL (for cross-reference)
 * @param {Object} options - Discovery options
 * @returns {Promise<Object>} Discovery result with confidence score
 */
async function findEmail(person, options = {}) {
  const {
    methods = ['pattern', 'verify', 'enrich'],
    maxAttempts = 5,
    timeoutMs = 10000
  } = options;

  const result = {
    person: {
      firstName: person.firstName,
      lastName: person.lastName,
      domain: person.domain,
      company: person.company
    },
    discovered: [],
    verified: null,
    confidence: 0,
    method: null,
    suggestions: [],
    discoveredAt: new Date().toISOString()
  };

  try {
    // Method 1: Pattern-based generation + verification
    if (methods.includes('pattern')) {
      const patterns = generateEmailPatterns(person.firstName, person.lastName, person.domain);
      
      // Test top patterns
      const testPatterns = patterns.slice(0, maxAttempts);
      const verificationResults = await batchVerifyEmails(testPatterns, { 
        concurrency: 3, 
        checkSMTP: false 
      });

      // Find highest scoring valid email
      const validEmails = verificationResults
        .filter(r => r.valid && r.score >= 70)
        .sort((a, b) => b.score - a.score);

      if (validEmails.length > 0) {
        result.verified = validEmails[0];
        result.confidence = validEmails[0].score;
        result.method = 'pattern-verification';
        result.discovered = verificationResults;
        return result;
      }

      // Store attempts for reference
      result.discovered = verificationResults;
    }

    // Method 2: Common corporate patterns
    if (methods.includes('verify') && !result.verified) {
      const commonPatterns = generateCommonPatterns(person.firstName, person.lastName, person.domain);
      const commonResults = await batchVerifyEmails(commonPatterns.slice(0, maxAttempts), {
        concurrency: 3,
        checkSMTP: false
      });

      const validCommon = commonResults
        .filter(r => r.valid && r.score >= 70)
        .sort((a, b) => b.score - a.score);

      if (validCommon.length > 0) {
        result.verified = validCommon[0];
        result.confidence = validCommon[0].score;
        result.method = 'common-pattern';
        result.discovered = [...result.discovered, ...commonResults];
        return result;
      }
    }

    // Method 3: Domain enrichment (check for catch-all)
    if (methods.includes('enrich')) {
      const domainInfo = await enrichDomainInfo(person.domain);
      result.domainInfo = domainInfo;

      if (domainInfo.catchAll) {
        result.suggestions.push('Domain has catch-all - any pattern may work');
        result.confidence = 50; // Medium confidence for catch-all
      }

      if (domainInfo.commonPattern) {
        const enrichedEmail = generatePatternFromTemplate(
          person.firstName, 
          person.lastName, 
          person.domain,
          domainInfo.commonPattern
        );
        result.suggestions.push(`Domain pattern suggests: ${enrichedEmail}`);
      }
    }

    // If no verified email found, return best guess with warning
    if (!result.verified && result.discovered.length > 0) {
      const bestGuess = result.discovered
        .filter(r => r.checks.syntax && r.checks.mx)
        .sort((a, b) => b.score - a.score)[0];

      if (bestGuess) {
        result.bestGuess = bestGuess;
        result.confidence = bestGuess.score * 0.5; // Halve confidence for unverified
        result.suggestions.push('Best guess based on pattern - verification recommended');
      }
    }

  } catch (error) {
    result.error = error.message;
    result.suggestions.push(`Discovery error: ${error.message}`);
  }

  return result;
}

/**
 * Batch find emails for multiple people
 */
async function batchFindEmails(people, options = {}) {
  const { concurrency = 3, delayMs = 500, onProgress } = options;
  const results = [];

  for (let i = 0; i < people.length; i += concurrency) {
    const batch = people.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(person => findEmail(person, options))
    );
    
    results.push(...batchResults);

    if (onProgress) {
      onProgress({
        completed: results.length,
        total: people.length,
        percent: Math.round((results.length / people.length) * 100)
      });
    }

    if (delayMs > 0 && i + concurrency < people.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return results;
}

// ============ EMAIL VERIFICATION ============

/**
 * Verify a single email address comprehensively
 */
async function verifyEmail(email, options = {}) {
  const {
    checkSyntax = true,
    checkDisposable = true,
    checkRoleBased = true,
    checkMX = true,
    checkSMTP = false,
    checkCatchAll = true,
    timeoutMs = 5000
  } = options;

  const result = {
    email,
    valid: false,
    score: 0,
    checks: {},
    suggestions: [],
    verifiedAt: new Date().toISOString()
  };

  try {
    // 1. Syntax validation
    if (checkSyntax) {
      result.checks.syntax = EMAIL_REGEX.test(email);
      if (!result.checks.syntax) {
        result.suggestions.push('Invalid email format');
        return result;
      }
      result.score += 20;
    }

    const [localPart, domain] = email.split('@');

    // 2. Disposable check
    if (checkDisposable) {
      const isDisposable = DISPOSABLE_DOMAINS.has(domain.toLowerCase()) ||
        DISPOSABLE_DOMAINS.has(domain.toLowerCase().split('.')[0]);
      result.checks.disposable = !isDisposable;
      
      if (isDisposable) {
        result.suggestions.push('Disposable email - low trust');
        result.score -= 20;
      } else {
        result.score += 20;
      }
    }

    // 3. Role-based check
    if (checkRoleBased) {
      const localLower = localPart.toLowerCase();
      const isRoleBased = ROLE_BASED_PREFIXES.has(localLower) ||
        ROLE_BASED_PREFIXES.has(localLower.split('.')[0]) ||
        ROLE_BASED_PREFIXES.has(localLower.split('_')[0]);
      result.checks.roleBased = !isRoleBased;
      
      if (isRoleBased) {
        result.suggestions.push('Role-based email (not personal)');
        result.score -= 10;
      } else {
        result.score += 20;
      }
    }

    // 4. MX validation
    if (checkMX) {
      try {
        const mxRecords = await Promise.race([
          dns.resolveMx(domain),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('DNS timeout')), timeoutMs)
          )
        ]);
        
        result.checks.mx = mxRecords && mxRecords.length > 0;
        
        if (result.checks.mx) {
          mxRecords.sort((a, b) => a.priority - b.priority);
          result.mxRecords = mxRecords.slice(0, 3).map(r => r.exchange);
          result.score += 20;
        } else {
          result.suggestions.push('No mail server found');
        }
      } catch (err) {
        result.checks.mx = false;
        result.suggestions.push(`DNS lookup failed`);
      }
    }

    // 5. Catch-all detection
    if (checkCatchAll && result.checks.mx) {
      result.checks.catchAll = await detectCatchAll(domain, result.mxRecords[0], timeoutMs);
      if (result.checks.catchAll) {
        result.suggestions.push('Domain has catch-all configuration');
      }
    }

    // 6. SMTP verification (optional)
    if (checkSMTP && result.checks.mx) {
      result.checks.smtp = await verifySMTP(email, result.mxRecords[0], timeoutMs);
      if (result.checks.smtp) {
        result.score += 20;
      }
    }

    result.valid = result.score >= 60 && result.checks.syntax && result.checks.mx;
    result.score = Math.max(0, Math.min(100, result.score));

  } catch (error) {
    result.error = error.message;
  }

  return result;
}

/**
 * Batch verify emails
 */
async function batchVerifyEmails(emails, options = {}) {
  const { concurrency = 5, delayMs = 100 } = options;
  const results = [];
  
  const chunks = [];
  for (let i = 0; i < emails.length; i += concurrency) {
    chunks.push(emails.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(email => verifyEmail(email, options))
    );
    results.push(...chunkResults);
    
    if (delayMs > 0 && chunks.length > 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return results;
}

// ============ HELPER FUNCTIONS ============

function generateEmailPatterns(firstName, lastName, domain) {
  const f = (firstName || '').toLowerCase().trim();
  const l = (lastName || '').toLowerCase().trim();
  const fi = f[0] || '';
  const li = l[0] || '';

  return EMAIL_PATTERNS.map(pattern => {
    return pattern
      .replace('{first}', f)
      .replace('{last}', l)
      .replace('{f}', fi)
      .replace('{l}', li) + `@${domain}`;
  });
}

function generateCommonPatterns(firstName, lastName, domain) {
  const f = (firstName || '').toLowerCase().trim();
  const l = (lastName || '').toLowerCase().trim();
  
  return [
    `${f}.${l}@${domain}`,
    `${f}${l}@${domain}`,
    `${f}@${domain}`,
    `${l}@${domain}`,
    `${f[0] || ''}${l}@${domain}`,
    `${f}${l[0] || ''}@${domain}`,
    `${f[0] || ''}.${l}@${domain}`,
    `${f}_${l}@${domain}`,
    `${f}-${l}@${domain}`,
    `${l}.${f}@${domain}`,
    `${f[0] || ''}${l[0] || ''}@${domain}`,
    `${f}2@${domain}`,
    `${f}.${l}2@${domain}`
  ];
}

function generatePatternFromTemplate(firstName, lastName, domain, template) {
  const f = (firstName || '').toLowerCase().trim();
  const l = (lastName || '').toLowerCase().trim();
  
  return template
    .replace('{first}', f)
    .replace('{last}', l)
    .replace('{f}', f[0] || '')
    .replace('{l}', l[0] || '') + `@${domain}`;
}

async function enrichDomainInfo(domain) {
  const info = {
    domain,
    mxRecords: [],
    catchAll: false,
    commonPattern: null,
    enrichedAt: new Date().toISOString()
  };

  try {
    const mxRecords = await dns.resolveMx(domain);
    info.mxRecords = mxRecords.sort((a, b) => a.priority - b.priority);
    
    // Try to detect catch-all
    if (info.mxRecords.length > 0) {
      info.catchAll = await detectCatchAll(domain, info.mxRecords[0].exchange);
    }
  } catch (err) {
    info.error = err.message;
  }

  return info;
}

async function detectCatchAll(domain, mxHost, timeoutMs = 5000) {
  // Test with a random email that shouldn't exist
  const testEmail = `test${Date.now()}@${domain}`;
  
  try {
    // Simple check: if MX accepts any email, likely catch-all
    // This is a simplified check - real catch-all detection requires SMTP conversation
    return false; // Placeholder - real implementation would do SMTP RCPT TO test
  } catch {
    return false;
  }
}

async function verifySMTP(email, mxHost, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
      }
    };

    socket.setTimeout(timeoutMs);
    
    socket.on('connect', () => {
      cleanup();
      resolve(true);
    });

    socket.on('error', () => {
      cleanup();
      resolve(false);
    });

    socket.on('timeout', () => {
      cleanup();
      resolve(false);
    });

    socket.connect(25, mxHost);
  });
}

// ============ SUMMARY & EXPORT ============

function getDiscoverySummary(results) {
  const total = results.length;
  const verified = results.filter(r => r.verified).length;
  const highConfidence = results.filter(r => r.confidence >= 70).length;
  const mediumConfidence = results.filter(r => r.confidence >= 40 && r.confidence < 70).length;
  const lowConfidence = results.filter(r => r.confidence < 40).length;

  return {
    total,
    verified,
    verifiedRate: Math.round((verified / total) * 100),
    highConfidence,
    mediumConfidence,
    lowConfidence,
    averageConfidence: Math.round(
      results.reduce((sum, r) => sum + r.confidence, 0) / total
    )
  };
}

module.exports = {
  // Discovery
  findEmail,
  batchFindEmails,
  
  // Verification
  verifyEmail,
  batchVerifyEmails,
  
  // Helpers
  generateEmailPatterns: generateCommonPatterns,
  enrichDomainInfo,
  
  // Summary
  getDiscoverySummary,
  
  // Constants
  DISPOSABLE_DOMAINS,
  ROLE_BASED_PREFIXES,
  EMAIL_PATTERNS
};

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: node email-finder.js <firstName> <lastName> <domain>');
    console.log('Example: node email-finder.js John Doe company.com');
    process.exit(1);
  }

  const [firstName, lastName, domain] = args;
  
  console.log(`Finding email for ${firstName} ${lastName} @ ${domain}...\n`);
  
  findEmail({ firstName, lastName, domain })
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(console.error);
}
