/**
 * PIE Briefing Generator CLI
 * 
 * Usage: node briefing-generator.js <lead-id> [options]
 * 
 * Generates comprehensive meeting briefings for leads
 */

const PIE = require('./pie-core');
const fs = require('fs').promises;
const path = require('path');

async function generateBriefing(leadId, options = {}) {
  console.log(`🎯 PIE Briefing Generator`);
  console.log(`═══════════════════════════════════════`);
  
  // Initialize PIE
  const pie = new PIE({
    dealflowIntegration: true,
    autoEnrich: true
  });
  
  await pie.initialize();
  
  // Get lead data
  console.log(`\n📋 Loading lead: ${leadId}...`);
  
  // Generate briefing
  console.log(`🔍 Researching...`);
  const briefing = await pie.generateBriefing(leadId, options);
  
  // Format output
  console.log(`\n═══════════════════════════════════════`);
  console.log(`📊 BRIEFING: ${briefing.executiveSummary.company}`);
  console.log(`═══════════════════════════════════════\n`);
  
  // Executive Summary
  console.log(`🎯 EXECUTIVE SUMMARY`);
  console.log(`─────────────────────────────────────`);
  console.log(`Company: ${briefing.executiveSummary.company}`);
  console.log(`Decision Maker: ${briefing.executiveSummary.decisionMaker || 'TBD'}`);
  console.log(`Relevance Score: ${briefing.executiveSummary.relevanceScore}/100`);
  console.log(`Key Insight: ${briefing.executiveSummary.keyInsight}`);
  console.log(`Approach: ${briefing.executiveSummary.recommendedApproach}\n`);
  
  // Company Info
  console.log(`🏢 COMPANY INTELLIGENCE`);
  console.log(`─────────────────────────────────────`);
  console.log(`Industry: ${briefing.company.industry}`);
  console.log(`Stage: ${briefing.company.stage || 'N/A'}`);
  console.log(`Employees: ${briefing.company.employees || 'N/A'}`);
  console.log(`Funding: ${briefing.company.totalFunding || 'N/A'}`);
  console.log(`HQ: ${briefing.company.headquarters || 'N/A'}\n`);
  
  // Talking Points
  console.log(`💬 RECOMMENDED TALKING POINTS`);
  console.log(`─────────────────────────────────────`);
  
  if (briefing.talkingPoints.opening.length > 0) {
    console.log(`\n🚪 Opening Hooks:`);
    briefing.talkingPoints.opening.forEach((hook, i) => {
      console.log(`   ${i + 1}. "${hook}"`);
    });
  }
  
  console.log(`\n💎 Value Propositions:`);
  briefing.talkingPoints.valueProposition.forEach((vp, i) => {
    console.log(`   ${i + 1}. ${vp}`);
  });
  
  if (briefing.talkingPoints.angles.length > 0) {
    console.log(`\n🤝 Partnership Angles:`);
    briefing.talkingPoints.angles.forEach((angle, i) => {
      console.log(`   ${i + 1}. ${angle.title}: ${angle.description}`);
      console.log(`      Relevance: ${angle.relevance}`);
    });
  }
  
  console.log(`\n❓ Questions to Ask:`);
  briefing.talkingPoints.questionsToAsk.forEach((q, i) => {
    console.log(`   ${i + 1}. ${q}`);
  });
  
  // Objection Handlers
  console.log(`\n🛡️ OBJECTION HANDLERS`);
  console.log(`─────────────────────────────────────`);
  briefing.talkingPoints.objectionHandlers.forEach((oh, i) => {
    console.log(`\n   ❌ "${oh.objection}"`);
    console.log(`   ✅ "${oh.response}"`);
  });
  
  // Recent News
  if (briefing.news.latest.length > 0) {
    console.log(`\n📰 RECENT NEWS`);
    console.log(`─────────────────────────────────────`);
    briefing.news.latest.slice(0, 3).forEach((news, i) => {
      console.log(`\n   ${i + 1}. ${news.title}`);
      console.log(`      ${news.description?.substring(0, 100)}...`);
    });
  }
  
  // Our Position
  console.log(`\n🏆 OUR POSITION`);
  console.log(`─────────────────────────────────────`);
  console.log(`Key Advantages:`);
  briefing.ourPosition.marketAdvantages.forEach((adv, i) => {
    console.log(`   • ${adv}`);
  });
  
  console.log(`\nRelevant Case Studies:`);
  briefing.ourPosition.caseStudies.forEach((cs, i) => {
    console.log(`   • ${cs.partner}: ${cs.result}`);
  });
  
  // Next Steps
  console.log(`\n➡️ RECOMMENDED NEXT STEPS`);
  console.log(`─────────────────────────────────────`);
  briefing.talkingPoints.nextSteps.forEach((step, i) => {
    console.log(`   ${i + 1}. ${step}`);
  });
  
  // Save to file
  const outputPath = path.join(__dirname, 'data', 'briefings', `${leadId}-briefing-${Date.now()}.md`);
  
  if (options.save !== false) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    const markdown = generateMarkdown(briefing);
    await fs.writeFile(outputPath, markdown);
    
    console.log(`\n✅ Briefing saved to: ${outputPath}`);
  }
  
  console.log(`\n═══════════════════════════════════════`);
  console.log(`🎤 Good luck with your meeting!`);
  console.log(`═══════════════════════════════════════\n`);
  
  await pie.stop();
  
  return briefing;
}

