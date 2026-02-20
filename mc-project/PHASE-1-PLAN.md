# MC PROJECT - PHASE 1 PLAN
**Minecraft GenZ Character: Health-Wealth Simulation**
**Timeline:** 2 Days (Feb 20-21, 2026) — ACCELERATED
**Team:** 6 Dedicated Agents
**Deploy Targets:** Vercel + GitHub Pages (dual deployment)

---

## DEPLOYMENT STRATEGY

| Platform | URL | Purpose |
|----------|-----|---------|
| **Vercel (Primary)** | `https://mc-project.vercel.app` | Main deployment, APIs |
| **GitHub Pages (Backup)** | `https://airickeff-af.github.io/mc-project` | Static backup, no APIs |
| **GitHub Repo** | `github.com/airickeff-af/mc-project` | Source + backup |

---

---

## TEAM ASSIGNMENTS

| Agent | Role | Specialty |
|-------|------|-----------|
| **Pixel-MC** | Lead Designer | Sprites, animations, visual design |
| **Code-MC** | Backend Lead | Systems, APIs, data tracking |
| **Forge-MC** | Frontend Lead | Dashboard, UI, real-time sync |
| **Glasses-MC** | Research Lead | Gen Z data, competitors, validation |
| **Quill-MC** | Content Lead | Docs, tutorials, copy |
| **Sentry-MC** | DevOps Lead | Testing, deployment, monitoring |

**Shared:** Audit (quality), Sentry (monitoring) — with Mission Control

---

## 20 TASKS - PHASE 1 (2-DAY SPRINT)

### DAY 1: BACKEND + 3D FOUNDATION (Feb 20)

**MC-TASK-001: GitHub Repo Setup + GitHub Pages**
- **Assigned:** Sentry-MC
- **Hours:** 2
- **Deliverable:** Repo created, GitHub Actions CI/CD, Pages enabled
- **Output:** `github.com/airickeff-af/mc-project` + Pages live

**MC-TASK-002: 3D Character Viewer Setup**
- **Assigned:** Forge-MC + Pixel-MC
- **Hours:** 4
- **Deliverable:** Three.js viewer, GLB loader, rigged character display
- **Output:** `/dashboard/viewer.html` — drag-drop GLB file
- **Features:** Rotate, zoom, wireframe, bone visualization

**MC-TASK-003: GLB File Integration System**
- **Assigned:** Code-MC
- **Hours:** 3
- **Deliverable:** GLB parser, rig detection, animation mapping
- **Output:** `/api/character/glb` endpoint
- **Features:** Upload GLB, extract rig, map to health/wealth states

**MC-TASK-004: Health System API**
- **Assigned:** Code-MC
- **Hours:** 4
- **Deliverable:** `/api/health` endpoints, tracking logic
- **Features:** Exercise, sleep, nutrition, mental health

**MC-TASK-005: Wealth System API**
- **Assigned:** Code-MC
- **Hours:** 4
- **Deliverable:** `/api/wealth` endpoints, tracking logic
- **Features:** Savings, investments, gig work, debt

**MC-TASK-006: Dual-Metric Integration + 3D Mapping**
- **Assigned:** Code-MC + Forge-MC
- **Hours:** 4
- **Deliverable:** Health-wealth → 3D character rig mapping
- **Features:** Rig changes based on stats (posture, color, animation)

**MC-TASK-007: Database + Real-time Sync**
- **Assigned:** Code-MC
- **Hours:** 3
- **Deliverable:** PostgreSQL, WebSocket, live updates
- **Output:** Character state syncs to 3D viewer in real-time

**MC-TASK-008: Character Sprite Design (2D Fallback)**
- **Assigned:** Pixel-MC
- **Hours:** 4
- **Deliverable:** 32x32 sprites, 7 animation states
- **Output:** `/assets/sprites/` (backup if 3D fails)

**MC-TASK-009: Gen Z Research Validation**
- **Assigned:** Glasses-MC
- **Hours:** 3
- **Deliverable:** Behavior data validation, pricing confirmed
- **Output:** `/docs/validation-report.md`

