/**
 * DealFlow Enrichment API Routes
 * Express/Vercel API endpoints for Hunter.io enrichment
 * 
 * @module dealflow-enrichment-api
 * @task P1 - Hunter.io Integration Sprint
 */

const { 
  handleEnrichLead, 
  handleEnrichAll, 
  handleEnrichmentStatus,
  processLeads,
  updateLeadsFile,
  CONFIG 
} = require('../../modules/hunter-enrichment');

const fs = require('fs').promises;
const path = require('path');

// ============================================
// API RESPONSE HELPERS
// ============================================

function successResponse(data, meta = {}) {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    meta,
    data
  };
}

function errorResponse(message, code = 500, details = null) {
  return {
    success: false,
    timestamp: new Date().toISOString(),
    error: {
      message,
      code,
      details
    }
  };
}

// ============================================
// LEAD DATA HELPERS
// ============================================

async function getLeadsData() {
  const leadsFile = path.join(__dirname, '..', 'data', 'scored-leads.json');
  const data = await fs.readFile(leadsFile, 'utf8');
  return JSON.parse(data);
}

async function getEnrichedLeadsData() {
  try {
    const enrichedFile = path.join(__dirname, '..', 'data', 'leads', 'scored-leads.json');
    const data = await fs.readFile(enrichedFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return original if enriched doesn't exist
    return getLeadsData();
  }
}

// ============================================
// API HANDLERS
// ============================================

/**
 * GET /api/dealflow/enrichment-status
 * Check enrichment progress and statistics
 */
async function enrichmentStatusHandler(req, res) {
  try {
    const status = await handleEnrichmentStatus();
    const leads = await getEnrichedLeadsData();
    
    // Calculate additional stats
    const totalLeads = leads.scoredLeads?.length || 0;
    const withEmail = leads.scoredLeads?.filter(l => l.email).length || 0;
    const coverage = totalLeads > 0 ? Math.round((withEmail / totalLeads) * 100) : 0;
    
    // Count by priority
    const byPriority = {};
    leads.scoredLeads?.forEach(lead => {
      const tier = lead.priorityTier || 'unknown';
      if (!byPriority[tier]) {
        byPriority[tier] = { total: 0, withEmail: 0 };
      }
      byPriority[tier].total++;
      if (lead.email) {
        byPriority[tier].withEmail++;
      }
    });
    
    // Calculate coverage by priority
    Object.keys(byPriority).forEach(tier => {
      const p = byPriority[tier];
      p.coverage = p.total > 0 ? Math.round((p.withEmail / p.total) * 100) : 0;
    });
    
    return res.status(200).json(successResponse({
      enrichment: status,
      coverage: {
        total: totalLeads,
        withEmail,
        withoutEmail: totalLeads - withEmail,
        percentage: coverage,
        target: 95,
        gap: Math.max(0, 95 - coverage)
      },
      byPriority,
      leads: leads.scoredLeads?.map(l => ({
        leadId: l.leadId,
        company: l.company,
        contactName: l.contactName,
        priorityTier: l.priorityTier,
        email: l.email || null,
        emailConfidence: l.emailConfidence || null,
        emailStatus: l.emailStatus || 'missing'
      })) || []
    }));
  } catch (error) {
    console.error('[API] enrichment-status error:', error);
    return res.status(500).json(errorResponse('Failed to get enrichment status', 500, error.message));
  }
}

/**
 * POST /api/dealflow/enrich
 * Trigger enrichment for a specific lead
 */
async function enrichLeadHandler(req, res) {
  try {
    const { leadId } = req.body || {};
    
    if (!leadId) {
      return res.status(400).json(errorResponse('leadId is required', 400));
    }
    
    if (!process.env.HUNTER_API_KEY) {
      return res.status(503).json(errorResponse('HUNTER_API_KEY not configured', 503));
    }
    
    const result = await handleEnrichLead(leadId);
    
    if (result.error) {
      return res.status(404).json(errorResponse(result.error, 404));
    }
    
    return res.status(200).json(successResponse(result, {
      leadId,
      processed: true
    }));
  } catch (error) {
    console.error('[API] enrich error:', error);
    return res.status(500).json(errorResponse('Failed to enrich lead', 500, error.message));
  }
}

/**
 * POST /api/dealflow/enrich-all
 * Bulk enrichment with progress tracking
 */
async function enrichAllHandler(req, res) {
  try {
    const { 
      batchSize = 10, 
      priorityOrder = ['P0', 'P1', 'P2', 'P3'],
      resume = true 
    } = req.body || {};
    
    if (!process.env.HUNTER_API_KEY) {
      return res.status(503).json(errorResponse('HUNTER_API_KEY not configured', 503));
    }
    
    // Start enrichment in background (don't await)
    const enrichmentPromise = handleEnrichAll({ batchSize, priorityOrder, resume });
    
    // Return immediate response
    res.status(202).json(successResponse({
      message: 'Bulk enrichment started',
      status: 'processing',
      options: { batchSize, priorityOrder, resume }
    }, {
      accepted: true,
      checkStatus: '/api/dealflow/enrichment-status'
    }));
    
    // Continue processing in background
    enrichmentPromise.then(async (results) => {
      console.log('[EnrichAll] Background processing complete:', results.stats);
    }).catch(error => {
      console.error('[EnrichAll] Background processing failed:', error);
    });
    
  } catch (error) {
    console.error('[API] enrich-all error:', error);
    return res.status(500).json(errorResponse('Failed to start enrichment', 500, error.message));
  }
}

/**
 * GET /api/dealflow/leads
 * Get all leads with email status
 */
async function getLeadsHandler(req, res) {
  try {
    const { priority, status, search } = req.query || {};
    
    const leads = await getEnrichedLeadsData();
    
    let filteredLeads = leads.scoredLeads || [];
    
    // Filter by priority
    if (priority) {
      filteredLeads = filteredLeads.filter(l => l.priorityTier === priority);
    }
    
    // Filter by email status
    if (status) {
      if (status === 'has-email') {
        filteredLeads = filteredLeads.filter(l => l.email);
      } else if (status === 'no-email') {
        filteredLeads = filteredLeads.filter(l => !l.email);
      } else if (status === 'verified') {
        filteredLeads = filteredLeads.filter(l => l.emailStatus === 'verified');
      }
    }
    
    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLeads = filteredLeads.filter(l => 
        l.company?.toLowerCase().includes(searchLower) ||
        l.contactName?.toLowerCase().includes(searchLower) ||
        l.email?.toLowerCase().includes(searchLower)
      );
    }
    
    return res.status(200).json(successResponse({
      leads: filteredLeads.map(l => ({
        leadId: l.leadId,
        company: l.company,
        contactName: l.contactName,
        title: l.title,
        priorityTier: l.priorityTier,
        totalScore: l.totalScore,
        email: l.email || null,
        emailConfidence: l.emailConfidence || null,
        emailStatus: l.emailStatus || 'missing',
        emailSource: l.emailSource || null,
        emailEnrichedAt: l.emailEnrichedAt || null
      })),
      total: filteredLeads.length,
      summary: leads.summary
    }));
  } catch (error) {
    console.error('[API] get-leads error:', error);
    return res.status(500).json(errorResponse('Failed to get leads', 500, error.message));
  }
}

