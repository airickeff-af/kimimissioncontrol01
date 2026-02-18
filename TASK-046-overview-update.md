### **TASK-046: Update Overview Page with Complete Agent Data**
- **Assigned:** Forge-2, Forge-3
- **Due:** Feb 18, 1:00 PM
- **Status:** 🟢 IN PROGRESS
- **Priority:** P1
- **Description:** Update Mission Control overview page with complete agent information and activity metrics

**Requirements:**
1. **Agent Grid (22 agents):**
   - Nexus/Air1ck3ff - CEO/Orchestrator
   - Audit-1, Audit-2 - QA
   - Code-1, Code-2, Code-3 - Backend
   - Forge-1, Forge-2, Forge-3 - Frontend
   - Cipher - Security
   - DealFlow - Lead Gen
   - Gary - Marketing
   - Glasses - Researcher
   - Larry - Social
   - PIE - Predictive Intelligence
   - Pixel - Designer
   - Quill - Writer
   - Scout - Researcher
   - Sentry - DevOps

2. **Per-Agent Information:**
   - Name + Role + Emoji
   - Status (active/busy/idle/offline)
   - Tokens used (from ACTUAL_TOKEN_USAGE_REPORT.md)
   - Files associated with agent
   - Tasks completed count
   - **Activity entries count** (number of actions completed)
   - Last active timestamp
   - Success rate %

3. **Recent Activity Feed:**
   - Last 50 activities across all agents
   - Time, Agent, Action, Details

4. **System Stats:**
   - Total tokens used
   - Total tasks completed
   - Active agents count
   - Deployments today

**Files to Modify:**
- `/mission-control/dashboard/index.html`

**Source:** EricF request (Feb 18, 12:18 PM)