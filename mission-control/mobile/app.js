/**
 * Mission Control Mobile PWA
 * Main application logic
 */

// ====================
// App State
// ====================
const state = {
  currentView: 'dashboard',
  isOnline: navigator.onLine,
  isInstalled: false,
  notificationsEnabled: false,
  deferredPrompt: null,
  tasks: [],
  agents: [],
  alerts: [],
  queuedActions: [],
  currentTask: null
};

// ====================
// DOM Elements
// ====================
const elements = {
  // Views
  views: document.querySelectorAll('.view'),
  tabItems: document.querySelectorAll('.tab-item'),
  
  // Header
  syncBtn: document.getElementById('syncBtn'),
  syncBadge: document.getElementById('syncBadge'),
  notificationsBtn: document.getElementById('notificationsBtn'),
  notificationBadge: document.getElementById('notificationBadge'),
  
  // Dashboard
  pendingTasksCount: document.getElementById('pendingTasksCount'),
  activeAgentsCount: document.getElementById('activeAgentsCount'),
  queuedActionsCount: document.getElementById('queuedActionsCount'),
  criticalAlertsCount: document.getElementById('criticalAlertsCount'),
  recentTasksList: document.getElementById('recentTasksList'),
  recentAlertsList: document.getElementById('recentAlertsList'),
  viewAllTasks: document.getElementById('viewAllTasks'),
  viewAllAlerts: document.getElementById('viewAllAlerts'),
  quickActions: document.querySelectorAll('.quick-action'),
  
  // Tasks
  tasksList: document.getElementById('tasksList'),
  
  // Agents
  agentsList: document.getElementById('agentsList'),
  
  // Alerts
  alertsList: document.getElementById('alertsList'),
  
  // Settings
  enableNotifications: document.getElementById('enableNotifications'),
  notificationStatus: document.getElementById('notificationStatus'),
  notificationDot: document.getElementById('notificationDot'),
  syncQueueStatus: document.getElementById('syncQueueStatus'),
  syncNowBtn: document.getElementById('syncNowBtn'),
  clearCacheBtn: document.getElementById('clearCacheBtn'),
  connectionStatus: document.getElementById('connectionStatus'),
  connectionDot: document.getElementById('connectionDot'),
  
  // Install Prompt
  installPrompt: document.getElementById('installPrompt'),
  dismissInstall: document.getElementById('dismissInstall'),
  acceptInstall: document.getElementById('acceptInstall'),
  
  // Offline Banner
  offlineBanner: document.getElementById('offlineBanner'),
  
  // Toast
  toastContainer: document.getElementById('toastContainer'),
  
  // Modal
  taskModal: document.getElementById('taskModal'),
  closeTaskModal: document.getElementById('closeTaskModal'),
  taskModalBody: document.getElementById('taskModalBody'),
  approveTaskBtn: document.getElementById('approveTaskBtn'),
  rejectTaskBtn: document.getElementById('rejectTaskBtn')
};

// ====================
// Initialization
// ====================
document.addEventListener('DOMContentLoaded', () => {
  init();
});

async function init() {
  
  // Register service worker
  await registerServiceWorker();
  
  // Setup event listeners
  setupEventListeners();
  
  // Check online status
  updateOnlineStatus();
  
  // Check notification permission
  checkNotificationPermission();
  
  // Check if installed
  checkInstallStatus();
  
  // Load initial data
  await loadData();
  
  // Update UI
  updateDashboard();
  
  // Handle deep links
  handleDeepLink();
  
}

// ====================
// Service Worker
// ====================
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[App] Service workers not supported');
    showToast('Service workers not supported', 'error');
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('sw.js');
    
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      handleSWMessage(event.data);
    });
    
    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showToast('Update available! Refresh to update.', 'info');
        }
      });
    });
    
  } catch (error) {
    console.error('[App] Service worker registration failed:', error);
    showToast('Offline mode unavailable', 'error');
  }
}

function handleSWMessage(data) {
  
  switch (data.type) {
    case 'ACTION_SYNCED':
      showToast('Action synced successfully', 'success');
      loadData();
      break;
    case 'SYNC_FAILED':
      showToast('Sync failed. Will retry.', 'error');
      break;
    case 'PUSH_RECEIVED':
      showToast(data.data.message, 'info');
      loadData();
      break;
  }
}

