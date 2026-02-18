/**
 * Response Classifier Module
 * 
 * Automatically classifies email responses into categories:
 * - Positive: Interested, wants meeting, asks for info
 * - Negative: Not interested, unsubscribe, stop
 * - Neutral: Not now, later, timing issues
 * - Referral: Points to another contact
 * - Question: Asks for clarification/details
 * 
 * @module ResponseClassifier
 * @version 1.0.0
 */

class ResponseClassifier {
  constructor() {
    this.categories = {
      positive: {
        keywords: [
          'interested', 'yes', 'sure', 'absolutely', 'definitely',
          'call', 'meeting', 'schedule', 'book', 'time', 'chat',
          'send info', 'more information', 'details', 'proposal',
          'sounds good', 'let\'s talk', 'connect', 'discuss',
          'worth exploring', 'potential fit', 'opportunity'
        ],
        weight: 1.0,
        autoAction: 'flag_for_followup'
      },
      negative: {
        keywords: [
          'not interested', 'unsubscribe', 'remove', 'stop',
          'no thanks', 'pass', 'not for us', 'decline',
          'wrong person', 'not relevant', 'spam',
          'don\'t contact', 'never', 'no need'
        ],
        weight: 1.0,
        autoAction: 'unsubscribe_and_close'
      },
      neutral: {
        keywords: [
          'not now', 'later', 'future', 'busy', 'timing',
          'quarter', 'next year', 'someday', 'maybe later',
          'not the right time', 'focused elsewhere',
          'priorities', 'back burner', 'revisit'
        ],
        weight: 0.8,
        autoAction: 'schedule_reengagement'
      },
      referral: {
        keywords: [
          'contact', 'colleague', 'handles', 'person',
          'reach out to', 'talk to', 'speak with',
          'right person', 'appropriate', 'responsible',
          'in charge of', 'manages', 'oversees'
        ],
        weight: 0.9,
        autoAction: 'extract_contact'
      },
      question: {
        keywords: [
          'how', 'what', 'price', 'cost', 'terms',
          'explain', 'clarify', 'elaborate', 'specify',
          'difference between', 'compared to', 'versus',
          'why', 'when', 'where', 'who', 'which'
        ],
        weight: 0.7,
        autoAction: 'send_faq_response'
      }
    };
    
    this.responseTemplates = {
      positive: `Hi {{firstName}},

Great to hear from you! I'd love to explore this further.

Here are a few times that work for me:
• {{timeSlot1}}
• {{timeSlot2}}
• {{timeSlot3}}

Or feel free to grab time directly: {{calendarLink}}

Quick agenda preview:
• 5 min: Introductions
• 10 min: Partnership opportunities between {{companyName}} and coins.ph
• 5 min: Next steps

Looking forward to it!

Eric`,

      negative: `Hi {{firstName}},

Thanks for the response. Totally understand — timing is everything.

I've removed you from follow-ups. Feel free to reach out if anything changes in the future.

Best of luck with {{companyName}}.

Eric`,

      neutral: `Hi {{firstName}},

No problem at all. Timing is everything.

I'll set a reminder to circle back in {{timeframe}}. In the meantime, feel free to reach out if anything changes on your end.

Best,
Eric`,

      referral: `Hi {{firstName}},

Thanks for the redirect. Much appreciated.

I'll reach out to {{newContact}}. If you think a warm intro would help, let me know — otherwise I'll reference our conversation.

Best,
Eric`,

      question: `Hi {{firstName}},

Great questions. Let me address each:

{{answers}}

Does this help clarify? Happy to jump on a quick call if easier.

Best,
Eric`
    };
  }

  /**
   * Classify a response email
   * @param {string} responseText - The email response text
   * @param {Object} context - Context about the lead/email
   * @returns {Object} Classification result
   */
  classify(responseText, context = {}) {
    const text = responseText.toLowerCase();
    const scores = {};
    
    // Calculate scores for each category
    for (const [category, config] of Object.entries(this.categories)) {
      let score = 0;
      let matches = [];
      
      for (const keyword of config.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score += config.weight;
          matches.push(keyword);
        }
      }
      
      scores[category] = {
        score,
        matches,
        confidence: Math.min(1.0, score / 3) // Normalize to 0-1
      };
    }
    
    // Determine primary category
    const sortedCategories = Object.entries(scores)
      .sort((a, b) => b[1].score - a[1].score);
    
    const [primaryCategory, primaryData] = sortedCategories[0];
    
    // Check for mixed signals
    const secondaryCategory = sortedCategories[1];
    const isMixed = secondaryCategory[1].score > 0 && 
                    (primaryData.score - secondaryCategory[1].score) < 1;
    
    // Determine sentiment
    let sentiment;
    if (primaryCategory === 'positive') {
      sentiment = 'positive';
    } else if (primaryCategory === 'negative') {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }
    
    // Extract entities
    const entities = this.extractEntities(responseText);
    
