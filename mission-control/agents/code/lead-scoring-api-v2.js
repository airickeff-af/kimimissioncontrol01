/**
 * DealFlow Lead Scoring API v2.0
 * Express.js routes for enhanced lead scoring endpoints
 * 
 * Endpoints:
 * - POST /api/v2/leads/score          - Score all leads or provided array
 * - POST /api/v2/leads/score-single   - Score a single lead
 * - GET  /api/v2/leads/scored         - Get previously scored results
 * - GET  /api/v2/leads/weights        - Get scoring weights configuration
 * - GET  /api/v2/leads/analytics      - Get scoring analytics
 * - POST /api/v2/leads/batch-score    - Score leads in batches
 * 
 * @module lead-scoring-api-v2
 * @version 2.0.0
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const {
  calculateLeadScore,
  scoreLeads,
  scoreLeadsFromFile,
  WEIGHTS
} = require('./lead-scoring-v2');

const router = express.Router();

// Paths
const LEADS_PATH = path.join(__dirname, '../dealflow/leads_complete_26.json');
const SCORED_LEADS_PATH = path.join(__dirname, '../../data/scored-leads-v2.json');

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * POST /api/v2/leads/score
 * Score leads - either from request body or from leads.json
 * 
 * Request body (optional):
 * {
 *   leads: [...],           // Array of lead objects
 *   saveResults: true       // Whether to save to file
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   summary: { 
 *     totalLeads, 
 *     averageScore, 
 *     tierDistribution,
 *     categoryAverages,
 *     topLeads 
 *   },
 *   scoredLeads: [...]
 * }
 */
