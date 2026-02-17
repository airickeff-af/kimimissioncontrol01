/**
 * DealFlow Lead Scoring API Server
 * Express.js routes for lead scoring endpoints
 * 
 * Endpoints:
 * - POST /api/leads/score       - Score all leads or provided leads array
 * - POST /api/leads/score-single - Score a single lead
 * - GET  /api/leads/scored       - Get previously scored results
 * 
 * @module lead-scoring-api
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const {
  calculateLeadScore,
  scoreLeads,
  scoreLeadsFromFile
} = require('./lead-scoring');

const router = express.Router();

// Paths
const LEADS_PATH = path.join(__dirname, '../dealflow/leads.json');
const SCORED_LEADS_PATH = path.join(__dirname, '../../data/scored-leads.json');

/**
 * POST /api/leads/score
 * Score leads - either from request body or from leads.json
 * 
 * Request body (optional):
 * {
 *   leads: [...]  // Array of lead objects
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   summary: { totalLeads, averageScore, tierDistribution },
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
      // Otherwise load from default leads.json
      const leadsData = fs.readFileSync(LEADS_PATH, 'utf8');
      leads = JSON.parse(leadsData);
    }
    
    const results = scoreLeads(leads);
    
    // Sort by score (descending)
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
        P3: results.filter(l => l.priorityTier === 'P3').length
      }
    };
    
    // Save results
    const output = {
      summary,
      scoredLeads: results,
      generatedAt: new Date().toISOString()
    };
    fs.writeFileSync(SCORED_LEADS_PATH, JSON.stringify(output, null, 2));
    
    res.json({
      success: true,
      summary,
      scoredLeads: results
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
 * POST /api/leads/score-single
 * Score a single lead
 * 
 * Request body:
 * {
 *   lead: {
 *     id: string,
 *     company: string,
 *     contact_name: string,
 *     email: string,
 *     notes: string,
 *     ...
 *   }
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   result: { leadId, totalScore, priorityTier, breakdown, ... }
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
      result
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
 * GET /api/leads/scored
 * Retrieve previously scored leads
 * 
 * Query params:
 * - tier: Filter by tier (P0, P1, P2, P3)
 * - minScore: Minimum score threshold
 * - limit: Maximum results to return
 * 
 * Response:
 * {
 *   success: true,
 *   summary: {...},
 *   scoredLeads: [...]
 * }
 */
router.get('/scored', (req, res) => {
  try {
    if (!fs.existsSync(SCORED_LEADS_PATH)) {
      return res.status(404).json({
        success: false,
        error: 'No scored leads found. Run POST /api/leads/score first.'
      });
    }
    
    const data = JSON.parse(fs.readFileSync(SCORED_LEADS_PATH, 'utf8'));
    let scoredLeads = data.scoredLeads || [];
    
    // Apply filters
    const { tier, minScore, limit } = req.query;
    
    if (tier) {
      scoredLeads = scoredLeads.filter(l => l.priorityTier === tier.toUpperCase());
    }
    
    if (minScore) {
      const threshold = parseInt(minScore, 10);
      scoredLeads = scoredLeads.filter(l => l.totalScore >= threshold);
    }
    
    if (limit) {
      scoredLeads = scoredLeads.slice(0, parseInt(limit, 10));
    }
    
    res.json({
      success: true,
      summary: data.summary,
      scoredLeads,
      generatedAt: data.generatedAt
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
 * GET /api/leads/weights
 * Get current scoring weights configuration
 * 
 * Response:
 * {
 *   success: true,
 *   weights: { industry, companySize, seniority, region }
 * }
 */
router.get('/weights', (req, res) => {
  const { WEIGHTS } = require('./lead-scoring');
  
  res.json({
    success: true,
    weights: WEIGHTS,
    description: {
      industry: 'DeFi/RWA/Payments priority (40%)',
      companySize: 'Company scale/presence (30%)',
      seniority: 'Decision-maker level (20%)',
      region: 'Geographic priority (10%)'
    }
  });
});

module.exports = router;

// ============================================================================
// STANDALONE SERVER (for direct execution)
// ============================================================================

if (require.main === module) {
  const app = express();
  
  app.use(express.json());
  app.use('/api/leads', router);
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'lead-scoring-api',
      timestamp: new Date().toISOString()
    });
  });
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      service: 'DealFlow Lead Scoring API',
      version: '1.0.0',
      endpoints: {
        'POST /api/leads/score': 'Score all leads or provided leads array',
        'POST /api/leads/score-single': 'Score a single lead',
        'GET /api/leads/scored': 'Get previously scored results',
        'GET /api/leads/weights': 'Get scoring weights configuration',
        'GET /health': 'Health check'
      }
    });
  });
  
  const PORT = process.env.PORT || 3001;
  
  app.listen(PORT, () => {
    console.log(`🚀 Lead Scoring API running on port ${PORT}`);
    console.log(`📊 API Documentation: http://localhost:${PORT}/`);
  });
}
