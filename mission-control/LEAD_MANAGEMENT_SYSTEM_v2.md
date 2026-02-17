# LEAD MANAGEMENT SYSTEM v2
**Status:** ⏳ PENDING ERICF APPROVAL  
**Created:** 2026-02-17 9:23 PM  
**Note:** Do not execute until EricF explicitly approves. Nexus authority overridden.

---

## 📁 DAILY DATA FILE STRUCTURE

### **File Locations:**
```
/root/.openclaw/workspace/mission-control/data/leads/
├── 2026-02-17/
│   ├── leads.json          # Master JSON
│   ├── leads.csv           # CSV Export
│   ├── dealflow-new.json   # DealFlow daily finds
│   └── onhing-metal.json   # On Hing Metal leads
├── 2026-02-18/
│   ├── leads.json
│   ├── leads.csv
│   └── ...
└── archive/                # Old leads (>30 days)
```

---

## 📊 CSV EXPORT FORMAT

### **Filename:** `leads-YYYY-MM-DD.csv`

### **Columns:**
| Column | Description | Example |
|--------|-------------|---------|
| id | Unique lead ID | lead_001 |
| date_added | Date found | 2026-02-17 |
| company | Company name | PDAX |
| country | Country | Philippines |
| industry | Industry | Fintech |
| company_size | Employee count | 50-200 |
| contact_name | Full name | Nichel Gaba |
| title | Job title | CEO |
| email | Email address | nichel@pdax.ph |
| phone | Phone number | +63... |
| linkedin | LinkedIn URL | linkedin.com/in/... |
| website | Company URL | pdax.ph |
| priority | P0/P1/P2/P3 | P1 |
| status | new/contacted/qualified | new |
| source | Where found | LinkedIn |
| notes | Additional info | BSP licensed |
| assigned_to | ColdCall batch | batch_1 |
| contact_date | Scheduled date | 2026-02-20 |

---

## 🎯 COLD CALL SCHEDULE (PENDING APPROVAL)

### **Daily Quota:** 10-15 calls per day
### **Weekly Target:** 50-75 calls
### **Batch Size:** 5 leads per batch (to avoid fatigue)

---

## 📅 WEEKLY SCHEDULE

### **MONDAY - Research & Prep Day**
- **Morning:** Review weekend lead intake
- **Afternoon:** Prioritize P0 leads for week
- **ColdCall Activity:** 0 calls (prep only)
- **Tasks:**
  - Sort leads by priority
  - Research top 20 targets
  - Prepare personalized scripts

### **TUESDAY - High Priority Blitz**
- **Target:** P0 leads only
- **Calls:** 15 dials
- **Focus:** Decision makers (CEOs, Founders)
- **Time:** 9 AM - 12 PM (best reach rate)
- **Goal:** 3-5 conversations

### **WEDNESDAY - Follow-up Day**
- **Target:** Tuesday no-answers + P1 leads
- **Calls:** 15 dials
- **Focus:** Voicemail + email combo
- **Time:** 2 PM - 5 PM
- **Goal:** 5-7 touchpoints

### **THURSDAY - Volume Day**
- **Target:** P1 and P2 leads
- **Calls:** 15 dials
- **Focus:** Quantity over quality
- **Time:** 10 AM - 4 PM (spread out)
- **Goal:** 10+ conversations

### **FRIDAY - Relationship Building**
- **Target:** Warm leads from week
- **Calls:** 10 dials
- **Focus:** Nurture, not sell
- **Time:** 9 AM - 11 AM
- **Goal:** Schedule next week meetings

### **WEEKEND - No Calls**
- Research and prep for next week
- Update CRM
- Review metrics

---

## ⏰ DAILY CALL BLOCKS

### **Block 1: Morning (9:00 AM - 11:00 AM)**
- **Best for:** CEOs, Founders, Decision makers
- **Strategy:** Direct, no-nonsense
- **Target:** 5 calls

### **Block 2: Afternoon (2:00 PM - 4:00 PM)**
- **Best for:** Managers, Engineers
- **Strategy:** Technical, detailed
- **Target:** 5 calls

### **Block 3: Late (4:00 PM - 5:00 PM)**
- **Best for:** Follow-ups, voicemails
- **Strategy:** Persistence
- **Target:** 5 calls

---

## 🎯 PRIORITY CALLING ORDER

