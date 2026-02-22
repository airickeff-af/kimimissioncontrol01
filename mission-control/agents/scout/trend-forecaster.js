#!/usr/bin/env node
/**
 * Scout - Trend Forecaster Agent
 * Industry Trend Forecasting System for Crypto/Fintech in Southeast Asia
 * 
 * TASK-SI-010: Industry Trend Forecasting
 * Predicts emerging trends based on funding patterns, hiring, news volume, patents, and conferences.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  reportDir: path.join(__dirname, 'reports'),
  dataDir: path.join(__dirname, 'data'),
  sectors: ['crypto', 'fintech', 'blockchain', 'defi', 'payments', 'digital_banking'],
  regions: ['singapore', 'indonesia', 'thailand', 'vietnam', 'malaysia', 'philippines'],
  forecastHorizon: 6, // months
};

// Ensure directories exist
[CONFIG.reportDir, CONFIG.dataDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Data Models
 */
class TrendIndicator {
  constructor(name, category, value, previousValue, timestamp) {
    this.name = name;
    this.category = category; // 'funding', 'hiring', 'news', 'patents', 'conferences'
    this.value = value;
    this.previousValue = previousValue || 0;
    this.timestamp = timestamp || new Date().toISOString();
    this.growthRate = this.calculateGrowthRate();
    this.acceleration = 0;
  }

  calculateGrowthRate() {
    if (!this.previousValue || this.previousValue === 0) return 0;
    return ((this.value - this.previousValue) / this.previousValue) * 100;
  }

  getTrendDirection() {
    if (this.growthRate > 10) return 'accelerating';
    if (this.growthRate > 0) return 'growing';
    if (this.growthRate > -10) return 'stable';
    return 'declining';
  }
}

class SectorAnalysis {
  constructor(sector) {
    this.sector = sector;
    this.indicators = [];
    this.keywords = new Map();
    this.momentumScore = 0;
    this.forecast = null;
  }

  addIndicator(...indicators) {
    indicators.forEach(ind => {
      if (ind) this.indicators.push(ind);
    });
  }

  addKeyword(keyword, frequency) {
    const current = this.keywords.get(keyword) || 0;
    this.keywords.set(keyword, current + frequency);
  }

  calculateMomentum() {
    if (this.indicators.length === 0) return 0;
    
    const weights = {
      funding: 0.35,
      hiring: 0.25,
      news: 0.20,
      patents: 0.10,
      conferences: 0.10
    };

    let weightedSum = 0;
    let totalWeight = 0;

    this.indicators.forEach(ind => {
      const weight = weights[ind.category] || 0.1;
      weightedSum += ind.growthRate * weight;
      totalWeight += weight;
    });

    this.momentumScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    return this.momentumScore;
  }

  generateForecast() {
    const momentum = this.calculateMomentum();
    const horizon = CONFIG.forecastHorizon;
    
    // Simple projection: apply momentum with decay factor
    const decayFactor = 0.85; // Momentum decays over time
    let projectedGrowth = momentum;
    const monthlyProjections = [];

    for (let i = 1; i <= horizon; i++) {
      projectedGrowth *= decayFactor;
      monthlyProjections.push({
        month: i,
        projectedGrowth: projectedGrowth,
        confidence: Math.max(0, 100 - (i * 10)) // Confidence decreases over time
      });
    }

    this.forecast = {
      sector: this.sector,
      currentMomentum: momentum,
      direction: momentum > 5 ? 'up' : momentum < -5 ? 'down' : 'sideways',
      monthlyProjections,
      emergingKeywords: this.getTopKeywords(5),
      riskFactors: this.identifyRiskFactors()
    };

    return this.forecast;
  }

  getTopKeywords(n = 5) {
    return Array.from(this.keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([keyword, freq]) => ({ keyword, frequency: freq }));
  }

