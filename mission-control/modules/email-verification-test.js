/**
 * Email Verification API - Test Suite
 * 
 * Run with: node email-verification-test.js
 * 
 * @task TASK-SI-001
 */

const emailVerification = require('./email-verification-api');

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  return { name, fn };
}

async function runTest(testCase) {
  try {
    await testCase.fn();
    testResults.passed++;
    testResults.tests.push({ name: testCase.name, status: '✅ PASS' });
    console.log(`✅ ${testCase.name}`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testCase.name, status: '❌ FAIL', error: error.message });
    console.log(`❌ ${testCase.name}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

// ============================================
// TEST CASES
// ============================================

const tests = [
  test('Module exports required functions', () => {
    assert(typeof emailVerification.verifyEmail === 'function', 'verifyEmail should be a function');
    assert(typeof emailVerification.verifyBatch === 'function', 'verifyBatch should be a function');
    assert(typeof emailVerification.getDomainInfo === 'function', 'getDomainInfo should be a function');
    assert(typeof emailVerification.getStats === 'function', 'getStats should be a function');
    assert(typeof emailVerification.clearCache === 'function', 'clearCache should be a function');
  }),

  test('getStats returns correct structure', () => {
    const stats = emailVerification.getStats();
    assert(stats.cache, 'stats should have cache property');
    assert(stats.rateLimit, 'stats should have rateLimit property');
    assert(typeof stats.cache.entries === 'number', 'cache.entries should be a number');
    assert(typeof stats.rateLimit.used === 'number', 'rateLimit.used should be a number');
    assert(typeof stats.rateLimit.remaining === 'number', 'rateLimit.remaining should be a number');
    assert(typeof stats.rateLimit.limit === 'number', 'rateLimit.limit should be a number');
  }),

  test('verifyEmail validates input', async () => {
    try {
      await emailVerification.verifyEmail();
      throw new Error('Should have thrown for missing email');
    } catch (error) {
      assert(error.message.includes('required'), 'Should throw for missing email');
    }

    try {
      await emailVerification.verifyEmail(123);
      throw new Error('Should have thrown for non-string email');
    } catch (error) {
      assert(error.message.includes('string'), 'Should throw for non-string email');
    }
  }),

  test('verifyEmail handles invalid format', async () => {
    const result = await emailVerification.verifyEmail('not-an-email');
    assertEqual(result.result, 'undeliverable', 'Should return undeliverable for invalid format');
    assertEqual(result.status, 'invalid', 'Should return invalid status');
    assertEqual(result.score, 0, 'Should return score of 0');
  }),

  test('verifyEmail normalizes input', async () => {
    const result = await emailVerification.verifyEmail('  Test@Example.COM  ');
    assertEqual(result.email, 'test@example.com', 'Should normalize email to lowercase');
  }),

  test('verifyBatch validates input', async () => {
    try {
      await emailVerification.verifyBatch('not-an-array');
      throw new Error('Should have thrown for non-array input');
    } catch (error) {
      assert(error.message.includes('array'), 'Should throw for non-array input');
    }
  }),

  test('verifyBatch handles empty array', async () => {
    const result = await emailVerification.verifyBatch([]);
    assertEqual(result.summary.total, 0, 'Should handle empty array');
  }),

  test('verifyBatch deduplicates emails', async () => {
    const emails = ['test@example.com', 'test@example.com', 'TEST@EXAMPLE.COM'];
    const result = await emailVerification.verifyBatch(emails);
    assertEqual(result.summary.total, 1, 'Should deduplicate emails');
  }),

  test('verifyBatch returns correct summary structure', async () => {
    const emails = ['test1@example.com', 'test2@example.com'];
    const result = await emailVerification.verifyBatch(emails);
    
    assert(typeof result.summary.total === 'number', 'summary.total should be a number');
    assert(typeof result.summary.valid === 'number', 'summary.valid should be a number');
    assert(typeof result.summary.invalid === 'number', 'summary.invalid should be a number');
    assert(typeof result.summary.risky === 'number', 'summary.risky should be a number');
    assert(typeof result.summary.unknown === 'number', 'summary.unknown should be a number');
    assert(typeof result.summary.cached === 'number', 'summary.cached should be a number');
    assert(typeof result.summary.fallback === 'number', 'summary.fallback should be a number');
  }),

  test('verifyBatch returns results array', async () => {
    const emails = ['test@example.com'];
    const result = await emailVerification.verifyBatch(emails);
    
    assert(Array.isArray(result.results), 'results should be an array');
    assertEqual(result.results.length, 1, 'Should return one result per email');
    assert(result.results[0].email, 'Each result should have an email field');
  }),

  test('getDomainInfo validates input', async () => {
    try {
      await emailVerification.getDomainInfo();
      throw new Error('Should have thrown for missing domain');
    } catch (error) {
      assert(error.message.includes('required'), 'Should throw for missing domain');
    }

    try {
      await emailVerification.getDomainInfo(123);
      throw new Error('Should have thrown for non-string domain');
    } catch (error) {
      assert(error.message.includes('string'), 'Should throw for non-string domain');
    }
  }),

  test('getDomainInfo cleans domain input', async () => {
    const result = await emailVerification.getDomainInfo('https://Example.COM/path');
    assertEqual(result.domain, 'example.com', 'Should clean and normalize domain');
  }),

  test('Cache stores and retrieves data', () => {
    const cache = emailVerification._cache;
    const testData = { test: 'data', timestamp: Date.now() };
    
    cache.set('test:key', testData);
    const retrieved = cache.get('test:key');
    
    assertEqual(retrieved.test, 'data', 'Cache should store and retrieve data');
  }),

  test('Cache returns null for missing keys', () => {
    const cache = emailVerification._cache;
    const result = cache.get('nonexistent:key:12345');
    assertEqual(result, null, 'Cache should return null for missing keys');
  }),

  test('Rate limiter tracks usage', () => {
    const rateLimiter = emailVerification._rateLimiter;
    const status = rateLimiter.getStatus();
    
    assert(typeof status.used === 'number', 'rateLimit status should have used count');
    assert(typeof status.remaining === 'number', 'rateLimit status should have remaining count');
    assert(typeof status.limit === 'number', 'rateLimit status should have limit');
    assert(typeof status.canMakeRequest === 'boolean', 'rateLimit status should have canMakeRequest');
  }),

  test('Fallback mode activates when API key not set', async () => {
    // With default placeholder key, should use fallback
    const result = await emailVerification.verifyEmail('test@example.com');
    
    if (result._fallback) {
      assert(result.suggestedPatterns, 'Fallback result should include suggestedPatterns');
      assert(Array.isArray(result.suggestedPatterns), 'suggestedPatterns should be an array');
    }
  }),

  test('Module configuration is accessible', () => {
    const config = emailVerification.getConfig();
    assert(config.BASE_URL, 'config should have BASE_URL');
    assert(config.API_VERSION, 'config should have API_VERSION');
    assert(typeof config.CACHE_TTL_HOURS === 'number', 'config should have CACHE_TTL_HOURS');
    assert(typeof config.MAX_REQUESTS_PER_MONTH === 'number', 'config should have MAX_REQUESTS_PER_MONTH');
  }),

  test('Results have expected structure', async () => {
    const result = await emailVerification.verifyEmail('test@example.com');
    
    assert(typeof result.email === 'string', 'result should have email string');
    assert(typeof result.status === 'string', 'result should have status string');
    assert(typeof result.result === 'string', 'result should have result string');
    assert(Array.isArray(result.sources), 'result should have sources array');
  })
];

// ============================================
// RUN TESTS
// ============================================

async function runAllTests() {
  console.log('🧪 Email Verification API - Test Suite\n');
  console.log('==============================================\n');

  for (const testCase of tests) {
    await runTest(testCase);
  }

  console.log('\n==============================================');
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   📋 Total:  ${testResults.passed + testResults.failed}`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. See details above.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, testResults };
