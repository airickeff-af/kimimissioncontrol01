/**
 * API Input Validation Tests
 * Run with: node test-validation.js
 */

const { validateQuery, validateParam, VALIDATION_RULES, containsDangerousPatterns, sanitizeString } = require('./lib/validation');

// Test results
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || 'Assertion failed'}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value, msg) {
  if (value !== true) {
    throw new Error(msg || 'Expected true');
  }
}

function assertFalse(value, msg) {
  if (value !== false) {
    throw new Error(msg || 'Expected false');
  }
}

console.log('\n=== API Input Validation Tests ===\n');

// Test 1: Valid limit parameter
test('Valid limit parameter', () => {
  const result = validateQuery({ limit: '50' }, { limit: VALIDATION_RULES.limit });
  assertTrue(result.valid, 'Should be valid');
  assertEqual(result.sanitized.limit, 50, 'Should parse to integer');
});

// Test 2: Limit too high
test('Limit too high', () => {
  const result = validateQuery({ limit: '5000' }, { limit: VALIDATION_RULES.limit });
  assertFalse(result.valid, 'Should be invalid');
  assertTrue(result.errors.some(e => e.includes('at most 1000')), 'Should have limit error');
});

// Test 3: Limit too low
test('Limit too low', () => {
  const result = validateQuery({ limit: '0' }, { limit: VALIDATION_RULES.limit });
  assertFalse(result.valid, 'Should be invalid');
  assertTrue(result.errors.some(e => e.includes('at least 1')), 'Should have min error');
});

// Test 4: Invalid limit (not a number)
test('Invalid limit (not a number)', () => {
  const result = validateQuery({ limit: 'abc' }, { limit: VALIDATION_RULES.limit });
  assertFalse(result.valid, 'Should be invalid');
  assertTrue(result.errors.some(e => e.includes('valid integer')), 'Should have integer error');
});

// Test 5: Valid status enum
test('Valid status enum', () => {
  const result = validateQuery({ status: 'active' }, { status: VALIDATION_RULES.status });
  assertTrue(result.valid, 'Should be valid');
  assertEqual(result.sanitized.status, 'active', 'Should preserve value');
});

// Test 6: Invalid status enum
test('Invalid status enum', () => {
  const result = validateQuery({ status: 'hacked' }, { status: VALIDATION_RULES.status });
  assertFalse(result.valid, 'Should be invalid');
  assertTrue(result.errors.some(e => e.includes('must be one of')), 'Should have enum error');
});

// Test 7: Valid agent name
test('Valid agent name', () => {
  const result = validateQuery({ agent: 'nexus-1' }, { agent: VALIDATION_RULES.agent });
  assertTrue(result.valid, 'Should be valid');
});

// Test 8: Invalid agent name (special chars)
test('Invalid agent name (special chars)', () => {
  const result = validateQuery({ agent: 'nexus;rm -rf /' }, { agent: VALIDATION_RULES.agent });
  assertFalse(result.valid, 'Should be invalid');
});

// Test 9: SQL injection detection
test('SQL injection detection', () => {
  const result = validateQuery({ search: "'; DROP TABLE users; --" }, { search: VALIDATION_RULES.search });
  assertFalse(result.valid, 'Should detect SQL injection');
});

// Test 10: XSS detection
test('XSS detection', () => {
  const result = validateQuery({ query: '<script>alert("xss")</script>' }, { query: VALIDATION_RULES.query });
  assertFalse(result.valid, 'Should detect XSS');
});

// Test 11: Command injection detection
test('Command injection detection', () => {
  const result = validateQuery({ agent: 'test; cat /etc/passwd' }, { agent: VALIDATION_RULES.agent });
  assertFalse(result.valid, 'Should detect command injection');
});

// Test 12: Path traversal detection
test('Path traversal detection', () => {
  const result = validateQuery({ file: '../../../etc/passwd' }, { file: { type: 'string', maxLength: 100 } });
  assertFalse(result.valid, 'Should detect path traversal');
});