/**
 * Generate Markdown version of briefing
 */
function generateMarkdown(briefing) {
  return `# Meeting Briefing: ${briefing.executiveSummary.company}

**Generated:** ${new Date(briefing.generatedAt).toLocaleString()}  
**Briefing ID:** ${briefing.id}

---

## 🎯 Executive Summary

| Field | Value |
|-------|-------|
| **Company** | ${briefing.executiveSummary.company} |
| **Decision Maker** | ${briefing.executiveSummary.decisionMaker || 'TBD'} |
| **Relevance Score** | ${briefing.executiveSummary.relevanceScore}/100 |
| **Key Insight** | ${briefing.executiveSummary.keyInsight} |
| **Recommended Approach** | ${briefing.executiveSummary.recommendedApproach} |

---

## 🏢 Company Intelligence

- **Industry:** ${briefing.company.industry}
- **Stage:** ${briefing.company.stage || 'N/A'}
- **Employees:** ${briefing.company.employees || 'N/A'}
- **Total Funding:** ${briefing.company.totalFunding || 'N/A'}
- **Headquarters:** ${briefing.company.headquarters || 'N/A'}

${briefing.company.description ? `**Description:** ${briefing.company.description}` : ''}

---

## 💬 Talking Points

### Opening Hooks
${briefing.talkingPoints.opening.map(h => `- "${h}"`).join('\n')}

### Value Propositions
${briefing.talkingPoints.valueProposition.map(vp => `- ${vp}`).join('\n')}

### Partnership Angles
${briefing.talkingPoints.angles.map(a => `**${a.title}:** ${a.description}\n- Relevance: ${a.relevance}`).join('\n\n')}

### Questions to Ask
${briefing.talkingPoints.questionsToAsk.map((q, i) => `${i + 1}. ${q}`).join('\n')}

---

## 🛡️ Objection Handlers

${briefing.talkingPoints.objectionHandlers.map(oh => `**Objection:** "${oh.objection}"\n\n**Response:** "${oh.response}"`).join('\n\n---\n\n')}

---

## 📰 Recent News

${briefing.news.latest.map(n => `- **${n.title}** (${n.publishedAt})\n  ${n.description}`).join('\n\n')}

---

## 🏆 Our Position

### Market Advantages
${briefing.ourPosition.marketAdvantages.map(a => `- ${a}`).join('\n')}

### Relevant Case Studies
${briefing.ourPosition.caseStudies.map(cs => `- **${cs.partner}:** ${cs.result}`).join('\n')}

---

## ➡️ Recommended Next Steps

${briefing.talkingPoints.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

---

*Generated by PIE (Predictive Intelligence Engine)*
`;
}

// CLI execution
if (require.main === module) {
  const leadId = process.argv[2];
  
  if (!leadId) {
    console.log('Usage: node briefing-generator.js <lead-id> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --no-save    Don\'t save briefing to file');
    console.log('  --format     Output format (json|markdown|console)');
    process.exit(1);
  }
  
  const options = {
    save: !process.argv.includes('--no-save'),
    format: process.argv.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'console'
  };
  
  generateBriefing(leadId, options).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

module.exports = { generateBriefing, generateMarkdown };