router.post('/score', (req, res) => {
  try {
    let leads;
    
    // If leads provided in request body, use those
    if (req.body && req.body.leads && Array.isArray(req.body.leads)) {
      leads = req.body.leads;
    } else {
      // Otherwise load from default leads file
      const leadsData = fs.readFileSync(LEADS_PATH, 'utf8');
      leads = JSON.parse(leadsData);
    }
    
    const results = scoreLeads(leads);
    results.sort((a, b) => b.totalScore - a.totalScore);
    
    // Calculate summary
    const summary = {
      totalLeads: results.length,
      averageScore: Math.round(
        results.reduce((sum, l) => sum + l.totalScore, 0) / results.length
      ),
      tierDistribution: {
        P0: results.filter(l => l.priorityTier === 'P0').length,
        P1: results.filter(l => l.priorityTier === 'P1').length,
        P2: results.filter(l => l.priorityTier === 'P2').length,
        P3: results.filter(l => l.priorityTier === 'P3').length,
        Cold: results.filter(l => l.priorityTier === 'Cold').length
      },
      categoryAverages: {
        companySizeFunding: Math.round(
          results.reduce((sum, l) => sum + l.breakdown.companySizeFunding.score, 0) / results.length
        ),
        partnershipPotential: Math.round(
          results.reduce((sum, l) => sum + l.breakdown.partnershipPotential.score, 0) / results.length
        ),
        contactAccessibility: Math.round(
          results.reduce((sum, l) => sum + l.breakdown.contactAccessibility.score, 0) / results.length
        ),
        marketRelevance: Math.round(
          results.reduce((sum, l) => sum + l.breakdown.marketRelevance.score, 0) / results.length
        )
      },
      topLeads: results.slice(0, 5).map(l => ({
        company: l.company,
        contact: l.contactName,
        score: l.totalScore,
        tier: l.priorityTier,
        action: l.actionRequired
      }))
    };
    
    // Save results if requested or by default
    const saveResults = req.body?.saveResults !== false;
    if (saveResults) {
      const output = {
        summary,
        scoredLeads: results,
        generatedAt: new Date().toISOString(),
        algorithmVersion: '2.0.0'
      };
      fs.writeFileSync(SCORED_LEADS_PATH, JSON.stringify(output, null, 2));
    }
    
    res.json({
      success: true,
      summary,
      scoredLeads: results,
      algorithmVersion: '2.0.0'
    });
  } catch (error) {
    console.error('Lead scoring error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v2/leads/score-single
 * Score a single lead
 * 
 * Request body:
 * {
 *   lead: {
 *     id: string,
 *     company: string,
 *     contact_name: string,
 *     title: string,
 *     email: string,
 *     email_verified: boolean,
 *     linkedin: string,
 *     linkedin_personal: string,
 *     twitter: string,
 *     phone: string,
 *     telegram: string,
 *     notes: string,
 *     ...
 *   }
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   result: { 
 *     leadId, 
 *     totalScore, 
 *     priorityTier, 
 *     actionRequired,
 *     breakdown, 
 *     recommendations 
 *   }
 * }
 */
router.post('/score-single', (req, res) => {
  try {
    if (!req.body || !req.body.lead) {
      return res.status(400).json({
        success: false,
        error: 'Lead data required in request body'
      });
    }
    
    const result = calculateLeadScore(req.body.lead);
    
    res.json({
      success: true,
      result,
      algorithmVersion: '2.0.0'
    });
  } catch (error) {
    console.error('Single lead scoring error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v2/leads/batch-score
 * Score leads in batches (for large datasets)
 * 
 * Request body:
 * {
 *   leads: [...],
 *   batchSize: 50,        // Leads per batch
 *   parallel: false       // Process batches in parallel
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   batchResults: [...],
 *   summary: {...}
 * }
 */
router.post('/batch-score', async (req, res) => {
  try {
    if (!req.body || !req.body.leads || !Array.isArray(req.body.leads)) {
      return res.status(400).json({
        success: false,
        error: 'Leads array required in request body'
      });
    }
    
    const { leads, batchSize = 50, parallel = false } = req.body;
    const batches = [];
    
    // Split into batches
    for (let i = 0; i < leads.length; i += batchSize) {
      batches.push(leads.slice(i, i + batchSize));
    }
    
    const batchResults = [];
    
    if (parallel) {
      // Process batches in parallel
      const promises = batches.map((batch, index) => 
        Promise.resolve({
          batchIndex: index,
          batchSize: batch.length,
          scoredLeads: scoreLeads(batch)
        })
      );
      batchResults.push(...await Promise.all(promises));
    } else {
      // Process batches sequentially
      for (let i = 0; i < batches.length; i++) {
        batchResults.push({
          batchIndex: i,
          batchSize: batches[i].length,
          scoredLeads: scoreLeads(batches[i])
        });
      }
    }
    
    // Combine all results
    const allScoredLeads = batchResults.flatMap(b => b.scoredLeads);
    allScoredLeads.sort((a, b) => b.totalScore - a.totalScore);
    
    // Calculate summary
    const summary = {
      totalBatches: batches.length,
      totalLeads: allScoredLeads.length,
      averageScore: Math.round(
        allScoredLeads.reduce((sum, l) => sum + l.totalScore, 0) / allScoredLeads.length
      ),
      tierDistribution: {
        P0: allScoredLeads.filter(l => l.priorityTier === 'P0').length,
        P1: allScoredLeads.filter(l => l.priorityTier === 'P1').length,
        P2: allScoredLeads.filter(l => l.priorityTier === 'P2').length,
        P3: allScoredLeads.filter(l => l.priorityTier === 'P3').length,
        Cold: allScoredLeads.filter(l => l.priorityTier === 'Cold').length
      }
    };
    
    res.json({
      success: true,
      batchResults: batchResults.map(b => ({
        batchIndex: b.batchIndex,
        batchSize: b.batchSize,
        processed: b.scoredLeads.length
      })),
      summary,
      scoredLeads: allScoredLeads,
      algorithmVersion: '2.0.0'
    });
  } catch (error) {
    console.error('Batch scoring error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/leads/scored
 * Retrieve previously scored leads
 * 
 * Query params:
 * - tier: Filter by tier (P0, P1, P2, P3, Cold)
 * - minScore: Minimum score threshold
 * - maxScore: Maximum score threshold
 * - limit: Maximum results to return
 * - offset: Pagination offset
 * - sortBy: Sort field (score, company, tier)
 * - sortOrder: asc or desc
 * 
 * Response:
 * {
 *   success: true,
 *   summary: {...},
 *   scoredLeads: [...],
 *   pagination: { total, limit, offset, hasMore }
 * }
 */
router.get('/scored', (req, res) => {
  try {
    if (!fs.existsSync(SCORED_LEADS_PATH)) {
      return res.status(404).json({
        success: false,
        error: 'No scored leads found. Run POST /api/v2/leads/score first.'
      });
    }
    
    const data = JSON.parse(fs.readFileSync(SCORED_LEADS_PATH, 'utf8'));
    let scoredLeads = data.scoredLeads || [];
    
    // Apply filters
    const { tier, minScore, maxScore, industry, region } = req.query;
    
    if (tier) {
      scoredLeads = scoredLeads.filter(l => 
        l.priorityTier === tier.toUpperCase()
      );
    }
    
    if (minScore) {
      const threshold = parseInt(minScore, 10);
      scoredLeads = scoredLeads.filter(l => l.totalScore >= threshold);
    }
    
    if (maxScore) {
      const threshold = parseInt(maxScore, 10);
      scoredLeads = scoredLeads.filter(l => l.totalScore <= threshold);
    }
    
    if (industry) {
      scoredLeads = scoredLeads.filter(l => 
        l.breakdown.marketRelevance.details.industry.type === industry
      );
    }
    
    if (region) {
      scoredLeads = scoredLeads.filter(l => 
        l.breakdown.marketRelevance.details.geography.region === region
      );
    }
    
    // Sorting
    const sortBy = req.query.sortBy || 'score';
    const sortOrder = req.query.sortOrder || 'desc';
    
    scoredLeads.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'company':
          aVal = a.company;
          bVal = b.company;
          break;
        case 'tier':
          const tierOrder = { P0: 4, P1: 3, P2: 2, P3: 1, Cold: 0 };
          aVal = tierOrder[a.priorityTier] || 0;
          bVal = tierOrder[b.priorityTier] || 0;
          break;
        case 'score':
        default:
          aVal = a.totalScore;
          bVal = b.totalScore;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
    
    // Pagination
    const total = scoredLeads.length;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    
    scoredLeads = scoredLeads.slice(offset, offset + limit);
    
    res.json({
      success: true,
      summary: data.summary,
      scoredLeads,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      generatedAt: data.generatedAt,
      algorithmVersion: data.algorithmVersion || '2.0.0'
    });
  } catch (error) {
    console.error('Get scored leads error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/leads/weights
 * Get current scoring weights configuration
 * 
 * Response:
 * {
 *   success: true,
 *   weights: { companySizeFunding, partnershipPotential, contactAccessibility, marketRelevance },
 *   descriptions: {...}
 * }
 */
router.get('/weights', (req, res) => {
  res.json({
    success: true,
    weights: WEIGHTS,
    descriptions: {
      companySizeFunding: {
        weight: '25%',
        description: 'Company scale, funding raised, employee count, market presence',
        subcategories: {
          funding: '40% - Funding amount and stage',
          companySize: '35% - Employee count and scale',
          marketPresence: '25% - Market dominance indicators'
        }
      },
      partnershipPotential: {
        weight: '30%',
        description: 'Strategic fit, collaboration opportunities, deal size potential',
        subcategories: {
          partnershipType: '40% - Type of partnership opportunity',
          dealSizePotential: '35% - Estimated deal value',
          strategicFit: '25% - Alignment with strategic goals'
        }
      },
      contactAccessibility: {
        weight: '25%',
        description: 'How reachable the contact is via various channels',
        subcategories: {
          channels: 'Points per available channel (email, LinkedIn, Twitter, etc.)',
          seniorityMultiplier: 'Adjustment based on contact seniority level'
        }
      },
      marketRelevance: {
        weight: '20%',
        description: 'Industry alignment, geographic fit, timing/opportunity window',
        subcategories: {
          industry: '50% - Industry relevance to crypto/blockchain',
          geography: '30% - Geographic priority (Philippines/SEA focus)',
          timing: '20% - Current opportunity indicators'
        }
      }
    },
    algorithmVersion: '2.0.0'
  });
});

/**
 * GET /api/v2/leads/analytics
 * Get detailed scoring analytics
 * 
 * Query params:
 * - groupBy: Group results by (tier, industry, region, scoreRange)
 * 
 * Response:
 * {
 *   success: true,
 *   analytics: {...}
 * }
 */
router.get('/analytics', (req, res) => {
  try {
    if (!fs.existsSync(SCORED_LEADS_PATH)) {
      return res.status(404).json({
        success: false,
        error: 'No scored leads found. Run POST /api/v2/leads/score first.'
      });
    }
    
    const data = JSON.parse(fs.readFileSync(SCORED_LEADS_PATH, 'utf8'));
    const leads = data.scoredLeads || [];
    
    const groupBy = req.query.groupBy || 'tier';
    let analytics = {};
    
    switch (groupBy) {
      case 'tier':
        analytics = {
          byTier: {
            P0: leads.filter(l => l.priorityTier === 'P0'),
            P1: leads.filter(l => l.priorityTier === 'P1'),
            P2: leads.filter(l => l.priorityTier === 'P2'),
            P3: leads.filter(l => l.priorityTier === 'P3'),
            Cold: leads.filter(l => l.priorityTier === 'Cold')
          }.map(tier => ({
            count: tier.length,
            averageScore: tier.length > 0 
              ? Math.round(tier.reduce((sum, l) => sum + l.totalScore, 0) / tier.length)
              : 0
          }))
        };
        break;
        
      case 'industry':
        const byIndustry = {};
        leads.forEach(l => {
          const industry = l.breakdown.marketRelevance.details.industry.type;
          if (!byIndustry[industry]) byIndustry[industry] = [];
          byIndustry[industry].push(l);
        });
        analytics.byIndustry = Object.entries(byIndustry).map(([industry, items]) => ({
          industry,
          count: items.length,
          averageScore: Math.round(items.reduce((sum, l) => sum + l.totalScore, 0) / items.length)
        }));
        break;
        
      case 'region':
        const byRegion = {};
        leads.forEach(l => {
          const region = l.breakdown.marketRelevance.details.geography.region;
          if (!byRegion[region]) byRegion[region] = [];
          byRegion[region].push(l);
        });
        analytics.byRegion = Object.entries(byRegion).map(([region, items]) => ({
          region,
          count: items.length,
          averageScore: Math.round(items.reduce((sum, l) => sum + l.totalScore, 0) / items.length)
        }));
        break;
        
      case 'scoreRange':
        const ranges = {
          '90-100': leads.filter(l => l.totalScore >= 90),
          '80-89': leads.filter(l => l.totalScore >= 80 && l.totalScore < 90),
          '70-79': leads.filter(l => l.totalScore >= 70 && l.totalScore < 80),
          '60-69': leads.filter(l => l.totalScore >= 60 && l.totalScore < 70),
          '50-59': leads.filter(l => l.totalScore >= 50 && l.totalScore < 60),
          '40-49': leads.filter(l => l.totalScore >= 40 && l.totalScore < 50),
          'Below 40': leads.filter(l => l.totalScore < 40)
        };
        analytics.byScoreRange = Object.entries(ranges).map(([range, items]) => ({
          range,
          count: items.length,
          percentage: Math.round((items.length / leads.length) * 100)
        }));
        break;
        
      default:
        analytics = {
          overall: data.summary,
          categoryDistribution: {
            companySizeFunding: {
              high: leads.filter(l => l.breakdown.companySizeFunding.score >= 70).length,
              medium: leads.filter(l => l.breakdown.companySizeFunding.score >= 40 && l.breakdown.companySizeFunding.score < 70).length,
              low: leads.filter(l => l.breakdown.companySizeFunding.score < 40).length
            },
            partnershipPotential: {
              high: leads.filter(l => l.breakdown.partnershipPotential.score >= 70).length,
              medium: leads.filter(l => l.breakdown.partnershipPotential.score >= 40 && l.breakdown.partnershipPotential.score < 70).length,
              low: leads.filter(l => l.breakdown.partnershipPotential.score < 40).length
            },
            contactAccessibility: {
              high: leads.filter(l => l.breakdown.contactAccessibility.score >= 70).length,
              medium: leads.filter(l => l.breakdown.contactAccessibility.score >= 40 && l.breakdown.contactAccessibility.score < 70).length,
              low: leads.filter(l => l.breakdown.contactAccessibility.score < 40).length
            },
            marketRelevance: {
              high: leads.filter(l => l.breakdown.marketRelevance.score >= 70).length,
              medium: leads.filter(l => l.breakdown.marketRelevance.score >= 40 && l.breakdown.marketRelevance.score < 70).length,
              low: leads.filter(l => l.breakdown.marketRelevance.score < 40).length
            }
          }
        };
    }
    
    res.json({
      success: true,
      analytics,
      groupBy,
      totalLeads: leads.length,
      algorithmVersion: '2.0.0'
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/leads/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  const hasScoredLeads = fs.existsSync(SCORED_LEADS_PATH);
  const hasLeads = fs.existsSync(LEADS_PATH);
  
  res.json({
    status: 'ok',
    service: 'lead-scoring-api-v2',
    dataStatus: {
      leadsAvailable: hasLeads,
      scoredLeadsAvailable: hasScoredLeads
    },
    algorithmVersion: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

// ============================================================================
// STANDALONE SERVER
// ============================================================================

if (require.main === module) {
  const app = express();
  
  app.use(express.json());
  app.use('/api/v2/leads', router);
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'DealFlow Lead Scoring API v2.0',
      timestamp: new Date().toISOString()
    });
  });
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      service: 'DealFlow Lead Scoring API v2.0',
      version: '2.0.0',
      description: 'AI-powered lead quality scoring system (0-100 scale)',
      criteria: {
        companySizeFunding: '25% - Company scale and financial backing',
        partnershipPotential: '30% - Strategic partnership opportunity',
        contactAccessibility: '25% - How reachable the contact is',
        marketRelevance: '20% - Industry and geographic fit'
      },
      endpoints: {
        'POST /api/v2/leads/score': 'Score all leads or provided leads array',
        'POST /api/v2/leads/score-single': 'Score a single lead',
        'POST /api/v2/leads/batch-score': 'Score leads in batches',
        'GET /api/v2/leads/scored': 'Get previously scored results with filters',
        'GET /api/v2/leads/weights': 'Get scoring weights configuration',
        'GET /api/v2/leads/analytics': 'Get detailed scoring analytics',
        'GET /api/v2/leads/health': 'Health check'
      }
    });
  });
  
  const PORT = process.env.PORT || 3002;
  
  app.listen(PORT, () => {
    console.log('🚀 Lead Scoring API v2.0 running on port', PORT);
    console.log('📊 API Documentation: http://localhost:' + PORT + '/');
    console.log('');
    console.log('Scoring Criteria:');
    console.log('  • Company Size/Funding (25%)');
    console.log('  • Partnership Potential (30%)');
    console.log('  • Contact Accessibility (25%)');
    console.log('  • Market Relevance (20%)');
  });
}
