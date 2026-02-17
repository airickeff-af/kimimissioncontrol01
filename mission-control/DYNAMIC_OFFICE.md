# Mission Control - Dynamic Office System

## Overview
Agents move around the office based on their current activities. Positions update every hour to reflect real work patterns.

## Office Zones

### 1. Command Center (West)
**Permanent:** EricF + Air1ck3ff
**Purpose:** High-level coordination
**Activities:** Briefings, strategic planning, delegation

### 2. Content Corner (North-West)
**Agents:** Glasses, Quill, Pixel
**Purpose:** Content creation workflow
**Activities:** Research → Writing → Design pipeline

### 3. Marketing Bay (North-East)
**Agents:** Gary, Larry
**Purpose:** Marketing execution
**Activities:** Campaign planning, social scheduling

### 4. Operations Center (East)
**Agents:** Sentry, Audit, Cipher
**Purpose:** System monitoring
**Activities:** Health checks, QA, security

### 5. Conference Area (Center)
**Purpose:** Team meetings, discussions
**Activities:** All-hands, project kickoffs, problem-solving

### 6. Break Area (South)
**Purpose:** Rest, informal chat
**Activities:** Coffee breaks, casual discussions

## Dynamic Position States

### State: Morning Briefing (06:45 - 07:30)
```
┌─────────────────────────────────────────┐
│  [COMMAND]  →  [CONFERENCE AREA]        │
│   EricF        All agents gathered       │
│   Air1ck3ff    for daily briefing        │
│                                         │
│  Glasses presenting intel at center     │
│  Others seated around conference table  │
└─────────────────────────────────────────┘
```

### State: Deep Work (09:00 - 12:00)
```
┌─────────────────────────────────────────┐
│  [COMMAND]   [CONTENT]    [MARKETING]   │
│   EricF       Glasses       Gary        │
│   Air1ck3ff   Quill         Larry       │
│               Pixel                     │
│                                         │
│  Each at their individual desks         │
│  Focused on individual tasks            │
└─────────────────────────────────────────┘
```

### State: Collaboration - Content Pipeline (14:00 - 15:00)
```
┌─────────────────────────────────────────┐
│  [COMMAND]   [CONTENT CORNER - CLUSTER] │
│   EricF       Glasses → Quill → Pixel   │
│   Air1ck3ff      ↘      ↓      ↙       │
│               (huddled together)        │
│                                         │
│  Research being passed to writer        │
│  Writer collaborating with designer     │
└─────────────────────────────────────────┘
```

### State: Marketing Campaign Planning (15:30 - 16:30)
```
┌─────────────────────────────────────────┐
│  [COMMAND]          [MARKETING BAY]     │
│   EricF               Gary ←→ Larry     │
│   Air1ck3ff          (whiteboard)       │
│                                         │
│  Gary and Larry at shared workspace     │
│  Whiteboard with campaign flow          │
└─────────────────────────────────────────┘
```

### State: Crisis Response - All Hands (Anytime)
```
┌─────────────────────────────────────────┐
│           [CONFERENCE AREA]             │
│    All 9 agents gathered around         │
│    central holographic display          │
│                                         │
│    Sentry presenting system status      │
│    Cipher showing security feed         │
│    Others taking notes/asking questions │
└─────────────────────────────────────────┘
```

### State: Review & QA (17:00 - 18:00)
```
┌─────────────────────────────────────────┐
│  [COMMAND]   [CONTENT]      [QA STATION]│
│   EricF       Quill/Pixel    Audit      │
│   Air1ck3ff   (presenting)   (reviewing)│
│                                         │
│  Content creators showing work          │
│  Audit reviewing with checklist         │
└─────────────────────────────────────────┘
```

### State: End of Day Wind Down (19:00 - 20:00)
```
┌─────────────────────────────────────────┐
│  [COMMAND]   [BREAK AREA]   [OPS]       │
│   EricF       Mixed group     Sentry    │
│   Air1ck3ff   (coffee/chat)   Cipher    │
│                                         │
│  Some agents relaxing                   │
│  Ops team still monitoring              │
└─────────────────────────────────────────┘
```

## Hourly Position Schedule

| Time | State | Active Zone | Notes |
|------|-------|-------------|-------|
| 06:45 | Morning Briefing | Conference | Glasses presents daily intel |
| 07:30 | Transition | Individual | Agents move to desks |
| 09:00 | Deep Work | All Zones | Focus time, minimal chat |
| 10:00 | Deep Work | All Zones | Continued focus |
| 11:00 | Collaboration | Content | Glasses→Quill handoff |
| 12:00 | Lunch Break | Break Area | Mixed groups chatting |
| 13:00 | Deep Work | All Zones | Afternoon focus |
| 14:00 | Collaboration | Content | Full pipeline active |
| 15:00 | Marketing | Marketing Bay | Gary+Larry planning |
| 16:00 | Review | QA Station | Audit reviews outputs |
| 17:00 | Strategy | Command | EricF + Air1ck3ff planning |
| 18:00 | Wrap-up | Individual | Agents finishing tasks |
| 19:00 | Wind Down | Break Area | Casual conversations |
| 20:00 | Night Ops | Ops Center | Sentry/Cipher monitoring |

## Special Events (Trigger Position Changes)

### Event: New High-Priority Task
**Trigger:** EricF assigns urgent task
**Response:** 
- Relevant agents move to Conference Area
- 5-minute huddle
- Return to positions with clear roles

### Event: System Alert
**Trigger:** Sentry detects issue
**Response:**
- All ops agents (Sentry, Audit, Cipher) gather at Ops Center
- Air1ck3ff joins
- Others continue work unless affected

### Event: Content Approval Needed
**Trigger:** Quill/Pixel complete draft
**Response:**
- Move to QA Station with Audit
- Review and feedback
- Iterate or approve

### Event: Social Crisis
**Trigger:** Larry detects negative engagement
**Response:**
- Larry + Gary move to Command Center
- Brief EricF
- Decision on response

### Event: Creative Block
**Trigger:** Agent stuck on task
**Response:**
- Agent moves to Break Area
- Others may join for brainstorming
- Return when unblocked

## Visual Indicators for States

### Individual Work
- Agent at their desk
- Status: 🟢 Focused
- Minimal chat bubbles

### Collaboration
- Agents clustered together
- Status: 🔵 Collaborating
- Active chat between them
- Shared screen/whiteboard visible

### Meeting
- All agents in Conference Area
- Status: 🟡 In Meeting
- Structured dialogue
- Agenda visible

### Break
- Agents in Break Area
- Status: ⚪ On Break
- Casual chat
- Coffee cups visible

### Alert/Crisis
- Relevant agents gathered
- Status: 🔴 Alert
- Urgent dialogue
- Red lighting effect

## Implementation Notes

### Position Update Logic
```javascript
// Every hour, check:
1. Current time → Determine state
2. Active tasks → Override if needed
3. Special events → Highest priority
4. Update agent positions
5. Animate transitions
```

### Transition Animation
- Agents walk between zones (2-second animation)
- Desks light up when occupied
- Chat bubbles show movement
- Zone labels highlight active area

### Chat Context
When agents are:
- **At same desk:** Direct conversation
- **In same zone:** Zone chat
- **In meeting:** Meeting dialogue
- **Far apart:** Messages/DMs

---

*Dynamic office system for Mission Control*
*Positions update hourly based on activities*
