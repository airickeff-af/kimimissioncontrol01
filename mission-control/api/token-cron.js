#!/usr/bin/env node
/**
 * Token Tracker Cron Job
 * 
 * Updates token cache every 15 minutes.
 * Run via cron: /15 * * * * /usr/bin/node /root/.openclaw/workspace/mission-control/api/token-cron.js
 */

const tokenTracker = require('./tokens.js');


try {
  // Force refresh token data
  const data = tokenTracker.getTokenData(true);
  
  
  process.exit(0);
} catch (error) {
  console.error(`[${new Date().toISOString()}] Token Tracker Cron - Error:`, error.message);
  process.exit(1);
}