// ====================
// Event Listeners
// ====================
function setupEventListeners() {
  // Tab navigation
  elements.tabItems.forEach(tab => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  });
  
  // Quick actions
  elements.quickActions.forEach(btn => {
    btn.addEventListener('click', () => handleQuickAction(btn.dataset.action));
  });
  
  // View all buttons
  elements.viewAllTasks.addEventListener('click', () => switchView('tasks'));
  elements.viewAllAlerts.addEventListener('click', () => switchView('alerts'));
  
  // Online/offline events
  window.addEventListener('online', () => {
    state.isOnline = true;
    updateOnlineStatus();
    showToast('Back online', 'success');
    syncQueuedActions();
  });
  
  window.addEventListener('offline', () => {
    state.isOnline = false;
    updateOnlineStatus();
    showToast('You\'re offline. Actions will be queued.', 'info');
  });
  
  // Install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPrompt = e;
    showInstallPrompt();
  });
  
  elements.dismissInstall.addEventListener('click', hideInstallPrompt);
  elements.acceptInstall.addEventListener('click', installApp);
  
  // Settings
  elements.enableNotifications.addEventListener('click', requestNotifications);
  elements.syncNowBtn.addEventListener('click', syncQueuedActions);
  elements.clearCacheBtn.addEventListener('click', clearCache);
  
  // Modal
  elements.closeTaskModal.addEventListener('click', closeTaskModal);
  elements.taskModal.addEventListener('click', (e) => {
    if (e.target === elements.taskModal) closeTaskModal();
  });
  elements.approveTaskBtn.addEventListener('click', () => approveTask(state.currentTask));
  elements.rejectTaskBtn.addEventListener('click', () => rejectTask(state.currentTask));
  
  // Sync button
  elements.syncBtn.addEventListener('click', () => {
    loadData();
    showToast('Syncing...', 'info');
  });
  
  // Notifications button
  elements.notificationsBtn.addEventListener('click', () => {
    switchView('alerts');
  });
  
  // Popstate for deep links
  window.addEventListener('popstate', handleDeepLink);
}

// ====================
// View Management
// ====================
function switchView(viewName) {
  state.currentView = viewName;
  
  // Update views
  elements.views.forEach(view => {
    view.classList.toggle('active', view.id === `${viewName}View`);
  });
  
  // Update tabs
  elements.tabItems.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.view === viewName);
  });
  
  // Update URL
  history.pushState(null, null, `#${viewName}`);
  
  // Refresh data for the view
  if (viewName === 'tasks') renderTasks();
  if (viewName === 'agents') renderAgents();
  if (viewName === 'alerts') renderAlerts();
}

function handleDeepLink() {
  const hash = window.location.hash.slice(1);
  if (hash && ['dashboard', 'tasks', 'agents', 'alerts', 'settings'].includes(hash)) {
    switchView(hash);
  }
}

// ====================
// Data Loading
// ====================
async function loadData() {
  try {
    // Load tasks
    const tasksResponse = await fetch('/api/tasks?status=pending');
    if (tasksResponse.ok) {
      state.tasks = await tasksResponse.json();
    } else {
      // Fallback to cached data
      state.tasks = JSON.parse(localStorage.getItem('cached_tasks') || '[]');
    }
  } catch (error) {
    state.tasks = JSON.parse(localStorage.getItem('cached_tasks') || '[]');
  }
  
  try {
    // Load agents
    const agentsResponse = await fetch('/api/agents');
    if (agentsResponse.ok) {
      state.agents = await agentsResponse.json();
    } else {
      state.agents = JSON.parse(localStorage.getItem('cached_agents') || '[]');
    }
  } catch (error) {
    state.agents = JSON.parse(localStorage.getItem('cached_agents') || '[]');
  }
  
  try {
    // Load alerts
    const alertsResponse = await fetch('/api/alerts');
    if (alertsResponse.ok) {
      state.alerts = await alertsResponse.json();
    } else {
      state.alerts = JSON.parse(localStorage.getItem('cached_alerts') || '[]');
    }
  } catch (error) {
    state.alerts = JSON.parse(localStorage.getItem('cached_alerts') || '[]');
  }
  
  // Update sync queue count
  await updateSyncQueueStatus();
  
  // Cache data locally
  localStorage.setItem('cached_tasks', JSON.stringify(state.tasks));
  localStorage.setItem('cached_agents', JSON.stringify(state.agents));
  localStorage.setItem('cached_alerts', JSON.stringify(state.alerts));
}

