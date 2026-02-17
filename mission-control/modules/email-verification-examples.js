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
  console.log('\n=== Example 1: Single Email Verification ===\n');
  
  try {
    const result = await emailVerification.verifyEmail('eric@example.com');
    console.log('Verification Result:', JSON.stringify(result, null, 2));
    
    // Interpret the result
    if (result.result === 'deliverable') {
      console.log('✅ Email is valid and deliverable');
    } else if (result.result === 'undeliverable') {
      console.log('❌ Email is invalid');
    } else if (result.result === 'risky') {
      console.log('⚠️ Email is risky (may bounce)');
    } else {
      console.log('❓ Email status unknown');
    }
    
    if (result.score !== null) {
      console.log(`Score: ${result.score}/100`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// EXAMPLE 2: Batch Email Verification
// ============================================

async function exampleBatchVerification() {
  console.log('\n=== Example 2: Batch Email Verification ===\n');
  
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
    
    console.log('Batch Results:');
    console.log(JSON.stringify(batchResult.results, null, 2));
    
    console.log('\nSummary:');
    console.log(`  Total: ${batchResult.summary.total}`);
    console.log(`  Valid: ${batchResult.summary.valid}`);
    console.log(`  Invalid: ${batchResult.summary.invalid}`);
    console.log(`  Risky: ${batchResult.summary.risky}`);
    console.log(`  Unknown: ${batchResult.summary.unknown}`);
    console.log(`  Cached: ${batchResult.summary.cached}`);
    console.log(`  Fallback: ${batchResult.summary.fallback}`);
    
    console.log('\nRate Limit Status:');
    console.log(`  Used: ${batchResult.rateLimit.used}/${batchResult.rateLimit.limit}`);
    console.log(`  Remaining: ${batchResult.rateLimit.remaining}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// EXAMPLE 3: Get Domain Information
// ============================================

async function exampleDomainInfo() {
  console.log('\n=== Example 3: Domain Information ===\n');
  
  try {
    // Get info for a company domain
    const result = await emailVerification.getDomainInfo('stripe.com');
    console.log('Domain Info:', JSON.stringify(result, null, 2));
    
    if (result.pattern) {
      console.log(`\n📧 Email pattern found: ${result.pattern}`);
      console.log('Pattern legend:');
      console.log('  {first} = First name');
      console.log('  {last} = Last name');
      console.log('  {f} = First initial');
      console.log('  {l} = Last initial');
    }
    
    if (result.emails && result.emails.length > 0) {
      console.log(`\nFound ${result.emails.length} public emails:`);
      result.emails.forEach(email => {
        console.log(`  - ${email.value} (${email.type})`);
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
  console.log('\n=== Example 4: Module Statistics ===\n');
  
  const stats = emailVerification.getStats();
  console.log('Module Stats:', JSON.stringify(stats, null, 2));
}

// ============================================
// EXAMPLE 5: Working with Results
// ============================================

async function exampleWorkingWithResults() {
  console.log('\n=== Example 5: Working with Results ===\n');
  
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
  console.log('Valid emails:', validEmails.map(r => r.email));
  
  // Filter high-confidence emails (score > 80)
  const highConfidence = batchResult.results.filter(
    r => r.score && r.score > 80
  );
  console.log('High confidence emails:', highConfidence.map(r => ({
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
  console.log('\n=== Example 6: Cache Management ===\n');
  
  // Check initial stats
  console.log('Initial stats:', emailVerification.getStats());
  
  // Verify an email (will be cached)
  await emailVerification.verifyEmail('test@example.com');
  
  // Check stats again
  console.log('After verification:', emailVerification.getStats());
  
  // Verify same email again (should use cache)
  const cachedResult = await emailVerification.verifyEmail('test@example.com');
  console.log('Cached result:', cachedResult._cached ? '✅ From cache' : '❌ Not cached');
  
  // Clear cache if needed
  // emailVerification.clearCache();
}

// ============================================
// RUN ALL EXAMPLES
// ============================================

async function runAllExamples() {
  console.log('🚀 Email Verification API - Usage Examples\n');
  console.log('==============================================');
  
  // Run examples sequentially
  await exampleStats();
  await exampleSingleVerification();
  await exampleBatchVerification();
  await exampleDomainInfo();
  await exampleWorkingWithResults();
  await exampleCacheManagement();
  
  console.log('\n==============================================');
  console.log('✅ All examples completed!');
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
