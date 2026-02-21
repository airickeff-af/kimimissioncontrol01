/**
 * P1 VIRAL FEATURES — Confession System
 * MC Project — Nexus (Air1ck3ff)
 * Date: Feb 21, 2026
 * 
 * Features:
 * - Anonymous confession submission
 * - Public confession feed
 * - Like/upvote system
 * - Daily winner picker
 * - Social sharing (Twitter/X)
 */

// ============================================
// CONFESSION SYSTEM STATE
// ============================================
const ConfessionSystem = {
    confessions: JSON.parse(localStorage.getItem('mc_confessions') || '[]'),
    likes: JSON.parse(localStorage.getItem('mc_confession_likes') || '{}'),
    currentUser: 'anonymous_' + Math.random().toString(36).substr(2, 6),
    categories: [
        { id: 'health', name: '💪 Health', color: '#4ade80' },
        { id: 'wealth', name: '💰 Wealth', color: '#fbbf24' },
        { id: 'mindset', name: '🧠 Mindset', color: '#a78bfa' },
        { id: 'relationship', name: '❤️ Relationships', color: '#f472b6' },
        { id: 'work', name: '💼 Work', color: '#60a5fa' }
    ],

    init() {
        this.renderConfessionSection();
        this.loadConfessions();
        this.checkDailyWinner();
    },

    // ============================================
    // RENDER UI
    // ============================================
    renderConfessionSection() {
        const container = document.querySelector('.main-container') || document.body;
        
        const confessionHTML = `
        <div id="confession-section" class="confession-section pixel-card">
            <div class="confession-header">
                <h2 class="pixel-title">📢 DAILY CONFESSIONS</h2>
                <span class="confession-count">${this.confessions.length} confessions today</span>
            </div>
            
            <!-- Submission Form -->
            <div class="confession-form">
                <textarea 
                    id="confession-input" 
                    class="pixel-textarea"
                    placeholder="Share your anonymous confession... What's on your mind?"
                    maxlength="280"
                ></textarea>
                <div class="confession-meta">
                    <select id="confession-category" class="pixel-select">
                        ${this.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                    <button onclick="ConfessionSystem.submitConfession()" class="pixel-btn primary">
                        🚀 POST ANONYMOUSLY
                    </button>
                </div>
                <div class="char-count"><span id="char-count">0</span>/280</div>
            </div>

            <!-- Winner Banner -->
            <div id="winner-banner" class="winner-banner hidden">
                <div class="winner-crown">👑</div>
                <div class="winner-text">
                    <strong>Yesterday's Winner!</strong>
                    <span id="winner-confession"></span>
                </div>
            </div>

            <!-- Confession Feed -->
            <div id="confession-feed" class="confession-feed">
                <div class="loading-feed">Loading confessions...</div>
            </div>
        </div>
        `;

        // Insert after main container or append to body
        const existing = document.getElementById('confession-section');
        if (!existing) {
            const div = document.createElement('div');
            div.innerHTML = confessionHTML;
            container.appendChild(div.firstElementChild);
        }

        // Add character counter
        const textarea = document.getElementById('confession-input');
        if (textarea) {
            textarea.addEventListener('input', (e) => {
                document.getElementById('char-count').textContent = e.target.value.length;
            });
        }

        this.addStyles();
    },

    addStyles() {
        if (document.getElementById('confession-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'confession-styles';
        styles.textContent = `
            .confession-section {
                max-width: 800px;
                margin: 2rem auto;
                padding: 1.5rem;
                background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%);
                border: 3px solid #333;
                border-radius: 12px;
                box-shadow: 4px 4px 0 #000;
            }

            .confession-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid #333;
            }

            .pixel-title {
                font-family: 'Press Start 2P', monospace;
                font-size: 14px;
                color: #00d4ff;
                text-shadow: 2px 2px 0 #000;
            }

            .confession-count {
                font-family: 'VT323', monospace;
                font-size: 18px;
                color: #888;
            }

            .confession-form {
                margin-bottom: 1.5rem;
            }

            .pixel-textarea {
                width: 100%;
                min-height: 100px;
                padding: 1rem;
                background: #0a0a0f;
                border: 2px solid #333;
                border-radius: 8px;
                color: #e0e0e0;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                resize: vertical;
                transition: border-color 0.2s;
            }

            .pixel-textarea:focus {
                outline: none;
                border-color: #00d4ff;
            }

            .confession-meta {
                display: flex;
                gap: 1rem;
                margin-top: 1rem;
                align-items: center;
            }

            .pixel-select {
                padding: 0.75rem 1rem;
                background: #0a0a0f;
                border: 2px solid #333;
                border-radius: 6px;
                color: #e0e0e0;
                font-family: 'VT323', monospace;
                font-size: 16px;
                cursor: pointer;
            }

            .pixel-btn {
                padding: 0.75rem 1.5rem;
                border: 2px solid;
                border-radius: 6px;
                font-family: 'Press Start 2P', monospace;
                font-size: 10px;
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: 3px 3px 0 #000;
            }

            .pixel-btn.primary {
                background: #00d4ff;
                border-color: #00d4ff;
                color: #0a0a0f;
            }

            .pixel-btn.primary:hover {
                transform: translate(-2px, -2px);
                box-shadow: 5px 5px 0 #000;
            }

            .pixel-btn:active {
                transform: translate(2px, 2px);
                box-shadow: 1px 1px 0 #000;
            }

            .char-count {
                text-align: right;
                font-family: 'VT323', monospace;
                font-size: 14px;
                color: #666;
                margin-top: 0.5rem;
            }

            .winner-banner {
                background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
                border: 3px solid #ffd700;
                border-radius: 12px;
                padding: 1rem;
                margin-bottom: 1.5rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
                animation: winner-pulse 2s ease-in-out infinite;
            }

            @keyframes winner-pulse {
                0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
                50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.6); }
            }

            .winner-banner.hidden { display: none; }

            .winner-crown {
                font-size: 2rem;
                animation: crown-bounce 1s ease-in-out infinite;
            }

            @keyframes crown-bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }

            .winner-text {
                display: flex;
                flex-direction: column;
                color: #1a1a2e;
            }

            .winner-text strong {
                font-family: 'Press Start 2P', monospace;
                font-size: 10px;
            }

            .confession-feed {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .confession-card {
                background: #0f0f1a;
                border: 2px solid #333;
                border-radius: 8px;
                padding: 1rem;
                transition: all 0.2s;
            }

            .confession-card:hover {
                border-color: #555;
                transform: translateX(4px);
            }

            .confession-card.winner {
                border-color: #ffd700;
                background: linear-gradient(135deg, #1a1a2e 0%, #2a2510 100%);
            }

            .confession-category-tag {
                display: inline-block;
                padding: 0.25rem 0.75rem;
                border-radius: 4px;
                font-family: 'VT323', monospace;
                font-size: 14px;
                margin-bottom: 0.5rem;
            }

            .confession-text {
                font-size: 15px;
                line-height: 1.6;
                color: #e0e0e0;
                margin-bottom: 1rem;
            }

            .confession-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-family: 'VT323', monospace;
                font-size: 14px;
                color: #666;
            }

            .confession-actions {
                display: flex;
                gap: 1rem;
            }

            .action-btn {
                background: transparent;
                border: 1px solid #333;
                border-radius: 4px;
                padding: 0.5rem 1rem;
                color: #888;
                font-family: 'VT323', monospace;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .action-btn:hover {
                border-color: #00d4ff;
                color: #00d4ff;
            }

            .action-btn.liked {
                border-color: #ff6b6b;
                color: #ff6b6b;
                background: rgba(255, 107, 107, 0.1);
            }

            .empty-feed {
                text-align: center;
                padding: 3rem;
                color: #666;
                font-family: 'VT323', monospace;
                font-size: 18px;
            }

            .share-popup {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #1a1a2e;
                border: 3px solid #00d4ff;
                border-radius: 12px;
                padding: 2rem;
                z-index: 1000;
                box-shadow: 0 0 50px rgba(0, 212, 255, 0.3);
            }

            .share-popup h3 {
                font-family: 'Press Start 2P', monospace;
                font-size: 12px;
                color: #00d4ff;
                margin-bottom: 1rem;
            }

            .share-options {
                display: flex;
                gap: 1rem;
                margin-top: 1rem;
            }

            .share-btn {
                padding: 1rem 2rem;
                border: 2px solid;
                border-radius: 8px;
                font-family: 'Press Start 2P', monospace;
                font-size: 10px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .share-btn.twitter {
                background: #1da1f2;
                border-color: #1da1f2;
                color: white;
            }

            .share-btn.copy {
                background: #333;
                border-color: #555;
                color: #e0e0e0;
            }
        `;
        document.head.appendChild(styles);
    },

    // ============================================
    // SUBMIT CONFESSION
    // ============================================
    submitConfession() {
        const input = document.getElementById('confession-input');
        const categorySelect = document.getElementById('confession-category');
        const text = input.value.trim();

        if (!text || text.length < 10) {
            alert('Confession must be at least 10 characters!');
            return;
        }

        const confession = {
            id: Date.now().toString(),
            text: text,
            category: categorySelect.value,
            timestamp: Date.now(),
            likes: 0,
            author: this.currentUser
        };

        this.confessions.unshift(confession);
        this.saveConfessions();
        
        input.value = '';
        document.getElementById('char-count').textContent = '0';
        
        this.renderFeed();
        this.showNotification('✅ Confession posted anonymously!');
    },

    // ============================================
    // LIKE SYSTEM
    // ============================================
    toggleLike(confessionId) {
        const confession = this.confessions.find(c => c.id === confessionId);
        if (!confession) return;

        const likeKey = `${this.currentUser}_${confessionId}`;
        const hasLiked = this.likes[likeKey];

        if (hasLiked) {
            confession.likes--;
            delete this.likes[likeKey];
        } else {
            confession.likes++;
            this.likes[likeKey] = true;
        }

        localStorage.setItem('mc_confession_likes', JSON.stringify(this.likes));
        this.saveConfessions();
        this.renderFeed();
    },

    // ============================================
    // SOCIAL SHARING
    // ============================================
    shareConfession(confessionId, platform) {
        const confession = this.confessions.find(c => c.id === confessionId);
        if (!confession) return;

        const category = this.categories.find(c => c.id === confession.category);
        const shareText = `"${confession.text.substring(0, 100)}${confession.text.length > 100 ? '...' : ''}" — Anonymous ${category?.name || ''} confession via MC Project 🎮`;
        const shareUrl = 'https://airickeff-af.github.io/mc-project/';

        if (platform === 'twitter') {
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
            window.open(twitterUrl, '_blank', 'width=600,height=400');
        } else if (platform === 'copy') {
            navigator.clipboard.writeText(shareText + ' ' + shareUrl);
            this.showNotification('📋 Copied to clipboard!');
        }
    },

    // ============================================
    // DAILY WINNER
    // ============================================
    checkDailyWinner() {
        const lastWinnerDate = localStorage.getItem('mc_last_winner_date');
        const today = new Date().toDateString();

        if (lastWinnerDate !== today) {
            this.pickDailyWinner();
            localStorage.setItem('mc_last_winner_date', today);
        } else {
            this.showYesterdayWinner();
        }
    },

    pickDailyWinner() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        const yesterdayConfessions = this.confessions.filter(c => {
            const confessionDate = new Date(c.timestamp).toDateString();
            return confessionDate === yesterdayStr && c.likes > 0;
        });

        if (yesterdayConfessions.length > 0) {
            // Weight by likes + random factor
            const weighted = yesterdayConfessions.map(c => ({
                ...c,
                weight: c.likes + Math.random() * 5
            }));
            weighted.sort((a, b) => b.weight - a.weight);
            
            const winner = weighted[0];
            localStorage.setItem('mc_yesterday_winner', JSON.stringify(winner));
        }
    },

    showYesterdayWinner() {
        const winner = JSON.parse(localStorage.getItem('mc_yesterday_winner') || 'null');
        if (!winner) return;

        const banner = document.getElementById('winner-banner');
        const text = document.getElementById('winner-confession');
        
        if (banner && text) {
            text.textContent = winner.text.substring(0, 100) + (winner.text.length > 100 ? '...' : '');
            banner.classList.remove('hidden');
        }
    },

    // ============================================
    // RENDER FEED
    // ============================================
    renderFeed() {
        const feed = document.getElementById('confession-feed');
        if (!feed) return;

        if (this.confessions.length === 0) {
            feed.innerHTML = `
                <div class="empty-feed">
                    📝 No confessions yet. Be the first to share!<br>
                    <small>Your anonymous confession could help someone else.</small>
                </div>
            `;
            return;
        }

        const winner = JSON.parse(localStorage.getItem('mc_yesterday_winner') || 'null');

        feed.innerHTML = this.confessions.map(confession => {
            const category = this.categories.find(c => c.id === confession.category);
            const likeKey = `${this.currentUser}_${confession.id}`;
            const hasLiked = this.likes[likeKey];
            const isWinner = winner && winner.id === confession.id;
            const timeAgo = this.getTimeAgo(confession.timestamp);

            return `
                <div class="confession-card ${isWinner ? 'winner' : ''}">
                    <span class="confession-category-tag" style="background: ${category?.color || '#666'}20; color: ${category?.color || '#666'}">
                        ${category?.name || '💬 General'}
                    </span>
                    <div class="confession-text">${this.escapeHtml(confession.text)}</div>
                    <div class="confession-footer">
                        <span>${timeAgo} • ${confession.likes} likes</span>
                        <div class="confession-actions">
                            <button class="action-btn ${hasLiked ? 'liked' : ''}" 
                                    onclick="ConfessionSystem.toggleLike('${confession.id}')">
                                ${hasLiked ? '❤️' : '🤍'} ${confession.likes}
                            </button>
                            <button class="action-btn" onclick="ConfessionSystem.shareConfession('${confession.id}', 'twitter')">
                                🐦 Share
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // ============================================
    // UTILITIES
    // ============================================
    saveConfessions() {
        localStorage.setItem('mc_confessions', JSON.stringify(this.confessions));
        const count = document.querySelector('.confession-count');
        if (count) count.textContent = `${this.confessions.length} confessions today`;
    },

    loadConfessions() {
        this.renderFeed();
    },

    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
        
        setTimeout(() => {
            notification.style.animation = 'slide-out 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ConfessionSystem.init());
} else {
    ConfessionSystem.init();
}
