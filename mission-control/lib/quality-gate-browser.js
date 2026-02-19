/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QUALITY GATE - BROWSER AUTOMATION MODULE
 * Author: SubAgent (Browser Automation Setup)
 * Date: 2026-02-19
 * 
 * This module provides browser automation for quality gate testing:
 * - Console error detection
 * - Mobile viewport testing (375px, 768px, 1024px)
 * - Screenshot capture for visual regression
 * - Page load performance metrics
 * 
 * Supports: Puppeteer, Playwright, or OpenClaw Browser Tool
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: process.env.QUALITY_GATE_URL || 'https://dashboard-ten-sand-20.vercel.app',
  viewports: [
    { name: 'mobile', width: 375, height: 667, device: 'iPhone SE' },
    { name: 'tablet', width: 768, height: 1024, device: 'iPad Mini' },
    { name: 'desktop', width: 1024, height: 768, device: 'Small Desktop' }
  ],
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
  ],
  outputDir: path.join(__dirname, '../reports/quality-gate'),
  screenshotsDir: path.join(__dirname, '../reports/quality-gate/screenshots')
};

/**
 * Quality Gate Browser Automation Class
 */
class QualityGateBrowserAutomation {
  constructor(options = {}) {
    this.config = { ...CONFIG, ...options };
    this.results = {
      timestamp: new Date().toISOString(),
      baseUrl: this.config.baseUrl,
      pages: [],
      apis: [],
      mobile: [],
      consoleErrors: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        score: 0
      }
    };
    this.browser = null;
    this.browserType = null; // 'puppeteer', 'playwright', or 'fetch'
  }

  /**
   * Initialize browser automation
   */
  async init() {
    console.log('🔧 Initializing Quality Gate Browser Automation...');
    
    // Ensure output directories exist
    await fs.mkdir(this.config.outputDir, { recursive: true });
    await fs.mkdir(this.config.screenshotsDir, { recursive: true });
    
    // Try to initialize browser in order of preference
    await this.tryInitPuppeteer() || 
    await this.tryInitPlaywright() || 
    await this.initFetchMode();
    
    console.log(`✅ Browser automation ready (${this.browserType})`);
    return this;
  }

  /**
   * Try to initialize Puppeteer
   */
  async tryInitPuppeteer() {
    try {
      const puppeteer = require('puppeteer');
      
      // Check for system Chrome/Chromium
      const chromePath = await this.findChrome();
      
      this.browser = await puppeteer.launch({
        headless: 'new',
        executablePath: chromePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      
      this.browserType = 'puppeteer';
      console.log('🎭 Using Puppeteer for browser automation');
      return true;
    } catch (error) {
      console.log(`⚠️  Puppeteer not available: ${error.message}`);
      return false;
    }
  }

  /**
   * Try to initialize Playwright
   */
  async tryInitPlaywright() {
    try {
      const { chromium } = require('playwright');
      
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      this.browserType = 'playwright';
      console.log('🎭 Using Playwright for browser automation');
      return true;
    } catch (error) {
      console.log(`⚠️  Playwright not available: ${error.message}`);
      return false;
    }
  }

  /**
   * Initialize fetch-only mode (fallback)
   */
  async initFetchMode() {
    this.browserType = 'fetch';
    console.log('🌐 Using fetch-only mode (limited functionality)');
    console.log('   - Console error detection: Not available');
    console.log('   - Mobile viewport testing: Meta tag verification only');
    console.log('   - Screenshots: Not available');
  }

  /**
   * Find Chrome/Chromium executable
   */
  async findChrome() {
    const possiblePaths = [
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chrome',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    
    for (const chromePath of possiblePaths) {
      try {
        await fs.access(chromePath);
        console.log(`🔍 Found Chrome at: ${chromePath}`);
        return chromePath;
      } catch {
        continue;
      }
    }
    
    return undefined; // Let Puppeteer use bundled Chrome
  }

  /**
   * Run all quality gate tests
   */
  async runAllTests() {
    console.log('\n🚀 Starting Quality Gate Tests...\n');
    
    // 1. Test all pages
    await this.testPages();
    
    // 2. Test all API endpoints
    await this.testAPIs();
    
    // 3. Test mobile responsiveness
    await this.testMobileResponsiveness();
    
    // 4. Test console errors (browser only)
    if (this.browserType !== 'fetch') {
      await this.testConsoleErrors();
    }
    
    // Calculate final score
    this.calculateScore();
    
    // Save results
    await this.saveResults();
    
    return this.results;
  }

  /**
   * Test all pages
   */
  async testPages() {
    console.log('📄 Testing Pages...');
    
    for (const page of this.config.pages) {
      const result = await this.testPage(page);
      this.results.pages.push(result);
      this.logResult(result);
    }
  }

  /**
   * Test a single page
   */
  async testPage(pageConfig) {
    const url = `${this.config.baseUrl}${pageConfig.path}`;
    const startTime = Date.now();
    
    try {
      if (this.browserType === 'fetch') {
        // Fetch-only mode
        const response = await fetch(url, { 
          method: 'GET',
          headers: { 'Accept': 'text/html' }
        });
        
        const loadTime = Date.now() - startTime;
        const html = await response.text();
        
        return {
          name: pageConfig.name,
          path: pageConfig.path,
          url,
          status: response.status,
          loadTime,
          hasViewportMeta: html.includes('viewport'),
          hasResponsiveClasses: html.includes('media') || html.includes('flex') || html.includes('grid'),
          passed: response.status === 200,
          warnings: response.status === 200 ? [] : ['Non-200 status'],
          errors: []
        };
      } else {
        // Browser mode
        const page = await this.createPage();
        
        const response = await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        const loadTime = Date.now() - startTime;
        const html = await page.content();
        
        // Check for viewport meta
        const hasViewportMeta = await page.evaluate(() => {
          const viewport = document.querySelector('meta[name="viewport"]');
          return viewport !== null;
        });
        
        // Check for responsive CSS
        const hasResponsiveCSS = await page.evaluate(() => {
          const stylesheets = Array.from(document.styleSheets);
          return stylesheets.some(sheet => {
            try {
              const rules = Array.from(sheet.cssRules || sheet.rules || []);
              return rules.some(rule => rule.cssText && rule.cssText.includes('@media'));
            } catch {
              return false;
            }
          });
        });
        
        // Capture screenshot
        const screenshotPath = path.join(
          this.config.screenshotsDir, 
          `${pageConfig.name.replace(/\s+/g, '-').toLowerCase()}-desktop.png`
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });
        
        await page.close();
        
        return {
          name: pageConfig.name,
          path: pageConfig.path,
          url,
          status: response.status(),
          loadTime,
          hasViewportMeta,
          hasResponsiveCSS,
          screenshot: screenshotPath,
          passed: response.status() === 200,
          warnings: [],
          errors: []
        };
      }
    } catch (error) {
      return {
        name: pageConfig.name,
        path: pageConfig.path,
        url,
        status: 0,
        loadTime: Date.now() - startTime,
        hasViewportMeta: false,
        hasResponsiveCSS: false,
        passed: false,
        warnings: [],
        errors: [error.message]
      };
    }
  }

  /**
   * Test all API endpoints
   */
  async testAPIs() {
    console.log('🔌 Testing API Endpoints...');
    
    for (const api of this.config.apis) {
      const result = await this.testAPI(api);
      this.results.apis.push(result);
      this.logResult(result);
    }
  }

  /**
   * Test a single API endpoint
   */
  async testAPI(apiConfig) {
    const url = `${this.config.baseUrl}${apiConfig.path}`;
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const loadTime = Date.now() - startTime;
      const contentType = response.headers.get('content-type') || '';
      let body;
      
      try {
        body = await response.json();
      } catch {
        body = await response.text();
      }
      
      const isJSON = contentType.includes('application/json');
      const isValidJSON = typeof body === 'object' && body !== null;
      
      return {
        name: apiConfig.name,
        path: apiConfig.path,
        url,
        status: response.status,
        loadTime,
        contentType,
        isJSON,
        isValidJSON,
        passed: response.status === 200 && isJSON && isValidJSON,
        warnings: !isJSON ? ['Response is not JSON'] : [],
        errors: response.status !== 200 ? [`HTTP ${response.status}`] : []
      };
    } catch (error) {
      return {
        name: apiConfig.name,
        path: apiConfig.path,
        url,
        status: 0,
        loadTime: Date.now() - startTime,
        contentType: '',
        isJSON: false,
        isValidJSON: false,
        passed: false,
        warnings: [],
        errors: [error.message]
      };
    }
  }

  /**
   * Test mobile responsiveness at different viewports
   */
  async testMobileResponsiveness() {
    console.log('📱 Testing Mobile Responsiveness...');
    
    // Test the main page at different viewports
    const testPage = this.config.pages[0]; // HQ Dashboard
    
    for (const viewport of this.config.viewports) {
      const result = await this.testViewport(testPage, viewport);
      this.results.mobile.push(result);
      this.logResult(result);
    }
  }

  /**
   * Test a page at a specific viewport
   */
  async testViewport(pageConfig, viewport) {
    const url = `${this.config.baseUrl}${pageConfig.path}`;
    
    try {
      if (this.browserType === 'fetch') {
        // In fetch mode, we can only verify meta tags
        const response = await fetch(url);
        const html = await response.text();
        
        return {
          page: pageConfig.name,
          viewport: viewport.name,
          device: viewport.device,
          width: viewport.width,
          height: viewport.height,
          hasViewportMeta: html.includes('viewport'),
          hasResponsiveMeta: html.includes('width=device-width'),
          screenshot: null,
          passed: html.includes('viewport') && html.includes('width=device-width'),
          warnings: [],
          errors: []
        };
      } else {
        // Browser mode - full testing
        const page = await this.createPage();
        
        await page.setViewport({
          width: viewport.width,
          height: viewport.height,
          deviceScaleFactor: viewport.name === 'mobile' ? 2 : 1
        });
        
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Check for horizontal scroll (indicates non-responsive)
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        
        // Check for touch-friendly elements
        const touchTargets = await page.evaluate(() => {
          const buttons = document.querySelectorAll('button, a, input, select, textarea');
          let smallTargets = 0;
          buttons.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
              smallTargets++;
            }
          });
          return { total: buttons.length, small: smallTargets };
        });
        
        // Capture screenshot
        const screenshotPath = path.join(
          this.config.screenshotsDir,
          `${pageConfig.name.replace(/\s+/g, '-').toLowerCase()}-${viewport.name}.png`
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });
        
        await page.close();
        
        return {
          page: pageConfig.name,
          viewport: viewport.name,
          device: viewport.device,
          width: viewport.width,
          height: viewport.height,
          hasHorizontalScroll,
          touchTargets,
          screenshot: screenshotPath,
          passed: !hasHorizontalScroll && touchTargets.small < touchTargets.total * 0.5,
          warnings: touchTargets.small > 0 ? [`${touchTargets.small} small touch targets`] : [],
          errors: hasHorizontalScroll ? ['Horizontal scroll detected - not fully responsive'] : []
        };
      }
    } catch (error) {
      return {
        page: pageConfig.name,
        viewport: viewport.name,
        device: viewport.device,
        width: viewport.width,
        height: viewport.height,
        hasHorizontalScroll: false,
        touchTargets: { total: 0, small: 0 },
        screenshot: null,
        passed: false,
        warnings: [],
        errors: [error.message]
      };
    }
  }

  /**
   * Test for console errors
   */
  async testConsoleErrors() {
    console.log('🐛 Testing Console Errors...');
    
    const testPage = this.config.pages[0]; // HQ Dashboard
    const url = `${this.config.baseUrl}${testPage.path}`;
    
    try {
      const page = await this.createPage();
      const errors = [];
      const warnings = [];
      
      // Listen for console messages
      page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        
        if (type === 'error') {
          errors.push({ type, message: text });
        } else if (type === 'warning') {
          warnings.push({ type, message: text });
        }
      });
      
      // Listen for page errors
      page.on('pageerror', error => {
        errors.push({ type: 'pageerror', message: error.message });
      });
      
      // Navigate to page
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // Wait a bit for any async errors
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await page.close();
      
      this.results.consoleErrors = {
        page: testPage.name,
        url,
        errors,
        warnings,
        passed: errors.length === 0,
        errorCount: errors.length,
        warningCount: warnings.length
      };
      
      console.log(`   ${errors.length === 0 ? '✅' : '❌'} ${testPage.name}: ${errors.length} errors, ${warnings.length} warnings`);
      
    } catch (error) {
      this.results.consoleErrors = {
        page: testPage.name,
        url,
        errors: [{ type: 'test-error', message: error.message }],
        warnings: [],
        passed: false,
        errorCount: 1,
        warningCount: 0
      };
    }
  }

  /**
   * Create a new browser page
   */
  async createPage() {
    if (this.browserType === 'puppeteer') {
      return await this.browser.newPage();
    } else if (this.browserType === 'playwright') {
      return await this.browser.newPage();
    }
    throw new Error('Browser not initialized');
  }

  /**
   * Calculate overall quality score
   */
  calculateScore() {
    let totalScore = 0;
    let maxScore = 0;
    
    // Page tests (20 points max)
    const pageScore = this.results.pages.filter(p => p.passed).length / this.results.pages.length * 20;
    totalScore += pageScore;
    maxScore += 20;
    
    // API tests (20 points max)
    const apiScore = this.results.apis.filter(a => a.passed).length / this.results.apis.length * 20;
    totalScore += apiScore;
    maxScore += 20;
    
    // Mobile tests (30 points max)
    const mobileScore = this.results.mobile.filter(m => m.passed).length / this.results.mobile.length * 30;
    totalScore += mobileScore;
    maxScore += 30;
    
    // Console error tests (30 points max)
    if (this.results.consoleErrors) {
      const consoleScore = this.results.consoleErrors.passed ? 30 : Math.max(0, 30 - this.results.consoleErrors.errorCount * 5);
      totalScore += consoleScore;
      maxScore += 30;
    }
    
    this.results.summary = {
      totalTests: this.results.pages.length + this.results.apis.length + this.results.mobile.length + (this.results.consoleErrors ? 1 : 0),
      passed: this.results.pages.filter(p => p.passed).length + 
              this.results.apis.filter(a => a.passed).length + 
              this.results.mobile.filter(m => m.passed).length + 
              (this.results.consoleErrors?.passed ? 1 : 0),
      failed: this.results.pages.filter(p => !p.passed).length + 
              this.results.apis.filter(a => !a.passed).length + 
              this.results.mobile.filter(m => !m.passed).length + 
              (this.results.consoleErrors && !this.results.consoleErrors.passed ? 1 : 0),
      warnings: this.results.pages.reduce((sum, p) => sum + p.warnings.length, 0) +
                this.results.apis.reduce((sum, a) => sum + a.warnings.length, 0) +
                this.results.mobile.reduce((sum, m) => sum + m.warnings.length, 0),
      score: Math.round(totalScore)
    };
    
    // Determine status
    this.results.summary.status = this.results.summary.score >= 95 ? 'PASS' : 
                                   this.results.summary.score >= 80 ? 'WARNING' : 'FAIL';
  }

  /**
   * Save results to file
   */
  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(this.config.outputDir, `quality-gate-report-${timestamp}.json`);
    const markdownPath = path.join(this.config.outputDir, `quality-gate-report-${timestamp}.md`);
    
    // Save JSON
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    
    // Save Markdown report
    const markdown = this.generateMarkdownReport();
    await fs.writeFile(markdownPath, markdown);
    
    // Save latest symlink/reference
    const latestJson = path.join(this.config.outputDir, 'latest-report.json');
    const latestMd = path.join(this.config.outputDir, 'latest-report.md');
    
    try {
      await fs.unlink(latestJson);
      await fs.unlink(latestMd);
    } catch {}
    
    await fs.writeFile(latestJson, JSON.stringify(this.results, null, 2));
    await fs.writeFile(latestMd, markdown);
    
    console.log(`\n📊 Reports saved:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   Markdown: ${markdownPath}`);
  }

  /**
   * Generate Markdown report
   */
  generateMarkdownReport() {
    const { summary } = this.results;
    const statusEmoji = summary.status === 'PASS' ? '✅' : summary.status === 'WARNING' ? '⚠️' : '❌';
    
    let md = `# Quality Gate Report
**Date:** ${new Date().toLocaleString()}  
**URL:** ${this.config.baseUrl}  
**Status:** ${statusEmoji} **${summary.status}**  
**Score:** ${summary.score}/100

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${summary.totalTests} |
| Passed | ${summary.passed} ✅ |
| Failed | ${summary.failed} ❌ |
| Warnings | ${summary.warnings} ⚠️ |
| **Overall Score** | **${summary.score}/100** |

---

## Page Load Tests

| Page | Status | Load Time | Viewport | Responsive |
|------|--------|-----------|----------|------------|
`;

    for (const page of this.results.pages) {
      const status = page.passed ? '✅' : '❌';
      const loadTime = page.loadTime ? `${page.loadTime}ms` : 'N/A';
      const viewport = page.hasViewportMeta ? '✅' : '❌';
      const responsive = page.hasResponsiveCSS || page.hasResponsiveClasses ? '✅' : '❌';
      md += `| ${page.name} | ${status} | ${loadTime} | ${viewport} | ${responsive} |\n`;
    }

    md += `
---

## API Endpoint Tests

| Endpoint | Status | Response Type | Valid JSON |
|----------|--------|---------------|------------|
`;

    for (const api of this.results.apis) {
      const status = api.passed ? '✅' : '❌';
      const contentType = api.isJSON ? 'JSON' : api.contentType || 'Unknown';
      const validJson = api.isValidJSON ? '✅' : '❌';
      md += `| ${api.name} | ${status} | ${contentType} | ${validJson} |\n`;
    }

    md += `
---

## Mobile Responsiveness Tests

| Viewport | Device | Width | Status | Issues |
|----------|--------|-------|--------|--------|
`;

    for (const mobile of this.results.mobile) {
      const status = mobile.passed ? '✅' : '❌';
      const issues = [...mobile.warnings, ...mobile.errors].join(', ') || 'None';
      md += `| ${mobile.viewport} | ${mobile.device} | ${mobile.width}px | ${status} | ${issues} |\n`;
    }

    if (this.results.consoleErrors) {
      md += `
---

## Console Error Detection

| Check | Status | Count |
|-------|--------|-------|
`;
      const consoleStatus = this.results.consoleErrors.passed ? '✅' : '❌';
      md += `| Console Errors | ${consoleStatus} | ${this.results.consoleErrors.errorCount} |\n`;
      md += `| Warnings | ⚠️ | ${this.results.consoleErrors.warningCount} |\n`;
      
      if (this.results.consoleErrors.errors.length > 0) {
        md += `
### Errors Found:
`;
        for (const error of this.results.consoleErrors.errors.slice(0, 10)) {
          md += `- [${error.type}] ${error.message}\n`;
        }
        if (this.results.consoleErrors.errors.length > 10) {
          md += `- ... and ${this.results.consoleErrors.errors.length - 10} more\n`;
        }
      }
    }

    md += `
---

## Screenshots

Screenshots captured at:
`;

    for (const mobile of this.results.mobile) {
      if (mobile.screenshot) {
        md += `- ${mobile.viewport}: \`${mobile.screenshot}\`\n`;
      }
    }

    md += `
---

*Report generated by Quality Gate Browser Automation*
`;

    return md;
  }

  /**
   * Log a test result
   */
  logResult(result) {
    const status = result.passed ? '✅' : '❌';
    const name = result.name || result.page || result.viewport || 'Unknown';
    console.log(`   ${status} ${name}`);
    
    if (result.errors && result.errors.length > 0) {
      for (const error of result.errors) {
        console.log(`      ❌ ${error}`);
      }
    }
    
    if (result.warnings && result.warnings.length > 0) {
      for (const warning of result.warnings) {
        console.log(`      ⚠️  ${warning}`);
      }
    }
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      if (this.browserType === 'puppeteer') {
        await this.browser.close();
      } else if (this.browserType === 'playwright') {
        await this.browser.close();
      }
      console.log('\n🔒 Browser closed');
    }
  }
}

/**
 * Run quality gate tests (CLI entry point)
 */
async function runQualityGate() {
  const automation = new QualityGateBrowserAutomation();
  
  try {
    await automation.init();
    const results = await automation.runAllTests();
    await automation.close();
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                    QUALITY GATE RESULTS                       ');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Status: ${results.summary.status}`);
    console.log(`Score: ${results.summary.score}/100`);
    console.log(`Passed: ${results.summary.passed}/${results.summary.totalTests}`);
    console.log('═══════════════════════════════════════════════════════════════');
    
    // Exit with appropriate code
    process.exit(results.summary.status === 'PASS' ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Quality gate failed:', error.message);
    await automation.close();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runQualityGate();
}

module.exports = { QualityGateBrowserAutomation, runQualityGate };