**MC-TASK-010: Day 1 Deploy Test**
- **Assigned:** Sentry-MC
- **Hours:** 1
- **Deliverable:** Vercel + GitHub Pages both live
- **Test:** APIs on Vercel, static on GitHub Pages

---

### DAY 2: FRONTEND + FINAL DEPLOY (Feb 21)

**MC-TASK-011: Dashboard with 3D Viewer Integration**
- **Assigned:** Forge-MC
- **Hours:** 6
- **Deliverable:** Main dashboard with embedded 3D character
- **Features:** Live character updates, health/wealth meters

**MC-TASK-012: Input Interface + Activity Logging**
- **Assigned:** Forge-MC
- **Hours:** 4
- **Deliverable:** Forms for exercise, spending, income, sleep
- **Features:** Quick actions, mobile responsive

**MC-TASK-013: Anonymous Confessions System**
- **Assigned:** Code-MC + Forge-MC
- **Hours:** 4
- **Deliverable:** Confession box, shared wall, moderation
- **Features:** Categories, reactions, AI flagging

**MC-TASK-014: Visual Feedback System**
- **Assigned:** Forge-MC + Pixel-MC
- **Hours:** 4
- **Deliverable:** Character changes visualized in real-time
- **Features:** Color shifts, posture changes, animation triggers

**MC-TASK-015: Mobile Responsive + PWA**
- **Assigned:** Forge-MC
- **Hours:** 3
- **Deliverable:** Mobile-optimized, installable PWA
- **Features:** Offline mode, push notifications

**MC-TASK-016: Testing + Bug Fixes**
- **Assigned:** Sentry-MC + all agents
- **Hours:** 4
- **Deliverable:** Test suite, bug fixes, performance
- **Coverage:** API, frontend, 3D viewer, mobile

**MC-TASK-017: Documentation**
- **Assigned:** Quill-MC
- **Hours:** 4
- **Deliverable:** User guide, API docs, 3D viewer guide
- **Output:** `/docs/README.md`, `/docs/3D-GUIDE.md`

**MC-TASK-018: Education Edition Package**
- **Assigned:** Quill-MC + Pixel-MC
- **Hours:** 3
- **Deliverable:** Minecraft Education files, lesson plans
- **Output:** `/edition/education/`

**MC-TASK-019: Dual Deployment (Vercel + GitHub Pages)**
- **Assigned:** Sentry-MC
- **Hours:** 2
- **Deliverable:** Both platforms live and synced
- **URLs:** 
  - `https://mc-project.vercel.app` (full features)
  - `https://airickeff-af.github.io/mc-project` (static backup)

**MC-TASK-020: Launch + Handoff**
- **Assigned:** Nexus + all agents
- **Hours:** 2
- **Deliverable:** Live MVP, demo ready, EricF handoff
- **Demo:** Working 3D character, health-wealth tracking, confessions

---

## SUCCESS CRITERIA

| Metric | Target |
|--------|--------|
| **Quality Score** | 95/100 |
| **Working Features** | All 20 tasks complete |
| **Test Coverage** | 80%+ |
| **Deploy Status** | Live URL |
| **Documentation** | Complete |

---

## REVENUE READINESS

**Phase 1 Output:**
- ✅ Working MVP
- ✅ Education Edition ready
- ✅ Documentation complete
- ✅ Demo URL live

**Ready for:**
- School pilots (2-3 schools)
- Marketplace listing prep
- Investor/demo presentations

---

## APPROVAL REQUIRED

**EricF — Review this plan:**
1. Are the 20 tasks correct?
2. Is 4-day timeline realistic?
3. Any changes needed?

**Reply:**
- "GREEN LIGHT" — Start immediately
- "MODIFY: [changes]" — Adjust and resubmit
- "HOLD" — Pause until further notice

---

*Prepared by: Nexus (Air1ck3ff)*
*Date: Feb 20, 2026 12:00 PM*