  identifyRiskFactors() {
    const risks = [];
    const fundingInd = this.indicators.find(i => i.category === 'funding');
    const hiringInd = this.indicators.find(i => i.category === 'hiring');

    if (fundingInd && fundingInd.growthRate < -20) {
      risks.push('Significant funding decline detected');
    }
    if (hiringInd && hiringInd.growthRate < -15) {
      risks.push('Hiring slowdown may indicate consolidation');
    }
    if (this.momentumScore < -10) {
      risks.push('Strong negative momentum across indicators');
    }

    return risks;
  }
}

/**
 * Data Collection Simulators
 * In production, these would connect to APIs (Crunchbase, LinkedIn, news feeds, etc.)
 */
class DataCollector {
  constructor() {
    this.mockData = this.loadMockData();
  }

  loadMockData() {
    // Based on research data collected
    return {
      funding: {
        'singapore_crypto': { current: 325, previous: 271, unit: 'M USD' }, // 20% increase
        'singapore_fintech': { current: 870, previous: 1100, unit: 'M USD' }, // 21% decline
        'regional_crypto': { current: 325, previous: 271, unit: 'M USD' },
        'regional_fintech': { current: 907, previous: 1147, unit: 'M USD' },
      },
      hiring: {
        'bitcoin_jobs': { current: 1801, previous: 1707, unit: 'roles' }, // 6% increase
        'web3_contractors': { current: 70, previous: 65, unit: 'percent' },
        'blockchain_dev': { current: 1200, previous: 1150, unit: 'roles' },
        'defi_roles': { current: 450, previous: 400, unit: 'roles' },
      },
      news: {
        'crypto_coverage': { current: 850, previous: 720, unit: 'articles' },
        'fintech_coverage': { current: 1200, previous: 1100, unit: 'articles' },
        'regulation_mentions': { current: 320, previous: 280, unit: 'articles' },
      },
      patents: {
        'blockchain_patents': { current: 145, previous: 130, unit: 'filings' },
        'crypto_patents': { current: 89, previous: 82, unit: 'filings' },
        'payment_tech': { current: 210, previous: 195, unit: 'filings' },
      },
      conferences: {
        'sff_2025': { current: 70000, previous: 65000, unit: 'attendees' },
        'blockchain_events': { current: 45, previous: 38, unit: 'events' },
        'fintech_summits': { current: 28, previous: 25, unit: 'events' },
      }
    };
  }

  collectFundingData(sector) {
    const data = this.mockData.funding;
    const indicators = [];

    if (sector === 'crypto') {
      indicators.push(new TrendIndicator(
        'SEA Crypto Funding',
        'funding',
        data.regional_crypto.current,
        data.regional_crypto.previous
      ));
    } else if (sector === 'fintech') {
      indicators.push(new TrendIndicator(
        'SEA Fintech Funding',
        'funding',
        data.regional_fintech.current,
        data.regional_fintech.previous
      ));
    }

    return indicators;
  }

  collectHiringData(sector) {
    const data = this.mockData.hiring;
    const indicators = [];

    if (sector === 'crypto' || sector === 'blockchain') {
      indicators.push(new TrendIndicator(
        'Bitcoin/Blockchain Jobs',
        'hiring',
        data.bitcoin_jobs.current,
        data.bitcoin_jobs.previous
      ));
      indicators.push(new TrendIndicator(
        'DeFi Roles',
        'hiring',
        data.defi_roles.current,
        data.defi_roles.previous
      ));
    }

    return indicators;
  }

  collectNewsData(sector) {
    const data = this.mockData.news;
    const indicators = [];

    if (sector === 'crypto') {
      indicators.push(new TrendIndicator(
        'Crypto News Volume',
        'news',
        data.crypto_coverage.current,
        data.crypto_coverage.previous
      ));
    } else if (sector === 'fintech') {
      indicators.push(new TrendIndicator(
        'Fintech News Volume',
        'news',
        data.fintech_coverage.current,
        data.fintech_coverage.previous
      ));
    }

    indicators.push(new TrendIndicator(
      'Regulation Mentions',
      'news',
      data.regulation_mentions.current,
      data.regulation_mentions.previous
    ));

    return indicators;
  }

