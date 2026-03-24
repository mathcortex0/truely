// ============================================
// TRUELY - Profile Page Logic
// ============================================

let profileUserId = null;
let profileData = null;
let isOwnProfile = false;
let isFollowing = false;

async function initProfile() {
  // Insert navigation
  const navPlaceholder = document.getElementById('nav-placeholder');
  if (navPlaceholder) {
    navPlaceholder.innerHTML = renderNav('profile');
  }
  
  // Initialize theme and auth
  initTheme();
  await initAuth();
  
  // Get profile ID from URL
  const params = new URLSearchParams(window.location.search);
  profileUserId = params.get('id');
  
  if (!profileUserId) {
    window.location.href = '/';
    return;
  }
  
  // Load profile
  await loadProfile();
  
  // Subscribe to state changes
  window.TruelyState.subscribe(async () => {
    if (window.TruelyState.currentUser) {
      await loadProfile();
    }
  });
}

async function loadProfile() {
  const { data: profile, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', profileUserId)
    .single();
  
  if (error || !profile) {
    document.getElementById('profile-header').innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>User not found</h3>
      </div>
    `;
    return;
  }
  
  profileData = profile;
  
  const user = window.TruelyState.currentUser;
  isOwnProfile = user?.id === profileUserId;
  
  // Check if following
  if (user && !isOwnProfile) {
    const { data: followCheck } = await sb
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profileUserId)
      .single();
    isFollowing = !!followCheck;
  }
  
  // Get counts
  const [postsCount, followersCount, followingCount] = await Promise.all([
    sb.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', profileUserId),
    sb.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', profileUserId),
    sb.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', profileUserId)
  ]);
  
  // Render profile header
  renderProfileHeader(profile, {
    posts: postsCount.count || 0,
    followers: followersCount.count || 0,
    following: followingCount.count || 0
  });
  
  // Load user posts
  await loadUserPosts();
}

function renderProfileHeader(profile, counts) {
  const name = profile.full_name || 'User';
  const avatar = profile.avatar_url;
  const isAdmin = profile.is_admin;
  const isVerified = profile.is_verified;
  const ringClass = isAdmin ? 'avatar-ring-admin' : isVerified ? 'avatar-ring-verified' : '';
  
  let badgeHtml = '';
  if (isAdmin) badgeHtml = `<span class="badge">${adminBadge()}</span>`;
  else if (isVerified) badgeHtml = `<span class="badge">${verifiedBadge()}</span>`;
  
  let actionButtons = '';
  if (isOwnProfile) {
    actionButtons = `
      <button class="btn btn-secondary" id="edit-bio-btn">Edit Profile</button>
    `;
  } else if (window.TruelyState.currentUser) {
    actionButtons = `
      <button class="btn btn-secondary" id="message-btn">Message</button>
      <button class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}" id="follow-btn">
        ${isFollowing ? 'Following' : 'Follow'}
      </button>
    `;
  }
  
  const headerHtml = `
    <div class="profile-header">
      <div class="profile-top">
        <div class="avatar avatar-xl ${ringClass}">
          ${avatar ? `<img src="${avatar}" alt="${name}">` : name.charAt(0).toUpperCase()}
        </div>
        <div>${actionButtons}</div>
      </div>
      <div class="profile-info">
        <div class="profile-name">
          ${escapeHtml(name)}${badgeHtml}
        </div>
        <div class="profile-handle">${escapeHtml(profile.email || '')}</div>
        <div class="profile-bio" id="profile-bio">
          ${profile.bio ? escapeHtml(profile.bio) : '<span class="text-muted">No bio yet</span>'}
        </div>
        ${isOwnProfile ? `
          <div id="bio-edit-form" style="display:none; margin-top: var(--spacing-sm);">
            <textarea id="bio-input" class="form-input" rows="3" placeholder="Write your bio...">${escapeHtml(profile.bio || '')}</textarea>
            <div style="display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-sm);">
              <button class="btn btn-primary btn-sm" id="save-bio">Save</button>
              <button class="btn btn-secondary btn-sm" id="cancel-bio">Cancel</button>
            </div>
          </div>
        ` : ''}
        <div class="profile-stats">
          <div class="stat" data-stat="posts">
            <div class="stat-number">${counts.posts}</div>
            <div class="stat-label">Posts</div>
          </div>
          <div class="stat" data-stat="followers">
            <div class="stat-number">${counts.followers}</div>
            <div class="stat-label">Followers</div>
          </div>
          <div class="stat" data-stat="following">
            <div class="stat-number">${counts.following}</div>
            <div class="stat-label">Following</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('profile-header').innerHTML = headerHtml;
  
  // Setup event listeners
  if (isOwnProfile) {
    const editBtn = document.getElementById('edit-bio-btn');
    const bioText = document.getElementById('profile-bio');
    const editForm = document.getElementById('bio-edit-form');
    const saveBtn = document.getElementById('save-bio');
    const cancelBtn = document.getElementById('cancel-bio');
    const bioInput = document.getElementById('bio-input');
    
    if (editBtn) {
      editBtn.onclick = () => {
        bioText.style.display = 'none';
        editForm.style.display = 'block';
        editBtn.style.display = 'none';
      };
    }
    
    if (saveBtn) {
      saveBtn.onclick = async () => {
        const newBio = bioInput.value.trim();
        await sb.from('profiles').update({ bio: newBio }).eq('id', profileUserId);
        bioText.innerHTML = newBio ? escapeHtml(newBio) : '<span class="text-muted">No bio yet</span>';
        bioText.style.display = 'block';
        editForm.style.display = 'none';
        if (editBtn) editBtn.style.display = 'block';
        showToast('Bio updated', 'success');
      };
    }
    
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        bioText.style.display = 'block';
        editForm.style.display = 'none';
        if (editBtn) editBtn.style.display = 'block';
      };
    }
  }
  
  if (!isOwnProfile && window.TruelyState.currentUser) {
    const followBtn = document.getElementById('follow-btn');
    if (followBtn) {
      followBtn.onclick = toggleFollow;
    }
    
    const messageBtn = document.getElementById('message-btn');
    if (messageBtn) {
      messageBtn.onclick = () => {
        window.location.href = `/messages.html?to=${profileUserId}`;
      };
    }
  }
}

