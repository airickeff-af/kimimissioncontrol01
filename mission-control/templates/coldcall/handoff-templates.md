# DealFlow → ColdCall Handoff Templates

> **Purpose:** Standardize lead handoffs from DealFlow to ColdCall for outreach execution  
> **Version:** 1.0.0  
> **Last Updated:** February 19, 2026

---

## Handoff Types

| Type | Use Case | Urgency | Lead Score Required |
|------|----------|---------|---------------------|
| **Standard** | Complete lead with full research | Normal | 70+ |
| **Hot Lead** | High-priority, time-sensitive | High | 80+ |
| **Warm Intro** | Referral-based lead | High | 75+ |
| **Event Follow-up** | Post-conference/meeting | Normal | 65+ |
| **Re-engagement** | Previously contacted lead | Low | 60+ |

---

## Template 1: Standard Handoff

### When to Use
- Lead has complete contact information
- Research has been conducted
- Lead score is 70+
- No special circumstances

### Format

```json
{
  "handoffType": "standard",
  "handoffId": "HO-2026-001",
  "timestamp": "2026-02-19T07:30:00Z",
  "from": "DealFlow",
  "to": "ColdCall",
  
  "lead": {
    "id": "lead_001",
    "company": "Coins.ph",
    "contactName": "Wei Zhou",
    "title": "CEO & Founder",
    "email": "wei.zhou@coins.ph",
    "emailVerified": false,
    "linkedin": "https://www.linkedin.com/company/coins-ph",
    "priority": "P0",
    "industry": "Exchange"
  },
  
  "research": {
    "summary": "Former Binance CFO (2018-2021). Acquired Coins.ph from Gojek in 2022. Leading crypto exchange in Philippines with 18M+ users.",
    "recentNews": "Expanding globally with Coins.xyz, launched Brazil Jan 2025",
    "keyInsights": [
      "Speaker at Consensus, Money20/20",
      "Focus on remittance and financial inclusion",
      "Recently raised funding for expansion"
    ],
    "researchSources": [
      "https://www.coins.xyz/en/about",
      "https://consensus-hongkong2025.coindesk.com/agenda/speaker/-wei-zhou"
    ]
  },
  
  "outreach": {
    "recommendedTemplate": "initial-cold-outreach",
    "valueProposition": "Cross-listing opportunities with 18.6M registered users in Philippines",
    "personalizationAngle": "His recent expansion into Brazil and global markets through coins.xyz",
    "suggestedSubjectLine": "Coins.ph + Philippines' $38.4B crypto market opportunity",
    "priority": "high",
    "bestSendTime": "Tuesday-Thursday, 10:00 AM PHT"
  },
  
  "context": {
    "previousContact": null,
    "warmIntro": null,
    "competitorRelationships": ["Circle", "Veem"],
    "notes": "High-value target. Approach with respect to his Binance background."
  }
}
```

---

## Template 2: Hot Lead Handoff

### When to Use
- P0 priority lead
- Time-sensitive opportunity
- Recent funding or major announcement
- Lead score 80+

### Format

```json
{
  "handoffType": "hot_lead",
  "handoffId": "HO-2026-002",
  "timestamp": "2026-02-19T07:30:00Z",
  "urgency": "high",
  "responseRequired": "24 hours",
  
  "from": "DealFlow",
  "to": "ColdCall",
  
  "lead": {
    "id": "lead_007",
    "company": "Maya",
    "contactName": "Shailesh Baidwan",
    "title": "Group President & Co-Founder",
    "email": "shailesh.baidwan@maya.ph",
    "priority": "P0",
    "industry": "Fintech/Bank",
    "leadScore": 92
  },
  
  "triggerEvent": {
    "type": "funding_announcement",
    "description": "Maya just announced $150M Series C funding for SEA expansion",
    "date": "2026-02-18",
    "source": "TechCrunch",
    "url": "https://techcrunch.com/maya-funding"
  },
  
  "research": {
    "summary": "Digital banking and payments super app. Licensed VASP by BSP. 80M+ users.",
    "whyNow": "Fresh funding means partnership budget and expansion appetite",
    "keyInsights": [
      "Looking to expand crypto offerings",
      "Recently partnered with major remittance providers",
      "Competing directly with GCash for market share"
    ]
  },
  
  "outreach": {
    "recommendedTemplate": "initial-cold-outreach",
    "urgency": "Send within 48 hours while news is fresh",
    "valueProposition": "PHPC stablecoin integration for their 80M user base",
    "personalizationAngle": "Congratulations on the Series C - perfect timing for partnership discussion",
    "suggestedSubjectLine": "Maya's $150M raise + PHPC stablecoin opportunity",
    "priority": "critical"
  },
  
  "actions": {
    "immediate": [
      "Verify email address",
      "Research recent interviews/statements",
      "Prepare custom one-pager"
    ],
    "followUp": "If no response in 3 days, try LinkedIn connection"
  }
}
```

