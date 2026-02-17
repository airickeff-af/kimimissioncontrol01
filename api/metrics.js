/**
 * Metrics Collection API
 * 
 * Provides endpoints for collecting and retrieving performance metrics:
 * - API response times (p50, p95, p99)
 * - Dashboard load times
 * - Agent success/failure rates
 * - Token usage trends
 * - Error rates
 * - Uptime percentage
 * 
 * @module api/metrics
 */

const fs = require('fs');
const path = require('path');

// Configuration
const METRICS_DIR = path.join(__dirname, '..', 'data', 'metrics');
const RETENTION_DAYS = 30;
const ALERT_THRESHOLDS = {
    apiLatency: 500,      // ms
    errorRate: 1,         // percent
    tokenUsage: 200000,   // tokens per day
    agentFailure: 5       // percent
};

// Ensure metrics directory exists
if (!fs.existsSync(METRICS_DIR)) {
    fs.mkdirSync(METRICS_DIR, { recursive: true });
}

/**
 * Get current timestamp in ISO format
 */
function getTimestamp() {
    return new Date().toISOString();
}

/**
 * Get date string for file naming (YYYY-MM-DD)
 */
function getDateString(date = new Date()) {
    return date.toISOString().split('T')[0];
}

/**
 * Get metrics file path for a specific date
 */
function getMetricsFile(date = new Date()) {
    return path.join(METRICS_DIR, `metrics-${getDateString(date)}.jsonl`);
}

/**
 * Append a metric entry to the daily log file
 */
function appendMetric(entry) {
    const filePath = getMetricsFile();
    const line = JSON.stringify({ ...entry, timestamp: getTimestamp() }) + '\n';
    fs.appendFileSync(filePath, line);
}

/**
 * Read metrics for a date range
 */
function readMetrics(startDate, endDate) {
    const metrics = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
        const filePath = getMetricsFile(current);
        if (fs.existsSync(filePath)) {
            const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
            for (const line of lines) {
                if (line) {
                    try {
                        metrics.push(JSON.parse(line));
                    } catch (e) {
                        console.error('Failed to parse metric line:', line);
                    }
                }
            }
        }
        current.setDate(current.getDate() + 1);
    }
    
    return metrics;
}

/**
 * Clean up old metrics files
 */
function cleanupOldMetrics() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
    
    const files = fs.readdirSync(METRICS_DIR);
    for (const file of files) {
        const match = file.match(/metrics-(\d{4}-\d{2}-\d{2})\.jsonl/);
        if (match) {
            const fileDate = new Date(match[1]);
            if (fileDate < cutoff) {
                fs.unlinkSync(path.join(METRICS_DIR, file));
                console.log(`Cleaned up old metrics file: ${file}`);
            }
        }
    }
}

/**
 * Calculate percentiles from an array of numbers
 */
function calculatePercentiles(values, percentiles = [50, 95, 99]) {
    const sorted = [...values].sort((a, b) => a - b);
    const results = {};
    
    for (const p of percentiles) {
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        results[`p${p}`] = sorted[Math.max(0, index)];
    }
    
    return results;
}

/**
 * Calculate statistics from metrics
 */
function calculateStats(metrics, metricType) {
    const values = metrics
        .filter(m => m.type === metricType)
        .map(m => m.value);
    
    if (values.length === 0) return null;
    
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const percentiles = calculatePercentiles(values);
    
    return {
        count: values.length,
        avg: Math.round(avg * 100) / 100,
        ...percentiles,
        min: Math.min(...values),
        max: Math.max(...values)
    };
}

// ============================================
// API Endpoints
// ============================================

/**
 * Record a new metric
 * POST /api/metrics/record
 */
