/**
 * P1 FEATURE: Friend Challenges System
 * MC Project — Agent-Alpha + Agent-Beta
 * Date: Feb 21, 2026
 * 
 * Features:
 * - Create challenges between friends
 * - Track challenge progress
 * - Challenge leaderboard
 * - Real-time updates
 */

const FriendChallengeSystem = {
    challenges: JSON.parse(localStorage.getItem('mc_challenges') || '[]'),
    currentUser: localStorage.getItem('mc_user_id') || 'user_' + Math.random().toString(36).substr(2, 8),
    
    challengeTypes: [
        { id: 'steps', name: '👟 Step Battle', icon: '👟', metric: 'steps', unit: 'steps' },
        { id: 'savings', name: '💰 Savings Race', icon: '💰', metric: 'savings', unit: '$' },
        { id: 'workout', name: '💪 Workout Streak', icon: '💪', metric: 'workouts', unit: 'sessions' },
        { id: 'sleep', name: '😴 Sleep Goal', icon: '😴', metric: 'sleep', unit: 'hours' },
        { id: 'water', name: '💧 Hydration', icon: '💧', metric: 'water', unit: 'glasses' }
    ],

    init() {
        this.renderChallengeSection();
        this.loadChallenges();
    },

    renderChallengeSection() {
        const container = document.getElementById('confession-section');
        if (!container) return;

        const challengeHTML = `
        <div id="challenge-section" class="challenge-section pixel-card">
            <div class="challenge-header">
                <h2 class="pixel-title">🏆 FRIEND CHALLENGES</h2>
                <button onclick="FriendChallengeSystem.showCreateModal()" class="pixel-btn primary">
                    ➕ NEW CHALLENGE
                </button>
            </div>

            <div id="active-challenges" class="challenges-list">
                <div class="loading-challenges">Loading challenges...</div>
            </div>

            <!-- Create Challenge Modal -->
            <div id="create-challenge-modal" class="modal hidden">
                <div class="modal-content pixel-card">
                    <h3 class="pixel-title">Create Challenge</h3>
                    <select id="challenge-type" class="pixel-select">
                        ${this.challengeTypes.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                    </select>
                    
                    <input type="text" id="challenge-friend" class="pixel-input" 
                           placeholder="Friend's username" maxlength="20">
                    
                    <input type="number" id="challenge-goal" class="pixel-input" 
                           placeholder="Goal amount" min="1">
                    
                    <select id="challenge-duration" class="pixel-select">
                        <option value="1">1 Day</option>
                        <option value="3">3 Days</option>
                        <option value="7" selected>7 Days</option>
                        <option value="30">30 Days</option>
                    </select>
                    
                    <div class="modal-actions">
                        <button onclick="FriendChallengeSystem.createChallenge()" class="pixel-btn primary">CREATE</button>
                        <button onclick="FriendChallengeSystem.hideCreateModal()" class="pixel-btn">CANCEL</button>
                    </div>
                </div>
            </div>
        </div>
        `;

        const div = document.createElement('div');
        div.innerHTML = challengeHTML;
        container.parentNode.insertBefore(div.firstElementChild, container.nextSibling);
        this.addStyles();
    },

    addStyles() {
        if (document.getElementById('challenge-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'challenge-styles';
        styles.textContent = `
            .challenge-section {
                max-width: 800px;
                margin: 2rem auto;
                padding: 1.5rem;
                background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%);
                border: 3px solid #333;
                border-radius: 12px;
                box-shadow: 4px 4px 0 #000;
            }

            .challenge-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid #333;
            }

            .challenges-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .challenge-card {
                background: #0f0f1a;
                border: 2px solid #333;
                border-radius: 8px;
                padding: 1rem;
                transition: all 0.2s;
            }

            .challenge-card:hover {
                border-color: #00d4ff;
                transform: translateX(4px);
            }

            .challenge-card.winner {
                border-color: #ffd700;
                background: linear-gradient(135deg, #1a1a2e 0%, #2a2510 100%);
            }

            .challenge-title {
                font-family: 'Press Start 2P', monospace;
                font-size: 10px;
                color: #00d4ff;
                margin-bottom: 0.5rem;
            }

            .challenge-details {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-family: 'VT323', monospace;
                font-size: 16px;
                color: #888;
            }

            .challenge-progress {
                display: flex;
                gap: 1rem;
                margin-top: 1rem;
            }

            .progress-bar {
                flex: 1;
                height: 20px;
                background: #0a0a0f;
                border: 2px solid #333;
                border-radius: 4px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #00d4ff, #4ecdc4);
                transition: width 0.3s ease;
            }

            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }

            .modal.hidden { display: none; }

            .modal-content {
                max-width: 400px;
                width: 90%;
                padding: 2rem;
            }

            .modal-content h3 {
                margin-bottom: 1rem;
            }

            .modal-content .pixel-select,
            .modal-content .pixel-input {
                width: 100%;
                margin-bottom: 1rem;
            }

            .modal-actions {
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
            }

            .pixel-input {
                padding: 0.75rem 1rem;
                background: #0a0a0f;
                border: 2px solid #333;
                border-radius: 6px;
                color: #e0e0e0;
                font-family: 'VT323', monospace;
                font-size: 16px;
            }

            .empty-challenges {
                text-align: center;
                padding: 3rem;
                color: #666;
                font-family: 'VT323', monospace;
                font-size: 18px;
            }
        `;
        document.head.appendChild(styles);
    },

    showCreateModal() {
        document.getElementById('create-challenge-modal').classList.remove('hidden');
    },

    hideCreateModal() {
        document.getElementById('create-challenge-modal').classList.add('hidden');
    },

    createChallenge() {
        const typeId = document.getElementById('challenge-type').value;
        const friend = document.getElementById('challenge-friend').value.trim();
        const goal = parseInt(document.getElementById('challenge-goal').value);
        const duration = parseInt(document.getElementById('challenge-duration').value);

        if (!friend || !goal) {
            alert('Please fill in all fields!');
            return;
        }

        const type = this.challengeTypes.find(t => t.id === typeId);
        const challenge = {
            id: Date.now().toString(),
            type: typeId,
            typeName: type.name,
            icon: type.icon,
            unit: type.unit,
            creator: this.currentUser,
            opponent: friend,
            goal: goal,
            duration: duration,
            createdAt: Date.now(),
            endsAt: Date.now() + (duration * 24 * 60 * 60 * 1000),
            creatorProgress: 0,
            opponentProgress: 0,
            status: 'active'
        };

        this.challenges.push(challenge);
        this.saveChallenges();
        this.hideCreateModal();
        this.renderChallenges();
        
        // Clear inputs
        document.getElementById('challenge-friend').value = '';
        document.getElementById('challenge-goal').value = '';
        
        this.showNotification('🏆 Challenge created!');
    },

    updateProgress(challengeId, userType, amount) {
        const challenge = this.challenges.find(c => c.id === challengeId);
        if (!challenge || challenge.status !== 'active') return;

        if (userType === 'creator') {
            challenge.creatorProgress = Math.min(amount, challenge.goal);
        } else {
            challenge.opponentProgress = Math.min(amount, challenge.goal);
        }

        // Check for winner
        if (challenge.creatorProgress >= challenge.goal || challenge.opponentProgress >= challenge.goal) {
            challenge.status = 'completed';
            challenge.winner = challenge.creatorProgress >= challenge.goal ? challenge.creator : challenge.opponent;
        }

        this.saveChallenges();
        this.renderChallenges();
    },

    renderChallenges() {
        const container = document.getElementById('active-challenges');
        if (!container) return;

        const active = this.challenges.filter(c => c.status === 'active');
        const completed = this.challenges.filter(c => c.status === 'completed');

        if (active.length === 0 && completed.length === 0) {
            container.innerHTML = `
                <div class="empty-challenges">
                    🏆 No active challenges<br>
                    <small>Create a challenge with a friend to get started!</small>
                </div>
            `;
            return;
        }

        let html = '';
        
        if (active.length > 0) {
            html += `<h3 class="pixel-title" style="margin-bottom: 1rem;">ACTIVE CHALLENGES</h3>`;
            html += active.map(c => this.renderChallengeCard(c)).join('');
        }

        if (completed.length > 0) {
            html += `<h3 class="pixel-title" style="margin: 1.5rem 0 1rem;">COMPLETED</h3>`;
            html += completed.map(c => this.renderChallengeCard(c)).join('');
        }

        container.innerHTML = html;
    },

    renderChallengeCard(challenge) {
        const isCreator = challenge.creator === this.currentUser;
        const myProgress = isCreator ? challenge.creatorProgress : challenge.opponentProgress;
        const theirProgress = isCreator ? challenge.opponentProgress : challenge.creatorProgress;
        const myPercent = (myProgress / challenge.goal) * 100;
        const theirPercent = (theirProgress / challenge.goal) * 100;
        const opponent = isCreator ? challenge.opponent : challenge.creator;
        const daysLeft = Math.ceil((challenge.endsAt - Date.now()) / (24 * 60 * 60 * 1000));

        return `
            <div class="challenge-card ${challenge.winner === this.currentUser ? 'winner' : ''}">
                <div class="challenge-title">${challenge.icon} ${challenge.typeName}</div>
                <div class="challenge-details">
                    <span>🎯 Goal: ${challenge.goal} ${challenge.unit}</span>
                    <span>⏰ ${daysLeft > 0 ? daysLeft + ' days left' : 'Ended'}</span>
                </div>
                <div style="margin-top: 0.5rem; font-family: 'VT323', monospace; color: #888;">
                    vs ${opponent}
                </div>
                <div class="challenge-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${myPercent}%"></div>
                    </div>
                    <span style="font-family: 'VT323', monospace; color: #00d4ff; min-width: 60px;">
                        ${myProgress}/${challenge.goal}
                    </span>
                </div>
                ${challenge.status === 'active' ? `
                    <button onclick="FriendChallengeSystem.simulateProgress('${challenge.id}')" 
                            class="pixel-btn" style="margin-top: 0.5rem; font-size: 8px;">
                        ➕ ADD PROGRESS
                    </button>
                ` : `
                    <div style="margin-top: 0.5rem; font-family: 'Press Start 2P', monospace; font-size: 10px; color: #ffd700;">
                        👑 Winner: ${challenge.winner === this.currentUser ? 'YOU!' : challenge.winner}
                    </div>
                `}
            </div>
        `;
    },

    simulateProgress(challengeId) {
        const challenge = this.challenges.find(c => c.id === challengeId);
        if (!challenge) return;

        const isCreator = challenge.creator === this.currentUser;
        const currentProgress = isCreator ? challenge.creatorProgress : challenge.opponentProgress;
        const increment = Math.floor(Math.random() * 10) + 5;
        
        this.updateProgress(challengeId, isCreator ? 'creator' : 'opponent', currentProgress + increment);
    },

    saveChallenges() {
        localStorage.setItem('mc_challenges', JSON.stringify(this.challenges));
    },

    loadChallenges() {
        this.renderChallenges();
    },

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #00d4ff;
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
    setTimeout(() => FriendChallengeSystem.init(), 1000);
});
