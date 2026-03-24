// ============================================
// TRUELY - Feed Page Logic
// ============================================

let feedState = {
  posts: [],
  likedPosts: new Set(),
  likesCount: {},
  commentsCount: {}
};

// Initialize feed page
async function initFeed() {
  // Insert navigation
  const navPlaceholder = document.getElementById('nav-placeholder');
  if (navPlaceholder) {
    navPlaceholder.innerHTML = renderNav('feed');
  }
  
  // Initialize theme and auth
  initTheme();
  await initAuth();
  
  // Setup event listeners
  setupFeedEventListeners();
  
  // Load posts
  await loadPosts();
  
  // Subscribe to state changes
  window.TruelyState.subscribe(async (state) => {
    if (state.currentUser) {
      document.getElementById('compose-box').style.display = 'block';
      updateComposeAvatar();
      await loadPosts();
    } else {
      document.getElementById('compose-box').style.display = 'none';
      await loadPosts();
    }
  });
}

function setupFeedEventListeners() {
  // Post submit
  const postSubmit = document.getElementById('post-submit');
  if (postSubmit) {
    postSubmit.addEventListener('click', submitPost);
  }
  
  // Post content input
  const postContent = document.getElementById('post-content');
  if (postContent) {
    postContent.addEventListener('input', updateCharCount);
  }
  
  // Verify modal close
  window.closeVerifyModal = () => {
    document.getElementById('verify-modal')?.classList.remove('open');
  };
}

function updateComposeAvatar() {
  const profile = window.TruelyState.userProfile;
  const composeAvatar = document.getElementById('compose-avatar');
  if (composeAvatar && profile) {
    const name = profile.full_name || 'U';
    const avatar = profile.avatar_url;
    composeAvatar.innerHTML = avatar ? `<img src="${avatar}">` : name.charAt(0).toUpperCase();
  }
}

function updateCharCount() {
  const textarea = document.getElementById('post-content');
  const charCount = document.getElementById('char-count');
  if (!textarea || !charCount) return;
  
  const limit = getPostLimit();
  const length = textarea.value.length;
  const remaining = limit - length;
  
  if (limit === Infinity) {
    charCount.textContent = `${length} / ∞`;
  } else {
    charCount.textContent = `${length} / ${limit}`;
    charCount.className = 'char-count';
    if (length > limit * 0.9) {
      charCount.classList.add('warning');
    }
    if (length >= limit) {
      charCount.classList.add('over');
    }
  }
}

async function submitPost() {
  const user = window.TruelyState.currentUser;
  if (!user) {
    showToast('Please sign in to post', 'error');
    return;
  }
  
  const textarea = document.getElementById('post-content');
  const content = textarea.value.trim();
  const limit = getPostLimit();
  
  if (!content) {
    showToast('Write something first', 'error');
    return;
  }
  
  if (limit !== Infinity && content.length > limit) {
    showToast(`Post exceeds ${limit} characters`, 'error');
    return;
  }
  
  const { error } = await sb
    .from('posts')
    .insert({ content, author_id: user.id });
  
  if (error) {
    showToast('Failed to post', 'error');
    console.error(error);
    return;
  }
  
  textarea.value = '';
  updateCharCount();
  showToast('Posted successfully', 'success');
  await loadPosts();
}

async function loadPosts() {
  const container = document.getElementById('posts-container');
  if (!container) return;
  
  // Show skeleton
  container.innerHTML = `
    ${Array(3).fill(0).map(() => `
      <div class="post-card">
        <div class="post-header">
          <div class="skeleton skeleton-avatar"></div>
          <div class="post-body">
            <div class="skeleton skeleton-line" style="width: 40%"></div>
            <div class="skeleton skeleton-line" style="width: 80%"></div>
            <div class="skeleton skeleton-line" style="width: 60%"></div>
          </div>
        </div>
      </div>
    `).join('')}
  `;
  
  // Fetch posts
  const { data: posts, error } = await sb
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error(error);
    container.innerHTML = '<div class="empty-state"><p>Failed to load posts</p></div>';
    return;
  }
  
  if (!posts || posts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <h3>No posts yet</h3>
        <p>Be the first to share something!</p>
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
  
  // Render posts
  container.innerHTML = posts.map(post => {
    const profile = profileMap[post.author_id];
    const isLiked = likedSet.has(post.id);
    const likesCount = likesCountMap[post.id] || 0;
    const commentsCount = commentsCountMap[post.id] || 0;
    return renderPost(post, profile, isLiked, likesCount, commentsCount);
  }).join('');
  
  // Attach event listeners to posts
  attachPostEventListeners();
}

