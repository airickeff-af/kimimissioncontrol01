# Content Repurposing System

**Design Document**  
**Prepared by:** Quill Agent  
**Task:** TASK-024  
**Due:** Feb 21, 2026  
**Last Updated:** 2026-02-19

---

## Executive Summary

The Content Repurposing System automatically transforms long-form content (blogs, articles, whitepapers) into platform-optimized formats for Twitter/X, LinkedIn, and other social channels. This maximizes content ROI by extracting multiple assets from a single source piece.

---

## System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Source Content │────▶│  Content Parser  │────▶│  Asset Extractor │
│  (Blog/Article) │     │  & Analyzer      │     │                 │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                              ┌───────────────────────────┼───────────┐
                              │                           │           │
                              ▼                           ▼           ▼
                    ┌─────────────────┐        ┌─────────────────┐  ┌─────────────────┐
                    │  Twitter/X      │        │  LinkedIn       │  │  Other Channels │
                    │  Generator      │        │  Generator      │  │  (Instagram,    │
                    │                 │        │                 │  │  Newsletter)    │
                    └────────┬────────┘        └────────┬────────┘  └────────┬────────┘
                             │                          │                   │
                             ▼                          ▼                   ▼
                    ┌─────────────────┐        ┌─────────────────┐  ┌─────────────────┐
                    │  Thread (5-10)  │        │  Long-form Post │  │  Format-specific│
                    │  Single Tweets  │        │  Carousel PDF   │  │  Assets         │
                    │  Quote Cards    │        │  Short Updates  │  │                 │
                    └─────────────────┘        └─────────────────┘  └─────────────────┘
