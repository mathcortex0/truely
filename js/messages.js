// ============================================
// TRUELY - Messages/Chat Page Logic
// ============================================

let activeConversationUser = null;
let messagePollInterval = null;
let currentUserProfile = null;

async function initMessages() {
  // Insert navigation
  const navPlaceholder = document.getElementById('nav-placeholder');
  if (navPlaceholder) {
    navPlaceholder.innerHTML = renderNav('messages');
  }
  
  // Initialize theme and auth
  initTheme();
  await initAuth();
  
  currentUserProfile = window.TruelyState.userProfile;
  
  if (!window.TruelyState.currentUser) {
    document.getElementById('conversations-list').innerHTML = `
      <div class="empty-state" style="padding: var(--spacing-xl);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <p>Sign in to message</p>
      </div>
    `;
    return;
  }
  
  // Load conversations
  await loadConversations();
  
  // Setup search
  const searchInput = document.getElementById('search-users');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(searchUsers, 300));
  }
  
  // Check URL for direct user
  const params = new URLSearchParams(window.location.search);
  const toUserId = params.get('to');
  if (toUserId) {
    const { data: profile } = await sb.from('profiles').select('*').eq('id', toUserId).single();
    if (profile) {
      await openConversation(profile);
    }
  }
  
  // Subscribe to state changes
  window.TruelyState.subscribe((state) => {
    if (state.currentUser) {
      currentUserProfile = state.userProfile;
      loadConversations();
    }
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

async function loadConversations() {
  const user = window.TruelyState.currentUser;
  if (!user) return;
  
  const container = document.getElementById('conversations-list');
  container.innerHTML = '<div class="skeleton skeleton-line" style="margin: var(--spacing-md);"></div>';
  
  // Get all messages involving this user
  const { data: messages } = await sb
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false });
  
  if (!messages || messages.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: var(--spacing-xl);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <p>No conversations yet</p>
      </div>
    `;
    return;
  }
  
  // Get unique conversation partners
  const conversationPartners = new Set();
  messages.forEach(msg => {
    if (msg.sender_id !== user.id) conversationPartners.add(msg.sender_id);
    if (msg.receiver_id !== user.id) conversationPartners.add(msg.receiver_id);
  });
  
  const partnerIds = Array.from(conversationPartners);
  const { data: profiles } = await sb
    .from('profiles')
    .select('*')
    .in('id', partnerIds);
  
  const profileMap = {};
  (profiles || []).forEach(p => { profileMap[p.id] = p; });
  
  // Get last message for each conversation
  const lastMessages = {};
  messages.forEach(msg => {
    const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    if (!lastMessages[partnerId] || new Date(msg.created_at) > new Date(lastMessages[partnerId].created_at)) {
      lastMessages[partnerId] = msg;
    }
  });
  
  container.innerHTML = partnerIds.map(partnerId => {
    const profile = profileMap[partnerId];
    if (!profile) return '';
    const lastMsg = lastMessages[partnerId];
    const isAdmin = profile.is_admin;
    const isVerified = profile.is_verified;
    const ringClass = isAdmin ? 'avatar-ring-admin' : isVerified ? 'avatar-ring-verified' : '';
    let badgeHtml = '';
    if (isAdmin) badgeHtml = `<span class="badge">${adminBadge(12)}</span>`;
    else if (isVerified) badgeHtml = `<span class="badge">${verifiedBadge(12)}</span>`;
    
    const preview = lastMsg.content ? lastMsg.content.substring(0, 50) : (lastMsg.image_url ? '📷 Image' : '');
    const timeAgo = formatTimeAgo(lastMsg.created_at);
    
    return `
      <div class="conversation-item" data-user-id="${partnerId}" onclick="openConversationById('${partnerId}')">
        <div class="avatar avatar-md ${ringClass}">
          ${profile.avatar_url ? `<img src="${profile.avatar_url}">` : (profile.full_name?.charAt(0).toUpperCase() || 'U')}
        </div>
        <div class="conversation-info">
          <div class="conversation-name">
            ${escapeHtml(profile.full_name || 'User')}${badgeHtml}
          </div>
          <div class="conversation-preview">${escapeHtml(preview)} · ${timeAgo}</div>
        </div>
      </div>
    `;
  }).join('');
}

async function searchUsers() {
  const searchInput = document.getElementById('search-users');
  const query = searchInput?.value.trim();
  const user = window.TruelyState.currentUser;
  
  if (!query || !user) {
    await loadConversations();
    return;
  }
  
  const { data: users } = await sb
    .from('profiles')
    .select('*')
    .ilike('full_name', `%${query}%`)
    .neq('id', user.id)
    .limit(10);
  
  const container = document.getElementById('conversations-list');
  if (!users || users.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No users found</p></div>';
    return;
  }
  
  container.innerHTML = users.map(profile => {
    const isAdmin = profile.is_admin;
    const isVerified = profile.is_verified;
    const ringClass = isAdmin ? 'avatar-ring-admin' : isVerified ? 'avatar-ring-verified' : '';
    let badgeHtml = '';
    if (isAdmin) badgeHtml = `<span class="badge">${adminBadge(12)}</span>`;
    else if (isVerified) badgeHtml = `<span class="badge">${verifiedBadge(12)}</span>`;
    
    return `
      <div class="conversation-item" data-user-id="${profile.id}" onclick="openConversationById('${profile.id}')">
        <div class="avatar avatar-md ${ringClass}">
          ${profile.avatar_url ? `<img src="${profile.avatar_url}">` : (profile.full_name?.charAt(0).toUpperCase() || 'U')}
        </div>
        <div class="conversation-info">
          <div class="conversation-name">
            ${escapeHtml(profile.full_name || 'User')}${badgeHtml}
          </div>
          <div class="conversation-preview">${escapeHtml(profile.bio || 'Click to start chatting')}</div>
        </div>
      </div>
    `;
  }).join('');
}

window.openConversationById = async (userId) => {
  const { data: profile } = await sb.from('profiles').select('*').eq('id', userId).single();
  if (profile) await openConversation(profile);
};

async function openConversation(profile) {
  activeConversationUser = profile;
  
  // Update active state in sidebar
  document.querySelectorAll('.conversation-item').forEach(el => {
    el.classList.remove('active');
    if (el.dataset.userId === profile.id) {
      el.classList.add('active');
    }
  });
  
  // Render chat area
  renderChatArea(profile);
  
  // Load messages
  await loadMessages();
  
  // Set up polling for new messages
  if (messagePollInterval) clearInterval(messagePollInterval);
  messagePollInterval = setInterval(() => {
    loadMessages();
    deleteExpiredMessages();
  }, 3000);
}

function renderChatArea(profile) {
  const chatArea = document.getElementById('chat-area');
  const isAdmin = profile.is_admin;
  const isVerified = profile.is_verified;
  const ringClass = isAdmin ? 'avatar-ring-admin' : isVerified ? 'avatar-ring-verified' : '';
  let badgeHtml = '';
  if (isAdmin) badgeHtml = `<span class="badge">${adminBadge()}</span>`;
  else if (isVerified) badgeHtml = `<span class="badge">${verifiedBadge()}</span>`;
  
  const limit = getMessageLimit();
  const limitText = limit === Infinity ? '∞' : limit;
  
  chatArea.innerHTML = `
    <div class="chat-header">
      <div class="avatar avatar-md ${ringClass}">
        ${profile.avatar_url ? `<img src="${profile.avatar_url}">` : (profile.full_name?.charAt(0).toUpperCase() || 'U')}
      </div>
      <div>
        <div class="conversation-name" style="font-size: 1rem;">
          ${escapeHtml(profile.full_name || 'User')}${badgeHtml}
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">Messages disappear after 30s</div>
      </div>
    </div>
    <div class="chat-messages" id="chat-messages"></div>
    <div class="chat-compose">
      <div style="font-size: 0.6875rem; color: var(--text-muted); margin-bottom: var(--spacing-sm);">
        <span id="msg-char-count">0 / ${limitText}</span>
      </div>
      <div class="chat-compose-row">
        <input type="text" class="chat-input" id="message-input" placeholder="Type a message..." maxlength="${limit === Infinity ? 9999 : limit}">
        <button class="send-btn" id="send-message">
          <svg viewBox="0 0 24 24">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
    </div>
  `;
  
  // Setup message input
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-message');
  const charCount = document.getElementById('msg-char-count');
  
  if (messageInput) {
    messageInput.addEventListener('input', () => {
      const len = messageInput.value.length;
      if (charCount) {
        if (limit === Infinity) {
          charCount.textContent = `${len} / ∞`;
        } else {
          charCount.textContent = `${len} / ${limit}`;
          charCount.style.color = len > limit * 0.9 ? (len >= limit ? 'var(--accent-red)' : 'var(--accent-gold)') : 'var(--text-muted)';
        }
      }
    });
    
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }
  
  if (sendBtn) {
    sendBtn.onclick = sendMessage;
  }
}

async function loadMessages() {
  const user = window.TruelyState.currentUser;
  if (!user || !activeConversationUser) return;
  
  const messagesContainer = document.getElementById('chat-messages');
  if (!messagesContainer) return;
  
  const { data: messages } = await sb
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeConversationUser.id}),and(sender_id.eq.${activeConversationUser.id},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true });
  
  if (!messages || messages.length === 0) {
    messagesContainer.innerHTML = `
      <div class="empty-state" style="padding: var(--spacing-xl);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <p>No messages yet. Start the conversation!</p>
      </div>
    `;
    return;
  }
  
  const shouldScroll = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 50;
  
  messagesContainer.innerHTML = messages.map(msg => {
    const isMine = msg.sender_id === user.id;
    const time = formatMessageTime(msg.created_at);
    const expiresAt = new Date(msg.expires_at);
    const now = new Date();
    const remainingSecs = Math.max(0, Math.floor((expiresAt - now) / 1000));
    const timerPercent = (remainingSecs / MSG_TTL_SECONDS) * 100;
    
    return `
      <div class="message-bubble ${isMine ? 'mine' : 'other'}">
        <div class="message-content">
          ${msg.content ? escapeHtml(msg.content) : ''}
          ${msg.image_url ? `<img src="${msg.image_url}" style="max-width: 200px; border-radius: var(--radius-md); margin-top: var(--spacing-xs);">` : ''}
          <span class="message-time">${time} · ${remainingSecs}s</span>
          <div class="message-timer ${!isMine ? 'other' : ''}" style="width: ${timerPercent}%"></div>
        </div>
      </div>
    `;
  }).join('');
  
  if (shouldScroll) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

async function sendMessage() {
  const user = window.TruelyState.currentUser;
  if (!user || !activeConversationUser) {
    showToast('Sign in to send messages', 'error');
    return;
  }
  
  const input = document.getElementById('message-input');
  const content = input.value.trim();
  const limit = getMessageLimit();
  
  if (!content) return;
  
  if (limit !== Infinity && content.length > limit) {
    showToast(`Message exceeds ${limit} characters`, 'error');
    return;
  }
  
  const expiresAt = new Date(Date.now() + MSG_TTL_SECONDS * 1000).toISOString();
  
  const { error } = await sb
    .from('messages')
    .insert({
      sender_id: user.id,
      receiver_id: activeConversationUser.id,
      content,
      expires_at: expiresAt
    });
  
  if (error) {
    showToast('Failed to send message', 'error');
    return;
  }
  
  input.value = '';
  await loadMessages();
}

async function deleteExpiredMessages() {
  await sb.from('messages').delete().lt('expires_at', new Date().toISOString());
}

// Start the app
initMessages();
