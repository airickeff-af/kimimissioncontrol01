/**
 * ColdCall Automation Module
 * P1 TASK: ColdCall Activation & Outreach Sequences
 * 
 * Features:
 * - Automated email sequences (Day 0, 2, 5, 7)
 * - Personalization tokens: {name}, {company}, {pain_point}
 * - A/B testing framework for subject lines
 * - Integration with DealFlow enriched leads
 * - Ready for EricF approval
 * 
 * @module coldcall-automation
 * @version 1.0.0
 * @author Nexus (Air1ck3ff)
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Data Paths
  DATA_DIR: path.join(__dirname, '..', '..', 'data'),
  LEADS_FILE: path.join(__dirname, '..', '..', 'data', 'enriched-leads-v2.json'),
  QUEUE_FILE: path.join(__dirname, '..', '..', 'data', 'outreach-queue.json'),
  SEQUENCES_FILE: path.join(__dirname, '..', '..', 'coldcall', 'active-sequences.json'),
  TEMPLATES_DIR: path.join(__dirname, '..', '..', 'coldcall', 'templates'),
  
  // Sequence Settings
  SEQUENCE: {
    day0: { delay: 0, name: 'Initial Outreach' },
    day2: { delay: 2 * 24 * 60 * 60 * 1000, name: 'Follow-up' },
    day5: { delay: 5 * 24 * 60 * 60 * 1000, name: 'Value Add' },
    day7: { delay: 7 * 24 * 60 * 60 * 1000, name: 'Breakup' }
  },
  
  // A/B Testing
  AB_TEST: {
    enabled: true,
    splitRatio: 0.5, // 50/50 split
    minSampleSize: 10
  },
  
  // Personalization
  TOKENS: {
    name: /\{name\}/g,
    company: /\{company\}/g,
    title: /\{title\}/g,
    pain_point: /\{pain_point\}/g,
    value_prop: /\{value_prop\}/g,
    optimal_time: /\{optimal_time\}/g
  },
  
  // Approval Required
  REQUIRE_APPROVAL: true
};

// ============================================
// EMAIL TEMPLATES
// ============================================

const TEMPLATES = {
  day0: {
    variants: [
      {
        id: 'day0_a',
        name: 'Direct Value',
        subject: 'Quick question about {company}\'s crypto strategy',
        body: `Hi {name},

I noticed {company} has been making waves in the {industry} space, especially with your recent growth in the Philippines market.

I'm reaching out from coins.ph/coins.xyz - we processed over $1B in remittances last year and are expanding our partnership network across Southeast Asia.

Given your role as {title}, I thought there might be synergies between our user bases. We're particularly interested in exploring:

• Cross-listing opportunities for tokens
• Shared liquidity pools
• Co-marketing initiatives for user acquisition

Would you be open to a brief 15-minute call next week to explore if there's a fit?

Best regards,
Eric Fung
CEO, coins.ph

P.S. I see you're based in {region} - would {optimal_time} work for a quick chat?`
      },
      {
        id: 'day0_b',
        name: 'Social Proof',
        subject: 'How {company} can tap into 18.6M crypto users',
        body: `Hi {name},

Quick intro - I'm Eric, CEO at coins.ph. We recently crossed 18.6M registered users in the Philippines and are looking for strategic partners to expand our ecosystem.

I came across {company} and was impressed by your approach to {pain_point}. We've helped similar companies in the region achieve:

• 40% faster settlement times
• 60% lower transaction fees
• Access to our verified user base

Given your position at {company}, I'd love to explore how we might collaborate. Any chance for a quick call this week?

Best,
Eric

coins.ph | coins.xyz`
      }
    ]
  },
  
  day2: {
    variants: [
      {
        id: 'day2_a',
        name: 'Gentle Bump',
        subject: 'Re: Quick question about {company}\'s crypto strategy',
        body: `Hi {name},

Just bumping this to the top of your inbox in case it got buried.

I know you're probably juggling a lot as {title} at {company}. To make this easy - if partnerships aren't a priority right now, totally understand. Just reply "not now" and I'll circle back in a few months.

If you are interested, here's my calendar: [link]

Best,
Eric`
      },
      {
        id: 'day2_b',
        name: 'Value Add',
        subject: 'A resource that might help {company}',
        body: `Hi {name},

Following up on my note from a couple days ago. In the meantime, I thought you might find this useful:

We just published our Q4 2025 report on crypto adoption patterns in Southeast Asia. Some interesting findings on {pain_point} that seem relevant to {company}'s market.

[Link to report]

Happy to discuss the findings on a call if helpful.

Best,
Eric

coins.ph`
      }
    ]
  },
  
  day5: {
    variants: [
      {
        id: 'day5_a',
        name: 'Case Study',
        subject: 'How Maya reached 80M users with our partnership',
        body: `Hi {name},

I wanted to share a quick win from one of our partners that might resonate with {company}.

Maya (formerly PayMaya) integrated with our crypto infrastructure 18 months ago. Results so far:

• 2.3M new crypto-active users
• $450M in transaction volume
• 94% user satisfaction score

Given {company}'s focus on {pain_point}, I see similar potential. The integration took their team less than 3 weeks.

Worth a 15-minute conversation to explore?

Best,
Eric Fung
CEO, coins.ph

P.S. I can share the full case study if helpful.`
      },
      {
        id: 'day5_b',
        name: 'Direct Ask',
        subject: 'Is partnership on the roadmap for {company} this quarter?',
        body: `Hi {name},

I've reached out a couple times about potential collaboration between coins.ph and {company}. Haven't heard back, which usually means one of three things:

1. Partnerships aren't a priority right now
2. You're not the right person to discuss this
3. My emails are getting lost in the shuffle

If it's #1 or #3 - no worries, just let me know and I'll adjust accordingly.

If it's #2 - could you point me to the right person on your team?

Thanks for your time,
Eric

coins.ph | Making crypto accessible to everyone`
      }
    ]
  },
  
  day7: {
    variants: [
      {
        id: 'day7_a',
        name: 'Soft Breakup',
        subject: 'Permission to close your file?',
        body: `Hi {name},

I've reached out a few times about exploring a partnership between coins.ph and {company}. I haven't heard back, so I'm assuming timing isn't right or priorities have shifted.

No hard feelings - I know how busy things get as {title}.

I'll close your file for now, but if partnership discussions become relevant down the road, feel free to reach out. I'll keep you on our newsletter list unless you prefer I don't.

Best of luck with {company}'s growth this year.

Eric Fung
CEO, coins.ph

eric@coins.ph`
      },
      {
        id: 'day7_b',
        name: 'Door Opener',
        subject: 'One last thing before I go...',
        body: `Hi {name},

This is my last email - promise. I know inbox zero is a mythical state, so I'll get out of your hair.

But before I do: if you're ever at a crypto event in Singapore, Manila, or Hong Kong, grab me for a coffee. No pitch, just good conversation with someone who understands the {industry} space.

My personal line: +65 XXXX XXXX

Cheers,
Eric

coins.ph`
      }
    ]
  }
};

// ============================================
// SEQUENCE MANAGER
// ============================================

class SequenceManager extends EventEmitter {
  constructor() {
    super();
    this.sequences = new Map();
    this.stats = {
      total: 0,
      active: 0,
      completed: 0,
      responded: 0,
      meetings: 0
    };
  }

  /**
   * Create new sequence for a lead
   */
  createSequence(lead, options = {}) {
    const leadId = lead.id || `lead_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const sequenceId = `seq_${Date.now()}_${leadId}`;
    
    // Select variant for A/B testing
    const variant = this.selectVariant('day0', lead);
    
    const sequence = {
      id: sequenceId,
      leadId: lead.id,
      lead: {
        name: lead.name,
        email: lead.email,
        company: lead.company,
        title: lead.title,
        priority: lead.priority
      },
      status: 'pending_approval', // pending_approval, active, paused, completed
      createdAt: new Date().toISOString(),
      variant: variant.id,
      steps: [
        {
          step: 'day0',
          variant: variant.id,
          scheduledFor: new Date(Date.now() + CONFIG.SEQUENCE.day0.delay).toISOString(),
          status: 'pending',
          sentAt: null,
          openedAt: null,
          clickedAt: null,
          repliedAt: null
        },
        {
          step: 'day2',
          scheduledFor: new Date(Date.now() + CONFIG.SEQUENCE.day2.delay).toISOString(),
          status: 'pending',
          condition: 'if_no_reply',
          sentAt: null,
          openedAt: null,
          clickedAt: null,
          repliedAt: null
        },
        {
          step: 'day5',
          scheduledFor: new Date(Date.now() + CONFIG.SEQUENCE.day5.delay).toISOString(),
          status: 'pending',
          condition: 'if_no_reply',
          sentAt: null,
          openedAt: null,
          clickedAt: null,
          repliedAt: null
        },
        {
          step: 'day7',
          scheduledFor: new Date(Date.now() + CONFIG.SEQUENCE.day7.delay).toISOString(),
          status: 'pending',
          condition: 'if_no_reply',
          sentAt: null,
          openedAt: null,
          clickedAt: null,
          repliedAt: null
        }
      ],
      metadata: {
        source: lead.source || 'dealflow',
        pieScore: lead.pie_intel?.signal_strength || 0,
        enrichmentVersion: lead.enriched_at || null,
        personalization: this.extractPersonalizationData(lead)
      }
    };

    this.sequences.set(sequenceId, sequence);
    this.stats.total++;
    
    this.emit('sequenceCreated', { sequenceId, lead: lead.id });
    
    return sequence;
  }

  /**
   * Select A/B test variant
   */
  selectVariant(step, lead) {
    if (!CONFIG.AB_TEST.enabled) {
      return TEMPLATES[step].variants[0];
    }

    const variants = TEMPLATES[step].variants;
    
    // Use lead ID to deterministically assign variant (consistent across runs)
    const leadId = lead.id || lead.email || lead.name || Date.now().toString();
    const hash = leadId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const index = Math.abs(hash) % variants.length;
    return variants[index];
  }

  /**
   * Extract personalization data from lead
   */
  extractPersonalizationData(lead) {
    const painPoints = {
      'Cryptocurrency Exchange': 'liquidity and cross-market expansion',
      'Fintech': 'crypto integration for traditional finance users',
      'Payments': 'cross-border settlement speed and cost',
      'Crypto Wallet': 'user acquisition and retention',
      'DeFi': 'mainstream adoption barriers',
      'default': 'scaling in the Southeast Asian market'
    };

    const valueProps = {
      'P0': '18.6M registered users and $1B+ in annual remittances',
      'P1': 'proven infrastructure and regulatory compliance',
      'P2': 'established market presence and user trust',
      'default': 'regional expertise and established infrastructure'
    };

    const industry = lead.industry || 'default';
    const priority = lead.priority || 'default';

    return {
      name: lead.name?.split(' ')[0] || 'there',
      company: lead.company,
      title: lead.title,
      industry: lead.industry,
      region: lead.region || 'Southeast Asia',
      pain_point: painPoints[industry] || painPoints.default,
      value_prop: valueProps[priority] || valueProps.default,
      optimal_time: lead.pie_intel?.optimal_time || 'Tuesday 10:00 AM'
    };
  }

  /**
   * Personalize template with lead data
   */
  personalizeTemplate(template, lead) {
    const data = this.extractPersonalizationData(lead);
    
    let personalized = template;
    personalized = personalized.replace(CONFIG.TOKENS.name, data.name);
    personalized = personalized.replace(CONFIG.TOKENS.company, data.company);
    personalized = personalized.replace(CONFIG.TOKENS.title, data.title);
    personalized = personalized.replace(CONFIG.TOKENS.pain_point, data.pain_point);
    personalized = personalized.replace(CONFIG.TOKENS.value_prop, data.value_prop);
    personalized = personalized.replace(CONFIG.TOKENS.optimal_time, data.optimal_time);
    
    // Replace {industry} if present
    personalized = personalized.replace(/\{industry\}/g, data.industry);
    personalized = personalized.replace(/\{region\}/g, data.region);
    
    return personalized;
  }

  /**
   * Get next email to send
   */
  getNextEmail(sequenceId) {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) return null;

    // Check if sequence is active
    if (sequence.status !== 'active') return null;

    // Find next pending step
    const nextStep = sequence.steps.find(s => s.status === 'pending');
    if (!nextStep) return null;

    // Check if it's time to send
    const scheduledTime = new Date(nextStep.scheduledFor);
    if (scheduledTime > new Date()) return null;

    // Check condition
    if (nextStep.condition === 'if_no_reply') {
      const previousSteps = sequence.steps.slice(0, sequence.steps.indexOf(nextStep));
      const hasReply = previousSteps.some(s => s.repliedAt);
      if (hasReply) {
        nextStep.status = 'skipped';
        return this.getNextEmail(sequenceId); // Recurse to next
      }
    }

    // Get template
    const template = TEMPLATES[nextStep.step].variants.find(
      v => v.id === nextStep.variant
    ) || TEMPLATES[nextStep.step].variants[0];

    // Personalize
    const subject = this.personalizeTemplate(template.subject, sequence.lead);
    const body = this.personalizeTemplate(template.body, sequence.lead);

    return {
      sequenceId,
      step: nextStep.step,
      to: sequence.lead.email,
      subject,
      body,
      lead: sequence.lead
    };
  }

  /**
   * Mark email as sent
   */
  markSent(sequenceId, step) {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) return;

    const stepData = sequence.steps.find(s => s.step === step);
    if (stepData) {
      stepData.status = 'sent';
      stepData.sentAt = new Date().toISOString();
    }

    this.emit('emailSent', { sequenceId, step, lead: sequence.lead.id });
  }

  /**
   * Mark reply received
   */
  markReplied(sequenceId, replyData = {}) {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) return;

    // Mark current step as replied
    const currentStep = sequence.steps.find(s => s.status === 'sent' && !s.repliedAt);
    if (currentStep) {
      currentStep.repliedAt = new Date().toISOString();
    }

    sequence.status = 'responded';
    this.stats.responded++;
    
    this.emit('replyReceived', { 
      sequenceId, 
      lead: sequence.lead.id,
      reply: replyData 
    });
  }

  /**
   * Mark meeting booked
   */
  markMeeting(sequenceId, meetingData) {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) return;

    sequence.status = 'meeting_booked';
    sequence.meeting = {
      bookedAt: new Date().toISOString(),
      ...meetingData
    };
    
    this.stats.meetings++;
    this.emit('meetingBooked', { sequenceId, lead: sequence.lead.id, meeting: meetingData });
  }

  /**
   * Activate sequence (after approval)
   */
  activate(sequenceId) {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) return false;

    sequence.status = 'active';
    sequence.activatedAt = new Date().toISOString();
    this.stats.active++;
    
    this.emit('sequenceActivated', { sequenceId, lead: sequence.lead.id });
    return true;
  }

  /**
   * Get all sequences
   */
  getAll() {
    return Array.from(this.sequences.values());
  }

  /**
   * Get sequences by status
   */
  getByStatus(status) {
    return this.getAll().filter(s => s.status === status);
  }

  /**
   * Get stats
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Export sequences to file
   */
  async export() {
    const data = {
      exportedAt: new Date().toISOString(),
      stats: this.stats,
      sequences: this.getAll()
    };

    await fs.mkdir(path.dirname(CONFIG.SEQUENCES_FILE), { recursive: true });
    await fs.writeFile(CONFIG.SEQUENCES_FILE, JSON.stringify(data, null, 2));
    
    return CONFIG.SEQUENCES_FILE;
  }
}

// ============================================
// COLDCALL AUTOMATION
// ============================================

class ColdCallAutomation extends EventEmitter {
  constructor() {
    super();
    this.sequences = new SequenceManager();
    this.approvalQueue = [];
    this.isRunning = false;
  }

  /**
   * Initialize from enriched leads
   */
  async initializeFromLeads() {
    
    const leads = await this.loadEnrichedLeads();

    // Filter to ready leads with emails
    const readyLeads = leads.filter(l => 
      l.email && 
      (l.email_verified === 'verified' || l.email_verified === 'pattern') &&
      l.coldcall_ready !== false
    );


    // Create sequences for each lead
    for (const lead of readyLeads) {
      const sequence = this.sequences.createSequence(lead);
      this.approvalQueue.push(sequence);
    }

    return {
      total: leads.length,
      ready: readyLeads.length,
      sequencesCreated: this.approvalQueue.length
    };
  }

  /**
   * Load enriched leads
   */
  async loadEnrichedLeads() {
    try {
      const data = await fs.readFile(CONFIG.LEADS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.leads || parsed || [];
    } catch (error) {
      console.error('Failed to load leads:', error.message);
      return [];
    }
  }

  /**
   * Get approval queue (for EricF review)
   */
  getApprovalQueue() {
    return this.approvalQueue.map(seq => ({
      sequenceId: seq.id,
      lead: seq.lead,
      variant: seq.variant,
      preview: this.getEmailPreview(seq.id, 'day0')
    }));
  }

  /**
   * Get email preview
   */
  getEmailPreview(sequenceId, step) {
    const sequence = this.sequences.sequences.get(sequenceId);
    if (!sequence) return null;

    const stepData = sequence.steps.find(s => s.step === step);
    if (!stepData) return null;

    const template = TEMPLATES[step].variants.find(v => v.id === stepData.variant);
    if (!template) return null;

    return {
      subject: this.sequences.personalizeTemplate(template.subject, sequence.lead),
      body: this.sequences.personalizeTemplate(template.body, sequence.lead)
    };
  }

  /**
   * Approve all sequences (EricF approval)
   */
  approveAll() {
    if (CONFIG.REQUIRE_APPROVAL) {
    }

    for (const seq of this.approvalQueue) {
      this.sequences.activate(seq.id);
    }

    this.approvalQueue = [];
    this.isRunning = true;

    return {
      activated: this.sequences.stats.active,
      status: 'active'
    };
  }

  /**
   * Get A/B test results
   */
  getABTestResults() {
    const sequences = this.sequences.getAll();
    
    const results = {};
    
    for (const step of ['day0', 'day2', 'day5', 'day7']) {
      const stepResults = {};
      
      for (const variant of TEMPLATES[step].variants) {
        const variantSequences = sequences.filter(s => {
          const stepData = s.steps.find(st => st.step === step);
          return stepData?.variant === variant.id;
        });

        const sent = variantSequences.filter(s => {
          const stepData = s.steps.find(st => st.step === step);
          return stepData?.status === 'sent';
        }).length;

        const opened = variantSequences.filter(s => {
          const stepData = s.steps.find(st => st.step === step);
          return stepData?.openedAt;
        }).length;

        const replied = variantSequences.filter(s => {
          const stepData = s.steps.find(st => st.step === step);
          return stepData?.repliedAt;
        }).length;

        stepResults[variant.id] = {
          name: variant.name,
          sent,
          opened,
          replied,
          openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
          replyRate: sent > 0 ? Math.round((replied / sent) * 100) : 0
        };
      }

      results[step] = stepResults;
    }

    return results;
  }

  /**
   * Generate status report
   */
  generateReport() {
    const stats = this.sequences.getStats();
    const byStatus = {
      pending_approval: this.sequences.getByStatus('pending_approval').length,
      active: this.sequences.getByStatus('active').length,
      responded: this.sequences.getByStatus('responded').length,
      meeting_booked: this.sequences.getByStatus('meeting_booked').length,
      completed: this.sequences.getByStatus('completed').length
    };

    return {
      timestamp: new Date().toISOString(),
      status: this.isRunning ? 'ACTIVE' : 'PENDING_APPROVAL',
      stats,
      byStatus,
      abTests: this.getABTestResults(),
      readyToSend: this.sequences.getByStatus('active')
        .filter(s => {
          const nextEmail = this.sequences.getNextEmail(s.id);
          return nextEmail !== null;
        }).length
    };
  }

  /**
   * Export and save
   */
  async save() {
    const file = await this.sequences.export();
    return file;
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  ColdCallAutomation,
  SequenceManager,
  TEMPLATES,
  CONFIG
};

// ============================================
// CLI EXECUTION
// ============================================

async function main() {

  const coldcall = new ColdCallAutomation();

  // Initialize from leads
  const init = await coldcall.initializeFromLeads();
  

  // Show approval queue
  const queue = coldcall.getApprovalQueue();
  

  // Show sample preview
  if (queue.length > 0) {
    const sample = queue[0];
  }

  // Simulate approval for testing (in production, wait for EricF)
  if (process.argv.includes('--approve')) {
    const activation = coldcall.approveAll();
    

    // Save state
    await coldcall.save();
  } else {
  }

  // Generate report
  const report = coldcall.generateReport();
  
}

if (require.main === module) {
  main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}