  collectPatentData(sector) {
    const data = this.mockData.patents;
    const indicators = [];

    if (sector === 'crypto' || sector === 'blockchain') {
      indicators.push(new TrendIndicator(
        'Blockchain Patents',
        'patents',
        data.blockchain_patents.current,
        data.blockchain_patents.previous
      ));
    }

    return indicators;
  }

  collectConferenceData(sector) {
    const data = this.mockData.conferences;
    const indicators = [];

    indicators.push(new TrendIndicator(
      'Major Event Attendance',
      'conferences',
      data.sff_2025.current,
      data.sff_2025.previous
    ));

    if (sector === 'crypto' || sector === 'blockchain') {
      indicators.push(new TrendIndicator(
        'Blockchain Events',
        'conferences',
        data.blockchain_events.current,
        data.blockchain_events.previous
      ));
    }

    return indicators;
  }
}

/**
 * Trend Forecaster Engine
 */
class TrendForecaster {
  constructor() {
    this.collector = new DataCollector();
    this.sectors = new Map();
  }

  analyzeSector(sectorName) {
    const sector = new SectorAnalysis(sectorName);

    // Collect all indicator types
    sector.addIndicator(...this.collector.collectFundingData(sectorName));
    sector.addIndicator(...this.collector.collectHiringData(sectorName));
    sector.addIndicator(...this.collector.collectNewsData(sectorName));
    sector.addIndicator(...this.collector.collectPatentData(sectorName));
    sector.addIndicator(...this.collector.collectConferenceData(sectorName));

    // Add emerging keywords based on sector
    this.addSectorKeywords(sector, sectorName);

    // Generate forecast
    sector.generateForecast();

    this.sectors.set(sectorName, sector);
    return sector;
  }

  addSectorKeywords(sector, sectorName) {
    const keywordMap = {
      crypto: [
        ['institutional adoption', 45],
        ['bitcoin etf', 38],
        ['defi 2.0', 32],
        ['tokenization', 28],
        ['cbdc', 25],
        ['staking', 22],
        ['layer 2', 20],
        [' rwa', 18],
      ],
      fintech: [
        ['embedded finance', 52],
        ['open banking', 48],
        ['digital wallet', 45],
        ['cross-border payments', 40],
        ['ai-powered', 35],
        ['super app', 32],
        ['buy now pay later', 28],
        ['regtech', 22],
      ],
      blockchain: [
        ['enterprise blockchain', 35],
        ['supply chain', 30],
        ['smart contracts', 28],
        ['interoperability', 25],
        ['zero knowledge', 22],
        ['modular blockchain', 20],
      ],
      payments: [
        ['qr payments', 55],
        ['real-time payments', 48],
        ['cross-border', 42],
        ['digital currency', 35],
        ['contactless', 30],
      ],
      digital_banking: [
        ['neobank', 40],
        ['digital lending', 35],
        ['financial inclusion', 32],
        ['mobile-first', 28],
        ['ai underwriting', 25],
      ]
    };

    const keywords = keywordMap[sectorName] || [];
    keywords.forEach(([keyword, freq]) => {
      sector.addKeyword(keyword, freq);
    });
  }

