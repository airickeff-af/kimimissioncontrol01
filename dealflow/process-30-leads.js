const fs = require('fs');
const path = require('path');

// ============================================================================
// DEALFLOW PIE ENRICHMENT PIPELINE - SUBAGENT TASK
// Processes 30 leads through contact enrichment and readiness scoring
// ============================================================================

// Load the enrichment modules
const contactEnrichment = require('/root/.openclaw/workspace/dealflow/contact-enrichment.js');
const leadReadiness = require('/root/.openclaw/workspace/dealflow/lead-readiness.js');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  inputPath: '/root/.openclaw/workspace/mission-control/agents/dealflow/leads_complete_26.json',
  outputPath: '/root/.openclaw/workspace/mission-control/agents/dealflow/leads_enriched_30.json',
  targetLeadCount: 30
};

// 4 Additional leads to reach 30 total
const ADDITIONAL_LEADS = [
  {
    "id": "lead_027",
    "company": "Crypto.com",
    "contact_name": "Kris Marszalek",
    "title": "CEO & Co-Founder",
    "email": null,
    "email_verified": false,
    "linkedin": "https://www.linkedin.com/in/krismarszalek",
    "linkedin_personal": "https://www.linkedin.com/in/krismarszalek",
    "twitter": "https://x.com/kris",
    "phone": null,
    "telegram": null,
    "status": "new",
    "priority": "P0",
    "notes": "Global cryptocurrency exchange with strong Asia presence. Recently launched AI agent platform Feb 2026. Major player for potential partnerships. Based in Singapore.",
    "research_sources": [
      "https://crypto.com",
      "https://www.linkedin.com/in/krismarszalek"
    ],
    "last_researched": "2026-02-18",
    "company_domain": "crypto.com",
    "funding": "Well-funded, IPO preparation",
    "employees": 4000,
    "market": "Global",
    "region": "Singapore"
  },
  {
    "id": "lead_028",
    "company": "Plentina",
    "contact_name": "Kevin Gabayan",
    "title": "CEO & Co-Founder",
    "email": null,
    "email_verified": false,
    "linkedin": "https://ph.linkedin.com/in/kevin-gabayan",
    "linkedin_personal": "https://ph.linkedin.com/in/kevin-gabayan",
    "twitter": null,
    "phone": null,
    "telegram": null,
    "status": "new",
    "priority": "P1",
    "notes": "Filipino fintech providing buy-now-pay-later and financial services. Backed by Silicon Valley investors. Strong growth trajectory in PH market. Potential integration partner.",
    "research_sources": [
      "https://plentina.com",
      "https://ph.linkedin.com/in/kevin-gabayan"
    ],
    "last_researched": "2026-02-18",
    "company_domain": "plentina.com",
    "funding": "$10M+ Series A",
    "employees": 100,
    "market": "Philippines",
    "region": "Philippines"
  },
  {
    "id": "lead_029",
    "company": "First Digital Trust",
    "contact_name": "Vincent Chok",
    "title": "CEO",
    "email": null,
    "email_verified": false,
    "linkedin": "https://hk.linkedin.com/in/vincent-chok",
    "linkedin_personal": "https://hk.linkedin.com/in/vincent-chok",
    "twitter": null,
    "phone": null,
    "telegram": null,
    "status": "new",
    "priority": "P1",
    "notes": "Hong Kong-based digital asset custody and trust company. Issuer of FDUSD stablecoin. Key infrastructure player in Asia crypto ecosystem. Regulatory-compliant institutional partner.",
    "research_sources": [
      "https://firstdigitalexchange.com",
      "https://hk.linkedin.com/in/vincent-chok"
    ],
    "last_researched": "2026-02-18",
    "company_domain": "firstdigitalexchange.com",
    "funding": "Privately funded",
    "employees": 50,
    "market": "Asia-Pacific",
    "region": "Hong Kong"
  },
  {
    "id": "lead_030",
    "company": "Coins.ph",
    "contact_name": "Naomi Mclaughlin",
    "title": "Head of Partnerships",
    "email": null,
    "email_verified": false,
    "linkedin": "https://ph.linkedin.com/in/naomi-mclaughlin",
    "linkedin_personal": "https://ph.linkedin.com/in/naomi-mclaughlin",
    "twitter": null,
    "phone": null,
    "telegram": null,
    "status": "new",
    "priority": "P0",
    "notes": "Head of Partnerships at Coins.ph. Alternative contact to Wei Zhou for partnership discussions. Specializes in strategic alliances and business development. Direct path to partnership discussions.",
    "research_sources": [
      "https://www.coins.ph",
      "https://ph.linkedin.com/in/naomi-mclaughlin"
    ],
    "last_researched": "2026-02-18",
    "company_domain": "coins.ph",
    "funding": "Part of Coins.ph group",
    "employees": 200,
    "market": "Philippines/Global",
    "region": "Philippines"
  }
];

