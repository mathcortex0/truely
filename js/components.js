// ============================================
// TRUELY - UI Components
// ============================================

/**
 * Render navigation bar
 */
function renderNav(activePage = '') {
  return `
    <nav class="nav">
      <div class="nav-inner">
        <a href="/" class="logo">Truely</a>
        <div class="nav-links">
          <a href="/" class="nav-link ${activePage === 'feed' ? 'active' : ''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Home</span>
          </a>
          <a href="/search.html" class="nav-link ${activePage === 'search' ? 'active' : ''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span>Search</span>
          </a>
          <a href="/messages.html" class="nav-link ${activePage === 'messages' ? 'active' : ''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Messages</span>
          </a>
          <a href="/notifications.html" class="nav-link ${activePage === 'notifications' ? 'active' : ''}" style="position:relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span>Alerts</span>
            <span id="notif-dot" style="display:none; position:absolute; top: 4px; right: 4px; width: 8px; height: 8px; background: var(--accent-red); border-radius: 50%;"></span>
          </a>
        </div>
        <div class="nav-actions">
          <button class="theme-toggle" id="theme-toggle"></button>
          <button class="btn btn-secondary btn-sm" id="nav-login">Sign In</button>
          <button class="btn btn-primary btn-sm" id="nav-signup">Join</button>
          <div class="avatar-wrap" id="avatar-wrap" style="display:none">
            <div class="avatar avatar-sm" id="nav-avatar"></div>
            <div class="avatar-dropdown" id="avatar-dropdown">
              <div class="dropdown-header">
                <div class="avatar avatar-md" id="dd-avatar"></div>
                <div class="dropdown-info">
                  <div class="dropdown-name" id="dd-name"></div>
                  <div class="dropdown-email" id="dd-email"></div>
                  <span class="dropdown-badge" id="dd-badge"></span>
                </div>
              </div>
              <div class="dropdown-item" id="dd-profile">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                View Profile
              </div>
              <div class="dropdown-item" id="dd-upload-photo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Change Photo
              </div>
              <div class="dropdown-item" id="dd-verify">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                Get Verified
              </div>
              <div class="dropdown-item danger" id="dd-logout">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `;
}

/**
 * Render post card
 */
