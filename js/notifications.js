// ============================================
// TRUELY - Notifications Page Logic
// ============================================

async function initNotifications() {
  // Insert navigation
  const navPlaceholder = document.getElementById('nav-placeholder');
  if (navPlaceholder) {
    navPlaceholder.innerHTML = renderNav('notifications');
  }
  
  // Initialize theme and auth
  initTheme();
  await initAuth();
  
  // Load notifications
  await loadNotifications();
  
  // Setup mark all read button
  const markAllBtn = document.getElementById('mark-all-read');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', markAllRead);
  }
  
  // Subscribe to state changes
  window.TruelyState.subscribe(async (state) => {
    if (state.currentUser) {
      await loadNotifications();
    } else {
      document.getElementById('notifications-list').innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <h3>Sign in to see notifications</h3>
        </div>
      `;
    }
  });
}

async function loadNotifications() {
  const user = window.TruelyState.currentUser;
  const container = document.getElementById('notifications-list');
  
  if (!user) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <h3>Sign in to see notifications</h3>
      </div>
    `;
    return;
  }
  
  // Show skeleton
  container.innerHTML = `
    ${Array(3).fill(0).map(() => `
      <div class="skeleton" style="height: 70px; margin: var(--spacing-sm); border-radius: var(--radius-md);"></div>
    `).join('')}
  `;
  
  const { data: notifications } = await sb
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (!notifications || notifications.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <h3>No notifications yet</h3>
        <p>When someone interacts with you, it will appear here</p>
      </div>
    `;
    return;
  }
  
  // Get from user profiles
  const fromUserIds = [...new Set(notifications.map(n => n.from_user_id).filter(Boolean))];
  const { data: profiles } = await sb
    .from('profiles')
    .select('*')
    .in('id', fromUserIds);
  
  const profileMap = {};
  (profiles || []).forEach(p => { profileMap[p.id] = p; });
  
  container.innerHTML = notifications.map(notification => {
    const fromUser = profileMap[notification.from_user_id];
    return renderNotification(notification, fromUser, notification.post_id);
  }).join('');
  
  // Mark all as read
  await sb.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  
  // Update notification dot
  const dot = document.getElementById('notif-dot');
  if (dot) dot.style.display = 'none';
  
  // Attach click handlers
  attachNotificationClickHandlers();
}

function attachNotificationClickHandlers() {
  document.querySelectorAll('.notification-item').forEach(item => {
    item.addEventListener('click', async () => {
      const notificationId = item.dataset.notificationId;
      const postId = item.dataset.postId;
      const userId = item.dataset.userId;
      
      // Mark as read
      await sb.from('notifications').update({ read: true }).eq('id', notificationId);
      item.classList.remove('unread');
      
      // Navigate
      if (postId) {
        window.location.href = `/?post=${postId}`;
      } else if (userId) {
        window.location.href = `/profile.html?id=${userId}`;
      }
    });
  });
}

async function markAllRead() {
  const user = window.TruelyState.currentUser;
  if (!user) return;
  
  await sb.from('notifications').update({ read: true }).eq('user_id', user.id);
  
  document.querySelectorAll('.notification-item.unread').forEach(item => {
    item.classList.remove('unread');
  });
  
  showToast('All notifications marked as read', 'success');
}

// Start the app
initNotifications();