function recordMetric(req, res) {
    const { type, value, agent, metadata = {} } = req.body;
    
    if (!type || value === undefined) {
        return res.status(400).json({ 
            error: 'Missing required fields: type, value' 
        });
    }
    
    const entry = {
        type,
        value,
        agent: agent || 'system',
        metadata
    };
    
    appendMetric(entry);
    
    // Check for alert conditions
    const alerts = [];
    if (type === 'api_latency' && value > ALERT_THRESHOLDS.apiLatency) {
        alerts.push({
            type: 'api_latency_high',
            message: `API latency ${value}ms exceeds threshold ${ALERT_THRESHOLDS.apiLatency}ms`,
            severity: 'warning'
        });
    }
    if (type === 'error_rate' && value > ALERT_THRESHOLDS.errorRate) {
        alerts.push({
            type: 'error_rate_high',
            message: `Error rate ${value}% exceeds threshold ${ALERT_THRESHOLDS.errorRate}%`,
            severity: 'critical'
        });
    }
    if (type === 'token_usage' && value > ALERT_THRESHOLDS.tokenUsage) {
        alerts.push({
            type: 'token_usage_high',
            message: `Token usage ${value} exceeds daily limit ${ALERT_THRESHOLDS.tokenUsage}`,
            severity: 'warning'
        });
    }
    
    res.json({ 
        success: true, 
        timestamp: getTimestamp(),
        alerts: alerts.length > 0 ? alerts : undefined
    });
}

/**
 * Get API latency statistics
 * GET /api/metrics/latency?range=1h|6h|24h|7d
 */
function getLatencyStats(req, res) {
    const range = req.query.range || '1h';
    const now = new Date();
    const start = new Date(now);
    
    switch (range) {
        case '1h': start.setHours(start.getHours() - 1); break;
        case '6h': start.setHours(start.getHours() - 6); break;
        case '24h': start.setHours(start.getHours() - 24); break;
        case '7d': start.setDate(start.getDate() - 7); break;
        default: start.setHours(start.getHours() - 1);
    }
    
    const metrics = readMetrics(start, now)
        .filter(m => m.type === 'api_latency')
        .map(m => ({
            timestamp: m.timestamp,
            value: m.value,
            agent: m.agent
        }));
    
    const stats = calculateStats(
        metrics.map(m => ({ type: 'api_latency', value: m.value })),
        'api_latency'
    );
    
    res.json({
        range,
        stats,
        data: metrics,
        threshold: ALERT_THRESHOLDS.apiLatency
    });
}

/**
 * Get error rate statistics
 * GET /api/metrics/errors?range=1h|6h|24h|7d
 */
function getErrorStats(req, res) {
    const range = req.query.range || '24h';
    const now = new Date();
    const start = new Date(now);
    
    switch (range) {
        case '1h': start.setHours(start.getHours() - 1); break;
        case '6h': start.setHours(start.getHours() - 6); break;
        case '24h': start.setHours(start.getHours() - 24); break;
        case '7d': start.setDate(start.getDate() - 7); break;
        default: start.setHours(start.getHours() - 24);
    }
    
    const metrics = readMetrics(start, now)
        .filter(m => m.type === 'error_rate' || m.type === 'error_count');
    
    // Group by error type
    const byType = {};
    const byAgent = {};
    
    for (const m of metrics) {
        const key = m.metadata?.errorType || 'unknown';
        byType[key] = (byType[key] || 0) + 1;
        
        const agent = m.agent || 'system';
        byAgent[agent] = (byAgent[agent] || 0) + 1;
    }
    
    res.json({
        range,
        total: metrics.length,
        byType,
        byAgent,
        threshold: ALERT_THRESHOLDS.errorRate
    });
}

/**
 * Get token usage statistics
 * GET /api/metrics/tokens?range=1h|6h|24h|7d
 */
function getTokenStats(req, res) {
    const range = req.query.range || '24h';
    const now = new Date();
    const start = new Date(now);
    
    switch (range) {
        case '1h': start.setHours(start.getHours() - 1); break;
        case '6h': start.setHours(start.getHours() - 6); break;
        case '24h': start.setHours(start.getHours() - 24); break;
        case '7d': start.setDate(start.getDate() - 7); break;
        default: start.setHours(start.getHours() - 24);
    }
    
    const metrics = readMetrics(start, now)
        .filter(m => m.type === 'token_usage');
    
    // Group by agent
    const byAgent = {};
    let total = 0;
    
    for (const m of metrics) {
        const agent = m.agent || 'unknown';
        byAgent[agent] = (byAgent[agent] || 0) + m.value;
        total += m.value;
    }
    
    // Sort by usage
    const sortedAgents = Object.entries(byAgent)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    res.json({
        range,
        total,
        byAgent: Object.fromEntries(sortedAgents),
        threshold: ALERT_THRESHOLDS.tokenUsage,
        percentage: Math.round((total / ALERT_THRESHOLDS.tokenUsage) * 100)
    });
}

