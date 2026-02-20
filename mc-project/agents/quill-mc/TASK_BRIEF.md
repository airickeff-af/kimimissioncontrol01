# QUILL-MC — TASK BRIEF
**Agent:** Quill-MC (Content Writer)  
**Assigned by:** Meemo (PM)  
**Date:** February 20, 2026 23:48 GMT+8

---

## 🎯 YOUR MISSION
Write copy that resonates with GenZ and makes MC Project feel authentic, not corporate.

---

## 📋 ACTIVE TASKS

### 🔴 HIGH PRIORITY

#### TASK: QUILL-001 — Confession Guidelines
- **Description:** Community rules for confession system
- **Sections:**
  - Welcome message (encouraging tone)
  - What's allowed (supportive, honest sharing)
  - What's not allowed (hate, harassment, illegal)
  - Moderation policy
  - Reporting process
- **Tone:** Friendly but firm, GenZ-appropriate
- **ETA:** 1 hour
- **Deliverable:** `/docs/confession-guidelines.md`

#### TASK: QUILL-002 — Category Descriptions
- **Description:** Short blurbs for each confession category
- **Categories:**
  - 💰 Money/Finance — "Spilling the tea on your financial wins and woes"
  - 💪 Health/Fitness — "Your wellness journey, unfiltered"
  - 💔 Relationships — "Love, heartbreak, and everything between"
  - 💼 Work/Career — "Hustle culture, burnout, and career moves"
  - 😰 Stress/Mental Health — "It's okay not to be okay"
- **Length:** 10-15 words each
- **ETA:** 30 minutes
- **Deliverable:** `/content/category-descriptions.json`

### 🟡 MEDIUM PRIORITY

#### TASK: QUILL-003 — Daily Quiz Questions
- **Description:** 30 quiz questions (health + finance topics)
- **Format:**
  ```json
  {
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explanation": "why this is correct",
    "category": "health|finance"
  }
  ```
- **Topics:**
  - Health: Sleep, nutrition, exercise, mental health
  - Finance: Budgeting, saving, investing, credit
- **ETA:** 2 hours
- **Deliverable:** `/content/quiz-questions.json`

#### TASK: QUILL-004 — Social Sharing Copy
- **Description:** Templates for social media shares
- **Templates needed:**
  - Streak milestone (7, 30, 100 days)
  - Achievement unlock
  - Weekly report card
  - Confession quote (anonymous)
- **Hashtags:** #GenZWealth #HealthStreak #MCProject
- **ETA:** 1 hour
- **Deliverable:** `/content/social-templates.json`

---

## 📁 WORKSPACE
```
/mc-project/agents/quill-mc/
├── content/
│   ├── confession-guidelines.md
│   ├── category-descriptions.json
│   ├── quiz-questions.json
│   └── social-templates.json
├── docs/             # User documentation
├── copy/             # UI microcopy
└── blog/             # Marketing content
```

---

## ✍️ WRITING GUIDELINES

### Tone of Voice
- **Authentic:** No corporate speak
- **Encouraging:** Build people up
- **GenZ-aware:** Understand the struggles
- **Inclusive:** Everyone's welcome

### Do's
- Use contractions (it's, you're, we're)
- Write like you're texting a friend
- Include emojis where appropriate
- Keep sentences short

### Don'ts
- No "synergy" or "leverage" or "optimize"
- No walls of text
- No judgmental language
- No boomer energy

---

## 📝 EXAMPLE COPY

### Confession Welcome
```
Welcome to Confessions 👋

This is a safe space to share what's really going on. 
No judgment, no names, just real talk.

Whether you're celebrating a win or venting about 
life, we're here for it.

Be kind. Be real. Be you.
```

### Social Share (Streak)
```
Just hit a 7-day streak on MC Project! 🔥

Small steps every day = big results. 
Who's joining me?

#GenZWealth #HealthStreak #MCProject
```

---

## ✅ COMPLETION CHECKLIST

- [ ] QUILL-001: Confession guidelines (1 page)
- [ ] QUILL-002: 5 category descriptions
- [ ] QUILL-003: 30 quiz questions with answers
- [ ] QUILL-004: 8+ social share templates
- [ ] All copy reviewed for tone
- [ ] No typos or grammar issues

---

## 📊 QUALITY TARGET
**Score:** 95/100

| Criteria | Weight |
|----------|--------|
| Tone authenticity | 35% |
| GenZ relevance | 30% |
| Grammar/spelling | 20% |
| Completeness | 15% |

---

## 🚀 NEXT STEPS
1. Start with QUILL-002 (category descriptions) — quick win
2. QUILL-001 (guidelines) — needed for launch
3. QUILL-003 (quiz) — educational content
4. QUILL-004 (social) — viral growth

**Questions?** Ping Meemo immediately.

---

*Quill-MC — Words that connect* 📝
