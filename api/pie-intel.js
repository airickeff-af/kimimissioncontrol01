// PIE Intelligence API Endpoint
// Provides real-time intelligence data for the PIE Dashboard

const fs = require('fs');
const path = require('path');

// Mock intelligence data store
let intelData = {
    opportunities: [],
    competitors: [],
    marketTrends: [],
    alerts: [],
    lastUpdated: new Date().toISOString()
};

// Generate sample opportunities
function generateOpportunities() {
    const companies = [
        { name: 'TechCorp Inc', industry: 'Technology', region: 'North America', size: 'Enterprise' },
        { name: 'DataFlow Systems', industry: 'Data Analytics', region: 'Europe', size: 'Mid-Market' },
        { name: 'CloudNine AI', industry: 'AI/ML', region: 'Asia Pacific', size: 'Startup' },
        { name: 'MegaSoft Ltd', industry: 'Software', region: 'North America', size: 'Enterprise' },
        { name: 'InnovateCo', industry: 'Fintech', region: 'Europe', size: 'Mid-Market' },
        { name: 'GlobalTech Partners', industry: 'Technology', region: 'Asia Pacific', size: 'Enterprise' },
        { name: 'NextGen Solutions', industry: 'SaaS', region: 'North America', size: 'Mid-Market' },
        { name: 'Enterprise Hub', industry: 'Enterprise Software', region: 'Europe', size: 'Enterprise' },
        { name: 'Acme Corp', industry: 'Manufacturing', region: 'North America', size: 'Enterprise' },
        { name: 'StartupXYZ', industry: 'AI/ML', region: 'Asia Pacific', size: 'Startup' }
    ];

    const opportunityTypes = [
        'New Partnership', 'Expansion Deal', 'Integration Opportunity', 
        'Strategic Alliance', 'Technology Partnership', 'Reseller Agreement'
    ];

    return companies.map((company, index) => ({
        id: `OPP-${1000 + index}`,
        company: company.name,
        industry: company.industry,
        region: company.region,
        companySize: company.size,
        type: opportunityTypes[Math.floor(Math.random() * opportunityTypes.length)],
        value: Math.floor(Math.random() * 1000000) + 50000,
        score: Math.floor(Math.random() * 30) + 70, // 70-100
        priority: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        status: 'active',
        confidence: Math.floor(Math.random() * 20) + 80, // 80-100%
        detectedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
        signals: [
            'Recent funding round',
            'Hiring spree detected',
            'Competitor weakness',
            'Technology gap identified'
        ].slice(0, Math.floor(Math.random() * 3) + 1)
    }));
}

// Generate competitor data
function generateCompetitors() {
    const competitors = [
        { name: 'RivalCo', marketShare: 28, threat: 'high', focus: 'Enterprise' },
        { name: 'CompeteTech', marketShare: 22, threat: 'medium', focus: 'Mid-Market' },
        { name: 'NewEntrant AI', marketShare: 8, threat: 'medium', focus: 'AI Solutions' },
        { name: 'BigCorp Solutions', marketShare: 35, threat: 'high', focus: 'Enterprise' },
        { name: 'NichePlayer', marketShare: 7, threat: 'low', focus: 'Specialized' }
    ];

    return competitors.map(comp => ({
        ...comp,
        recentMoves: [
            'Launched new product line',
            'Acquired smaller competitor',
            'Reduced pricing by 15%',
            'Expanded to new region',
            'Hired key executives'
        ].slice(0, Math.floor(Math.random() * 2) + 1),
        sentiment: Math.random() > 0.5 ? 'positive' : Math.random() > 0.3 ? 'neutral' : 'negative',
        lastActivity: new Date(Date.now() - Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000)).toISOString()
    }));
}

// Generate market trends
function generateMarketTrends() {
    const trends = [
        { category: 'AI/ML Adoption', direction: 'up', value: 78, change: 12 },
        { category: 'Cloud Migration', direction: 'up', value: 85, change: 8 },
        { category: 'Data Privacy', direction: 'up', value: 92, change: 15 },
        { category: 'Remote Work Tools', direction: 'down', value: 65, change: -5 },
        { category: 'Cybersecurity', direction: 'up', value: 88, change: 10 },
        { category: 'Sustainability Tech', direction: 'up', value: 72, change: 18 }
    ];

    return trends.map(trend => ({
        ...trend,
        forecast: trend.direction === 'up' ? 'continued growth' : 'stabilizing',
        confidence: Math.floor(Math.random() * 15) + 85
    }));
}

