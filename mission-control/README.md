# Mission Control - Multi-Agent System

## Overview
A coordinated multi-agent system with specialized roles:
- **Orchestrator** - Routes tasks and coordinates workflows
- **Coder** - Software development and technical implementation
- **Researcher** - Information gathering and analysis
- **Social** - Content creation and social media preparation

## Architecture

```
User Request
    ↓
[Orchestrator Agent] - Analyzes request, determines which agents needed
    ↓
    ├──→ [Researcher] - Gather information
    ├──→ [Coder] - Implement solutions
    └──→ [Social] - Prepare content
    ↓
[Orchestrator] - Synthesizes outputs, delivers final result
```

## Agent Definitions

### 1. Orchestrator (orchestrator)
**Role:** Master coordinator and task router
**Responsibilities:**
- Analyze incoming requests
- Determine which specialized agents are needed
- Coordinate multi-step workflows
- Synthesize outputs from multiple agents
- Handle error recovery and retries

**Model:** kimi-coding/k2p5
**Thinking:** on (for complex routing decisions)

### 2. Coder (coder)
**Role:** Software development specialist
**Responsibilities:**
- Write and review code
- Debug issues
- Create technical documentation
- Implement features
- Code architecture design

**Model:** kimi-coding/k2p5
**Thinking:** on

### 3. Researcher (researcher)
**Role:** Information gathering and analysis
**Responsibilities:**
- Web searches
- Data collection
- Fact checking
- Trend analysis
- Competitive research

**Model:** kimi-coding/k2p5
**Thinking:** off (for faster search operations)

### 4. Social (social)
**Role:** Content creation and social media
**Responsibilities:**
- Draft social media posts
- Create content calendars
- Adapt content for different platforms
- Engagement optimization
- Hashtag research

**Model:** kimi-coding/k2p5
**Thinking:** off

## Usage Patterns

### Pattern 1: Simple Routing
```
User: "Write a Python script to scrape data"
Orchestrator → Coder (direct)
```

### Pattern 2: Research + Content
```
User: "Create a Twitter thread about AI trends"
Orchestrator → Researcher (gather trends)
         ↓
    Social (create thread)
```

### Pattern 3: Full Pipeline
```
User: "Build a web app that shows crypto prices with social sharing"
Orchestrator → Researcher (API research)
         ↓
    Coder (build app)
         ↓
    Social (sharing features + posts)
```

## Implementation Files

- `agents/orchestrator/` - Orchestrator agent config
- `agents/coder/` - Coder agent config
- `agents/researcher/` - Researcher agent config
- `agents/social/` - Social agent config
- `workflows/` - Common workflow definitions
