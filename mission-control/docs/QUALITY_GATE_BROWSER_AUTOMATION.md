# Quality Gate Browser Automation

**Date:** 2026-02-19  
**Author:** SubAgent (Browser Automation Setup)

---

## Overview

This document describes the browser automation setup for the Mission Control Quality Gate system. The quality gate now supports automated testing of:

1. **Page Load Tests** - Verify all pages load correctly
2. **API Endpoint Tests** - Verify APIs return valid JSON
3. **Functionality Tests** - Check static resources
4. **Response Quality Tests** - Verify headers and compression
5. **Mobile Responsive Tests** - Test at 375px, 768px, 1024px viewports
6. **Console Error Detection** - Capture JavaScript errors

---

## Quick Start

### Run Quality Gate (Fetch Mode - No Browser Required)

```bash
cd /root/.openclaw/workspace/mission-control
npm run quality-gate:cron
```

### Run Full Quality Gate (Requires Chrome/Chromium)

```bash
cd /root/.openclaw/workspace/mission-control
npm run quality-gate
```

### Setup Browser Automation

```bash
cd /root/.openclaw/workspace/mission-control
npm run setup:browser
```

---

## Available Scripts

| Script | Description | Browser Required |
|--------|-------------|------------------|
| `npm run quality-gate:cron` | Lightweight cron-friendly tests | No |
| `npm run quality-gate` | Full integrated quality gate | Yes (optional) |
| `npm run quality-gate:browser` | Standalone browser automation | Yes (optional) |
| `npm run setup:browser` | Install Chrome/Chromium | - |

---

## Test Categories

### 1. Page Load Tests (15% weight)

Tests all 9 pages:
- HQ Dashboard
- Task Board
- Agents
- Office
- DealFlow
- Token Tracker
- Scout
- Data Viewer
- Logs

**Verifies:**
- HTTP 200 status
- Page load time
- Title tag present
- Viewport meta tag

### 2. API Endpoint Tests (25% weight)

Tests all 6 API endpoints:
- Health API
- Agents API
- Tasks API
- Deals API
- Logs API
- Tokens API

**Verifies:**
- HTTP 200 status
- Content-Type: application/json
- Valid JSON response

### 3. Functionality Tests (15% weight)

**Verifies:**
- JavaScript files accessible
- CSS files accessible
- Static resources load correctly

### 4. Response Quality Tests (10% weight)

**Verifies:**
- CORS headers present
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Compression enabled (gzip/brotli)

### 5. Mobile Responsive Tests (20% weight)

Tests at 3 viewport sizes:
- **Mobile:** 375px × 667px (iPhone SE)
- **Tablet:** 768px × 1024px (iPad Mini)
- **Desktop:** 1024px × 768px (Small Desktop)

**Verifies:**
- Viewport meta tag present
- No horizontal scroll
- Touch targets appropriately sized
- Responsive CSS media queries

### 6. Console Error Detection (15% weight)

**Verifies:**
- No JavaScript console errors
- No unhandled exceptions
- Warnings documented

---

## Scoring

| Score | Status | Action |
|-------|--------|--------|
| ≥95 | ✅ PASS | Deployment approved |
| 80-94 | ⚠️ WARNING | Review recommended |
| <80 | ❌ FAIL | Fix issues before deploy |

---

## Configuration

### Environment Variables

```bash
# Set target URL
QUALITY_GATE_URL=https://dashboard-ten-sand-20.vercel.app

# Run with custom URL
QUALITY_GATE_URL=https://staging.example.com npm run quality-gate
```

### Threshold Configuration

Edit the threshold in the quality gate files:

```javascript
// lib/quality-gate-integrated.js
const CONFIG = {
  passThreshold: 95  // Adjust as needed
};
```

---

## Output

### Report Files

Reports are saved to `reports/quality-gate/`:

```
reports/quality-gate/
├── integrated-quality-gate-2026-02-19T00-00-00-000Z.json
├── integrated-quality-gate-2026-02-19T00-00-00-000Z.md
├── cron-quality-gate-2026-02-19T00-00-00-000Z.json
├── cron-quality-gate-2026-02-19T00-00-00-000Z.md
├── latest-integrated-report.json
├── latest-integrated-report.md
└── latest-cron-report.json
```

### Screenshots (Browser Mode)

When running with browser automation, screenshots are captured:

```
reports/quality-gate/screenshots/
├── hq-dashboard-desktop.png
├── hq-dashboard-mobile.png
├── hq-dashboard-tablet.png
├── task-board-desktop.png
└── ...
```

---

## Browser Automation Modes

### Mode 1: Fetch-Only (Default)

**Pros:**
- No browser installation required
- Fast execution
- Works in any environment

**Cons:**
- Cannot detect console errors
- Limited mobile testing (meta tags only)
- No screenshots

### Mode 2: Puppeteer/Playwright (Full)

**Pros:**
- Full console error detection
- Real viewport testing
- Screenshot capture
- JavaScript execution testing

**Cons:**
- Requires Chrome/Chromium installation
- Slower execution
- More resource intensive

---

## Installation

### Option A: Automatic Setup

```bash
cd /root/.openclaw/workspace/mission-control
npm run setup:browser
```

### Option B: Manual Setup

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser
```

**macOS (with Homebrew):**
```bash
brew install --cask google-chrome
```

**Install Playwright browsers:**
```bash
cd /root/.openclaw/workspace/mission-control
npx playwright install chromium
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Quality Gate

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd mission-control
          npm install
      
      - name: Run Quality Gate
        run: |
          cd mission-control
          npm run quality-gate:cron
```

### Vercel Integration

Add to `vercel.json`:

```json
{
  "github": {
    "silent": true,
    "autoJobCancelation": true
  }
}
```

---

## Troubleshooting

### Issue: "Chrome not found"

**Solution:**
```bash
npm run setup:browser
```

Or use fetch-only mode:
```bash
npm run quality-gate:cron
```

### Issue: "Tests timeout"

**Solution:**
Increase timeout in the test configuration:

```javascript
// lib/quality-gate-browser.js
const response = await page.goto(url, { 
  waitUntil: 'networkidle2',
  timeout: 60000  // Increase from 30000
});
```

### Issue: "Low score due to missing CSS files"

**Note:** Some CSS files are optional and return 404. This is expected behavior and doesn't affect the actual functionality.

---

## Files Reference

| File | Description |
|------|-------------|
| `lib/quality-gate-browser.js` | Core browser automation module |
| `lib/quality-gate-integrated.js` | Full integrated quality gate |
| `lib/quality-gate-cron.js` | Lightweight cron runner |
| `scripts/setup-browser-automation.sh` | Browser setup script |
| `cron/quality-gate.cron` | Cron configuration |

---

## Next Steps

1. **Install Chrome/Chromium** for full browser automation:
   ```bash
   npm run setup:browser
   ```

2. **Test the setup:**
   ```bash
   npm run quality-gate
   ```

3. **Integrate with CI/CD:**
   - Add to GitHub Actions
   - Configure Vercel deployment hooks
   - Set up Slack/Telegram notifications

4. **Monitor reports:**
   - Check `reports/quality-gate/` for detailed results
   - Review screenshots for visual regression
   - Track score trends over time

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the generated report files
3. Run with verbose logging: `DEBUG=1 npm run quality-gate`