```

---

## Workflow Stages

### Stage 1: Content Ingestion

**Input:** Blog post URL, markdown file, or raw text
**Output:** Structured content object

#### Supported Formats
- Markdown files (`.md`)
- HTML pages
- Plain text
- Google Docs (via API)
- Notion pages (via API)

#### Extraction Process
1. Fetch raw content
2. Extract metadata (title, author, date, tags)
3. Parse structure (headings, paragraphs, lists)
4. Identify key sections and quotes
5. Extract media (images, videos)

#### Content Object Structure
```json
{
  "id": "content_001",
  "source": {
    "url": "https://ericclfung.medium.com/article",
    "title": "Original Title",
    "author": "Eric Fung",
    "publishedAt": "2026-02-19",
    "wordCount": 1200
  },
  "structure": {
    "headings": [...],
    "paragraphs": [...],
    "quotes": [...],
    "stats": [...],
    "cta": "..."
  },
  "analysis": {
    "topics": ["startups", "fundraising"],
    "tone": "professional",
    "keyPoints": [...],
    "readTime": "5 min"
  }
}
```

---

### Stage 2: Content Analysis

**Purpose:** Understand content to extract maximum value

#### Analysis Modules

| Module | Description | Output |
|--------|-------------|--------|
| **Topic Extractor** | Identifies main themes and subtopics | Topic taxonomy |
| **Sentiment Analyzer** | Determines emotional tone | Tone profile |
| **Key Point Identifier** | Extracts core arguments | Bullet summary |
| **Quote Detector** | Finds quotable passages | Quote candidates |
| **Stat Finder** | Locates data points | Stats list |
| **CTA Extractor** | Identifies calls-to-action | CTA options |

#### Key Point Scoring
Each extracted element is scored (0-100) based on:
- Relevance to main topic
- Standalone value (does it make sense out of context?)
- Engagement potential
- Shareability

---

### Stage 3: Asset Generation

#### 3.1 Twitter/X Assets

**Thread Generator**
- Input: Full article
- Output: 5-10 tweet thread
- Format:
  ```
  Tweet 1: Hook (problem/curiosity gap)
  Tweet 2-4: Key points with context
  Tweet 5-8: Supporting details/examples
  Tweet 9: Insight/takeaway
  Tweet 10: CTA + link
  ```

**Single Tweet Variants**
- **The Insight:** One key takeaway
- **The Contrarian:** Counter-intuitive point
- **The How-To:** Actionable tip
- **The Stat:** Data-driven tweet
- **The Question:** Engagement driver

**Quote Cards**
- Visual templates with pull quotes
- Branded backgrounds
- Auto-sized for Twitter (1200x675)

#### 3.2 LinkedIn Assets

**Long-Form Post**
- 1300 characters max
- Professional tone
- Paragraph breaks for readability
- 3-5 hashtags

**Carousel Document**
- PDF with 5-10 slides
- Each slide: One key point + visual
- Native LinkedIn document upload

**Short Update**
- Quick insight (2-3 sentences)
- Link to full article
- Engagement question

#### 3.3 Instagram Assets

**Carousel Posts**
- 5-10 slides
- Square format (1080x1080)
- Minimal text per slide
- Strong visuals

**Stories**
- Key quote on branded background
- Poll/question sticker
- Link sticker (if eligible)

**Reels Script**
- 30-60 second script
- Hook in first 3 seconds
- Key point + CTA

#### 3.4 Newsletter Assets

**Summary Email**
- 3-paragraph summary
- "Read the full article" link
- Key takeaways list

**Deep Dive Section**
- One expanded point
- Additional context
- Related resources

---

### Stage 4: Platform Optimization

#### Character Limits

| Platform | Type | Limit |
|----------|------|-------|
| Twitter/X | Tweet | 280 chars |
| Twitter/X | Thread | 25 tweets max |
| LinkedIn | Post | 3000 chars (1300 optimal) |
| LinkedIn | Comment | 1250 chars |
| Instagram | Caption | 2200 chars |
| Instagram | Bio link | 1 URL |

#### Hashtag Strategy

**Twitter/X**
- 1-2 hashtags max
- Place at end or inline
- Research trending tags

**LinkedIn**
- 3-5 hashtags
- Mix of broad (#startups) and niche (#seedfunding)
- Place at end of post

**Instagram**
- 5-10 hashtags in caption or first comment
- Mix of sizes (1M+, 100K+, 10K+ posts)
- Rotate hashtag sets

#### Optimal Posting Times

| Platform | Best Times | Frequency |
|----------|------------|-----------|
| Twitter/X | Tue-Thu, 9am-11am | 2-5x daily |
| LinkedIn | Tue-Thu, 8am-10am | 1x daily |
| Instagram | Mon-Fri, 11am-1pm | 1-2x daily |

---

### Stage 5: Scheduling & Publishing

#### Scheduling Queue

```
Day 0: Publish blog post
Day 0: LinkedIn long-form
Day 0: Twitter thread
Day 1: Twitter single (insight)
Day 1: LinkedIn short update
Day 2: Instagram carousel
Day 2: Twitter quote card
Day 3: LinkedIn carousel
Day 3: Twitter single (stat)
Day 5: Newsletter feature
Day 7: Twitter single (how-to)
Day 7: LinkedIn short update
```

#### Automation Rules

1. **Spacing:** Minimum 4 hours between posts on same platform
2. **Variety:** Rotate content types (don't post 3 threads in a row)
3. **Peak Times:** Schedule for optimal engagement windows
4. **Recycling:** evergreen content can be reshared after 30 days

---

## Implementation Guide

### Phase 1: MVP (Week 1-2)

**Core Features:**
- [ ] Markdown file ingestion
- [ ] Basic Twitter thread generator
- [ ] LinkedIn post generator
- [ ] Manual review before publishing

**Tech Stack:**
- Python/Node.js for processing
- OpenAI API for content generation
- Airtable/Notion for content calendar
- Buffer/Hootsuite for scheduling

### Phase 2: Automation (Week 3-4)

**Add Features:**
- [ ] URL-based ingestion
- [ ] Quote card generation (Canva API)
- [ ] Hashtag suggestions
- [ ] Auto-scheduling

### Phase 3: Intelligence (Week 5-6)

**Add Features:**
- [ ] Performance tracking
- [ ] A/B testing
- [ ] Content scoring
- [ ] Auto-optimization based on engagement

---

## Content Templates

### Twitter Thread Template

```
🧵 [Number] lessons from [topic]:

I spent [timeframe] [doing research/experience].

Here's what I learned:

[Hook tweet - 1/10]

