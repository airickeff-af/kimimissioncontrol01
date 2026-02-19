/**
 * Hunter.io Enrichment Test Script
 * Tests the enrichment pipeline without making actual API calls
 * 
 * Usage: node test-hunter-enrichment.js
 */

const { 
  generateEmailPatterns, 
  parseName,
  EnrichmentState,
  Cache,
  RateLimiter,
  CONFIG 
} = require('./modules/hunter-enrichment');

const fs = require('fs').promises;
const path = require('path');

// Mock data for testing
const TEST_LEADS = [
  { leadId: 'test_001', company: 'Stripe', contactName: 'John Collison', domain: 'stripe.com', priorityTier: 'P0' },
  { leadId: 'test_002', company: 'Notion', contactName: 'Ivan Zhao', domain: 'notion.so', priorityTier: 'P0' },
  { leadId: 'test_003', company: 'Figma', contactName: 'Dylan Field', domain: 'figma.com', priorityTier: 'P1' },
  { leadId: 'test_004', company: 'Vercel', contactName: 'Guillermo Rauch', domain: 'vercel.com', priorityTier: 'P1' },
  { leadId: 'test_005', company: 'Linear', contactName: 'Karri Saarinen', domain: 'linear.app', priorityTier: 'P2' },
];

// Test utilities
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('🧪 Hunter.io Enrichment Tests\n');
  console.log('============================\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: parseName
  try {
    console.log('Test 1: parseName()');
    const name1 = parseName('John Collison');
    assert(name1.first === 'John', 'First name should be John');
    assert(name1.last === 'Collison', 'Last name should be Collison');
    
    const name2 = parseName('Mary Kate Olsen');
    assert(name2.first === 'Mary', 'First name should be Mary');
    assert(name2.last === 'Olsen', 'Last name should be Olsen');
    
    const name3 = parseName('Prince');
    assert(name3.first === 'Prince', 'Single name should work');
    assert(name3.last === 'Prince', 'Single name should use same for last');
    
    console.log('  ✅ parseName() passed\n');
    passed++;
  } catch (error) {
    console.log(`  ❌ parseName() failed: ${error.message}\n`);
    failed++;
  }
  
  // Test 2: generateEmailPatterns
  try {
    console.log('Test 2: generateEmailPatterns()');
    const patterns = generateEmailPatterns('John', 'Collison', 'stripe.com');
    
    assert(patterns.includes('john@stripe.com'), 'Should include first@domain');
    assert(patterns.includes('collison@stripe.com'), 'Should include last@domain');
    assert(patterns.includes('john.collison@stripe.com'), 'Should include first.last@domain');
    assert(patterns.includes('jcollison@stripe.com'), 'Should include first initial + last@domain');
    assert(patterns.length >= 10, 'Should generate at least 10 patterns');
    
    console.log(`  ✅ generateEmailPatterns() passed (${patterns.length} patterns)\n`);
    passed++;
  } catch (error) {
    console.log(`  ❌ generateEmailPatterns() failed: ${error.message}\n`);
    failed++;
  }
  
  // Test 3: EnrichmentState
  try {
    console.log('Test 3: EnrichmentState()');
    const state = new EnrichmentState();
    
    state.markLeadProcessing('test_001');
    assert(state.state.leads['test_001'].status === 'processing', 'Lead should be processing');
    
    state.markLeadSuccess('test_001', 'john@example.com', 95, 'test');
    assert(state.state.leads['test_001'].status === 'completed', 'Lead should be completed');
    assert(state.state.leads['test_001'].email === 'john@example.com', 'Email should be saved');
    assert(state.state.successfulEnrichments === 1, 'Success count should be 1');
    
    state.markLeadFailed('test_002', 'No email found');
    assert(state.state.leads['test_002'].status === 'failed', 'Lead should be failed');
    assert(state.state.failedEnrichments === 1, 'Failed count should be 1');
    
    const coverage = state.calculateCoverage();
    assert(coverage === 50, 'Coverage should be 50% (1 of 2)');
    
    console.log('  ✅ EnrichmentState() passed\n');
    passed++;
  } catch (error) {
    console.log(`  ❌ EnrichmentState() failed: ${error.message}\n`);
    failed++;
  }
  
  // Test 4: Cache
  try {
    console.log('Test 4: Cache()');
    const cache = new Cache();
    
    // Test set and get
    cache.set('test:key', { value: 123 });
    const retrieved = cache.get('test:key');
    assert(retrieved.value === 123, 'Cached value should match');
    
    // Test non-existent key
    const missing = cache.get('test:missing');
    assert(missing === null, 'Missing key should return null');
    
    console.log('  ✅ Cache() passed\n');
    passed++;
  } catch (error) {
    console.log(`  ❌ Cache() failed: ${error.message}\n`);
    failed++;
  }
  
  // Test 5: RateLimiter
  try {
    console.log('Test 5: RateLimiter()');
    const limiter = new RateLimiter();
    
    // Test that waitIfNeeded doesn't throw
    await limiter.waitIfNeeded();
    
    // Simulate multiple requests (with small delay)
    for (let i = 0; i < 5; i++) {
      await limiter.waitIfNeeded();
    }
    
    // The rate limiter may filter out old requests, so just check it has requests
    assert(limiter.requests.length >= 1, 'Should have at least 1 recorded request');
    
    console.log('  ✅ RateLimiter() passed\n');
    passed++;
  } catch (error) {
    console.log(`  ❌ RateLimiter() failed: ${error.message}\n`);
    failed++;
  }
  
  // Test 6: Data file structure
  try {
    console.log('Test 6: Data file structure');
    const leadsFile = path.join(__dirname, 'data', 'scored-leads.json');
    const data = await fs.readFile(leadsFile, 'utf8');
    const leads = JSON.parse(data);
    
    assert(leads.summary, 'Should have summary');
    assert(leads.scoredLeads, 'Should have scoredLeads array');
    assert(Array.isArray(leads.scoredLeads), 'scoredLeads should be an array');
    assert(leads.scoredLeads.length > 0, 'Should have at least one lead');
    
    const firstLead = leads.scoredLeads[0];
    assert(firstLead.leadId, 'Lead should have leadId');
    assert(firstLead.company, 'Lead should have company');
    assert(firstLead.contactName, 'Lead should have contactName');
    assert(firstLead.priorityTier, 'Lead should have priorityTier');
    
    console.log(`  ✅ Data file structure passed (${leads.scoredLeads.length} leads)\n`);
    passed++;
  } catch (error) {
    console.log(`  ❌ Data file structure failed: ${error.message}\n`);
    failed++;
  }
  
  // Test 7: Mock enrichment flow
  try {
    console.log('Test 7: Mock enrichment flow');
    
    const state = new EnrichmentState();
    const cache = new Cache();
    const rateLimiter = new RateLimiter();
    
    // Simulate processing a lead
    const lead = TEST_LEADS[0];
    state.markLeadProcessing(lead.leadId);
    
    // Simulate finding an email
    const { first, last } = parseName(lead.contactName);
    const patterns = generateEmailPatterns(first, last, lead.domain);
    const mockEmail = patterns[2]; // Use a pattern-based email
    
    state.markLeadSuccess(lead.leadId, mockEmail, 85, 'test_pattern');
    
    assert(state.state.leads[lead.leadId].email === mockEmail, 'Email should be saved');
    assert(state.state.leads[lead.leadId].confidence === 85, 'Confidence should be 85');
    assert(state.state.successfulEnrichments === 1, 'Should have 1 success');
    
    console.log(`  ✅ Mock enrichment flow passed\n`);
    passed++;
  } catch (error) {
    console.log(`  ❌ Mock enrichment flow failed: ${error.message}\n`);
    failed++;
  }
  
  // Summary
  console.log('============================');
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
