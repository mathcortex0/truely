// ============================================
// TRUELY - Search Page Logic
// ============================================

let activeTab = 'people';
let searchTimeout = null;

async function initSearch() {
  // Insert navigation
  const navPlaceholder = document.getElementById('nav-placeholder');
  if (navPlaceholder) {
    navPlaceholder.innerHTML = renderNav('search');
  }
  
  // Initialize theme and auth
  initTheme();
  await initAuth();
  
  // Setup search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(performSearch, 300);
    });
  }
  
  // Setup tabs
  const tabs = document.querySelectorAll('.search-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      performSearch();
    });
  });
}

async function performSearch() {
  const searchInput = document.getElementById('search-input');
  const query = searchInput.value.trim();
  const resultsContainer = document.getElementById('search-results');
  
  if (!query) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <h3>Search for people or posts</h3>
        <p>Find friends and discover content</p>
      </div>
    `;
    return;
  }
  
  // Show loading
  resultsContainer.innerHTML = `
    <div class="empty-state">
      <div class="loading-spinner"></div>
      <p>Searching...</p>
    </div>
  `;
  
  if (activeTab === 'people') {
    await searchPeople(query);
  } else {
    await searchPosts(query);
  }
}

async function searchPeople(query) {
  const resultsContainer = document.getElementById('search-results');
  
  const { data: users } = await sb
    .from('profiles')
    .select('*')
    .ilike('full_name', `%${query}%`)
    .limit(20);
  
  if (!users || users.length === 0) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <h3>No people found</h3>
        <p>Try a different search term</p>
      </div>
    `;
    return;
  }
  
  resultsContainer.innerHTML = users.map(user => renderUserItem(user, true)).join('');
  
  // Attach click handlers
  document.querySelectorAll('.user-item').forEach(item => {
    item.addEventListener('click', () => {
      const userId = item.dataset.userId;
      window.location.href = `/profile.html?id=${userId}`;
    });
  });
}

async function searchPosts(query) {
  const resultsContainer = document.getElementById('search-results');
  
  const { data: posts } = await sb
    .from('posts')
    .select('*')
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (!posts || posts.length === 0) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <h3>No posts found</h3>
        <p>Try a different search term</p>
      </div>
    `;
    return;
  }
  
  // Get authors
  const authorIds = [...new Set(posts.map(p => p.author_id))];
  const { data: profiles } = await sb
    .from('profiles')
    .select('*')
    .in('id', authorIds);
  
  const profileMap = {};
  (profiles || []).forEach(p => { profileMap[p.id] = p; });
  
  resultsContainer.innerHTML = posts.map(post => {
    const profile = profileMap[post.author_id];
    const name = profile?.full_name || 'User';
    const avatar = profile?.avatar_url;
    const isAdmin = profile?.is_admin;
    const isVerified = profile?.is_verified;
    const ringClass = isAdmin ? 'avatar-ring-admin' : isVerified ? 'avatar-ring-verified' : '';
    let badgeHtml = '';
    if (isAdmin) badgeHtml = `<span class="badge">${adminBadge()}</span>`;
    else if (isVerified) badgeHtml = `<span class="badge">${verifiedBadge()}</span>`;
    
    const timeAgo = formatTimeAgo(post.created_at);
    const fullTime = formatFullDateTime(post.created_at);
    
    // Highlight search term
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const highlightedContent = escapeHtml(post.content).replace(regex, '<span class="highlight">$1</span>');
    
    return `
      <div class="post-card" data-post-id="${post.id}" data-author-id="${post.author_id}">
        <div class="post-header">
          <div class="avatar avatar-md ${ringClass}">
            ${avatar ? `<img src="${avatar}">` : name.charAt(0).toUpperCase()}
          </div>
          <div class="post-body">
            <div class="post-user">
              <span class="post-name">${escapeHtml(name)}</span>
              ${badgeHtml}
              <span class="post-time" title="${fullTime}">· ${timeAgo}</span>
            </div>
            <div class="post-content">${highlightedContent}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Attach click handlers
  document.querySelectorAll('.post-card').forEach(card => {
    card.addEventListener('click', () => {
      const authorId = card.dataset.authorId;
      if (authorId) {
        window.location.href = `/profile.html?id=${authorId}`;
      }
    });
  });
  
  document.querySelectorAll('.post-name').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = el.closest('.post-card');
      const authorId = card?.dataset.authorId;
      if (authorId) window.location.href = `/profile.html?id=${authorId}`;
    });
  });
}

// Start the app
initSearch();