### **Tier 1: Call First (P0)**
1. DeFi Protocols - Singapore/Hong Kong
2. RWA Tokenization - Singapore/Hong Kong
3. Payment Processors - Brazil/Nigeria

### **Tier 2: Call Second (P1)**
1. Crypto Exchanges - Australia/Thailand
2. Fintech Startups - All regions
3. Banks - Singapore/Hong Kong

### **Tier 3: Call Third (P2/P3)**
1. Consulting Firms
2. VCs/Investors
3. Others

---

## 📞 CALL SCRIPT TEMPLATES

### **Script A: DeFi Protocols (P0)**
```
Hi [Name], this is [ColdCall] from Mission Control.

I'm reaching out because we're building partnerships with 
leading DeFi protocols in [Region]. I noticed [Company] is 
doing impressive work with [Specific thing].

We're exploring synergies around [liquidity/cross-chain/integrations].
Would you be open to a 15-minute call this week to explore 
potential collaboration?

[If yes]: Great! How's [Day] at [Time]?
[If no]: No problem. Can I send you a brief overview via email?
```

### **Script B: Payment Processors (P1)**
```
Hi [Name], [ColdCall] here from Mission Control.

We're working with payment processors to expand remittance 
corridors into [Region]. [Company] came up as a key player.

I'd love to understand your current challenges and see if 
there's a fit for partnership. Do you have 10 minutes this 
week for a quick chat?
```

### **Script C: Follow-up (Voicemail)**
```
Hi [Name], this is [ColdCall] from Mission Control calling 
about partnership opportunities with [Company].

I'll send you an email with details, but I'd love to connect 
live if possible. My number is [Number].

Talk soon!
```

---

## 📊 TRACKING METRICS

### **Daily Tracking:**
| Metric | Target | Actual |
|--------|--------|--------|
| Calls Made | 15 | ___ |
| Conversations | 5 | ___ |
| Meetings Set | 2 | ___ |
| Voicemails | 5 | ___ |
| Emails Sent | 10 | ___ |

### **Weekly Tracking:**
| Metric | Target | Actual |
|--------|--------|--------|
| Total Calls | 55 | ___ |
| Conversations | 20 | ___ |
| Meetings Set | 8 | ___ |
| Deals Progressed | 3 | ___ |

---

## 🔄 DAILY AUTOMATION (PENDING APPROVAL)

### **6:00 AM - Daily Lead Export**
```bash
#!/bin/bash
# export-daily-leads.sh

DATE=$(date +%Y-%m-%d)
mkdir -p /root/.openclaw/workspace/mission-control/data/leads/$DATE

# Export to JSON
jq '.' /root/.openclaw/workspace/mission-control/agents/dealflow/leads.json > \
  /root/.openclaw/workspace/mission-control/data/leads/$DATE/leads.json

# Export to CSV
jq -r '.[] | [.id, .date_added, .company, .country, .industry, .contact_name, .title, .email, .phone, .linkedin, .priority, .status] | @csv' \
  /root/.openclaw/workspace/mission-control/agents/dealflow/leads.json > \
  /root/.openclaw/workspace/mission-control/data/leads/$DATE/leads.csv

echo "Leads exported for $DATE"
```

### **9:00 AM - ColdCall Daily Briefing**
- Review today's batch
- Check lead research
- Confirm script
- Set daily target

### **6:00 PM - Daily Report**
- Log calls made
- Update lead statuses
- Schedule follow-ups
- Export progress

---

## ⚠️ APPROVAL REQUIRED

### **Before Starting:**
- [ ] EricF approves cold call schedule
- [ ] EricF approves scripts
- [ ] EricF approves daily quotas
- [ ] EricF approves automation

### **Nexus Authority:**
**OVERRIDDEN** - This plan requires explicit EricF approval.
Nexus cannot authorize cold calling without EricF sign-off.

---

## 📁 FILES TO CREATE (Post-Approval)

1. `/data/leads/YYYY-MM-DD/leads.json` - Daily JSON
2. `/data/leads/YYYY-MM-DD/leads.csv` - Daily CSV
3. `/scripts/export-daily-leads.sh` - Export script
4. `/scripts/coldcall-daily-brief.sh` - Daily briefing
5. `/coldcall/scripts/` - Call scripts
6. `/coldcall/tracking/` - Daily tracking sheets

---

*System designed by: Nexus (Air1ck3ff)*  
*Status: AWAITING ERICF APPROVAL*  
*DO NOT EXECUTE WITHOUT EXPLICIT APPROVAL*