async function toggleFollow() {
  const user = window.TruelyState.currentUser;
  if (!user) {
    showToast('Sign in to follow', 'error');
    return;
  }
  
  const btn = document.getElementById('follow-btn');
  
  if (isFollowing) {
    await sb.from('follows').delete().eq('follower_id', user.id).eq('following_id', profileUserId);
    isFollowing = false;
    btn.textContent = 'Follow';
    btn.className = 'btn btn-primary';
    showToast('Unfollowed', 'success');
  } else {
    await sb.from('follows').insert({ follower_id: user.id, following_id: profileUserId });
    isFollowing = true;
    btn.textContent = 'Following';
    btn.className = 'btn btn-secondary';
    
    // Create notification
    await sb.from('notifications').insert({
      user_id: profileUserId,
      from_user_id: user.id,
      type: 'follow'
    });
    
    showToast('Following', 'success');
  }
}

async function loadUserPosts() {
  const container = document.getElementById('profile-posts');
  if (!container) return;
  
  container.innerHTML = `
    ${Array(2).fill(0).map(() => `
      <div class="post-card">
        <div class="post-header">
          <div class="skeleton skeleton-avatar"></div>
          <div class="post-body">
            <div class="skeleton skeleton-line" style="width: 60%"></div>
            <div class="skeleton skeleton-line" style="width: 90%"></div>
          </div>
        </div>
      </div>
    `).join('')}
  `;
  
  const { data: posts } = await sb
    .from('posts')
    .select('*')
    .eq('author_id', profileUserId)
    .order('created_at', { ascending: false });
  
  if (!posts || posts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <h3>No posts yet</h3>
      </div>
    `;
    return;
  }
  
  // Get likes for current user
  const user = window.TruelyState.currentUser;
  let likedSet = new Set();
  if (user) {
    const { data: likes } = await sb
      .from('likes')
      .select('post_id')
      .eq('user_id', user.id);
    (likes || []).forEach(l => likedSet.add(l.post_id));
  }
  
  // Get likes counts
  const { data: allLikes } = await sb.from('likes').select('post_id');
  const likesCountMap = {};
  (allLikes || []).forEach(l => {
    likesCountMap[l.post_id] = (likesCountMap[l.post_id] || 0) + 1;
  });
  
  // Get comments counts
  const { data: allComments } = await sb.from('comments').select('post_id');
  const commentsCountMap = {};
  (allComments || []).forEach(c => {
    commentsCountMap[c.post_id] = (commentsCountMap[c.post_id] || 0) + 1;
  });
  
  container.innerHTML = posts.map(post => {
    const isLiked = likedSet.has(post.id);
    const likesCount = likesCountMap[post.id] || 0;
    const commentsCount = commentsCountMap[post.id] || 0;
    return renderPost(post, profileData, isLiked, likesCount, commentsCount);
  }).join('');
  
  // Attach like event listeners
  container.querySelectorAll('[data-action="like"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const postCard = btn.closest('.post-card');
      const postId = postCard.dataset.postId;
      const isLiked = btn.classList.contains('liked');
      await toggleLike(postId, isLiked, btn);
    });
  });
  
  // Attach name clicks
  container.querySelectorAll('.post-name').forEach(el => {
    el.addEventListener('click', () => {
      window.location.href = `/profile.html?id=${profileUserId}`;
    });
  });
}

async function toggleLike(postId, currentlyLiked, buttonElement) {
  const user = window.TruelyState.currentUser;
  if (!user) {
    showToast('Sign in to like posts', 'error');
    return;
  }
  
  const countSpan = buttonElement.querySelector('.count');
  let count = parseInt(countSpan.textContent) || 0;
  
  if (currentlyLiked) {
    await sb.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
    buttonElement.classList.remove('liked');
    buttonElement.querySelector('svg').setAttribute('fill', 'none');
    countSpan.textContent = Math.max(0, count - 1);
  } else {
    await sb.from('likes').insert({ post_id: postId, user_id: user.id });
    buttonElement.classList.add('liked');
    buttonElement.querySelector('svg').setAttribute('fill', '#EF4444');
    countSpan.textContent = count + 1;
    
    // Create notification if not liking own post
    if (postId) {
      const { data: post } = await sb.from('posts').select('author_id').eq('id', postId).single();
      if (post && post.author_id !== user.id) {
        await sb.from('notifications').insert({
          user_id: post.author_id,
          from_user_id: user.id,
          type: 'like',
          post_id: postId
        });
      }
    }
  }
}

// Start the app
initProfile();