function renderPost(post, profile, isLiked, likesCount, commentsCount) {
  const name = profile?.full_name || 'User';
  const avatar = profile?.avatar_url;
  const isAdmin = profile?.is_admin || false;
  const isVerified = profile?.is_verified || false;
  const timeAgo = formatTimeAgo(post.created_at);
  const fullTime = formatFullDateTime(post.created_at);
  const ringClass = isAdmin ? 'avatar-ring-admin' : isVerified ? 'avatar-ring-verified' : '';
  
  let badgeHtml = '';
  if (isAdmin) badgeHtml = `<span class="badge">${adminBadge()}</span>`;
  else if (isVerified) badgeHtml = `<span class="badge">${verifiedBadge()}</span>`;
  
  return `
    <div class="post-card" data-post-id="${post.id}">
      <div class="post-header">
        <div class="avatar avatar-md ${ringClass}" data-user-id="${post.author_id}">
          ${avatar ? `<img src="${avatar}" alt="${name}">` : name.charAt(0).toUpperCase()}
        </div>
        <div class="post-body">
          <div class="post-user">
            <span class="post-name" data-user-id="${post.author_id}">${escapeHtml(name)}</span>
            ${badgeHtml}
            <span class="post-time" title="${fullTime}">· ${timeAgo}</span>
          </div>
          <div class="post-content">${escapeHtml(post.content)}</div>
          <div class="post-actions">
            <button class="action-btn ${isLiked ? 'liked' : ''}" data-action="like">
              <svg viewBox="0 0 24 24" fill="${isLiked ? '#EF4444' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span class="count">${likesCount}</span>
            </button>
            <button class="action-btn" data-action="comment">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span class="count">${commentsCount}</span>
            </button>
            <button class="action-btn" data-action="share">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </button>
          </div>
          <div class="comments-section" data-post-id="${post.id}">
            <div class="comment-form">
              <div class="avatar avatar-xs"></div>
              <input type="text" class="comment-input" placeholder="Write a comment..." maxlength="500">
              <button class="btn btn-sm btn-primary">Post</button>
            </div>
            <div class="comments-list"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render user item for search/followers
 */
function renderUserItem(user, showBio = true) {
  const isAdmin = user.is_admin;
  const isVerified = user.is_verified;
  const ringClass = isAdmin ? 'avatar-ring-admin' : isVerified ? 'avatar-ring-verified' : '';
  let badgeHtml = '';
  if (isAdmin) badgeHtml = `<span class="badge">${adminBadge()}</span>`;
  else if (isVerified) badgeHtml = `<span class="badge">${verifiedBadge()}</span>`;
  
  return `
    <div class="user-item" data-user-id="${user.id}">
      <div class="avatar avatar-md ${ringClass}">
        ${user.avatar_url ? `<img src="${user.avatar_url}">` : (user.full_name?.charAt(0).toUpperCase() || 'U')}
      </div>
      <div class="user-info">
        <div class="user-name">${escapeHtml(user.full_name || 'User')}${badgeHtml}</div>
        ${showBio && user.bio ? `<div class="user-bio">${escapeHtml(user.bio)}</div>` : ''}
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  `;
}

/**
 * Render comment
 */
function renderComment(comment, profile, canDelete = false) {
  const name = profile?.full_name || 'User';
  const avatar = profile?.avatar_url;
  const isAdmin = profile?.is_admin;
  const isVerified = profile?.is_verified;
  const ringClass = isAdmin ? 'avatar-ring-admin' : isVerified ? 'avatar-ring-verified' : '';
  let badgeHtml = '';
  if (isAdmin) badgeHtml = `<span class="badge">${adminBadge(12)}</span>`;
  else if (isVerified) badgeHtml = `<span class="badge">${verifiedBadge(12)}</span>`;
  
  return `
    <div class="comment-item" data-comment-id="${comment.id}">
      <div class="avatar avatar-xs ${ringClass}">
        ${avatar ? `<img src="${avatar}">` : name.charAt(0).toUpperCase()}
      </div>
      <div class="comment-bubble">
        <div class="comment-author">
          ${escapeHtml(name)}${badgeHtml}
          ${canDelete ? `<button class="comment-delete" data-action="delete-comment">✕</button>` : ''}
        </div>
        <div class="comment-text">${escapeHtml(comment.content)}</div>
      </div>
    </div>
  `;
}

/**
 * Render notification
 */
function renderNotification(notification, fromUser, postId = null) {
  const name = fromUser?.full_name || 'Someone';
  const avatar = fromUser?.avatar_url;
  const isAdmin = fromUser?.is_admin;
  const isVerified = fromUser?.is_verified;
  const ringClass = isAdmin ? 'avatar-ring-admin' : isVerified ? 'avatar-ring-verified' : '';
  let badgeHtml = '';
  if (isAdmin) badgeHtml = `<span class="badge">${adminBadge(12)}</span>`;
  else if (isVerified) badgeHtml = `<span class="badge">${verifiedBadge(12)}</span>`;
  
  let icon = '';
  let iconClass = '';
  let actionText = '';
  
  switch (notification.type) {
    case 'like':
      icon = '<svg viewBox="0 0 24 24" fill="#EF4444" stroke="none" width="20"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
      iconClass = 'like';
      actionText = 'liked your post';
      break;
    case 'comment':
      icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
      iconClass = 'comment';
      actionText = 'commented on your post';
      break;
    case 'follow':
      icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
      iconClass = 'follow';
      actionText = 'started following you';
      break;
  }
  
  const timeAgo = formatTimeAgo(notification.created_at);
  const fullTime = formatFullDateTime(notification.created_at);
  
  return `
    <div class="notification-item ${!notification.read ? 'unread' : ''}" data-notification-id="${notification.id}" data-post-id="${postId}" data-user-id="${notification.from_user_id}">
      <div class="notification-icon ${iconClass}">${icon}</div>
      <div class="avatar avatar-sm ${ringClass}">
        ${avatar ? `<img src="${avatar}">` : name.charAt(0).toUpperCase()}
      </div>
      <div class="notification-content">
        <div class="notification-text">
          <strong>${escapeHtml(name)}</strong>${badgeHtml} ${actionText}
        </div>
        <div class="notification-time" title="${fullTime}">${timeAgo}</div>
      </div>
    </div>
  `;
}

// Export to window
window.TruelyComponents = {
  renderNav,
  renderPost,
  renderUserItem,
  renderComment,
  renderNotification
};