/**
 * Get agent performance statistics
 * GET /api/metrics/agents?range=24h
 */
function getAgentStats(req, res) {
    const range = req.query.range || '24h';
    const now = new Date();
    const start = new Date(now);
    
    switch (range) {
        case '1h': start.setHours(start.getHours() - 1); break;
        case '6h': start.setHours(start.getHours() - 6); break;
        case '24h': start.setHours(start.getHours() - 24); break;
        case '7d': start.setDate(start.getDate() - 7); break;
        default: start.setHours(start.getHours() - 24);
    }
    
    const metrics = readMetrics(start, now);
    
    // Group by agent
    const agentData = {};
    
    for (const m of metrics) {
        const agent = m.agent || 'system';
        if (!agentData[agent]) {
            agentData[agent] = {
                tasks: 0,
                errors: 0,
                tokens: 0,
                responseTimes: []
            };
        }
        
        if (m.type === 'task_complete') agentData[agent].tasks++;
        if (m.type === 'error_count') agentData[agent].errors++;
        if (m.type === 'token_usage') agentData[agent].tokens += m.value;
        if (m.type === 'response_time') agentData[agent].responseTimes.push(m.value);
    }
    
    // Calculate stats for each agent
    const results = Object.entries(agentData).map(([name, data]) => {
        const total = data.tasks + data.errors;
        const successRate = total > 0 ? ((data.tasks / total) * 100).toFixed(1) : 100;
        const avgResponse = data.responseTimes.length > 0 
            ? (data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length).toFixed(0)
            : 0;
        
        return {
            name,
            tasks: data.tasks,
            errors: data.errors,
            successRate: parseFloat(successRate),
            avgResponse: parseInt(avgResponse),
            tokens: data.tokens
        };
    });
    
    res.json({
        range,
        agents: results.sort((a, b) => b.tasks - a.tasks)
    });
}

/**
 * Get dashboard load time statistics
 * GET /api/metrics/load-times?range=24h
 */
function getLoadTimeStats(req, res) {
    const range = req.query.range || '24h';
    const now = new Date();
    const start = new Date(now);
    
    switch (range) {
        case '1h': start.setHours(start.getHours() - 1); break;
        case '6h': start.setHours(start.getHours() - 6); break;
        case '24h': start.setHours(start.getHours() - 24); break;
        case '7d': start.setDate(start.getDate() - 7); break;
        default: start.setHours(start.getHours() - 24);
    }
    
    const metrics = readMetrics(start, now)
        .filter(m => m.type === 'dashboard_load');
    
    // Group by dashboard
    const byDashboard = {};
    
    for (const m of metrics) {
        const dashboard = m.metadata?.dashboard || 'unknown';
        if (!byDashboard[dashboard]) {
            byDashboard[dashboard] = [];
        }
        byDashboard[dashboard].push(m.value);
    }
    
    // Calculate stats per dashboard
    const results = Object.entries(byDashboard).map(([name, times]) => ({
        name,
        avg: (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2),
        min: Math.min(...times).toFixed(2),
        max: Math.max(...times).toFixed(2),
        count: times.length
    }));
    
    res.json({
        range,
        dashboards: results.sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg))
    });
}

/**
 * Get system uptime
 * GET /api/metrics/uptime
 */
function getUptime(req, res) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    
    const metrics = readMetrics(start, now);
    
    // Count health checks
    const healthChecks = metrics.filter(m => m.type === 'health_check');
    const failedChecks = healthChecks.filter(m => m.value === 0).length;
    const totalChecks = healthChecks.length || 1;
    
    const uptime = ((totalChecks - failedChecks) / totalChecks * 100).toFixed(2);
    
    res.json({
        period: '30d',
        uptime: parseFloat(uptime),
        totalChecks,
        failedChecks,
        lastCheck: healthChecks.length > 0 
            ? healthChecks[healthChecks.length - 1].timestamp 
            : null
    });
}

/**
 * Get current alerts
 * GET /api/metrics/alerts
 */
