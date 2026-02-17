#!/usr/bin/env node
/**
 * Token Tracker Cron Job
 * 
 * Updates token cache every 15 minutes.
 * Run via cron: /15 * * * * /usr/bin/node /root/.openclaw/workspace/mission-control/api/token-cron.js
 */

const tokenTracker = require('./tokens.js');

console.log(`[${new Date().toISOString()}] Token Tracker Cron - Starting update...`);

try {
  // Force refresh token data
  const data = tokenTracker.getTokenData(true);
  
  console.log(`[${new Date().toISOString()}] Token Tracker Cron - Update complete`);
  console.log(`  - Sessions: ${data.sessionCount}`);
  console.log(`  - Agents: ${data.agents.length}`);
  console.log(`  - Total Tokens: ${data.total.totalTokens.toLocaleString()}`);
  console.log(`  - Total Cost: $${data.total.cost.toFixed(4)}`);
  
  process.exit(0);
} catch (error) {
  console.error(`[${new Date().toISOString()}] Token Tracker Cron - Error:`, error.message);
  process.exit(1);
}
