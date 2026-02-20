# CODE-MC — TASK BRIEF
**Agent:** Code-MC (Backend Engineer)  
**Assigned by:** Meemo (PM)  
**Date:** February 20, 2026 23:48 GMT+8

---

## 🎯 YOUR MISSION
Build rock-solid APIs that power MC Project's viral features. Performance and reliability are key.

---

## 📋 ACTIVE TASKS

### 🔴 HIGH PRIORITY

#### TASK: CODE-001 — Confession API Endpoints
- **Description:** CRUD API for confession system
- **Endpoints needed:**
  ```
  POST   /api/confessions              # Create confession
  GET    /api/confessions              # List confessions (paginated)
  GET    /api/confessions/:id          # Get single confession
  DELETE /api/confessions/:id          # Delete own confession
  ```
- **Schema:**
  ```json
  {
    "id": "uuid",
    "content": "string (max 500 chars)",
    "category": "money|health|relationships|work|stress",
    "authorHash": "anonymous hash",
    "likes": 0,
    "createdAt": "timestamp",
    "isFlagged": false
  }
  ```
- **ETA:** 3 hours
- **Deliverable:** `/api/confessions.js`

#### TASK: CODE-002 — Like System Backend
- **Description:** Like/unlike functionality with deduplication
- **Endpoints:**
  ```
  POST   /api/confessions/:id/like     # Like confession
  DELETE /api/confessions/:id/like     # Unlike confession
  ```
- **Requirements:**
  - Prevent duplicate likes from same user
  - Real-time like count updates
  - Rate limiting (10 likes/minute)
- **ETA:** 2 hours
- **Deliverable:** Like system module

### 🟡 MEDIUM PRIORITY

#### TASK: CODE-003 — Daily Winner Algorithm
- **Description:** Random weighted selector for daily confession winner
- **Algorithm:**
  ```javascript
  // Weight = likes received + random factor
  // Higher likes = higher chance, but not guaranteed
  weight = confession.likes * 0.7 + Math.random() * 0.3
  ```
- **Requirements:**
  - Run daily at midnight
  - Select from users who liked confessions that day
  - Store winner history
  - Trigger notification
- **ETA:** 2 hours
- **Deliverable:** `/api/lottery/winner.js`

#### TASK: CODE-004 — Streak Tracking System
- **Description:** Track user login and activity streaks
- **Features:**
  - Daily login tracking
  - Streak counter with freeze protection (1 miss allowed)
  - Milestone bonuses (7, 30, 100 days)
  - Streak recovery option
- **ETA:** 2 hours
- **Deliverable:** `/api/streaks.js`

#### TASK: CODE-005 — Quiz Question API
- **Description:** Daily quiz system
- **Endpoints:**
  ```
  GET  /api/quiz/daily       # Get today's question
  POST /api/quiz/answer      # Submit answer
  GET  /api/quiz/streak      # Get user's quiz streak
  ```
- **Requirements:**
  - One question per day per user
  - Topics: health, finance, productivity
  - Correct answer = coins reward
  - 7-day streak = bonus
- **ETA:** 1 hour
- **Deliverable:** `/api/quiz.js`

---

## 📁 WORKSPACE
```
/mc-project/agents/code-mc/
├── api/
│   ├── confessions.js
│   ├── likes.js
│   ├── lottery/
│   ├── streaks.js
│   └── quiz.js
├── models/           # Database schemas
├── tests/            # Unit tests
└── docs/             # API documentation
```

---

## 🔧 TECHNICAL REQUIREMENTS

### Stack
- Node.js + Express
- PostgreSQL (existing)
- WebSocket for real-time updates
- Redis for caching (optional)

### Performance Targets
- API response: <100ms
- Concurrent users: 1000+
- Uptime: 99.9%

### Security
- Input validation (Joi/Zod)
- Rate limiting
- SQL injection prevention
- XSS protection

---

## ✅ COMPLETION CHECKLIST

- [ ] CODE-001: Confession CRUD API
- [ ] CODE-002: Like system with deduplication
- [ ] CODE-003: Daily winner algorithm
- [ ] CODE-004: Streak tracking
- [ ] CODE-005: Quiz API
- [ ] All endpoints tested
- [ ] API documentation complete

---

## 📊 QUALITY TARGET
**Score:** 95/100

| Criteria | Weight |
|----------|--------|
| Code quality | 30% |
| API performance | 25% |
| Test coverage | 25% |
| Documentation | 20% |

---

## 🚀 NEXT STEPS
1. Start with CODE-001 (confession API) — blocks frontend work
2. CODE-002 (likes) — needed for engagement
3. CODE-003, CODE-004, CODE-005 for viral features

**Questions?** Ping Meemo immediately.

---

*Code-MC — Building the backend that scales* 💻
