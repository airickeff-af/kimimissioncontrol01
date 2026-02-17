# DealFlow Lead Intake Process

## Overview
This document defines the standard operating procedure for lead intake, qualification, and management within the DealFlow system.

## Lead Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (format: `lead_XXX`) |
| `company` | string | Yes | Company/organization name |
| `contact_name` | string | Yes | Primary contact person's full name |
| `email` | string | Yes | Contact email address |
| `linkedin` | string | No | LinkedIn profile URL |
| `status` | string | Yes | Current pipeline stage |
| `priority` | string | Yes | Priority level (P0/P1/P2/P3) |
| `notes` | string | No | Additional context and details |
| `created_date` | string | Yes | ISO 8601 date (YYYY-MM-DD) |

## Pipeline Stages

```
┌─────────┐    ┌───────────┐    ┌─────────┐    ┌──────────┐    ┌────────┐
│   NEW   │───▶│ CONTACTED │───▶│ MEETING │───▶│ PROPOSAL │───▶│ CLOSED │
└─────────┘    └───────────┘    └─────────┘    └──────────┘    └────────┘
```

### Stage Definitions

1. **NEW**
   - Lead identified and added to database
   - No outreach attempted yet
   - Initial research completed

2. **CONTACTED**
   - First outreach sent (email/LinkedIn/call)
   - Awaiting response
   - Follow-up scheduled if no reply within 3-5 days

3. **MEETING**
   - Response received and meeting scheduled
   - Discovery call completed or pending
   - Qualification in progress

4. **PROPOSAL**
   - Partnership terms discussed
   - Formal proposal sent
   - Negotiation phase

5. **CLOSED**
   - Partnership finalized (WON) or
   - Opportunity disqualified (LOST)

## Priority Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| **P0** | Strategic must-win deals | Within 24 hours |
| **P1** | High-value opportunities | Within 48 hours |
| **P2** | Medium priority | Within 1 week |
| **P3** | Low priority/nurture | As capacity allows |

## Lead Intake Workflow

### Step 1: Lead Discovery
- Research target companies in crypto/Web3 space
- Identify key decision-makers
- Verify contact information

### Step 2: Lead Qualification
Before adding a lead, confirm:
- [ ] Company operates in relevant sector (crypto exchange, fintech, Web3)
- [ ] Contact is a decision-maker or influencer
- [ ] Clear partnership opportunity exists
- [ ] Contact information is accurate

### Step 3: Data Entry
1. Generate next `lead_XXX` ID (check `leads.json` for last ID)
2. Populate all required fields
3. Write concise but informative notes
4. Set appropriate priority level
5. Use current date for `created_date`

### Step 4: Initial Outreach (ColdCall Agent)
- ColdCall agent picks up NEW leads
- Generates personalized outreach templates
- Tracks first contact attempts
- Updates status to `contacted`

### Step 5: Handoff Rules
- **ColdCall → DealFlow**: After initial contact
- **DealFlow → Cipher**: For security/compliance review
- **DealFlow → Audit**: For pipeline review and reporting

## File Locations

| File | Path | Purpose |
|------|------|---------|
| Lead Database | `/mission-control/agents/dealflow/leads.json` | Master lead data |
| This Document | `/mission-control/agents/dealflow/LEAD_INTAKE.md` | Process documentation |
| Dashboard | `/mission-control/dashboard/dealflow-view.html` | Visual pipeline view |

## Integration Points

### ColdCall Agent
- Reads from `leads.json` for NEW leads
- Updates `status` to `contacted` after outreach
- Adds outreach notes to lead record

### Cipher (Security)
- Reviews all P0 leads before outreach
- Flags sensitive contacts
- Approves messaging for regulated entities

### Audit
- Weekly pipeline reviews
- Status change tracking
- Performance metrics

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-17 | Initial process creation | DealFlow |