---

## Template 3: Warm Intro Handoff

### When to Use
- Referral from existing contact
- Mutual connection available
- Introduction already made or promised

### Format

```json
{
  "handoffType": "warm_intro",
  "handoffId": "HO-2026-003",
  "timestamp": "2026-02-19T07:30:00Z",
  
  "from": "DealFlow",
  "to": "ColdCall",
  
  "lead": {
    "id": "lead_011",
    "company": "Xendit Group",
    "contactName": "Moses Lo",
    "title": "CEO & Co-Founder",
    "email": "moses@xendit.co",
    "priority": "P0",
    "industry": "Payment Processor"
  },
  
  "referral": {
    "source": "Robertson Chiang (Dragonpay)",
    "relationship": "Both are members of Fintech Philippines Association",
    "introMethod": "Email intro",
    "introStatus": "pending",
    "introEmail": "Hi Moses, I'd like to introduce you to Eric Fung from coins.ph..."
  },
  
  "research": {
    "summary": "Payment infrastructure across SEA. YCombinator alum. Forbes 30 Under 30.",
    "connectionToReferrer": "Both serve Philippines market, potential synergies",
    "keyInsights": [
      "Expanding crypto payment capabilities",
      "Strong presence in Indonesia, Philippines, Singapore",
      "Recently acquired a local PH payment company"
    ]
  },
  
  "outreach": {
    "recommendedTemplate": "warm-intro-follow-up",
    "timing": "24-48 hours after intro email",
    "valueProposition": "Cross-border payment rails between PH and SEA markets",
    "personalizationAngle": "Robertson mentioned you're exploring crypto payment partnerships",
    "suggestedSubjectLine": "Following up: Robertson's intro + Xendit + coins.ph",
    "referenceIntro": true
  },
  
  "context": {
    "warmthLevel": "high",
    "expectedResponseRate": "60-70%",
    "notes": "Warm intro significantly increases response likelihood. Move quickly."
  }
}
```

---

## Template 4: Event Follow-up Handoff

### When to Use
- Met at conference/event
- Exchanged contact info
- Follow-up promised

### Format

```json
{
  "handoffType": "event_followup",
  "handoffId": "HO-2026-004",
  "timestamp": "2026-02-19T07:30:00Z",
  
  "from": "DealFlow",
  "to": "ColdCall",
  
  "lead": {
    "id": "lead_016",
    "company": "GCash (Mynt)",
    "contactName": "Martha Sazon",
    "title": "President & CEO",
    "email": "martha.sazon@gcash.com",
    "priority": "P0",
    "industry": "Fintech"
  },
  
  "event": {
    "name": "Consensus Hong Kong 2025",
    "date": "2026-02-18",
    "location": "Hong Kong",
    "booth": "coins.ph Booth #47",
    "interactionType": "booth_visit",
    "conversationSummary": "Discussed potential partnership between GCrypto and coins.ph. She expressed interest in exploring stablecoin integration.",
    "duration": "15 minutes",
    "collected": "Business card + email confirmation"
  },
  
  "research": {
    "summary": "#1 Finance Super App in Philippines. 80M+ users. Globe Telecom fintech arm.",
    "conversationContext": "She mentioned they're looking for regulated exchange partners for crypto expansion",
    "keyInsights": [
      "GCrypto is their crypto product",
      "Made GCash profitable 3 years ahead of target",
      "Looking for partnership opportunities in 2026"
    ]
  },
  
  "outreach": {
    "recommendedTemplate": "event-follow-up",
    "timing": "Within 24 hours of event",
    "valueProposition": "BSP-licensed partnership for GCrypto expansion",
    "personalizationAngle": "Reference conversation at Consensus booth about stablecoin integration",
    "suggestedSubjectLine": "Following up: Consensus conversation + GCrypto partnership",
    "includeAsset": "Event photo or one-pager if shared"
  },
  
  "followUp": {
    "promised": "Send partnership deck and case studies",
    "timeline": "By end of week",
    "nextStep": "Schedule 30-min call to discuss technical integration"
  }
}
```

