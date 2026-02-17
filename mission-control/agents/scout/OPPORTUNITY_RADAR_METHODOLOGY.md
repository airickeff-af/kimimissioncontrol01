# Scout Opportunity Radar - Methodology

## Overview

The Opportunity Radar is an automated market intelligence system that identifies high-potential opportunities in the crypto/Web3 space. It uses a data-driven scoring algorithm to rank opportunities based on five key dimensions.

## Signal Types

The radar monitors five categories of opportunity signals:

### 1. Underserved Regions 🌍
**Definition:** Geographic markets with high crypto adoption but low infrastructure/competition.

**Data Sources:**
- Chainalysis Global Crypto Adoption Index
- Local exchange volume data
- Remittance flow statistics
- Mobile penetration metrics

**Key Indicators:**
- High grassroots adoption (retail transactions)
- Limited local exchange options
- Strong remittance corridors
- Mobile-first user base

**Examples in Database:**
- Southeast Asia DeFi Infrastructure (Vietnam, Philippines, Indonesia)
- Africa Stablecoin Payment Rails (Nigeria, Kenya)
- Latin America Crypto Payroll (Argentina, Brazil)

### 2. Feature Gaps 🔧
**Definition:** Missing functionality that users need but competitors haven't built.

**Data Sources:**
- GitHub repository trends
- Product Hunt launches
- Twitter complaint analysis
- Discord community feedback

**Key Indicators:**
- Repeated user requests across platforms
- Workarounds/hacks for missing features
- Competitor product limitations
- Emerging tech without crypto integration

**Examples in Database:**
- AI Agent Crypto Wallet Integration
- Cross-Chain Portfolio Analytics
- NFT Lending for Mid-Tier Assets

### 3. Customer Pain Points 😤
**Definition:** Frustrations and unmet needs expressed by crypto users.

**Data Sources:**
- Reddit r/CryptoMarkets, r/DeFi
- Twitter sentiment analysis
- Discord server complaints
- App store reviews

**Key Indicators:**
- High-engagement complaint threads
- "Why doesn't X exist?" posts
- Manual workarounds
- Abandoned onboarding flows

**Examples in Database:**
- Crypto Onboarding for Non-Tech Users
- DeFi Yield Aggregator for Small Wallets

### 4. Regulatory Openings 📜
**Definition:** New regulations that create compliance needs or market access.

**Data Sources:**
- SEC, ESMA, FCA announcements
- Legislative tracking (Congress, EU Parliament)
- Industry association reports
- Legal firm analysis

**Key Indicators:**
- New framework implementation dates
- Licensing requirement changes
- Compliance deadline announcements
- Regulatory clarity in previously gray areas

**Examples in Database:**
- MiCA Compliance as a Service (EU)
- US Stablecoin Infrastructure (GENIUS Act)

### 5. Partnership Voids 🤝
**Definition:** Companies seeking integrations but lacking suitable partners.

**Data Sources:**
- Job postings (integration engineer roles)
- Partnership announcement gaps
- Conference partnership pitches
- RFPs and vendor searches

**Key Indicators:**
- "Looking for partners" posts
- Integration job openings
- Failed partnership attempts
- Market consolidation leaving gaps

**Examples in Database:**
- AI Content Tools for Crypto Creators
- Web2 Gaming + NFT Integration Platform

---

## Scoring Algorithm

### Formula
```
Total Score = Σ(Component × Weight)
```

### Components

| Component | Weight | Description | Data Sources |
|-----------|--------|-------------|--------------|
| Market Size | 25% | TAM/SAM potential | Market research, user surveys, competitor ARR |
| Timing | 20% | Market urgency and trend alignment | Google Trends, social volume, regulatory dates |
| Competition Gap | 20% | Inverse of competition level | Competitor analysis, market mapping |
| Execution Ease | 15% | Technical feasibility | Complexity assessment, resource requirements |
| Alignment | 20% | Fit with EricF's skills/resources | Skill matrix matching |

### Scoring Scale
- **90-100:** Exceptional opportunity - immediate action recommended
- **80-89:** High priority - strong candidate for execution
- **70-79:** Medium-high - evaluate further, monitor closely
- **60-69:** Medium - potential but requires validation
- **50-59:** Low-medium - monitor only
- **0-49:** Low priority - ignore unless circumstances change

### Alignment Profile

Opportunities are scored against EricF's strengths:

| Skill | Weight | Rationale |
|-------|--------|-----------|
| Crypto Native | 95% | Deep expertise in crypto markets and culture |
| Content Creation | 90% | Proven track record, engaged audience |
| Startup Experience | 85% | Draper program, fundraising knowledge |
| AI Automation | 80% | Mission Control development experience |
| Community Building | 75% | Social media presence, network effects |
| DeFi Expertise | 70% | Active user, understands protocols |
| NFT Knowledge | 65% | Trading experience, market awareness |

---

## Data Confidence Levels

Each opportunity is tagged with a confidence level:

- **High:** Multiple verified data sources, clear market signals
- **Medium:** Some data gaps, requires further validation
- **Low:** Early signals, speculative opportunity

---

## Weekly Report Format

### Top 5 Opportunities
Each weekly report includes:

1. **Title** - Clear, actionable opportunity name
2. **Priority Score** - 0-100 with component breakdown
3. **Why it's an opportunity** - Data-driven explanation
4. **Evidence** - Supporting data points
5. **Recommended Action** - Specific next steps
6. **Estimated Impact** - Revenue/valuation potential
7. **Tags** - Category labels for filtering

### Summary Statistics
- Total opportunities tracked
- Distribution by signal type
- High/medium/low priority counts
- Average score trends

---

## Automation

### Weekly Schedule
- **When:** Every Monday at 10:00 AM Asia/Shanghai
- **Delivery:** Telegram message to @EricclFung
- **Format:** Concise summary with links to full report

### Manual Triggers
- `--scan` - Run signal detection across sources
- `--report` - Generate full opportunity report
- `--telegram` - Generate Telegram-formatted message
- `--export` - Export dashboard-compatible JSON

---

## Future Enhancements

### Planned Integrations
1. **Twitter/X API** - Real-time sentiment analysis
2. **Reddit API** - Community pain point detection
3. **News APIs** - Regulatory announcement tracking
4. **GitHub API** - Open-source project trend analysis
5. **DeFiLlama API** - On-chain usage pattern analysis

### ML Enhancements
- Sentiment classification for social data
- Opportunity similarity clustering
- Predictive scoring based on historical performance
- Automated signal detection from unstructured data

---

## References

- Chainalysis 2025 Global Crypto Adoption Index
- a16z Market Mapping Methodology
- "The Opportunity Algorithm" by Clay Christensen
- KAIROSOFT Games visual style reference

---

*Last Updated: February 18, 2026*
*Version: 1.0*
