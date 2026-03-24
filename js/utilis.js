// ============================================
// TRUELY - Utility Functions
// ============================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Professional time ago (like Facebook)
 */
function formatTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now - past) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (months < 12) return `${monthNames[past.getMonth()]} ${past.getDate()}`;
  return `${monthNames[past.getMonth()]} ${past.getDate()}, ${past.getFullYear()}`;
}

/**
 * Full date time for tooltips
 */
function formatFullDateTime(date) {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format message timestamp
 */
function formatMessageTime(date) {
  const now = new Date();
  const past = new Date(date);
  const diffHours = (now - past) / (1000 * 60 * 60);
  
  if (diffHours < 24) {
    return past.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } else if (diffHours < 48) {
    return 'Yesterday';
  }
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Show toast notification
 */
function showToast(message, type = 'default') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

/**
 * Verified badge SVG
 */
function verifiedBadge(size = 16) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#06B6D4"/>
    <path d="M7 12.5L10.5 16L17 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

/**
 * Admin badge SVG
 */
function adminBadge(size = 16) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#F59E0B">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
  </svg>`;
}

/**
 * Get post character limit based on user tier
 */
function getPostLimit() {
  const profile = window.TruelyState?.userProfile;
  const user = window.TruelyState?.currentUser;
  if (!profile) return POST_LIMITS.free;
  if (profile.is_admin || user?.email === ADMIN_EMAIL) return POST_LIMITS.admin;
  if (profile.is_verified) return POST_LIMITS.verified;
  return POST_LIMITS.free;
}

/**
 * Get message character limit based on user tier
 */
function getMessageLimit() {
  const profile = window.TruelyState?.userProfile;
  const user = window.TruelyState?.currentUser;
  if (!profile) return MSG_LIMITS.free;
  if (profile.is_admin || user?.email === ADMIN_EMAIL) return MSG_LIMITS.admin;
  if (profile.is_verified) return MSG_LIMITS.verified;
  return MSG_LIMITS.free;
}

// Export to window
window.TruelyUtils = {
  escapeHtml,
  formatTimeAgo,
  formatFullDateTime,
  formatMessageTime,
  showToast,
  verifiedBadge,
  adminBadge,
  getPostLimit,
  getMessageLimit
};