function getAlerts(req, res) {
    const now = new Date();
    const start = new Date(now);
    start.setHours(start.getHours() - 24);
    
    const metrics = readMetrics(start, now);
    const alerts = [];
    
    // Check API latency
    const latencies = metrics
        .filter(m => m.type === 'api_latency')
        .map(m => m.value);
    if (latencies.length > 0) {
        const p95 = calculatePercentiles(latencies, [95]).p95;
        if (p95 > ALERT_THRESHOLDS.apiLatency) {
            alerts.push({
                type: 'api_latency_high',
                severity: 'warning',
                message: `p95 latency (${p95}ms) exceeds threshold (${ALERT_THRESHOLDS.apiLatency}ms)`,
                timestamp: getTimestamp()
            });
        }
    }
    
    // Check error rate
    const errors = metrics.filter(m => m.type === 'error_count').length;
    const total = metrics.filter(m => m.type === 'request_count').length || 1;
    const errorRate = (errors / total * 100);
    if (errorRate > ALERT_THRESHOLDS.errorRate) {
        alerts.push({
            type: 'error_rate_high',
            severity: 'critical',
            message: `Error rate (${errorRate.toFixed(2)}%) exceeds threshold (${ALERT_THRESHOLDS.errorRate}%)`,
            timestamp: getTimestamp()
        });
    }
    
    // Check token usage
    const tokenUsage = metrics
        .filter(m => m.type === 'token_usage')
        .reduce((sum, m) => sum + m.value, 0);
    if (tokenUsage > ALERT_THRESHOLDS.tokenUsage) {
        alerts.push({
            type: 'token_usage_high',
            severity: 'warning',
            message: `Daily token usage (${tokenUsage}) exceeds limit (${ALERT_THRESHOLDS.tokenUsage})`,
            timestamp: getTimestamp()
        });
    }
    
    res.json({
        alerts,
        count: alerts.length,
        hasCritical: alerts.some(a => a.severity === 'critical')
    });
}

/**
 * Get summary for dashboard
 * GET /api/metrics/summary
 */
function getSummary(req, res) {
    const now = new Date();
    const start24h = new Date(now);
    start24h.setHours(start24h.getHours() - 24);
    
    const metrics24h = readMetrics(start24h, now);
    
    // Calculate summary stats
    const latencies = metrics24h.filter(m => m.type === 'api_latency').map(m => m.value);
    const errors = metrics24h.filter(m => m.type === 'error_count').length;
    const requests = metrics24h.filter(m => m.type === 'request_count').length || 1;
    const tokens = metrics24h.filter(m => m.type === 'token_usage').reduce((sum, m) => sum + m.value, 0);
    
    const latencyStats = latencies.length > 0 ? calculatePercentiles(latencies) : { p50: 0, p95: 0, p99: 0 };
    
    res.json({
        timestamp: getTimestamp(),
        api: {
            latency: latencyStats,
            requests: requests
        },
        errors: {
            count: errors,
            rate: ((errors / requests) * 100).toFixed(2)
        },
        tokens: {
            used: tokens,
            limit: ALERT_THRESHOLDS.tokenUsage,
            percentage: Math.round((tokens / ALERT_THRESHOLDS.tokenUsage) * 100)
        },
        agents: {
            active: new Set(metrics24h.map(m => m.agent)).size,
            total: 20
        }
    });
}

// ============================================
// Express Router Setup
// ============================================

function createRouter() {
    const express = require('express');
    const router = express.Router();
    
    router.post('/record', recordMetric);
    router.get('/latency', getLatencyStats);
    router.get('/errors', getErrorStats);
    router.get('/tokens', getTokenStats);
    router.get('/agents', getAgentStats);
    router.get('/load-times', getLoadTimeStats);
    router.get('/uptime', getUptime);
    router.get('/alerts', getAlerts);
    router.get('/summary', getSummary);
    
    return router;
}

// ============================================
// Module Exports
// ============================================

module.exports = {
    createRouter,
    recordMetric,
    getLatencyStats,
    getErrorStats,
    getTokenStats,
    getAgentStats,
    getLoadTimeStats,
    getUptime,
    getAlerts,
    getSummary,
    appendMetric,
    cleanupOldMetrics,
    ALERT_THRESHOLDS
};

// If run directly, start cleanup
if (require.main === module) {
    cleanupOldMetrics();
    console.log('Metrics cleanup completed');
}
