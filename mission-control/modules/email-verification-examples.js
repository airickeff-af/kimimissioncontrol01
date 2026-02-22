/**
 * Email Verification API - Usage Examples
 * 
 * This file demonstrates how to use the email-verification-api module.
 * 
 * @task TASK-SI-001
 */

const emailVerification = require('./email-verification-api');

// ============================================
// EXAMPLE 1: Verify a Single Email
// ============================================

async function exampleSingleVerification() {
  
  try {
    const result = await emailVerification.verifyEmail('eric@example.com');
    
    // Interpret the result
    if (result.result === 'deliverable') {
    } else if (result.result === 'undeliverable') {
    } else if (result.result === 'risky') {
    } else {
    }
    
    if (result.score !== null) {
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// EXAMPLE 2: Batch Email Verification
// ============================================

async function exampleBatchVerification() {
  
  const emails = [
    'eric@example.com',
    'john.doe@gmail.com',
    'invalid-email',
    'jane@company.com',
    'test@nonexistent-domain-12345.com'
  ];
  
  try {
    const batchResult = await emailVerification.verifyBatch(emails, {
      concurrency: 2 // Process 2 emails at a time
    });
    
    
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// EXAMPLE 3: Get Domain Information
// ============================================

async function exampleDomainInfo() {
  
  try {
    // Get info for a company domain
    const result = await emailVerification.getDomainInfo('stripe.com');
    
    if (result.pattern) {
    }
    
    if (result.emails && result.emails.length > 0) {
      result.emails.forEach(email => {
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// EXAMPLE 4: Check Module Statistics
// ============================================

async function exampleStats() {
  
  const stats = emailVerification.getStats();
}

// ============================================
// EXAMPLE 5: Working with Results
// ============================================

async function exampleWorkingWithResults() {
  
  const emails = [
    'contact@company.com',
    'invalid@bad-domain',
    'user@gmail.com'
  ];
  
  const batchResult = await emailVerification.verifyBatch(emails);
  
  // Filter valid emails only
  const validEmails = batchResult.results.filter(
    r => r.result === 'deliverable' && !r._fallback
  );
  
  // Filter high-confidence emails (score > 80)
  const highConfidence = batchResult.results.filter(
    r => r.score && r.score > 80
  );
    email: r.email,
    score: r.score
  })));
  
  // Check for disposable emails
  const disposable = batchResult.results.filter(r => r.disposable);
  if (disposable.length > 0) {
    console.warn('⚠️ Disposable emails detected:', disposable.map(r => r.email));
  }
  
  // Check for catch-all domains
  const catchAll = batchResult.results.filter(r => r.accept_all);
  if (catchAll.length > 0) {
    console.warn('⚠️ Catch-all domains detected:', catchAll.map(r => r.email));
  }
}

// ============================================
// EXAMPLE 6: Cache Management
// ============================================

async function exampleCacheManagement() {
  
  // Check initial stats
  
  // Verify an email (will be cached)
  await emailVerification.verifyEmail('test@example.com');
  
  // Check stats again
  
  // Verify same email again (should use cache)
  const cachedResult = await emailVerification.verifyEmail('test@example.com');
  
  // Clear cache if needed
  // emailVerification.clearCache();
}

// ============================================
// RUN ALL EXAMPLES
// ============================================

async function runAllExamples() {
  
  // Run examples sequentially
  await exampleStats();
  await exampleSingleVerification();
  await exampleBatchVerification();
  await exampleDomainInfo();
  await exampleWorkingWithResults();
  await exampleCacheManagement();
  
}

// Run if called directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

module.exports = {
  runAllExamples,
  exampleSingleVerification,
  exampleBatchVerification,
  exampleDomainInfo,
  exampleStats,
  exampleWorkingWithResults,
  exampleCacheManagement
};
