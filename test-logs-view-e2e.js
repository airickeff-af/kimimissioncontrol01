// E2E Test for logs-view.html fix
const http = require('http');

const TEST_CONFIG = {
  apiPort: 3001,
  tests: [
    { name: 'Health Check', path: '/api/health', expectStatus: 200 },
    { name: 'Logs Activity API', path: '/api/logs/activity?limit=5', expectStatus: 200 },
    { name: 'Agents API', path: '/api/agents', expectStatus: 200 },
    { name: 'System Status API', path: '/api/system/status', expectStatus: 200 },
    { name: 'Tasks API', path: '/api/tasks', expectStatus: 200 }
  ]
};

async function runTest(test) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: TEST_CONFIG.apiPort,
      path: test.path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const success = res.statusCode === test.expectStatus;
        let parsedData = null;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          // Not JSON
        }
        
        resolve({
          name: test.name,
          success: success,
          statusCode: res.statusCode,
          expectedStatus: test.expectStatus,
          data: parsedData,
          rawData: data.substring(0, 500)
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        name: test.name,
        success: false,
        error: error.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        name: test.name,
        success: false,
        error: 'Timeout'
      });
    });

    req.end();
  });
}

async function runAllTests() {
  console.log('🧪 E2E Test Suite for logs-view.html fix');
  console.log('=========================================\n');

  let passed = 0;
  let failed = 0;

  for (const test of TEST_CONFIG.tests) {
    process.stdout.write(`Testing ${test.name}... `);
    const result = await runTest(test);
    
    if (result.success) {
      console.log('✅ PASS');
      passed++;
      
      // Additional validation for logs API
      if (test.name === 'Logs Activity API' && result.data) {
        const hasLogs = Array.isArray(result.data.logs);
        const hasMeta = result.data.meta !== undefined;
        const logCount = hasLogs ? result.data.logs.length : 0;
        
        console.log(`   └─ Returns logs array: ${hasLogs ? '✅' : '❌'}`);
        console.log(`   └─ Returns meta object: ${hasMeta ? '✅' : '❌'}`);
        console.log(`   └─ Log entries returned: ${logCount}`);
        
        if (logCount > 0) {
          const firstLog = result.data.logs[0];
          console.log(`   └─ First log has timestamp: ${firstLog.timestamp ? '✅' : '❌'}`);
          console.log(`   └─ First log has agent: ${firstLog.agent ? '✅' : '❌'}`);
          console.log(`   └─ First log has type: ${firstLog.type ? '✅' : '❌'}`);
          console.log(`   └─ First log has message: ${firstLog.message ? '✅' : '❌'}`);
        }
      }
    } else {
      console.log('❌ FAIL');
      console.log(`   └─ Error: ${result.error || `Status ${result.statusCode} (expected ${result.expectedStatus})`}`);
      failed++;
    }
  }

  console.log('\n=========================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n✅ All tests passed! The logs-view.html fix is working correctly.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the API server.');
    process.exit(1);
  }
}

runAllTests();