// ====================
// Dashboard
// ====================
function updateDashboard() {
  // Update counts
  const pendingTasks = state.tasks.filter(t => t.status === 'pending');
  const activeAgents = state.agents.filter(a => a.status === 'online');
  const criticalAlerts = state.alerts.filter(a => a.level === 'critical');
  
  elements.pendingTasksCount.textContent = pendingTasks.length;
  elements.activeAgentsCount.textContent = activeAgents.length;
  elements.queuedActionsCount.textContent = state.queuedActions.length;
  elements.criticalAlertsCount.textContent = criticalAlerts.length;
  
  // Update notification badge
  const unreadAlerts = state.alerts.filter(a => !a.read).length;
  elements.notificationBadge.textContent = unreadAlerts;
  elements.notificationBadge.style.display = unreadAlerts > 0 ? 'flex' : 'none';
  
  // Update sync badge
  elements.syncBadge.style.display = state.queuedActions.length > 0 ? 'block' : 'none';
  
  // Render recent items
  renderRecentTasks(pendingTasks.slice(0, 3));
  renderRecentAlerts(state.alerts.slice(0, 3));
}

function renderRecentTasks(tasks) {
  if (tasks.length === 0) {
    elements.recentTasksList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <div class="empty-state-title">No Tasks</div>
        <div class="empty-state-text">All caught up! No pending tasks.</div>
      </div>
    `;
    return;
  }
  
  elements.recentTasksList.innerHTML = tasks.map(task => `
    <div class="list-item" data-task-id="${task.id}">
      <div class="list-item-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      </div>
      <div class="list-item-content">
        <div class="list-item-title">${escapeHtml(task.title)}</div>
        <div class="list-item-subtitle">${escapeHtml(task.description || 'No description')}</div>
      </div>
      <div class="list-item-meta">
        <div class="list-item-time">${formatTime(task.created_at)}</div>
        <span class="list-item-badge ${task.priority}">${task.priority}</span>
      </div>
    </div>
  `).join('');
  
  // Add click handlers
  elements.recentTasksList.querySelectorAll('.list-item').forEach(item => {
    item.addEventListener('click', () => openTaskModal(item.dataset.taskId));
  });
}

function renderRecentAlerts(alerts) {
  if (alerts.length === 0) {
    elements.recentAlertsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div class="empty-state-title">No Alerts</div>
        <div class="empty-state-text">No critical alerts at this time.</div>
      </div>
    `;
    return;
  }
  
  elements.recentAlertsList.innerHTML = alerts.map(alert => `
    <div class="alert-item ${alert.level}">
      <div class="alert-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${getAlertIcon(alert.level)}
        </svg>
      </div>
      <div class="alert-content">
        <div class="alert-title">${escapeHtml(alert.title)}</div>
        <div class="alert-message">${escapeHtml(alert.message)}</div>
        <div class="alert-time">${formatTime(alert.created_at)}</div>
      </div>
    </div>
  `).join('');
}

