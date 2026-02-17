// Standup Meeting Feature for Living Pixel Office
// Agents gather to discuss improvements and peer review

class StandupMeeting {
    constructor(office) {
        this.office = office;
        this.isRunning = false;
        this.participants = [];
        this.discussionTopics = [
            "How can we improve API response times?",
            "What new features should we prioritize?",
            "Any blockers preventing task completion?",
            "Best practices for lead research?",
            "How to optimize token usage?",
            "Ideas for better dashboard UX?",
            "Partnership outreach strategies",
            "Code review feedback",
            "Design system improvements",
            "Automation opportunities"
        ];
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.office.logActivity('🎤 STANDUP MEETING CALLED! All agents gathering...');
        
        // Select all available agents
        this.participants = this.office.agents.filter(a => a.status !== 'meeting');
        
        // Move all agents to meeting table
        this.participants.forEach((agent, index) => {
            const angle = (Math.PI * 2 / this.participants.length) * index;
            const radius = 80;
            const tableX = 500;
            const tableY = 400;
            
            agent.targetX = tableX + Math.cos(angle) * radius;
            agent.targetY = tableY + Math.sin(angle) * radius;
            agent.status = 'meeting';
            agent.activity = 'In standup';
            
            // Add speech bubble after arriving
            setTimeout(() => {
                this.showSpeechBubble(agent);
            }, 2000 + (index * 500));
        });
        
        this.office.updateAgentStatusList();
        
        // End meeting after 3 minutes
        setTimeout(() => {
            this.end();
        }, 180000);
        
        // Log discussion topics
        this.logDiscussions();
    }

    showSpeechBubble(agent) {
        const topic = this.discussionTopics[Math.floor(Math.random() * this.discussionTopics.length)];
        
        // Create speech bubble element
        const bubble = document.createElement('div');
        bubble.className = 'speech-bubble';
        bubble.style.cssText = `
            position: absolute;
            background: rgba(0, 212, 255, 0.9);
            color: #000;
            padding: 8px 12px;
            border-radius: 12px;
            font-size: 11px;
            max-width: 150px;
            z-index: 100;
            left: ${agent.x + 30}px;
            top: ${agent.y - 40}px;
            animation: fadeInOut 5s ease;
        `;
        bubble.textContent = topic;
        
        document.querySelector('.office-area').appendChild(bubble);
        
        // Remove after 5 seconds
        setTimeout(() => {
            bubble.remove();
        }, 5000);
    }

    logDiscussions() {
        const discussions = [
            `${this.participants[0]?.name || 'Agent'}: "Let's optimize our API calls to reduce token usage"`,
            `${this.participants[1]?.name || 'Agent'}: "I found a great lead in Singapore - should I prioritize?"`,
            `${this.participants[2]?.name || 'Agent'}: "The new dashboard design is almost ready for review"`,
            `Team: Discussed partnership strategies for APAC region`,
            `Team: Agreed on daily standup schedule at 9 AM`
        ];
        
        discussions.forEach((msg, i) => {
            setTimeout(() => {
                this.office.logActivity(msg);
            }, i * 10000);
        });
    }

    end() {
        this.office.logActivity('✅ Standup meeting complete! Agents returning to desks.');
        
        this.participants.forEach(agent => {
            // Return to original desk position
            const originalPos = this.getOriginalPosition(agent.id);
            agent.targetX = originalPos.x;
            agent.targetY = originalPos.y;
            agent.status = 'working';
            agent.activity = 'Working';
        });
        
        this.isRunning = false;
        this.participants = [];
        this.office.updateAgentStatusList();
    }

    getOriginalPosition(agentId) {
        const positions = {
            nexus: { x: 400, y: 100 },
            ericf: { x: 600, y: 100 },
            forge: { x: 150, y: 300 },
            code: { x: 300, y: 300 },
            pixel: { x: 450, y: 300 },
            glasses: { x: 150, y: 500 },
            quill: { x: 300, y: 500 },
            gary: { x: 600, y: 500 },
            larry: { x: 750, y: 500 },
            sentry: { x: 150, y: 700 },
            audit: { x: 300, y: 700 },
            cipher: { x: 450, y: 700 },
            dealflow: { x: 600, y: 700 },
            coldcall: { x: 750, y: 700 },
            scout: { x: 900, y: 700 }
        };
        return positions[agentId] || { x: 500, y: 400 };
    }
}

// Add to LivingOffice class
// this.standup = new StandupMeeting(this);
