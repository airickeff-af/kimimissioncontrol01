# Lead Processing Guide

## Lead Intake Process

### 1. Receive Lead from DealFlow

**Expected format:**
```json
{
  "lead_id": "uuid",
  "source": "deal_flow",
  "timestamp": "2026-02-17T08:50:00Z",
  "prospect": {
    "name": "Full Name",
    "title": "Job Title",
    "company": "Company Name",
    "linkedin": "https://linkedin.com/in/...",
    "twitter": "https://twitter.com/...",
    "email": "email@company.com",
    "company_website": "https://company.com"
  },
  "qualification": {
    "score": 1-10,
    "fit_reason": "Why this lead is qualified",
    "priority": "high/medium/low"
  },
  "notes": "Additional context from DealFlow"
}
```

### 2. Research Phase

**Checklist:**
- [ ] Recent company news (funding, launches, pivots)
- [ ] Prospect's recent posts/activity
- [ ] Mutual connections
- [ ] Pain points based on industry/role
- [ ] Competitors they might be watching
- [ ] Previous funding rounds
- [ ] Company size/growth trajectory

**Research sources:**
- LinkedIn profile & activity
- Company website/blog
- Twitter/X posts
- Crunchbase (funding info)
- Recent news (Google News)
- Podcasts/interviews they've done

### 3. Channel Selection

**Decision matrix:**

| Channel | Best For | Response Rate |
|---------|----------|---------------|
| LinkedIn | B2B, professional context | Medium |
| Twitter/X | Crypto/web3, casual tone | Medium-High |
| Email | Formal outreach, detailed pitch | Low-Medium |
| Warm Intro | High-value targets, mutual connections | High |

### 4. Message Personalization

**Required elements:**
1. **Hook** — Reference something specific about them
2. **Context** — Why now, why them
3. **Value** — What's in it for them
4. **Ask** — Clear, low-friction CTA

### 5. Outreach Execution

**Sequence:**
1. Day 0: Initial outreach
2. Day 3: Follow-up #1
3. Day 7: Follow-up #2
4. Day 14: Breakup message

**Tracking:**
- Log all touches in lead file
- Note response/no response
- Update status after each interaction

### 6. Meeting Booking

**When they respond positively:**
1. Send calendar link immediately
2. Suggest 2-3 specific times as alternative
3. Include brief agenda preview
4. Add to EricF's calendar

**Calendar invite template:**
```
Subject: coins.ph <> {Company} Partnership Discussion

Agenda:
• Quick intros (2 min)
• {Company}'s current priorities (5 min)
• coins.ph partnership opportunities (5 min)
• Potential collaboration areas (5 min)
• Next steps (3 min)

Eric will send a Zoom link closer to the meeting.
```

---

## Lead Statuses

| Status | Definition |
|--------|------------|
| `new` | Just received from DealFlow |
| `researching` | Gathering intel |
| `ready` | Research complete, message drafted |
| `contacted` | First outreach sent |
| `responded` | Prospect replied |
| `meeting_booked` | Call scheduled |
| `meeting_completed` | Call happened |
| `nurture` | Interested but not now |
| `declined` | Explicit no |
| `unresponsive` | No reply after full sequence |

---

## File Structure

```
/root/.openclaw/workspace/
├── leads/
│   ├── pending/           # New leads from DealFlow
│   ├── active/            # Currently in outreach sequence
│   ├── meetings/          # Meetings booked
│   ├── nurture/           # Future opportunities
│   └── archive/           # Completed (yes/no)
├── templates/             # Outreach templates
├── research/              # Prospect research notes
└── reports/               # Weekly/monthly stats
```

---

## Handoff to EricF

**Before each meeting, provide:**
1. Prospect background summary
2. Research notes on company/person
3. Suggested talking points
4. Potential partnership angles
5. Any mutual connections or interests

**Format:**
```
## Meeting Prep: {Prospect Name} @ {Company}

### Background
- Role: {title}
- Company: {description}
- Recent news: {bullet points}

### Research Insights
- Active on {platforms}
- Recently posted about {topics}
- Interested in {areas}

### Suggested Angles
1. {angle_1}
2. {angle_2}
3. {angle_3}

### Talking Points
- {point_1}
- {point_2}

### Questions to Ask
- {question_1}
- {question_2}
```