// Generate alerts
function generateAlerts() {
    const alertTypes = [
        { type: 'opportunity', title: 'New High-Value Lead', severity: 'high' },
        { type: 'competitor', title: 'Competitor Price Drop', severity: 'medium' },
        { type: 'market', title: 'Market Shift Detected', severity: 'medium' },
        { type: 'system', title: 'Intelligence Update', severity: 'low' }
    ];

    return alertTypes.map((alert, index) => ({
        id: `ALERT-${1000 + index}`,
        ...alert,
        message: `Alert details for ${alert.title}`,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString(),
        read: false,
        actionable: alert.severity === 'high'
    }));
}

// Initialize data
function initializeData() {
    intelData = {
        opportunities: generateOpportunities(),
        competitors: generateCompetitors(),
        marketTrends: generateMarketTrends(),
        alerts: generateAlerts(),
        lastUpdated: new Date().toISOString()
    };
}

// API Handler
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Initialize data if empty
    if (intelData.opportunities.length === 0) {
        initializeData();
    }

    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const type = searchParams.get('type') || 'all';
    const industry = searchParams.get('industry');
    const region = searchParams.get('region');
    const priority = searchParams.get('priority');

    try {
        let response = {
            success: true,
            timestamp: new Date().toISOString(),
            data: {}
        };

        switch (type) {
            case 'opportunities':
                response.data.opportunities = filterData(intelData.opportunities, { industry, region, priority });
                break;
            case 'competitors':
                response.data.competitors = intelData.competitors;
                break;
            case 'trends':
                response.data.marketTrends = intelData.marketTrends;
                break;
            case 'alerts':
                response.data.alerts = intelData.alerts;
                break;
            case 'all':
            default:
                response.data = {
                    opportunities: filterData(intelData.opportunities, { industry, region, priority }),
                    competitors: intelData.competitors,
                    marketTrends: intelData.marketTrends,
                    alerts: intelData.alerts,
                    stats: {
                        totalOpportunities: intelData.opportunities.length,
                        totalValue: intelData.opportunities.reduce((sum, opp) => sum + opp.value, 0),
                        avgScore: Math.round(intelData.opportunities.reduce((sum, opp) => sum + opp.score, 0) / intelData.opportunities.length),
                        highPriorityCount: intelData.opportunities.filter(opp => opp.priority === 'high').length
                    }
                };
                break;
        }

        res.status(200).json(response);
    } catch (error) {
        console.error('PIE Intel API Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch intelligence data',
            message: error.message
        });
    }
};

// Filter data based on query params
function filterData(data, filters) {
    return data.filter(item => {
        if (filters.industry && item.industry !== filters.industry) return false;
        if (filters.region && item.region !== filters.region) return false;
        if (filters.priority && item.priority !== filters.priority) return false;
        return true;
    });
}

// WebSocket support for real-time updates
module.exports.ws = (ws, req) => {
    console.log('[PIE Intel] WebSocket connection established');
    
    // Send initial data
    ws.send(JSON.stringify({
        type: 'connected',
        message: 'PIE Intelligence feed connected',
        timestamp: new Date().toISOString()
    }));

    // Simulate real-time updates
    const updateInterval = setInterval(() => {
        const update = {
            type: 'update',
            data: {
                newOpportunity: Math.random() > 0.7 ? generateOpportunities()[0] : null,
                alert: Math.random() > 0.8 ? generateAlerts()[0] : null,
                timestamp: new Date().toISOString()
            }
        };
        ws.send(JSON.stringify(update));
    }, 10000); // Every 10 seconds

    ws.on('close', () => {
        clearInterval(updateInterval);
        console.log('[PIE Intel] WebSocket connection closed');
    });
};

// Initialize on load
initializeData();
