/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QUALITY GATE - CRON RUNNER
 * Author: SubAgent (Browser Automation Setup)
 * Date: 2026-02-19
 * 
 * Lightweight quality gate for cron jobs. Uses fetch-only mode for reliability.
 * For full browser automation, use: npm run quality-gate
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration - matches quality-gate.cron
const CONFIG = {
  baseUrl: process.env.QUALITY_GATE_URL || 'https://dashboard-ten-sand-20.vercel.app',
  outputDir: path.join(__dirname, '../reports/quality-gate'),
  passThreshold: 95,
  pages: [
    { path: '/', name: 'HQ Dashboard' },
    { path: '/task-board.html', name: 'Task Board' },
    { path: '/agents.html', name: 'Agents' },
    { path: '/office.html', name: 'Office' },
    { path: '/dealflow-view.html', name: 'DealFlow' },
    { path: '/token-tracker.html', name: 'Token Tracker' },
    { path: '/scout.html', name: 'Scout' },
    { path: '/data-viewer.html', name: 'Data Viewer' },
    { path: '/logs-view.html', name: 'Logs' }
  ],
  apis: [
    { path: '/api/health', name: 'Health API' },
    { path: '/api/agents', name: 'Agents API' },
    { path: '/api/tasks', name: 'Tasks API' },
    { path: '/api/deals', name: 'Deals API' },
    { path: '/api/logs/activity', name: 'Logs API' },
    { path: '/api/tokens', name: 'Tokens API' }
  ]
};

/**
 * Run quality gate (cron-friendly version)
 */
