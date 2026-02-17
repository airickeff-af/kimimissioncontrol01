# Personalization Guide: How to Customize Each Template

> A practical guide for tailoring cold email templates to each prospect

---

## The 5-Minute Research Checklist

Before sending any email, spend 5 minutes researching:

### 1. The Person (2 minutes)
- [ ] Check LinkedIn for recent posts or job changes
- [ ] Look for mutual connections
- [ ] Note their role and seniority level
- [ ] Check if they've spoken at conferences or been quoted in articles

### 2. The Company (2 minutes)
- [ ] Recent news (funding, product launches, expansions)
- [ ] Press releases from the last 60 days
- [ ] Their blog or resources page
- [ ] Job postings (reveals priorities)

### 3. The Fit (1 minute)
- [ ] Why coins.ph specifically helps them
- [ ] What unique value you bring
- [ ] Any mutual connections or shared context

---

## Template-by-Template Customization

### Template 1: Initial Cold Outreach

#### Required Customizations

| Variable | Example | Bad | Good |
|----------|---------|-----|------|
| `{{firstName}}` | "Hi John," | "Hi there," | "Hi John," |
| `{{companyName}}` | "Binance" | "your company" | "Binance" |
| `{{recentNews}}` | "expansion into Southeast Asia" | "growth" | "Series C funding and SEA expansion announcement" |
| `{{specificValueProp}}` | "Your users need PHP liquidity..." | "We have 18M users" | "Your SEA expansion would benefit from our 75% market share in PHP/stablecoin pairs — giving your users local liquidity from day one." |

#### Customization Examples by Target Type

**For Exchanges:**
```
{{specificValueProp}} = "Your order books would benefit from our 
75-80% market share in PHP/USDT and PHP/USDC pairs. We process 
$X in daily volume and could provide immediate liquidity for 
your PHP trading pairs."
```

**For DeFi Protocols:**
```
{{specificValueProp}} = "PHPC (our regulated PHP stablecoin) could 
integrate as a settlement layer for your protocol, giving you 
access to the $38.4B Philippine remittance market with full 
regulatory compliance."
```

**For GameFi:**
```
{{specificValueProp}} = "The Philippines was Axie Infinity's #1 
market (40% of players). Our 18.6M mobile-first users are 
exactly your target demographic — crypto-native, gaming-hungry, 
and looking for the next big thing."
```

**For Payment Processors:**
```
{{specificValueProp}} = "Our 600,000+ QRPH-enabled merchants and 
PHPC stablecoin could provide instant crypto-to-fiat settlement 
for your cross-border payment corridors into the Philippines."
```

---

### Template 2: Follow-up #1 (No Response)

#### Required Customizations

| Variable | Focus | Example |
|----------|-------|---------|
| `{{specificValueProp}}` | Narrow down the value | Instead of listing 3 benefits, pick the ONE most relevant |
| Options provided | Match their likely preference | Technical teams → "one-pager"; Executives → "15-min call" |

#### Key Difference from Initial Email

This email should be:
- **Shorter** (cut 25% of words)
- **More specific** (one value prop, not three)
- **Easier to respond to** (multiple choice options)

---

### Template 3: Follow-up #2 (Still No Response)

#### Required Customizations

| Variable | Purpose | Example |
|----------|---------|---------|
| `{{doing X}}` | Show you understand their business | "building out your APAC infrastructure" |
| `{{18.6M users...}}` | Match their scale | For enterprise: "enterprise-grade compliance"; For startups: "18.6M users ready to adopt" |

#### Psychology of This Email

This template works because:
1. **Empathy** — "I don't want to be that person..."
2. **Logic** — Reminds them why you reached out
3. **Easy outs** — Gives them permission to say no
4. **P.S. hook** — Uncovers if you're talking to the wrong person

---

### Template 4: Value-Add Follow-up

#### Required Customizations

| Variable | Source | Example |
|----------|--------|---------|
| `{{industryInsightOrNews}}` | Industry pubs, regulatory updates | "BSP just released new guidelines for VASP licensing that could affect how foreign exchanges operate in the Philippines..." |
| `{{theirFocus}}` | LinkedIn posts, earnings calls | "your recent focus on institutional clients" |
| `{{specificArea}}` | Their product roadmap | "compliance strategy for SEA expansion" |
| `{{relatedTrend}}` | Your internal data | "a 40% increase in institutional onboarding requests" |

#### Finding Good Insights

**Sources:**
- CoinDesk, The Block, Cointelegraph (crypto news)
- BSP circulars and advisories (regulatory)
- LinkedIn posts from their executives
- Their competitors' announcements
- Your own data/analytics