// ============================================================================
// PIE INTELLIGENCE MOCK DATA
// ============================================================================

const PIE_INTEL = {
  "lead_001": {
    "signal_type": "expansion",
    "signal_strength": 0.95,
    "optimal_time": "Tuesday 10:00 AM PHT",
    "recent_news": "Coins.xyz launched in Brazil January 2025",
    "partnership_angles": ["Global expansion partnership", "Cross-border remittance", "Crypto payment integration"],
    "personalization_hook": "Congratulations on the Brazil launch"
  },
  "lead_002": {
    "signal_type": "expansion",
    "signal_strength": 0.92,
    "optimal_time": "Wednesday 2:00 PM PHT",
    "recent_news": "Same leadership as Coins.ph, focusing on global markets",
    "partnership_angles": ["International corridor expansion", "B2B payment solutions", "Contractor payments"],
    "personalization_hook": "Interested in your global expansion strategy"
  },
  "lead_003": {
    "signal_type": "funding",
    "signal_strength": 0.85,
    "optimal_time": "Thursday 11:00 AM PHT",
    "recent_news": "$51.1M raised, BSP licensed",
    "partnership_angles": ["Regulatory-compliant partnership", "Institutional integration", "Market making"],
    "personalization_hook": "Impressive growth with BSP license"
  },
  "lead_004": {
    "signal_type": "career_move",
    "signal_strength": 0.80,
    "optimal_time": "Tuesday 3:00 PM PHT",
    "recent_news": "Recently moved to GCash as Head of GCrypto",
    "partnership_angles": ["GCash crypto integration", "80M user base access", "Mobile-first partnership"],
    "personalization_hook": "Congratulations on the new role at GCash"
  },
  "lead_005": {
    "signal_type": "pioneer",
    "signal_strength": 0.70,
    "optimal_time": "Friday 10:00 AM PHT",
    "recent_news": "Long-standing Bitcoin advocate in PH",
    "partnership_angles": ["Bitcoin remittance corridor", "Community partnership", "Education initiatives"],
    "personalization_hook": "Admire your work since 2013 in PH crypto"
  },
  "lead_006": {
    "signal_type": "regulatory_challenge",
    "signal_strength": 0.50,
    "optimal_time": null,
    "recent_news": "Kenneth Stern left in Nov 2023, need new contact",
    "partnership_angles": [],
    "personalization_hook": null
  },
  "lead_007": {
    "signal_type": "growth",
    "signal_strength": 0.90,
    "optimal_time": "Monday 9:00 AM PHT",
    "recent_news": "Record growth in 2024, profitable ahead of target",
    "partnership_angles": ["Digital banking integration", "Crypto payments", "80M user ecosystem"],
    "personalization_hook": "Congratulations on profitability ahead of target"
  },
  "lead_008": {
    "signal_type": "funding",
    "signal_strength": 0.85,
    "optimal_time": "Wednesday 11:00 AM PHT",
    "recent_news": "$350M+ raised, expanding globally",
    "partnership_angles": ["Underserved market lending", "Cross-border loans", "Financial inclusion"],
    "personalization_hook": "Impressive mission for financial inclusion"
  },
  "lead_009": {
    "signal_type": "growth",
    "signal_strength": 0.82,
    "optimal_time": "Tuesday 2:00 PM PHT",
    "recent_news": "Fastest growing payment platform in PH",
    "partnership_angles": ["Payment gateway integration", "Merchant crypto acceptance", "API partnership"],
    "personalization_hook": "Impressive growth as YC alum"
  },
  "lead_010": {
    "signal_type": "expansion",
    "signal_strength": 0.78,
    "optimal_time": "Thursday 10:00 AM PHT",
    "recent_news": "Managing Philippines operations for Xendit",
    "partnership_angles": ["SEA payment rails", "Cross-border settlement", "B2B payments"],
    "personalization_hook": "Interested in your Philippines expansion"
  },
  "lead_011": {
    "signal_type": "growth",
    "signal_strength": 0.88,
    "optimal_time": "Monday 11:00 AM PHT",
    "recent_news": "YCombinator alum, Forbes 30 Under 30",
    "partnership_angles": ["SEA expansion", "Payment infrastructure", "Crypto on/off ramps"],
    "personalization_hook": "Congratulations on Xendit's growth across SEA"
  },
  "lead_012": {
    "signal_type": "regulatory_progress",
    "signal_strength": 0.65,
    "optimal_time": "Friday 2:00 PM PHT",
    "recent_news": "Working with DOTr on motorcycle taxi regulations",
    "partnership_angles": ["Driver payment solutions", "Fintech integration", "Mobile wallet partnership"],
    "personalization_hook": "Impressive work with DOTr on regulations"
  },
  "lead_013": {
    "signal_type": "growth",
    "signal_strength": 0.80,
    "optimal_time": "Wednesday 9:00 AM PHT",
    "recent_news": "Digital bank with physical kiosks, Robinsons partnership",
    "partnership_angles": ["Banking integration", "Crypto custody", "Retail on/off ramps"],
    "personalization_hook": "Innovative approach with physical kiosks"
  },
  "lead_014": {
    "signal_type": "leadership",
    "signal_strength": 0.82,
    "optimal_time": "Tuesday 11:00 AM PHT",
    "recent_news": "President of Fintech Philippines Association",
    "partnership_angles": ["Industry partnership", "Crypto payments", "Merchant network"],
    "personalization_hook": "Your leadership at Fintech PH Association"
  },
  "lead_015": {
    "signal_type": "pioneer",
    "signal_strength": 0.85,
    "optimal_time": "Thursday 3:00 PM PHT",
    "recent_news": "Pioneer since 2014, multiple products under SCI",
    "partnership_angles": ["Bitcoin ecosystem", "Remittance partnership", "Infrastructure"],
    "personalization_hook": "Pioneer in PH Bitcoin since 2014"
  },
  "lead_016": {
    "signal_type": "growth",
    "signal_strength": 0.95,
    "optimal_time": "Monday 10:00 AM PHT",
    "recent_news": "80M+ users, #1 Finance Super App, profitable",
    "partnership_angles": ["Super app integration", "Crypto services", "Massive user base"],
    "personalization_hook": "Congratulations on 80M users and profitability"
  },
  "lead_017": {
    "signal_type": "regulatory",
    "signal_strength": 0.60,
    "optimal_time": null,
    "recent_news": "BSP-licensed virtual currency exchange",
    "partnership_angles": ["Physical crypto exchange", "Retail presence", "Compliance"],
    "personalization_hook": null
  },
  "lead_018": {
    "signal_type": "pioneer",
    "signal_strength": 0.65,
    "optimal_time": null,
    "recent_news": "Co-founded BloomX in 2015",
    "partnership_angles": ["Blockchain solutions", "Enterprise partnerships"],
    "personalization_hook": null
  },
  "lead_019": {
    "signal_type": "pioneer",
    "signal_strength": 0.70,
    "optimal_time": "Friday 11:00 AM PHT",
    "recent_news": "SCI Ventures Chairman, serial entrepreneur",
    "partnership_angles": ["Bitcoin wallet integration", "Advisory partnership"],
    "personalization_hook": "Your work with SCI Ventures since 2014"
  },
  "lead_020": {
    "signal_type": "market_leader",
    "signal_strength": 0.80,
    "optimal_time": "Wednesday 4:00 PM PHT",
    "recent_news": "Leading play-to-earn gaming guild globally",
    "partnership_angles": ["Gaming partnerships", "GameFi integration", "Community access"],
    "personalization_hook": "Leading the GameFi revolution"
  },
  "lead_021": {
    "signal_type": "funding",
    "signal_strength": 0.70,
    "optimal_time": null,
    "recent_news": "$10M+ funding for gaming assets",
    "partnership_angles": ["Gaming asset factory", "NFT partnerships"],
    "personalization_hook": null
  },
  "lead_022": {
    "signal_type": "market_leader",
    "signal_strength": 0.85,
    "optimal_time": "Tuesday 1:00 PM PHT",
    "recent_news": "Massive PH user base for Axie Infinity",
    "partnership_angles": ["Gaming ecosystem", "PH market access", "Blockchain gaming"],
    "personalization_hook": "PH market is critical for Axie"
  },
  "lead_023": {
    "signal_type": "joint_venture",
    "signal_strength": 0.55,
    "optimal_time": null,
    "recent_news": "Japanese-PH crypto wallet JV",
    "partnership_angles": ["Cross-border wallet", "Japan market"],
    "personalization_hook": null
  },
  "lead_024": {
    "signal_type": "pioneer",
    "signal_strength": 0.70,
    "optimal_time": null,
    "recent_news": "Original founder of PayMaya",
    "partnership_angles": ["Mobile payments", "Industry connections"],
    "personalization_hook": null
  },
  "lead_025": {
    "signal_type": "connector",
    "signal_strength": 0.75,
    "optimal_time": null,
    "recent_news": "Key connector in PH fintech ecosystem",
    "partnership_angles": ["Warm intros", "Industry network"],
    "personalization_hook": null
  },
  "lead_026": {
    "signal_type": "leadership",
    "signal_strength": 0.75,
    "optimal_time": "Thursday 2:00 PM PHT",
    "recent_news": "President of Blockchain Council PH",
    "partnership_angles": ["Policy discussions", "Industry connections"],
    "personalization_hook": "Your leadership at Blockchain Council PH"
  },
  "lead_027": {
    "signal_type": "ai_launch",
    "signal_strength": 0.92,
    "optimal_time": "Monday 11:00 AM SGT",
    "recent_news": "Launched AI agent platform Feb 2026",
    "partnership_angles": ["AI agent payments", "Global exchange partnership", "Crypto infrastructure"],
    "personalization_hook": "Congratulations on the AI agent platform launch"
  },
  "lead_028": {
    "signal_type": "funding",
    "signal_strength": 0.80,
    "optimal_time": "Wednesday 10:00 AM PHT",
    "recent_news": "$10M+ Series A, strong PH growth",
    "partnership_angles": ["BNPL integration", "Consumer lending", "Financial inclusion"],
    "personalization_hook": "Impressive growth with Series A"
  },
  "lead_029": {
    "signal_type": "stablecoin",
    "signal_strength": 0.88,
    "optimal_time": "Tuesday 9:00 AM HKT",
    "recent_news": "FDUSD stablecoin issuer, Hong Kong licensed",
    "partnership_angles": ["Stablecoin integration", "Custody solutions", "Institutional partnership"],
    "personalization_hook": "Impressive work with FDUSD in Asia"
  },
  "lead_030": {
    "signal_type": "partnership_access",
    "signal_strength": 0.90,
    "optimal_time": "Tuesday 10:00 AM PHT",
    "recent_news": "Head of Partnerships at Coins.ph",
    "partnership_angles": ["Direct partnership path", "Strategic alliances", "Business development"],
    "personalization_hook": "Interested in partnership opportunities"
  }
};