async function runQualityGateCron() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('              QUALITY GATE - CRON RUNNER');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`URL: ${CONFIG.baseUrl}`);
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: CONFIG.baseUrl,
    pages: [],
    apis: [],
    mobile: [],
    summary: {}
  };

  // Test pages
  console.log('📄 Testing Pages...');
  for (const page of CONFIG.pages) {
    const result = await testPage(page);
    results.pages.push(result);
    console.log(`   ${result.passed ? '✅' : '❌'} ${page.name}: ${result.status} (${result.loadTime}ms)`);
  }

  // Test APIs
  console.log('\n🔌 Testing API Endpoints...');
  for (const api of CONFIG.apis) {
    const result = await testAPI(api);
    results.apis.push(result);
    console.log(`   ${result.passed ? '✅' : '❌'} ${api.name}: ${result.status} (${result.isJSON ? 'JSON' : 'Not JSON'})`);
  }

  // Test mobile (meta tag verification)
  console.log('\n📱 Testing Mobile Responsiveness...');
  const mobileResult = await testMobile();
  results.mobile = mobileResult;
  console.log(`   ${mobileResult.passed ? '✅' : '❌'} Viewport meta tag: ${mobileResult.hasViewport ? 'Present' : 'Missing'}`);

  // Calculate score
  const pageScore = results.pages.filter(p => p.passed).length / results.pages.length;
  const apiScore = results.apis.filter(a => a.passed).length / results.apis.length;
  const mobileScore = mobileResult.passed ? 1 : 0;

  // Weights: Pages 40%, APIs 40%, Mobile 20%
  const totalScore = Math.round((pageScore * 0.4 + apiScore * 0.4 + mobileScore * 0.2) * 100);

  results.summary = {
    score: totalScore,
    status: totalScore >= CONFIG.passThreshold ? 'PASS' : 'FAIL',
    pagesPassed: results.pages.filter(p => p.passed).length,
    pagesTotal: results.pages.length,
    apisPassed: results.apis.filter(a => a.passed).length,
    apisTotal: results.apis.length,
    threshold: CONFIG.passThreshold
  };

  // Save report
  await saveReport(results);

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    QUALITY GATE RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Score: ${results.summary.score}/100`);
  console.log(`Status: ${results.summary.status}`);
  console.log(`Pages: ${results.summary.pagesPassed}/${results.summary.pagesTotal}`);
  console.log(`APIs: ${results.summary.apisPassed}/${results.summary.apisTotal}`);
  console.log('═══════════════════════════════════════════════════════════════');

  return results.summary.status === 'PASS';
}

/**
 * Test a page
 */
async function testPage(page) {
  const url = `${CONFIG.baseUrl}${page.path}`;
  const startTime = Date.now();

  try {
    const response = await fetch(url, { 
      method: 'GET',
      headers: { 'Accept': 'text/html' }
    });

    return {
      name: page.name,
      path: page.path,
      status: response.status,
      loadTime: Date.now() - startTime,
      passed: response.status === 200
    };
  } catch (error) {
    return {
      name: page.name,
      path: page.path,
      status: 0,
      loadTime: Date.now() - startTime,
      passed: false,
      error: error.message
    };
  }
}

/**
 * Test an API endpoint
 */
async function testAPI(api) {
  const url = `${CONFIG.baseUrl}${api.path}`;
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    const contentType = response.headers.get('content-type') || '';
    let isValidJSON = false;

    try {
      await response.json();
      isValidJSON = true;
    } catch {}

    return {
      name: api.name,
      path: api.path,
      status: response.status,
      loadTime: Date.now() - startTime,
      isJSON: contentType.includes('application/json'),
      isValidJSON,
      passed: response.status === 200 && contentType.includes('application/json') && isValidJSON
    };
  } catch (error) {
    return {
      name: api.name,
      path: api.path,
      status: 0,
      loadTime: Date.now() - startTime,
      isJSON: false,
      isValidJSON: false,
      passed: false,
      error: error.message
    };
  }
}

/**
 * Test mobile responsiveness (meta tag check)
 */
async function testMobile() {
  try {
    const response = await fetch(CONFIG.baseUrl);
    const html = await response.text();

    const hasViewport = html.includes('viewport');
    const hasWidthDevice = html.includes('width=device-width');

    return {
      hasViewport,
      hasWidthDeviceWidth: hasWidthDevice,
      passed: hasViewport && hasWidthDevice
    };
  } catch (error) {
    return {
      hasViewport: false,
      hasWidthDeviceWidth: false,
      passed: false,
      error: error.message
    };
  }
}

/**
 * Save report
 */
async function saveReport(results) {
  await fs.mkdir(CONFIG.outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(CONFIG.outputDir, `cron-quality-gate-${timestamp}.json`);
  const mdPath = path.join(CONFIG.outputDir, `cron-quality-gate-${timestamp}.md`);

  // Save JSON
  await fs.writeFile(jsonPath, JSON.stringify(results, null, 2));

  // Save Markdown
  const md = generateMarkdown(results);
  await fs.writeFile(mdPath, md);

  // Update latest
  await fs.writeFile(
    path.join(CONFIG.outputDir, 'latest-cron-report.json'),
    JSON.stringify(results, null, 2)
  );

  console.log(`\n📊 Reports saved to:`);
  console.log(`   ${jsonPath}`);
}

/**
 * Generate Markdown report
 */
function generateMarkdown(results) {
  const { summary } = results;
  const statusEmoji = summary.status === 'PASS' ? '✅' : '❌';

  return `# Quality Gate Report (Cron)
**Date:** ${new Date().toLocaleString()}  
**URL:** ${CONFIG.baseUrl}  
**Status:** ${statusEmoji} **${summary.status}**  
**Score:** ${summary.score}/100

## Summary
- **Pages:** ${summary.pagesPassed}/${summary.pagesTotal} passed
- **APIs:** ${summary.apisPassed}/${summary.apisTotal} passed
- **Mobile:** ${results.mobile.passed ? '✅' : '❌'} Viewport meta tag

## Page Tests
${results.pages.map(p => `- ${p.passed ? '✅' : '❌'} ${p.name}: ${p.status}`).join('\n')}

## API Tests
${results.apis.map(a => `- ${a.passed ? '✅' : '❌'} ${a.name}: ${a.status} ${a.isJSON ? '(JSON)' : ''}`).join('\n')}

---
*Generated by Quality Gate Cron Runner*
`;
}

// Run
runQualityGateCron()
  .then(passed => {
    process.exit(passed ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Quality gate error:', error);
    process.exit(1);
  });
