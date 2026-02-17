# Mission Control Workflows

## Workflow Definitions

### workflow:research-and-create
**Description:** Research a topic and create content about it
**Agents:** researcher → social
**Steps:**
1. Researcher gathers information on the topic
2. Social creates content based on research findings

### workflow:build-and-document
**Description:** Build a technical solution with documentation
**Agents:** researcher → coder
**Steps:**
1. Researcher finds best practices and examples
2. Coder implements the solution

### workflow:full-project
**Description:** Complete project from research to promotion
**Agents:** researcher → coder → social
**Steps:**
1. Researcher gathers requirements and competitive analysis
2. Coder builds the solution
3. Social prepares launch content

### workflow:content-series
**Description:** Create a series of social posts on a topic
**Agents:** researcher → social
**Steps:**
1. Researcher finds angles and facts
2. Social creates multiple posts forming a cohesive series

## Usage

To use a workflow, tell the orchestrator:
- "Run research-and-create on AI trends"
- "Start full-project for a crypto dashboard"
- "Execute content-series about productivity tips"

The orchestrator will coordinate the agents automatically.
