/**
 * P1 FEATURE: Streak Lottery System
 * MC Project — Agent-Gamma + Nexus
 * Date: Feb 21, 2026
 * 
 * Features:
 * - Daily login streak tracking
 * - Scratch card lottery
 * - Random prizes
 * - Streak multiplier
 */

const StreakLotterySystem = {
    streakData: JSON.parse(localStorage.getItem('mc_streak') || '{}'),
    prizes: [
        { name: '💰 10 Coins', type: 'coins', value: 10, weight: 30 },
        { name: '💰 50 Coins', type: 'coins', value: 50, weight: 20 },
        { name: '💰 100 Coins', type: 'coins', value: 100, weight: 10 },
        { name: '⚡ 2x Multiplier', type: 'multiplier', value: 2, weight: 15 },
        { name: '🎁 Mystery Box', type: 'mystery', value: 1, weight: 15 },
        { name: '👑 Crown Avatar', type: 'cosmetic', value: 'crown', weight: 8 },
        { name: '🔥 Jackpot!', type: 'jackpot', value: 500, weight: 2 }
    ],

    init() {
        this.checkDailyStreak();
        this.renderLotterySection();
    },

    checkDailyStreak() {
        const today = new Date().toDateString();
        const lastLogin = this.streakData.lastLogin;

        if (lastLogin === today) return; // Already logged in today

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastLogin === yesterday.toDateString()) {
            // Consecutive day
            this.streakData.streak = (this.streakData.streak || 0) + 1;
        } else {
            // Streak broken
            this.streakData.streak = 1;
        }

        this.streakData.lastLogin = today;
        this.streakData.canScratch = true;
        this.saveStreak();
    },

    renderLotterySection() {
        const container = document.getElementById('challenge-section');
        if (!container) return;

        const lotteryHTML = `
        <div id="lottery-section" class="lottery-section pixel-card">
            <div class="lottery-header">
                <h2 class="pixel-title">🎰 STREAK LOTTERY</h2>
                <div class="streak-counter">
                    <span class="streak-flame">🔥</span>
                    <span class="streak-number">${this.streakData.streak || 0}</span>
                    <span class="streak-label">DAY STREAK</span>
                </div>
            </div>

            <div class="scratch-card-container">
                <div id="scratch-card" class="scratch-card ${!this.streakData.canScratch ? 'scratched' : ''}">
                    <div class="scratch-cover">
                        <div class="scratch-text">${this.streakData.canScratch ? '🔥 SCRATCH TO WIN!' : '✅ CLAIMED TODAY'}</div>
                        <div class="scratch-hint">Click to reveal your prize</div>
                    </div>
                    <div id="scratch-prize" class="scratch-prize"></div>
                </div>
            </div>

            <div class="streak-rewards">
                <h3 class="pixel-title" style="font-size: 10px; margin-bottom: 0.5rem;">STREAK MILESTONES</h3>
                <div class="milestone-list">
                    ${this.renderMilestones()}
                </div>
            </div>
        </div>
        `;

        const div = document.createElement('div');
        div.innerHTML = lotteryHTML;
        container.parentNode.insertBefore(div.firstElementChild, container.nextSibling);

        // Add click handler
        const scratchCard = document.getElementById('scratch-card');
        if (scratchCard && this.streakData.canScratch) {
            scratchCard.addEventListener('click', () => this.scratchCard());
        }

        this.addStyles();
    },

    renderMilestones() {
        const milestones = [
            { days: 3, reward: '🎁 Mystery Box', type: 'mystery', value: 1 },
            { days: 7, reward: '👑 Crown Avatar', type: 'cosmetic', value: 'crown' },
            { days: 14, reward: '💎 2x Forever', type: 'multiplier', value: 2 },
            { days: 30, reward: '🏆 Legend Badge', type: 'badge', value: 'legend' }
        ];

        // Track claimed milestones
        if (!this.streakData.claimedMilestones) {
            this.streakData.claimedMilestones = [];
        }

        return milestones.map(m => {
            const canClaim = (this.streakData.streak || 0) >= m.days && 
                            !this.streakData.claimedMilestones.includes(m.days);
            const claimed = this.streakData.claimedMilestones.includes(m.days);
            
            return `
            <div class="milestone ${claimed ? 'claimed' : ''} ${canClaim ? 'claimable' : ''}" 
                 ${canClaim ? `onclick="StreakLotterySystem.claimMilestone(${m.days}, '${m.type}', ${m.value})"` : ''}>
                <span class="milestone-days">${m.days}d</span>
                <span class="milestone-reward">${m.reward}</span>
                <span class="milestone-status">
                    ${claimed ? '✅ CLAIMED' : canClaim ? '👆 CLICK TO CLAIM' : '🔒'}
                </span>
            </div>
        `}).join('');
    },

    // P1-028: Claim milestone reward
    claimMilestone(days, type, value) {
        if (!this.streakData.claimedMilestones) {
            this.streakData.claimedMilestones = [];
        }
        
        // Check if already claimed
        if (this.streakData.claimedMilestones.includes(days)) {
            return;
        }
        
        // Mark as claimed
        this.streakData.claimedMilestones.push(days);
        this.saveStreak();
        
        // Apply reward
        let rewardMessage = '';
        switch(type) {
            case 'coins':
                const coins = (this.streakData.coins || 0) + value;
                this.streakData.coins = coins;
                rewardMessage = `💰 +${value} COINS!`;
                break;
            case 'mystery':
                rewardMessage = '🎁 MYSTERY BOX UNLOCKED!';
                break;
            case 'cosmetic':
                if (!this.streakData.cosmetics) this.streakData.cosmetics = [];
                this.streakData.cosmetics.push(value);
                rewardMessage = `👑 ${value.toUpperCase()} UNLOCKED!`;
                break;
            case 'multiplier':
                this.streakData.permanentMultiplier = value;
                rewardMessage = `💎 ${value}x PERMANENT MULTIPLIER!`;
                break;
            case 'badge':
                if (!this.streakData.badges) this.streakData.badges = [];
                this.streakData.badges.push(value);
                rewardMessage = `🏆 ${value.toUpperCase()} BADGE EARNED!`;
                break;
        }
        
        this.saveStreak();
        this.showNotification(`🎉 STREAK BONUS: ${rewardMessage}`);
        this.renderLotterySection(); // Re-render to update UI
    },

    scratchCard() {
        if (!this.streakData.canScratch) return;

        const card = document.getElementById('scratch-card');
        const prizeEl = document.getElementById('scratch-prize');
        
        // Pick prize based on weights
        const prize = this.pickPrize();
        
        // Apply streak multiplier
        const streak = this.streakData.streak || 1;
        const multiplier = Math.min(Math.floor(streak / 7) + 1, 3); // Max 3x
        
        let finalPrize = { ...prize };
        if (prize.type === 'coins') {
            finalPrize.value = prize.value * multiplier;
            finalPrize.name = prize.name.replace(/\d+/, finalPrize.value);
        }

        // Animate
        card.classList.add('scratching');
        
        setTimeout(() => {
            card.classList.remove('scratching');
            card.classList.add('scratched');
            
            prizeEl.innerHTML = `
                <div class="prize-reveal">
                    <div class="prize-icon">${finalPrize.name.split(' ')[0]}</div>
                    <div class="prize-name">${finalPrize.name}</div>
                    ${multiplier > 1 ? `<div class="prize-multiplier">${multiplier}x STREAK BONUS!</div>` : ''}
                </div>
            `;
            
            this.streakData.canScratch = false;
            this.saveStreak();
            this.showNotification(`🎉 Won: ${finalPrize.name}!`);
        }, 1000);
    },

    pickPrize() {
        const totalWeight = this.prizes.reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const prize of this.prizes) {
            random -= prize.weight;
            if (random <= 0) return prize;
        }
        
        return this.prizes[0];
    },

    addStyles() {
        if (document.getElementById('lottery-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'lottery-styles';
        styles.textContent = `
            .lottery-section {
                max-width: 800px;
                margin: 2rem auto;
                padding: 1.5rem;
                background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%);
                border: 3px solid #333;
                border-radius: 12px;
                box-shadow: 4px 4px 0 #000;
            }

            .lottery-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid #333;
            }

            .streak-counter {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
            }

            .streak-flame {
                font-size: 1.5rem;
                animation: flame-flicker 0.5s ease-in-out infinite alternate;
            }

            @keyframes flame-flicker {
                from { transform: scale(1); }
                to { transform: scale(1.1); }
            }

            .streak-number {
                font-family: 'Press Start 2P', monospace;
                font-size: 20px;
                color: white;
            }

            .streak-label {
                font-family: 'VT323', monospace;
                font-size: 14px;
                color: rgba(255,255,255,0.8);
            }

            .scratch-card-container {
                display: flex;
                justify-content: center;
                margin: 2rem 0;
            }

            .scratch-card {
                width: 280px;
                height: 160px;
                background: linear-gradient(135deg, #ffd700, #ffed4e);
                border: 4px solid #ffd700;
                border-radius: 12px;
                position: relative;
                overflow: hidden;
                cursor: pointer;
                transition: transform 0.2s;
            }

            .scratch-card:hover:not(.scratched) {
                transform: scale(1.02);
            }

            .scratch-cover {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #333, #555);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                transition: opacity 0.5s;
            }

            .scratch-card.scratched .scratch-cover {
                opacity: 0;
                pointer-events: none;
            }

            .scratch-card.scratching .scratch-cover {
                animation: scratch-shake 0.1s ease-in-out 10;
            }

            @keyframes scratch-shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }

            .scratch-text {
                font-family: 'Press Start 2P', monospace;
                font-size: 14px;
                color: #ffd700;
                text-align: center;
            }

            .scratch-hint {
                font-family: 'VT323', monospace;
                font-size: 16px;
                color: #888;
                margin-top: 0.5rem;
            }

            .scratch-prize {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #1a1a2e, #2a2a4e);
            }

            .prize-reveal {
                text-align: center;
                animation: prize-pop 0.5s ease;
            }

            @keyframes prize-pop {
                0% { transform: scale(0); opacity: 0; }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); opacity: 1; }
            }

            .prize-icon {
                font-size: 3rem;
                margin-bottom: 0.5rem;
            }

            .prize-name {
                font-family: 'Press Start 2P', monospace;
                font-size: 12px;
                color: #00d4ff;
            }

            .prize-multiplier {
                font-family: 'VT323', monospace;
                font-size: 16px;
                color: #ff6b6b;
                margin-top: 0.5rem;
            }

            .streak-rewards {
                margin-top: 1.5rem;
            }

            .milestone-list {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .milestone {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.75rem 1rem;
                background: #0f0f1a;
                border: 2px solid #333;
                border-radius: 6px;
                font-family: 'VT323', monospace;
                font-size: 16px;
            }

            .milestone.claimed {
                border-color: #00d4ff;
                background: rgba(0, 212, 255, 0.1);
            }

            .milestone-days {
                background: #333;
                padding: 0.25rem 0.75rem;
                border-radius: 4px;
                font-family: 'Press Start 2P', monospace;
                font-size: 10px;
            }

            .milestone.claimed .milestone-days {
                background: #00d4ff;
                color: #0a0a0f;
            }

            .milestone-reward {
                color: #888;
            }

            .milestone.claimed .milestone-reward {
                color: #00d4ff;
            }

            .milestone.claimable {
                border-color: #ffd700;
                background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
                cursor: pointer;
                animation: milestone-pulse 1.5s ease-in-out infinite;
            }

            @keyframes milestone-pulse {
                0%, 100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
                50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8); }
            }

            .milestone.claimable:hover {
                transform: translateX(5px);
                border-color: #ffed4e;
            }

            .milestone.claimable .milestone-status {
                color: #ffd700;
                font-weight: bold;
                animation: status-blink 1s ease-in-out infinite;
            }

            @keyframes status-blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        `;
        document.head.appendChild(styles);
    },

    saveStreak() {
        localStorage.setItem('mc_streak', JSON.stringify(this.streakData));
    },

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ffd700;
            color: #0a0a0f;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-family: 'Press Start 2P', monospace;
            font-size: 10px;
            z-index: 10000;
            box-shadow: 4px 4px 0 #000;
            animation: slide-in 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
};

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => StreakLotterySystem.init(), 1500);
});