---

1/ [First point]

[Context/elaboration]

[2/10]

---

2/ [Second point]

[Context/elaboration]

[3/10]

---

[Continue pattern...]

---

[Final insight or actionable takeaway]

[CTA: Follow for more, read full article, etc.]

[10/10]
```

### LinkedIn Post Template

```
[Hook - one sentence that stops the scroll]

[Blank line]

[Context - 2-3 sentences setting up the insight]

[Blank line]

[Main insight - the core value]

[Blank line]

[Supporting point or example]

[Blank line]

[Conclusion/takeaway]

[Blank line]

[CTA - question or invitation to engage]

[Hashtags - 3-5 relevant tags]
```

### Instagram Carousel Template

**Slide 1:** Hook + Title
**Slide 2:** Problem/Context
**Slide 3-7:** Key points (one per slide)
**Slide 8:** Solution/Takeaway
**Slide 9:** CTA + Link in bio

---

## Quality Checklist

Before publishing any repurposed content:

- [ ] Does it make sense standalone (without reading original)?
- [ ] Is the hook compelling in first 3 seconds/words?
- [ ] Are hashtags relevant and researched?
- [ ] Is the CTA clear?
- [ ] Does it match platform tone?
- [ ] Is formatting optimized for platform?
- [ ] Are all links working?
- [ ] Is branding consistent?

---

## Performance Metrics

### Track Per Asset

| Metric | Twitter/X | LinkedIn | Instagram |
|--------|-----------|----------|-----------|
| Impressions | ✓ | ✓ | ✓ |
| Engagements | ✓ | ✓ | ✓ |
| Engagement Rate | ✓ | ✓ | ✓ |
| Link Clicks | ✓ | ✓ | ✓ |
| Shares/Reposts | ✓ | ✓ | ✓ |
| Comments | ✓ | ✓ | ✓ |
| Saves | - | - | ✓ |
| Follows | ✓ | ✓ | ✓ |

### Success Benchmarks

| Platform | Good ER | Great ER |
|----------|---------|----------|
| Twitter/X | 1-3% | 5%+ |
| LinkedIn | 2-4% | 6%+ |
| Instagram | 3-6% | 8%+ |

---

## Example: Full Repurposing Workflow

### Source Content
**Blog Post:** "How I Raised $500K in 30 Days: A First-Time Founder's Playbook"

### Generated Assets

**Twitter Thread (8 tweets):**
1. Hook: "I raised $500K in 30 days as a first-time founder. Here's the exact playbook I used:"
2. Lesson 1: Start with warm intros
3. Lesson 2: Have a data room ready
4. Lesson 3: Create FOMO with multiple conversations
5. Lesson 4: Practice your pitch 50+ times
6. Lesson 5: Follow up within 24 hours
7. Biggest mistake to avoid
8. CTA + link

**LinkedIn Post:**
- Professional tone version
- Focus on "playbook" framework
- CTA: "What would you add to this list?"

**Instagram Carousel:**
- 8 slides covering each lesson
- Branded templates
- "Save this for your next raise"

**Quote Cards:**
- "Practice your pitch 50 times before your first meeting"
- "FOMO is your best friend in fundraising"

**Newsletter:**
- Full summary + link
- Expanded section on "Creating FOMO"

---

## Tools & Resources

### Content Generation
- OpenAI GPT-4
- Claude (Anthropic)
- Jasper.ai
- Copy.ai

### Design
- Canva (API available)
- Figma
- Adobe Express

### Scheduling
- Buffer
- Hootsuite
- Later
- Native schedulers

### Analytics
- Twitter Analytics
- LinkedIn Analytics
- Instagram Insights
- Google Analytics (for link tracking)

---

## Next Steps

1. **Immediate:** Create MVP script for Twitter thread generation
2. **Week 1:** Test with 3-5 blog posts
3. **Week 2:** Add LinkedIn generation
4. **Week 3:** Implement scheduling
5. **Week 4:** Add performance tracking

---

**Document prepared by:** Quill Agent  
**Task:** TASK-024  
**Status:** Design Complete → Ready for Implementation  
**Last updated:** 2026-02-19