function attachPostEventListeners() {
  // Post clicks
  document.querySelectorAll('.post-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.action-btn')) return;
      if (e.target.closest('.post-name')) return;
      if (e.target.closest('.avatar')) return;
      // Can navigate to post detail if needed
    });
  });
  
  // Name clicks
  document.querySelectorAll('.post-name').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const userId = el.dataset.userId;
      if (userId) window.location.href = `/profile.html?id=${userId}`;
    });
  });
  
  // Avatar clicks
  document.querySelectorAll('.avatar[data-user-id]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const userId = el.dataset.userId;
      if (userId) window.location.href = `/profile.html?id=${userId}`;
    });
  });
  
  // Like buttons
  document.querySelectorAll('[data-action="like"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const postCard = btn.closest('.post-card');
      const postId = postCard.dataset.postId;
      const isLiked = btn.classList.contains('liked');
      await toggleLike(postId, isLiked, btn);
    });
  });
  
  // Comment buttons
  document.querySelectorAll('[data-action="comment"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const postCard = btn.closest('.post-card');
      const commentsSection = postCard.querySelector('.comments-section');
      commentsSection.classList.toggle('open');
      if (commentsSection.classList.contains('open')) {
        loadComments(postCard.dataset.postId, commentsSection);
      }
    });
  });
  
  // Share buttons
  document.querySelectorAll('[data-action="share"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const postCard = btn.closest('.post-card');
      const url = `${window.location.origin}/post/${postCard.dataset.postId}`;
      if (navigator.share) {
        await navigator.share({ title: 'Truely', url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard', 'success');
      }
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
  }
}

async function loadComments(postId, commentsSection) {
  const commentsList = commentsSection.querySelector('.comments-list');
  if (!commentsList) return;
  
  commentsList.innerHTML = '<div class="skeleton skeleton-line" style="width: 80%"></div>';
  
  const { data: comments } = await sb
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  
  if (!comments || comments.length === 0) {
    commentsList.innerHTML = '<p class="text-muted" style="font-size: 0.875rem;">No comments yet</p>';
    return;
  }
  
  const userIds = [...new Set(comments.map(c => c.user_id))];
  const { data: profiles } = await sb
    .from('profiles')
    .select('*')
    .in('id', userIds);
  
  const profileMap = {};
  (profiles || []).forEach(p => { profileMap[p.id] = p; });
  
  const user = window.TruelyState.currentUser;
  commentsList.innerHTML = comments.map(comment => {
    const profile = profileMap[comment.user_id];
    const canDelete = user?.id === comment.user_id || user?.email === ADMIN_EMAIL;
    return renderComment(comment, profile, canDelete);
  }).join('');
  
  // Attach comment delete listeners
  commentsList.querySelectorAll('[data-action="delete-comment"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const commentItem = btn.closest('.comment-item');
      const commentId = commentItem.dataset.commentId;
      await sb.from('comments').delete().eq('id', commentId);
      commentItem.remove();
      
      // Update comment count
      const postCard = commentsSection.closest('.post-card');
      const commentBtn = postCard.querySelector('[data-action="comment"] .count');
      if (commentBtn) {
        commentBtn.textContent = Math.max(0, parseInt(commentBtn.textContent) - 1);
      }
      showToast('Comment deleted', 'success');
    });
  });
  
  // Setup comment form
  const commentForm = commentsSection.querySelector('.comment-form');
  const commentInput = commentForm?.querySelector('.comment-input');
  const submitBtn = commentForm?.querySelector('.btn');
  
  if (commentForm && commentInput && submitBtn) {
    const newSubmitHandler = async () => {
      const user = window.TruelyState.currentUser;
      if (!user) {
        showToast('Sign in to comment', 'error');
        return;
      }
      
      const content = commentInput.value.trim();
      if (!content) return;
      
      const { data, error } = await sb
        .from('comments')
        .insert({ post_id: postId, user_id: user.id, content })
        .select()
        .single();
      
      if (error) {
        showToast('Failed to post comment', 'error');
        return;
      }
      
      commentInput.value = '';
      await loadComments(postId, commentsSection);
      
      // Update comment count
      const postCard = commentsSection.closest('.post-card');
      const commentBtn = postCard.querySelector('[data-action="comment"] .count');
      if (commentBtn) {
        commentBtn.textContent = (parseInt(commentBtn.textContent) || 0) + 1;
      }
    };
    
    submitBtn.onclick = newSubmitHandler;
    commentInput.onkeypress = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        newSubmitHandler();
      }
    };
  }
}

// Start the app
initFeed();