// ============================================================================
// MAIN PIPELINE
// ============================================================================

async function runPipeline() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   DEALFLOW PIE ENRICHMENT PIPELINE - 30 LEADS             ║');
  console.log('║   Processing leads through enrichment and scoring          ║');
  console.log('╚════════════════════════════════════════════════════════════\n');

  try {
    // Load the 26 existing leads
    const leads26 = JSON.parse(fs.readFileSync(CONFIG.inputPath, 'utf8'));
    console.log(`📥 Loaded ${leads26.length} leads from ${CONFIG.inputPath}`);

    // Add company_domain if missing
    leads26.forEach(lead => {
      if (!lead.company_domain && lead.company) {
        lead.company_domain = lead.company.toLowerCase()
          .replace(/\s+/g, '')
          .replace(/[^a-z0-9]/g, '') + '.com';
      }
    });

    // Combine with 4 additional leads
    const allLeads = [...leads26, ...ADDITIONAL_LEADS];
    console.log(`➕ Added ${ADDITIONAL_LEADS.length} additional leads`);
    console.log(`📊 Total leads to process: ${allLeads.length}\n`);

    // Process each lead
    const enrichedLeads = [];
    const readyForHandoff = [];
    let totalReadinessScore = 0;
    let emailCount = 0;
    let verifiedEmailCount = 0;
    let linkedinCount = 0;
    let linkedinPersonalCount = 0;

    for (const lead of allLeads) {
      console.log(`🔍 Processing: ${lead.company} - ${lead.contact_name || 'TBD'}`);

      // Calculate accessibility score
      const accessibility = contactEnrichment.calculateAccessibilityScore(lead);

      // Get PIE intel
      const pieIntel = PIE_INTEL[lead.id] || {};

      // Calculate lead readiness
      const readiness = leadReadiness.calculateReadiness(lead, {
        accessibilityScore: accessibility.score,
        pieIntel: pieIntel
      });

      // Generate email patterns if email is missing
      let emailPatterns = null;
      if (!lead.email && lead.contact_name && lead.company_domain) {
        const names = lead.contact_name.split(' ');
        emailPatterns = contactEnrichment.generateEmailPatterns(
          names[0],
          names.slice(1).join(' '),
          lead.company_domain
        );
      }

      // Build enriched lead
      const enriched = {
        ...lead,
        email_patterns: emailPatterns,
        enrichment: {
          accessibility,
          readiness,
          pie_intel: pieIntel,
          enriched_at: new Date().toISOString(),
          enrichment_version: '1.0.0'
        }
      };

      enrichedLeads.push(enriched);

      // Track metrics
      totalReadinessScore += readiness.score;
      if (lead.email) emailCount++;
      if (lead.email_verified) verifiedEmailCount++;
      if (lead.linkedin) linkedinCount++;
      if (lead.linkedin_personal) linkedinPersonalCount++;

      // Check if ready for handoff (score >= 70)
      if (readiness.score >= 70) {
        readyForHandoff.push({
          lead_id: lead.id,
          company: lead.company,
          contact_name: lead.contact_name,
          title: lead.title,
          readiness_score: readiness.score,
          priority: readiness.priority,
          status: readiness.status,
          contact: {
            email: lead.email,
            email_verified: lead.email_verified,
            linkedin: lead.linkedin_personal || lead.linkedin,
            phone: lead.phone
          },
          handoff_package: contactEnrichment.generateHandoffPackage(enriched)
        });
        console.log(`  ✅ READY FOR HANDOFF (${readiness.score}/100)`);
      } else {
        console.log(`  📝 Score: ${readiness.score}/100 - ${readiness.status}`);
      }
    }

    // Calculate final metrics
    const avgReadinessScore = Math.round(totalReadinessScore / allLeads.length);
    const emailCoverage = Math.round((emailCount / allLeads.length) * 100);
    const linkedinCoverage = Math.round((linkedinPersonalCount / allLeads.length) * 100);

    // Build output
    const output = {
      generated_at: new Date().toISOString(),
      summary: {
        total_leads: allLeads.length,
        average_readiness_score: avgReadinessScore,
        ready_for_handoff: readyForHandoff.length,
        needs_work: allLeads.length - readyForHandoff.length,
        email_coverage_percent: emailCoverage,
        verified_email_coverage_percent: Math.round((verifiedEmailCount / allLeads.length) * 100),
        linkedin_coverage_percent: linkedinCoverage
      },
      handoff_candidates: readyForHandoff,
      leads: enrichedLeads
    };

    // Save output
    fs.writeFileSync(CONFIG.outputPath, JSON.stringify(output, null, 2));

    // Print report
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   ENRICHMENT COMPLETE - FINAL REPORT                       ║');
    console.log('╚════════════════════════════════════════════════════════════\n');

    console.log('📊 METRICS:');
    console.log(`   Total Leads Processed: ${allLeads.length}`);
    console.log(`   Average Readiness Score: ${avgReadinessScore}/100`);
    console.log(`   Ready for ColdCall Handoff: ${readyForHandoff.length} (score >= 70)`);
    console.log(`   Email Coverage: ${emailCoverage}%`);
    console.log(`   LinkedIn Coverage: ${linkedinCoverage}%\n`);

    console.log('🎯 HANDOFF CANDIDATES (Score >= 70):');
    readyForHandoff
      .sort((a, b) => b.readiness_score - a.readiness_score)
      .forEach((lead, i) => {
        console.log(`   ${i + 1}. ${lead.company} (${lead.contact_name}) - ${lead.readiness_score}/100 [${lead.priority}]`);
      });

    console.log('\n💾 Output saved to:');
    console.log(`   ${CONFIG.outputPath}\n`);

    // Check targets
    console.log('🎯 TARGET ANALYSIS:');
    console.log(`   Email Coverage Target: 60% | Actual: ${emailCoverage}% ${emailCoverage >= 60 ? '✅' : '❌'}`);
    console.log(`   Handoff Target: 5+ leads | Actual: ${readyForHandoff.length} ${readyForHandoff.length >= 5 ? '✅' : '❌'}`);

    return output;

  } catch (error) {
    console.error('❌ Pipeline failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the pipeline
runPipeline().then(output => {
  console.log('\n✅ Pipeline completed successfully\n');
  process.exit(0);
}).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