---

## Template 5: Re-engagement Handoff

### When to Use
- Previously contacted but no response
- New trigger event (funding, expansion)
- Lead score improved

### Format

```json
{
  "handoffType": "re_engagement",
  "handoffId": "HO-2026-005",
  "timestamp": "2026-02-19T07:30:00Z",
  
  "from": "DealFlow",
  "to": "ColdCall",
  
  "lead": {
    "id": "lead_003",
    "company": "PDAX",
    "contactName": "Nichel Gaba",
    "title": "Founder & CEO",
    "email": "nichel@pdax.ph",
    "priority": "P1",
    "industry": "Exchange"
  },
  
  "previousOutreach": {
    "firstContact": "2025-11-15",
    "lastContact": "2025-12-01",
    "emailsSent": 3,
    "response": "none",
    "lastTemplate": "breakup-email",
    "notes": "No response to 3-email sequence. Breakup email sent Dec 1."
  },
  
  "reEngagementTrigger": {
    "type": "new_development",
    "description": "PDAX just announced partnership with major remittance provider",
    "date": "2026-02-15",
    "source": "PDAX press release",
    "whyRelevant": "This creates overlap with coins.ph's remittance business"
  },
  
  "research": {
    "summary": "Philippines' largest homegrown crypto exchange. $51.1M raised. BSP licensed.",
    "whatChanged": "New partnership signals active BD efforts and partnership appetite",
    "keyInsights": [
      "CFA charterholder, Wharton grad",
      "Founded PDAX in 2018",
      "Recently expanded trading pairs"
    ]
  },
  
  "outreach": {
    "recommendedTemplate": "value-add-follow-up",
    "approach": "Soft re-engagement with value-first",
    "valueProposition": "Complementary remittance rails - non-competing",
    "personalizationAngle": "Saw the recent remittance partnership announcement - congrats!",
    "suggestedSubjectLine": "PDAX's remittance expansion + potential synergy",
    "acknowledgePrevious": "Briefly mention previous outreach but don't dwell on it"
  },
  
  "strategy": {
    "tone": "Casual, no pressure",
    "expectations": "Low - this is a long shot",
    "alternative": "If no response, add to quarterly newsletter only"
  }
}
```

---

## Handoff Process

### Step 1: Lead Qualification (DealFlow)
- [ ] Lead score calculated (70+ required)
- [ ] Contact information verified
- [ ] Research completed
- [ ] Priority assigned

### Step 2: Handoff Creation (DealFlow)
- [ ] Select appropriate template type
- [ ] Fill in all required fields
- [ ] Add personalization recommendations
- [ ] Set urgency/priority

### Step 3: Review (Nexus/Audit)
- [ ] Verify lead quality
- [ ] Check for duplicates
- [ ] Approve handoff

### Step 4: Execution (ColdCall)
- [ ] Review handoff details
- [ ] Customize template
- [ ] Schedule send
- [ ] Execute outreach

### Step 5: Feedback Loop
- [ ] Track response
- [ ] Update lead status
- [ ] Report results to DealFlow
- [ ] Refine future handoffs

---

## Quality Checklist

### Before Handoff
- [ ] Lead score >= 70
- [ ] Email address present
- [ ] Research completed within 30 days
- [ ] Value proposition identified
- [ ] Personalization angle clear

### Handoff Content
- [ ] All JSON fields populated
- [ ] Research summary concise (2-3 sentences)
- [ ] Value proposition specific to lead
- [ ] Suggested subject line under 50 characters
- [ ] Timing recommendation included

### Context
- [ ] Previous contact history noted
- [ ] Competitor relationships documented
- [ ] Special circumstances flagged
- [ ] Expected response rate estimated

---

## Handoff API Format

For system integration, handoffs should be submitted via:

```http
POST /api/handoffs
Content-Type: application/json

{
  "handoffType": "standard",
  "leadId": "lead_001",
  "priority": "high",
  "data": { /* full handoff object */ }
}
```

Response:
```json
{
  "handoffId": "HO-2026-001",
  "status": "accepted",
  "queuePosition": 3,
  "estimatedSendTime": "2026-02-20T10:00:00Z",
  "coldCallAgent": "coldcall-001"
}
```

---

*Templates prepared by ColdCall Agent | February 2026*
