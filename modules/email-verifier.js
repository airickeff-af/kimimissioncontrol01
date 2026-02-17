/**
 * Email Verification Module
 * Validates email addresses using multiple techniques
 * 
 * Usage:
 *   const { verifyEmail, batchVerifyEmails } = require('./email-verifier');
 *   const result = await verifyEmail('john@company.com');
 */

const dns = require('dns').promises;
const net = require('net');

// Disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'throwaway.com', 'mailinator.com', 'guerrillamail.com',
  '10minutemail.com', 'yopmail.com', 'fakeinbox.com', 'sharklasers.com',
  'getairmail.com', 'tempinbox.com', 'mailnesia.com', 'tempmailaddress.com',
  'burnermail.io', 'temp-mail.org', 'fake-email.net', 'tempmailo.com'
]);

// Common role-based prefixes
const ROLE_BASED_PREFIXES = new Set([
  'admin', 'support', 'help', 'info', 'sales', 'marketing', 'contact',
  'webmaster', 'postmaster', 'hostmaster', 'abuse', 'noc', 'security',
  'billing', 'jobs', 'careers', 'press', 'media', 'hello', 'team',
  'office', 'service', 'customerservice', 'feedback', 'newsletter'
]);

// Email regex pattern (RFC 5322 compliant subset)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Verify a single email address
 * @param {string} email - Email to verify
 * @param {Object} options - Verification options
 * @returns {Promise<Object>} Verification result
 */
async function verifyEmail(email, options = {}) {
  const {
    checkSyntax = true,
    checkDisposable = true,
    checkRoleBased = true,
    checkMX = true,
    checkSMTP = false, // Disabled by default - slow and may be blocked
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
      const syntaxValid = EMAIL_REGEX.test(email);
      result.checks.syntax = syntaxValid;
      
      if (!syntaxValid) {
        result.suggestions.push('Invalid email format');
        return result;
      }
      result.score += 25;
    }

    const [localPart, domain] = email.split('@');

    // 2. Disposable email check
    if (checkDisposable) {
      const domainLower = domain.toLowerCase();
      const isDisposable = DISPOSABLE_DOMAINS.has(domainLower) ||
        DISPOSABLE_DOMAINS.has(domainLower.split('.')[0]);
      result.checks.disposable = !isDisposable;
      
      if (isDisposable) {
        result.suggestions.push('Disposable email detected - low trust');
        result.score -= 20;
      } else {
        result.score += 25;
      }
    }

    // 3. Role-based email check
    if (checkRoleBased) {
      const localLower = localPart.toLowerCase();
      const isRoleBased = ROLE_BASED_PREFIXES.has(localLower) ||
        ROLE_BASED_PREFIXES.has(localLower.split('.')[0]) ||
        ROLE_BASED_PREFIXES.has(localLower.split('_')[0]) ||
        ROLE_BASED_PREFIXES.has(localLower.split('-')[0]);
      result.checks.roleBased = !isRoleBased;
      
      if (isRoleBased) {
        result.suggestions.push('Role-based email (not personal)');
        result.score -= 10;
      } else {
        result.score += 25;
      }
    }

    // 4. MX record validation
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
          // Sort by priority
          mxRecords.sort((a, b) => a.priority - b.priority);
          result.mxRecords = mxRecords.slice(0, 3).map(r => r.exchange);
          result.score += 25;
        } else {
          result.suggestions.push('No mail server found for domain');
        }
      } catch (err) {
        result.checks.mx = false;
        result.suggestions.push(`DNS lookup failed: ${err.message}`);
      }
    }

    // 5. SMTP verification (optional, slow)
    if (checkSMTP && result.checks.mx && result.mxRecords) {
      result.checks.smtp = await verifySMTP(email, result.mxRecords[0], timeoutMs);
      if (result.checks.smtp) {
        result.score += 25;
      } else {
        result.suggestions.push('SMTP verification failed - mailbox may not exist');
      }
    }

    // Final validity determination
    result.valid = result.score >= 60 && result.checks.syntax && result.checks.mx;
    result.score = Math.max(0, Math.min(100, result.score));

  } catch (error) {
    result.error = error.message;
    result.suggestions.push(`Verification error: ${error.message}`);
  }

  return result;
}

/**
 * Verify SMTP connection (basic check)
 * Note: Many servers block this or return false positives
 */
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
      // Just checking if port 25 is open - full SMTP conversation is complex
      // and often blocked by greylisting/rate limiting
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

/**
 * Batch verify multiple emails
 * @param {string[]} emails - Array of emails to verify
 * @param {Object} options - Verification options
 * @returns {Promise<Object[]>} Array of verification results
 */
async function batchVerifyEmails(emails, options = {}) {
  const { concurrency = 5, delayMs = 100 } = options;
  
  const results = [];
  const chunks = [];
  
  // Split into chunks for concurrency control
  for (let i = 0; i < emails.length; i += concurrency) {
    chunks.push(emails.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(email => verifyEmail(email, options))
    );
    results.push(...chunkResults);
    
    // Rate limiting delay between chunks
    if (delayMs > 0 && chunks.length > 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return results;
}

/**
 * Get verification summary for a batch
 */
function getVerificationSummary(results) {
  const total = results.length;
  const valid = results.filter(r => r.valid).length;
  const disposable = results.filter(r => !r.checks.disposable).length;
  const roleBased = results.filter(r => !r.checks.roleBased).length;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / total;

  return {
    total,
    valid,
    invalid: total - valid,
    validRate: Math.round((valid / total) * 100),
    disposableCount: disposable,
    roleBasedCount: roleBased,
    averageScore: Math.round(avgScore),
    highQuality: results.filter(r => r.score >= 80).length,
    mediumQuality: results.filter(r => r.score >= 60 && r.score < 80).length,
    lowQuality: results.filter(r => r.score < 60).length
  };
}

/**
 * Generate email pattern for a domain (fallback when email not found)
 * @param {string} firstName 
 * @param {string} lastName 
 * @param {string} domain
 * @returns {string[]} Common email patterns
 */
function generateEmailPatterns(firstName, lastName, domain) {
  const f = firstName.toLowerCase().trim();
  const l = lastName.toLowerCase().trim();
  const fi = f[0];
  const li = l[0];

  const patterns = [
    `${f}@${domain}`,
    `${l}@${domain}`,
    `${f}.${l}@${domain}`,
    `${f}_${l}@${domain}`,
    `${f}-${l}@${domain}`,
    `${fi}${l}@${domain}`,
    `${f}${li}@${domain}`,
    `${fi}.${l}@${domain}`,
    `${f}.${li}@${domain}`,
    `${l}.${f}@${domain}`,
    `${fi}${li}@${domain}`,
    `${f}${l}@${domain}`,
    `${l}${f}@${domain}`,
    `${f[0]}${l}@${domain}`
  ];

  return [...new Set(patterns)];
}

module.exports = {
  verifyEmail,
  batchVerifyEmails,
  getVerificationSummary,
  generateEmailPatterns,
  DISPOSABLE_DOMAINS,
  ROLE_BASED_PREFIXES
};

// CLI usage
if (require.main === module) {
  const email = process.argv[2];
  if (!email) {
    console.log('Usage: node email-verifier.js <email>');
    process.exit(1);
  }

  verifyEmail(email, { checkSMTP: false })
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(console.error);
}