**Rules:**
- Must be genuinely relevant (if it's a stretch, skip this template)
- Must be recent (within 2 weeks ideally)
- Must be brief (2-3 sentences max)
- Must connect to their business

---

### Template 5: Breakup Email

#### Required Customizations

| Variable | Purpose | Notes |
|----------|---------|-------|
| `{{companyName}}` | Personalization | Used twice — make sure it's correct |

#### Why This Works

The breakup email gets responses because:
1. **Permission-based** — "Permission to close your file?"
2. **Multiple choice** — Easy to reply with 1, 2, 3, or 4
3. **Low friction** — "Takes 10 seconds to reply"
4. **Professional** — Wishes them luck regardless

**Pro tip:** Some people will respond just to be nice, which opens the door to conversation.

---

## Subject Line Customization

### A/B Testing Your Subject Lines

For each campaign, test:

| Test | Variant A | Variant B | Winner Metric |
|------|-----------|-----------|---------------|
| Personalization | With `{{firstName}}` | Without name | Open rate |
| Length | Short (3-5 words) | Long (descriptive) | Open rate |
| Numbers | With stats ($107B) | Without stats | Open rate |
| Question vs Statement | Question | Statement | Open rate |
| Urgency | "Last try" | No urgency | Open + reply rate |

### Subject Line Formulas That Work

**Formula 1: Value + Specificity**
```
Partnership opportunity: Philippines' $107B crypto market
[Benefit type]: [Specific number] [Market]
```

**Formula 2: Curiosity Gap**
```
{{companyName}} + coins.ph in SEA?
[Their company] + [Your company] in [Region]?
```

**Formula 3: Question**
```
Quick question about {{companyName}}'s Asia expansion
Quick question about [Their company]'s [Their focus]
```

**Formula 4: Re: Continuity**
```
Re: [Original subject line]
```

**Formula 5: The Breakup**
```
Permission to close your file?
[Question that gives them control]
```

---

## Common Personalization Mistakes

### ❌ Mistake 1: Generic Value Props
**Bad:** "We can help you grow your business."  
**Good:** "Our 75% market share in PHP/stablecoin would give your users local liquidity from day one."

### ❌ Mistake 2: Talking About Yourself First
**Bad:** "I'm reaching out from coins.ph, the largest exchange in the Philippines..."  
**Good:** "I saw Binance's recent SEA expansion and wanted to reach out about..."

### ❌ Mistake 3: Forcing the Connection
**Bad:** Sharing a regulatory update that barely relates to their business  
**Good:** Only using the value-add template when you have genuinely relevant news

### ❌ Mistake 4: Too Long
**Bad:** 200+ word emails  
**Good:** 100-125 words for initial, 75-100 for follow-ups

### ❌ Mistake 5: Weak CTAs
**Bad:** "Let me know if you're interested."  
**Good:** "Worth a brief conversation to explore synergies?"

---

## Personalization at Scale

### Using a CRM or Spreadsheet

Create columns for:
- Company
- First Name
- Role
- Recent News (with date)
- Target Type (Exchange, DeFi, GameFi, etc.)
- Specific Value Prop (customized)
- Template to Use
- Subject Line Variant

### Automation vs. Manual

| Approach | When to Use | Tools |
|----------|-------------|-------|
| Fully manual | High-value targets (CEOs, big logos) | Gmail/Outlook |
| Semi-automated | Mid-tier prospects | Apollo, Outreach, Salesloft |
| Automated | Volume play, lower-tier | HubSpot sequences, Mixmax |

### The 80/20 Rule

Spend 80% of your personalization time on:
- The `{{specificValueProp}}` variable
- Subject line selection
- Recent news research

The other 20% on:
- Name/company verification
- Grammar and tone check

---

## Quick Reference: coins.ph Talking Points

### By Target Type

| Type | Lead With | Key Metrics | Proof Points |
|------|-----------|-------------|--------------|
| **Exchanges** | Liquidity sharing | 75-80% PHP market share | Circle partnership, daily volume |
| **DeFi** | PHPC stablecoin | $38.4B remittance market | Regulatory compliance, yield |
| **GameFi** | Mobile users | 18.6M registered | Axie Infinity history, Ronin partnership |
| **Payments** | Settlement rails | 600K+ merchants | QRPH network, cross-border |
| **Infra** | API/compliance | BSP-licensed, ISO 27001 | Enterprise security, SDK |

### Universal Proof Points
- 18.6 million registered users
- BSP-licensed (VASP, EMI, FX)
- 75-80% market share in peso-to-stablecoin
- PHPC: First regulated Philippine Peso stablecoin
- 600,000+ QRPH-enabled merchants
- Philippines: #9 globally in crypto adoption
- $38.4 billion annual remittance market
- Global expansion via coins.xyz (Brazil, Nigeria, EU, SEA)

---

## Quality Checklist Before Sending

- [ ] Is the recipient's name spelled correctly?
- [ ] Is the company name correct?
- [ ] Is the recent news actually recent (within 60 days)?
- [ ] Does the value prop speak to THEIR needs, not ours?
- [ ] Is the email under 150 words (initial) or 125 words (follow-up)?
- [ ] Is the CTA clear and low-friction?
- [ ] Is the subject line under 60 characters?
- [ ] Have I proofread for typos?
- [ ] Would I open this email if I received it?

---

*Guide prepared by Quill, the Writer Agent | February 2026*