// Test 13: NoSQL injection detection
test('NoSQL injection detection', () => {
  const result = validateQuery({ query: '{ "$ne": null }' }, { query: VALIDATION_RULES.query });
  assertFalse(result.valid, 'Should detect NoSQL injection');
});

// Test 14: Valid date parameter
test('Valid date parameter', () => {
  const result = validateQuery({ from: '2026-02-19T00:00:00Z' }, { from: VALIDATION_RULES.from });
  assertTrue(result.valid, 'Should be valid');
});

// Test 15: Invalid date parameter
test('Invalid date parameter', () => {
  const result = validateQuery({ from: 'not-a-date' }, { from: VALIDATION_RULES.from });
  assertFalse(result.valid, 'Should be invalid');
});

// Test 16: String sanitization
test('String sanitization', () => {
  const sanitized = sanitizeString('<script>alert("test")</script>');
  assertEqual(sanitized.includes('<script>'), false, 'Should encode script tags');
});

// Test 17: Multiple valid parameters
test('Multiple valid parameters', () => {
  const result = validateQuery(
    { limit: '10', status: 'active', priority: 'P0' },
    { limit: VALIDATION_RULES.limit, status: VALIDATION_RULES.status, priority: VALIDATION_RULES.priority }
  );
  assertTrue(result.valid, 'Should be valid');
  assertEqual(result.sanitized.limit, 10, 'Should parse limit');
  assertEqual(result.sanitized.status, 'active', 'Should preserve status');
});

// Test 18: Multiple errors
test('Multiple validation errors', () => {
  const result = validateQuery(
    { limit: '9999', status: 'invalid' },
    { limit: VALIDATION_RULES.limit, status: VALIDATION_RULES.status }
  );
  assertFalse(result.valid, 'Should be invalid');
  assertEqual(result.errors.length, 2, 'Should have 2 errors');
});

// Test 19: Default values
test('Default values applied', () => {
  const result = validateQuery({}, { limit: VALIDATION_RULES.limit });
  assertTrue(result.valid, 'Should be valid');
  assertEqual(result.sanitized.limit, 50, 'Should use default');
});

// Test 20: Priority enum validation
test('Priority enum validation', () => {
  const valid = validateQuery({ priority: 'P1' }, { priority: VALIDATION_RULES.priority });
  assertTrue(valid.valid, 'P1 should be valid');
  
  const invalid = validateQuery({ priority: 'P5' }, { priority: VALIDATION_RULES.priority });
  assertFalse(invalid.valid, 'P5 should be invalid');
});

// Test 21: Region parameter with spaces
test('Region parameter with spaces', () => {
  const result = validateQuery({ region: 'North America' }, { region: VALIDATION_RULES.region });
  assertTrue(result.valid, 'Should allow spaces in region');
});

// Test 22: Search parameter length limit
test('Search parameter length limit', () => {
  const longSearch = 'a'.repeat(250);
  const result = validateQuery({ search: longSearch }, { search: VALIDATION_RULES.search });
  assertFalse(result.valid, 'Should reject too long search');
});

// Test 23: Page parameter validation
test('Page parameter validation', () => {
  const result = validateQuery({ page: '0' }, { page: VALIDATION_RULES.page });
  assertFalse(result.valid, 'Page 0 should be invalid');
  
  const valid = validateQuery({ page: '1' }, { page: VALIDATION_RULES.page });
  assertTrue(valid.valid, 'Page 1 should be valid');
});

// Test 24: Unknown parameters are sanitized
test('Unknown parameters are sanitized', () => {
  const result = validateQuery({ unknown: 'value' }, {});
  assertTrue(result.valid, 'Should accept unknown params');
});

// Test 25: Contains dangerous patterns function
test('Contains dangerous patterns function', () => {
  assertTrue(containsDangerousPatterns("'; DROP TABLE"), 'Should detect SQL');
  assertTrue(containsDangerousPatterns('<script>'), 'Should detect XSS');
  assertTrue(containsDangerousPatterns('../../../'), 'Should detect path traversal');
  assertFalse(containsDangerousPatterns('normal string'), 'Should allow normal strings');
});

console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