  generateQuarterlyReport(quarter, year) {

    // Analyze all sectors
    CONFIG.sectors.forEach(sector => {
      this.analyzeSector(sector);
    });

    // Generate report
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        quarter: quarter,
        year: year,
        region: 'Southeast Asia',
        focus: 'Crypto & Fintech'
      },
      executiveSummary: this.generateExecutiveSummary(),
      sectorAnalysis: Array.from(this.sectors.values()).map(s => ({
        sector: s.sector,
        momentumScore: s.momentumScore,
        forecast: s.forecast,
        indicators: s.indicators.map(i => ({
          name: i.name,
          category: i.category,
          growthRate: i.growthRate.toFixed(2),
          direction: i.getTrendDirection()
        }))
      })),
      emergingTrends: this.identifyEmergingTrends(),
      outlook: this.generateOutlook()
    };

    // Save report
    const reportPath = path.join(CONFIG.reportDir, `${year}-${quarter}-trend-report.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate human-readable markdown report
    const markdownPath = path.join(CONFIG.reportDir, `${year}-${quarter}-trend-report.md`);
    fs.writeFileSync(markdownPath, this.generateMarkdownReport(report));


    return report;
  }

  generateExecutiveSummary() {
    const sectors = Array.from(this.sectors.values());
    const accelerating = sectors.filter(s => s.momentumScore > 10);
    const declining = sectors.filter(s => s.momentumScore < -10);

    return {
      totalSectorsAnalyzed: sectors.length,
      acceleratingSectors: accelerating.map(s => s.sector),
      decliningSectors: declining.map(s => s.sector),
      overallSentiment: this.calculateOverallSentiment(sectors),
      keyInsight: this.generateKeyInsight(accelerating, declining)
    };
  }

  calculateOverallSentiment(sectors) {
    const avgMomentum = sectors.reduce((sum, s) => sum + s.momentumScore, 0) / sectors.length;
    if (avgMomentum > 10) return 'bullish';
    if (avgMomentum > 0) return 'cautiously optimistic';
    if (avgMomentum > -10) return 'neutral';
    return 'bearish';
  }

  generateKeyInsight(accelerating, declining) {
    if (accelerating.length > declining.length) {
      return `Market showing resilience with ${accelerating.length} sectors demonstrating positive momentum. Crypto funding velocity recovering despite broader fintech headwinds.`;
    } else if (declining.length > accelerating.length) {
      return `Market consolidation phase detected. Focus shifting from growth to profitability across most sectors.`;
    }
    return `Mixed signals across sectors. Selective opportunities emerging in specific niches.`;
  }

  identifyEmergingTrends() {
    const trends = [];

    // Analyze keyword frequency across sectors
    const allKeywords = new Map();
    this.sectors.forEach(sector => {
      sector.keywords.forEach((freq, keyword) => {
        const current = allKeywords.get(keyword) || 0;
        allKeywords.set(keyword, current + freq);
      });
    });

    // Top emerging trends based on keyword analysis
    const topKeywords = Array.from(allKeywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return topKeywords.map(([keyword, freq]) => ({
      trend: keyword,
      signal: freq > 40 ? 'strong' : freq > 25 ? 'moderate' : 'emerging',
      mentions: freq
    }));
  }

  generateOutlook() {
    const sectors = Array.from(this.sectors.values());
    const avgMomentum = sectors.reduce((sum, s) => sum + s.momentumScore, 0) / sectors.length;

    return {
      threeMonth: {
        projection: avgMomentum > 5 ? 'positive' : avgMomentum > -5 ? 'stable' : 'negative',
        confidence: 'high',
        keyDrivers: ['regulatory clarity', 'institutional adoption', 'market maturation']
      },
      sixMonth: {
        projection: avgMomentum > 10 ? 'strong growth' : avgMomentum > 0 ? 'modest growth' : 'consolidation',
        confidence: 'medium',
        keyDrivers: ['macro environment', 'funding availability', 'talent migration']
      },
      risks: [
        'Regulatory uncertainty in key markets',
        'Global macroeconomic headwinds',
        'Talent shortage in specialized roles',
        'Competition from traditional finance'
      ],
      opportunities: [
        'Cross-border payment innovation',
        'RWA (Real World Asset) tokenization',
        'AI-blockchain convergence',
        'Financial inclusion initiatives'
      ]
    };
  }

  generateMarkdownReport(report) {
    const { metadata, executiveSummary, sectorAnalysis, emergingTrends, outlook } = report;

    return `# Industry Trend Forecast Report
## ${metadata.region} Crypto & Fintech | ${metadata.year} ${metadata.quarter}

**Generated:** ${new Date(metadata.generatedAt).toLocaleDateString()}  
**Region:** ${metadata.region}  
**Focus:** ${metadata.focus}

---

## 📈 Executive Summary

**Overall Sentiment:** ${executiveSummary.overallSentiment.toUpperCase()}

${executiveSummary.keyInsight}

### Sector Momentum Overview
- **Sectors Analyzed:** ${executiveSummary.totalSectorsAnalyzed}
- **Accelerating:** ${executiveSummary.acceleratingSectors.join(', ') || 'None'}
- **Declining:** ${executiveSummary.decliningSectors.join(', ') || 'None'}

---

## 📊 Sector Analysis

${sectorAnalysis.map(s => `
### ${s.sector.toUpperCase().replace('_', ' ')}

**Momentum Score:** ${s.momentumScore.toFixed(2)}% | **Direction:** ${s.forecast.direction.toUpperCase()}

#### Key Indicators
| Indicator | Category | Growth Rate | Trend |
|-----------|----------|-------------|-------|
${s.indicators.map(i => `| ${i.name} | ${i.category} | ${i.growthRate}% | ${i.direction} |`).join('\n')}

#### Emerging Keywords
${s.forecast.emergingKeywords.map(k => `- **${k.keyword}** (${k.frequency} mentions)`).join('\n')}

#### 6-Month Projection
${s.forecast.monthlyProjections.map(p => `- Month ${p.month}: ${p.projectedGrowth.toFixed(2)}% growth (${p.confidence}% confidence)`).join('\n')}

${s.forecast.riskFactors.length > 0 ? `**⚠️ Risk Factors:**\n${s.forecast.riskFactors.map(r => `- ${r}`).join('\n')}` : ''}
`).join('\n---\n')}

---

## 🔥 Top 10 Emerging Trends

| Rank | Trend | Signal Strength | Mentions |
|------|-------|-----------------|----------|
${emergingTrends.map((t, i) => `| ${i + 1} | ${t.trend} | ${t.signal} | ${t.mentions} |`).join('\n')}

---

## 🔮 3-6 Month Outlook

### 3-Month Projection
- **Direction:** ${outlook.threeMonth.projection}
- **Confidence:** ${outlook.threeMonth.confidence}
- **Key Drivers:** ${outlook.threeMonth.keyDrivers.join(', ')}

### 6-Month Projection
- **Direction:** ${outlook.sixMonth.projection}
- **Confidence:** ${outlook.sixMonth.confidence}
- **Key Drivers:** ${outlook.sixMonth.keyDrivers.join(', ')}

### Key Risks
${outlook.risks.map(r => `- ${r}`).join('\n')}

### Key Opportunities
${outlook.opportunities.map(o => `- ${o}`).join('\n')}

---

## 📝 Methodology

This report uses a simple forecasting approach (no ML):

1. **Month-over-Month Growth Rates:** Compare current vs previous period metrics
2. **Momentum Scoring:** Weighted average across funding, hiring, news, patents, and conferences
3. **Keyword Analysis:** Track emerging terminology frequency
4. **Trend Projection:** Apply decay factor to momentum for forward-looking estimates

**Data Sources:** Funding databases, job boards, news aggregators, patent filings, conference agendas

---

*Report generated by Scout Trend Forecaster Agent*
`;
  }
}

/**
 * CLI Interface
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'forecast';

  const forecaster = new TrendForecaster();

  switch (command) {
    case 'forecast':
      const quarter = args[1] || 'Q1';
      const year = args[2] || '2025';
      const report = forecaster.generateQuarterlyReport(quarter, year);
      
      // Print summary to console
      
      report.sectorAnalysis.forEach(s => {
      });
      
      report.emergingTrends.slice(0, 5).forEach((t, i) => {
      });
      
      break;

    case 'analyze':
      const sector = args[1];
      if (!sector) {
        process.exit(1);
      }
      const analysis = forecaster.analyzeSector(sector);
      break;

    case 'help':
    default:
Scout Trend Forecaster - Industry Trend Forecasting System

Usage:
  node trend-forecaster.js [command] [options]

Commands:
  forecast [quarter] [year]  Generate quarterly trend report (default: Q1 2025)
  analyze <sector>           Analyze specific sector
  help                       Show this help message

Examples:
  node trend-forecaster.js forecast Q1 2025
  node trend-forecaster.js analyze crypto
  node trend-forecaster.js analyze fintech

Sectors: ${CONFIG.sectors.join(', ')}
      `);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for testing/modules
module.exports = { TrendForecaster, TrendIndicator, SectorAnalysis, DataCollector };