// ====================
// Tasks View
// ====================
function renderTasks() {
  const pendingTasks = state.tasks.filter(t => t.status === 'pending');
  
  if (pendingTasks.length === 0) {
    elements.tasksList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <div class="empty-state-title">No Pending Tasks</div>
        <div class="empty-state-text">All tasks have been completed!</div>
      </div>
    `;
    return;
  }
  
  elements.tasksList.innerHTML = pendingTasks.map(task => `
    <div class="task-item" data-task-id="${task.id}">
      <div class="task-header">
        <div class="task-priority ${task.priority}"></div>
        <div class="task-content">
          <div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-desc">${escapeHtml(task.description || 'No description')}</div>
        </div>
      </div>
      <div class="task-meta">
        <span>Created ${formatTime(task.created_at)}</span>
        <span>by ${escapeHtml(task.created_by || 'System')}</span>
      </div>
      <div class="task-actions">
        <button class="btn btn-secondary btn-sm" onclick="rejectTask('${task.id}')">Reject</button>
        <button class="btn btn-success btn-sm" onclick="approveTask('${task.id}')">Approve</button>
      </div>
    </div>
  `).join('');
}

function openTaskModal(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  state.currentTask = taskId;
  
  elements.taskModalBody.innerHTML = `
    <div class="task-item" style="margin-bottom: 16px;">
      <div class="task-header">
        <div class="task-priority ${task.priority}"></div>
        <div class="task-content">
          <div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-desc">${escapeHtml(task.description || 'No description')}</div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">Details</span>
      </div>
      <div style="font-size: 0.875rem; color: var(--text-secondary);">
        <p><strong>Created:</strong> ${formatDateTime(task.created_at)}</p>
        <p><strong>Created by:</strong> ${escapeHtml(task.created_by || 'System')}</p>
        <p><strong>Priority:</strong> ${task.priority}</p>
        <p><strong>Status:</strong> ${task.status}</p>
      </div>
    </div>
  `;
  
  elements.taskModal.classList.add('show');
}

function closeTaskModal() {
  elements.taskModal.classList.remove('show');
  state.currentTask = null;
}

async function approveTask(taskId) {
  if (!taskId) taskId = state.currentTask;
  if (!taskId) return;
  
  const action = {
    type: 'APPROVE_TASK',
    endpoint: `/api/tasks/${taskId}/approve`,
    method: 'POST',
    payload: { approved_at: new Date().toISOString() }
  };
  
  await executeAction(action);
  closeTaskModal();
}

async function rejectTask(taskId) {
  if (!taskId) taskId = state.currentTask;
  if (!taskId) return;
  
  const action = {
    type: 'REJECT_TASK',
    endpoint: `/api/tasks/${taskId}/reject`,
    method: 'POST',
    payload: { rejected_at: new Date().toISOString() }
  };
  
  await executeAction(action);
  closeTaskModal();
}

// ====================
// Agents View
// ====================
function renderAgents() {
  if (state.agents.length === 0) {
    elements.agentsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="empty-state-title">No Agents</div>
        <div class="empty-state-text">No agents are currently registered.</div>
      </div>
    `;
    return;
  }
  
  elements.agentsList.innerHTML = state.agents.map(agent => `
    <div class="agent-card">
      <div class="agent-avatar">${getInitials(agent.name)}</div>
      <div class="agent-info">
        <div class="agent-name">
          ${escapeHtml(agent.name)}
          <span class="status-dot ${agent.status}"></span>
        </div>
        <div class="agent-role">${escapeHtml(agent.role || 'Agent')}</div>
        <div class="agent-status">
          ${agent.status === 'online' ? '🟢 Online' : agent.status === 'busy' ? '🟡 Busy' : '⚫ Offline'}
          ${agent.last_seen ? `• Last seen ${formatTime(agent.last_seen)}` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

// ====================
// Alerts View
// ====================
function renderAlerts() {
  if (state.alerts.length === 0) {
    elements.alertsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div class="empty-state-title">No Alerts</div>
        <div class="empty-state-text">No alerts to display.</div>
      </div>
    `;
    return;
  }
  
  elements.alertsList.innerHTML = state.alerts.map(alert => `
    <div class="alert-item ${alert.level}" data-alert-id="${alert.id}">
      <div class="alert-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${getAlertIcon(alert.level)}
        </svg>
      </div>
      <div class="alert-content">
        <div class="alert-title">${escapeHtml(alert.title)}</div>
        <div class="alert-message">${escapeHtml(alert.message)}</div>
        <div class="alert-time">${formatDateTime(alert.created_at)}</div>
      </div>
    </div>
  `).join('');
  
  // Mark alerts as read
  state.alerts.forEach(alert => alert.read = true);
  updateDashboard();
}

// ====================
// Actions
// ====================
async function executeAction(action) {
  if (state.isOnline) {
    try {
      const response = await fetch(action.endpoint, {
        method: action.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload)
      });
      
      if (response.ok) {
        showToast('Action completed', 'success');
        await loadData();
        updateDashboard();
        return;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.error('[App] Action failed, queuing:', error);
    }
  }
  
  // Queue for later
  await queueAction(action);
  showToast('Action queued for sync', 'info');
}

async function queueAction(action) {
  state.queuedActions.push({
    ...action,
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    timestamp: Date.now()
  });
  
  // Send to service worker
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'QUEUE_ACTION',
      payload: action
    });
  }
  
  updateSyncQueueStatus();
}

async function syncQueuedActions() {
  if (!state.isOnline) {
    showToast('Cannot sync while offline', 'error');
    return;
  }
  
  showToast('Syncing...', 'info');
  
  // Trigger background sync
  if ('sync' in navigator.serviceWorker) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-actions');
  }
  
  // Also try to sync directly
  const actions = [...state.queuedActions];
  for (const action of actions) {
    try {
      const response = await fetch(action.endpoint, {
        method: action.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action.payload)
      });
      
      if (response.ok) {
        state.queuedActions = state.queuedActions.filter(a => a.id !== action.id);
      }
    } catch (error) {
      console.error('[App] Sync failed for action:', action.id);
    }
  }
  
  updateSyncQueueStatus();
  await loadData();
  updateDashboard();
  
  showToast('Sync complete', 'success');
}