/**
 * GET /api/dealflow/lead/:id
 * Get specific lead details
 */
async function getLeadHandler(req, res) {
  try {
    const { id } = req.query || {};
    
    if (!id) {
      return res.status(400).json(errorResponse('Lead ID is required', 400));
    }
    
    const leads = await getEnrichedLeadsData();
    const lead = leads.scoredLeads?.find(l => l.leadId === id);
    
    if (!lead) {
      return res.status(404).json(errorResponse('Lead not found', 404));
    }
    
    return res.status(200).json(successResponse({
      lead: {
        ...lead,
        emailVerification: {
          status: lead.emailStatus || 'missing',
          confidence: lead.emailConfidence || 0,
          email: lead.email || null,
          source: lead.emailSource || null,
          enrichedAt: lead.emailEnrichedAt || null
        }
      }
    }));
  } catch (error) {
    console.error('[API] get-lead error:', error);
    return res.status(500).json(errorResponse('Failed to get lead', 500, error.message));
  }
}

// ============================================
// VERCEL SERVERLESS HANDLER
// ============================================

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Parse URL path
  const { url } = req;
  const path = url.split('?')[0];
  
  // Route to handler
  try {
    if (path === '/api/dealflow/enrichment-status' && req.method === 'GET') {
      return await enrichmentStatusHandler(req, res);
    }
    
    if (path === '/api/dealflow/enrich' && req.method === 'POST') {
      return await enrichLeadHandler(req, res);
    }
    
    if (path === '/api/dealflow/enrich-all' && req.method === 'POST') {
      return await enrichAllHandler(req, res);
    }
    
    if (path === '/api/dealflow/leads' && req.method === 'GET') {
      return await getLeadsHandler(req, res);
    }
    
    if (path === '/api/dealflow/lead' && req.method === 'GET') {
      return await getLeadHandler(req, res);
    }
    
    // 404 for unknown routes
    return res.status(404).json(errorResponse('Not found', 404));
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    return res.status(500).json(errorResponse('Internal server error', 500, error.message));
  }
};

// ============================================
// EXPRESS ROUTER (for local development)
// ============================================

function createRouter() {
  const express = require('express');
  const router = express.Router();
  
  router.get('/enrichment-status', enrichmentStatusHandler);
  router.post('/enrich', enrichLeadHandler);
  router.post('/enrich-all', enrichAllHandler);
  router.get('/leads', getLeadsHandler);
  router.get('/lead/:id', getLeadHandler);
  
  return router;
}

module.exports.createRouter = createRouter;
module.exports.handlers = {
  enrichmentStatus: enrichmentStatusHandler,
  enrichLead: enrichLeadHandler,
  enrichAll: enrichAllHandler,
  getLeads: getLeadsHandler,
  getLead: getLeadHandler
};
