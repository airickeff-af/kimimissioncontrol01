#!/usr/bin/env node
/**
 * Lead Pipeline Integration Hook
 * 
 * This script is called by the lead intake system when new leads are added.
 * It triggers the auto-enrichment process.
 * 
 * Usage:
 *   node enrichment-hook.js                    # Trigger enrichment
 *   node enrichment-hook.js --lead-id=<id>    # Enrich specific lead
 */

const { spawn } = require('child_process');
const path = require('path');

const AUTO_ENRICH_PATH = path.join(__dirname, 'auto-enrich.js');

function runEnrichment(args = []) {
  return new Promise((resolve, reject) => {
    console.log('🚀 Triggering lead enrichment...');
    
    const child = spawn('node', [AUTO_ENRICH_PATH, '--once', ...args], {
      stdio: 'inherit',
      cwd: __dirname
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Enrichment completed successfully');
        resolve();
      } else {
        reject(new Error(`Enrichment process exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  try {
    await runEnrichment(args);
    process.exit(0);
  } catch (err) {
    console.error('❌ Enrichment failed:', err.message);
    process.exit(1);
  }
}

main();