async function updateSyncQueueStatus() {
  // Get queue from service worker
  if (navigator.serviceWorker.controller) {
    const channel = new MessageChannel();
    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_QUEUE_STATUS' },
      [channel.port2]
    );
    
    channel.port1.onmessage = (event) => {
      const swQueue = event.data.queue || [];
      state.queuedActions = swQueue;
      elements.syncQueueStatus.textContent = `${swQueue.length} actions queued`;
      elements.syncBadge.style.display = swQueue.length > 0 ? 'block' : 'none';
      elements.queuedActionsCount.textContent = swQueue.length;
    };
  }
}

// ====================
// Quick Actions
// ====================
function handleQuickAction(action) {
  switch (action) {
    case 'approve':
      switchView('tasks');
      break;
    case 'alert':
      switchView('alerts');
      break;
    case 'agents':
      switchView('agents');
      break;
  }
}

// ====================
// Notifications
// ====================
async function checkNotificationPermission() {
  if (!('Notification' in window)) {
    elements.notificationStatus.textContent = 'Not supported';
    elements.notificationDot.className = 'status-dot offline';
    return;
  }
  
  if (Notification.permission === 'granted') {
    state.notificationsEnabled = true;
    elements.notificationStatus.textContent = 'Enabled';
    elements.notificationDot.className = 'status-dot online';
  } else if (Notification.permission === 'denied') {
    elements.notificationStatus.textContent = 'Blocked';
    elements.notificationDot.className = 'status-dot offline';
  }
}

async function requestNotifications() {
  if (!('Notification' in window)) {
    showToast('Notifications not supported', 'error');
    return;
  }
  
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    state.notificationsEnabled = true;
    elements.notificationStatus.textContent = 'Enabled';
    elements.notificationDot.className = 'status-dot online';
    
    // Subscribe to push notifications
    await subscribeToPush();
    
    showToast('Notifications enabled', 'success');
  } else {
    elements.notificationStatus.textContent = 'Blocked';
    elements.notificationDot.className = 'status-dot offline';
    showToast('Notifications blocked', 'error');
  }
}

async function subscribeToPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
    });
    
    // Send subscription to server
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    
  } catch (error) {
    console.error('[App] Push subscription failed:', error);
  }
}

// ====================
// Install Prompt
// ====================
function showInstallPrompt() {
  if (!state.isInstalled) {
    elements.installPrompt.classList.add('show');
  }
}

function hideInstallPrompt() {
  elements.installPrompt.classList.remove('show');
  localStorage.setItem('install_prompt_dismissed', Date.now().toString());
}

async function installApp() {
  if (!state.deferredPrompt) return;
  
  state.deferredPrompt.prompt();
  const { outcome } = await state.deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    state.isInstalled = true;
  }
  
  state.deferredPrompt = null;
  hideInstallPrompt();
}

function checkInstallStatus() {
  // Check if running as installed PWA
  if (window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true) {
    state.isInstalled = true;
  }
  
  // Check if prompt was recently dismissed
  const dismissed = localStorage.getItem('install_prompt_dismissed');
  if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
    // Don't show for 7 days after dismissal
  }
}

// ====================
// Online Status
// ====================
function updateOnlineStatus() {
  if (state.isOnline) {
    elements.offlineBanner.classList.remove('show');
    elements.connectionStatus.textContent = 'Online';
    elements.connectionDot.className = 'status-dot online';
  } else {
    elements.offlineBanner.classList.add('show');
    elements.connectionStatus.textContent = 'Offline';
    elements.connectionDot.className = 'status-dot offline';
  }
}

// ====================
// Cache Management
// ====================
async function clearCache() {
  if (confirm('Clear all cached data?')) {
    localStorage.removeItem('cached_tasks');
    localStorage.removeItem('cached_agents');
    localStorage.removeItem('cached_alerts');
    
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_QUEUE' });
    }
    
    showToast('Cache cleared', 'success');
    await loadData();
    updateDashboard();
  }
}

// ====================
// Toast Notifications
// ====================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };
  
  toast.innerHTML = `
    <div class="toast-icon ${type}">${icons[type]}</div>
    <div class="toast-content">
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ====================
// Utilities
// ====================
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return date.toLocaleDateString();
}

function formatDateTime(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  return date.toLocaleString();
}

function getAlertIcon(level) {
  const icons = {
    critical: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
  };
  return icons[level] || icons.info;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// ====================
// Periodic Refresh
// ====================
setInterval(() => {
  if (state.isOnline && document.visibilityState === 'visible') {
    loadData().then(() => updateDashboard());
  }
}, 30000); // Refresh every 30 seconds

// Handle visibility change
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.isOnline) {
    loadData().then(() => updateDashboard());
  }
});