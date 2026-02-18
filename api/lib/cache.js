// API Caching Utility
// Provides Cache-Control headers and ETag support for API responses

const crypto = require('crypto');

/**
 * Cache configuration for different endpoint types
 * TTL values in seconds
 */
const CACHE_CONFIG = {
  // Activity logs - short TTL since data changes frequently
  logsActivity: {
    maxAge: 30,
    staleWhileRevalidate: 60,
    etag: true
  },
  // Agents - medium TTL, updates when agents change status
  agents: {
    maxAge: 60,
    staleWhileRevalidate: 120,
    etag: true
  },
  // Tasks - medium TTL, updates when tasks change
  tasks: {
    maxAge: 60,
    staleWhileRevalidate: 120,
    etag: true
  },
  // Health - longer TTL, rarely changes
  health: {
    maxAge: 300,
    staleWhileRevalidate: 600,
    etag: true
  },
  // Stats - medium TTL
  stats: {
    maxAge: 60,
    staleWhileRevalidate: 120,
    etag: true
  },
  // Deployments - longer TTL, changes less frequently
  deployments: {
    maxAge: 120,
    staleWhileRevalidate: 300,
    etag: true
  }
};

/**
 * Generate ETag from data
 * @param {Object} data - Response data
 * @returns {string} ETag value
 */
function generateETag(data) {
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex');
  return `"${hash}"`;
}

/**
 * Check if client has matching ETag (conditional request)
 * @param {Object} req - Request object
 * @param {string} etag - Current ETag
 * @returns {boolean} True if content unchanged
 */
function isETagMatch(req, etag) {
  const clientETag = req.headers['if-none-match'];
  return clientETag && clientETag === etag;
}

/**
 * Set cache headers on response
 * @param {Object} res - Response object
 * @param {string} endpointType - Key from CACHE_CONFIG
 * @param {Object} data - Response data (for ETag generation)
 * @returns {string|null} ETag value or null
 */
function setCacheHeaders(res, endpointType, data) {
  const config = CACHE_CONFIG[endpointType];
  if (!config) return null;

  // Set Cache-Control header
  const cacheControl = [`max-age=${config.maxAge}`];
  if (config.staleWhileRevalidate) {
    cacheControl.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }
  res.setHeader('Cache-Control', cacheControl.join(', '));

  // Set Vary header to ensure proper cache key
  res.setHeader('Vary', 'Accept-Encoding');

  // Generate and set ETag
  let etag = null;
  if (config.etag && data) {
    etag = generateETag(data);
    res.setHeader('ETag', etag);
  }

  return etag;
}

/**
 * Send cached response with proper headers
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {string} endpointType - Key from CACHE_CONFIG
 * @param {Object} data - Response data
 * @param {number} statusCode - HTTP status code
 */
function sendCachedResponse(req, res, endpointType, data, statusCode = 200) {
  const etag = setCacheHeaders(res, endpointType, data);

  // Check for conditional request (If-None-Match)
  if (etag && isETagMatch(req, etag)) {
    return res.status(304).end();
  }

  return res.status(statusCode).json(data);
}

/**
 * Invalidate cache by including cache-busting header
 * @param {Object} res - Response object
 */
function setCacheBustingHeaders(res) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

module.exports = {
  CACHE_CONFIG,
  generateETag,
  isETagMatch,
  setCacheHeaders,
  sendCachedResponse,
  setCacheBustingHeaders
};