    return {
      primaryCategory,
      confidence: primaryData.confidence,
      sentiment,
      isMixed,
      secondaryCategory: isMixed ? secondaryCategory[0] : null,
      scores,
      entities,
      suggestedAction: this.categories[primaryCategory].autoAction,
      responseTemplate: this.responseTemplates[primaryCategory],
      requiresHumanReview: primaryData.confidence < 0.5 || isMixed
    };
  }

  /**
   * Extract entities from response
   * @param {string} text - Response text
   * @returns {Object} Extracted entities
   */
  extractEntities(text) {
    const entities = {
      names: [],
      emails: [],
      phoneNumbers: [],
      dates: [],
      questions: []
    };
    
    // Extract email addresses
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    entities.emails = text.match(emailRegex) || [];
    
    // Extract phone numbers (basic pattern)
    const phoneRegex = /[\+]?[\d\s\-\(\)]{10,}/g;
    entities.phoneNumbers = text.match(phoneRegex) || [];
    
    // Extract potential names (capitalized words after "contact", "talk to", etc.)
    const nameRegex = /(?:contact|talk to|reach out to|speak with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi;
    let match;
    while ((match = nameRegex.exec(text)) !== null) {
      entities.names.push(match[1]);
    }
    
    // Extract questions
    const sentences = text.split(/[.!?]+/);
    entities.questions = sentences.filter(s => 
      s.trim().endsWith('?') || 
      s.toLowerCase().includes('how') ||
      s.toLowerCase().includes('what') ||
      s.toLowerCase().includes('why')
    ).map(s => s.trim());
    
    return entities;
  }

  /**
   * Generate response based on classification
   * @param {Object} classification - Classification result
   * @param {Object} lead - Lead data
   * @param {Object} options - Response options
   * @returns {string} Generated response
   */
  generateResponse(classification, lead, options = {}) {
    const template = classification.responseTemplate;
    const { firstName, companyName } = options;
    
    let response = template
      .replace(/{{firstName}}/g, firstName || lead.contact_name?.split(' ')[0] || 'there')
      .replace(/{{companyName}}/g, companyName || lead.company || 'your company');
    
    // Category-specific replacements
    switch (classification.primaryCategory) {
      case 'positive':
        response = response
          .replace(/{{timeSlot1}}/g, options.timeSlots?.[0] || 'Tuesday at 10:00 AM')
          .replace(/{{timeSlot2}}/g, options.timeSlots?.[1] || 'Wednesday at 2:00 PM')
          .replace(/{{timeSlot3}}/g, options.timeSlots?.[2] || 'Thursday at 11:00 AM')
          .replace(/{{calendarLink}}/g, options.calendarLink || 'https://calendly.com/ericf');
        break;
        
      case 'neutral':
        response = response
          .replace(/{{timeframe}}/g, options.timeframe || '3 months');
        break;
        
      case 'referral':
        response = response
          .replace(/{{newContact}}/g, classification.entities.names[0] || 'your colleague');
        break;
        
      case 'question':
        response = response
          .replace(/{{answers}}/g, options.answers || 'I\'ll get back to you with detailed answers shortly.');
        break;
    }
    
    return response;
  }

  /**
   * Batch classify multiple responses
   * @param {Array} responses - Array of {id, text, context} objects
   * @returns {Array} Classification results
   */
  classifyBatch(responses) {
    return responses.map(r => ({
      id: r.id,
      classification: this.classify(r.text, r.context),
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Get summary statistics for classifications
   * @param {Array} classifications - Array of classification results
   * @returns {Object} Summary statistics
   */
  getSummary(classifications) {
    const summary = {
      total: classifications.length,
      byCategory: {},
      bySentiment: { positive: 0, negative: 0, neutral: 0 },
      avgConfidence: 0,
      requiresReview: 0
    };
    
    let totalConfidence = 0;
    
    for (const c of classifications) {
      const cat = c.classification.primaryCategory;
      summary.byCategory[cat] = (summary.byCategory[cat] || 0) + 1;
      summary.bySentiment[c.classification.sentiment]++;
      totalConfidence += c.classification.confidence;
      
      if (c.classification.requiresHumanReview) {
        summary.requiresReview++;
      }
    }
    
    summary.avgConfidence = totalConfidence / classifications.length;
    
    return summary;
  }
}

// Export for use in other modules
module.exports = ResponseClassifier;

// CLI usage for testing
if (require.main === module) {
  const classifier = new ResponseClassifier();
  
  // Test responses
  const testResponses = [
    {
      id: 'test-1',
      text: "Yes, I'm interested. Can we schedule a call next week?",
      context: { leadId: 'lead_001', template: 'initial' }
    },
    {
      id: 'test-2',
      text: "Not interested. Please remove me from your list.",
      context: { leadId: 'lead_002', template: 'initial' }
    },
    {
      id: 'test-3',
      text: "Not now, we're focused on other priorities. Maybe in Q3.",
      context: { leadId: 'lead_003', template: 'followup' }
    },
    {
      id: 'test-4',
      text: "You should talk to my colleague Sarah. She handles partnerships. Her email is sarah@company.com",
      context: { leadId: 'lead_004', template: 'initial' }
    },
    {
      id: 'test-5',
      text: "How does your pricing work? What's the difference between your PHPC and other stablecoins?",
      context: { leadId: 'lead_005', template: 'initial' }
    }
  ];
  
  console.log('🧪 Response Classification Tests\n');
  
  for (const test of testResponses) {
    const result = classifier.classify(test.text, test.context);
    console.log(`Test: "${test.text.substring(0, 50)}..."`);
    console.log(`  Category: ${result.primaryCategory} (${Math.round(result.confidence * 100)}% confidence)`);
    console.log(`  Sentiment: ${result.sentiment}`);
    console.log(`  Action: ${result.suggestedAction}`);
    console.log(`  Entities: ${JSON.stringify(result.entities)}`);
    console.log('');
  }
  
  // Batch classification
  const batchResults = classifier.classifyBatch(testResponses);
  const summary = classifier.getSummary(batchResults);
  
  console.log('📊 Summary:');
  console.log(`  Total: ${summary.total}`);
  console.log(`  By Category: ${JSON.stringify(summary.byCategory)}`);
  console.log(`  By Sentiment: ${JSON.stringify(summary.bySentiment)}`);
  console.log(`  Avg Confidence: ${Math.round(summary.avgConfidence * 100)}%`);
  console.log(`  Requires Review: ${summary.requiresReview}`);
}
