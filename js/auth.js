// ============================================
// TRUELY - Authentication Logic
// ============================================

async function initAuth() {
  const { data: { session } } = await sb.auth.getSession();
  
  if (session?.user) {
    await loadUserProfile(session.user);
    showLoggedInNav();
  } else {
    showLoggedOutNav();
  }
  
  await checkUnreadNotifications();
}

async function loadUserProfile(user) {
  const { data: profile } = await sb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (profile) {
    window.TruelyState.setUser(user, profile);
  } else {
    // Create profile if doesn't exist
    const newProfile = {
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email.split('@')[0],
      email: user.email,
      avatar_url: user.user_metadata?.avatar_url || null,
      is_admin: user.email === ADMIN_EMAIL,
      is_verified: false
    };
    
    await sb.from('profiles').insert(newProfile);
    window.TruelyState.setUser(user, newProfile);
  }
  
  updateNavAvatar();
}

async function signUp(email, password, fullName) {
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });
  
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  
  await loadUserProfile(data.user);
  showLoggedInNav();
  return data;
}

async function signInWithGoogle() {
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  if (error) throw error;
}

async function signOut() {
  await sb.auth.signOut();
  window.TruelyState.clearUser();
  showLoggedOutNav();
  window.location.href = '/';
}

async function checkUnreadNotifications() {
  const user = window.TruelyState.currentUser;
  if (!user) return;
  
  const { data } = await sb
    .from('notifications')
    .select('id')
    .eq('user_id', user.id)
    .eq('read', false);
  
  const dot = document.getElementById('notif-dot');
  if (dot) {
    dot.style.display = (data && data.length > 0) ? 'block' : 'none';
  }
}

function showLoggedInNav() {
  const loginBtn = document.getElementById('nav-login');
  const signupBtn = document.getElementById('nav-signup');
  const avatarWrap = document.getElementById('avatar-wrap');
  
  if (loginBtn) loginBtn.style.display = 'none';
  if (signupBtn) signupBtn.style.display = 'none';
  if (avatarWrap) avatarWrap.style.display = 'block';
}

function showLoggedOutNav() {
  const loginBtn = document.getElementById('nav-login');
  const signupBtn = document.getElementById('nav-signup');
  const avatarWrap = document.getElementById('avatar-wrap');
  
  if (loginBtn) loginBtn.style.display = 'flex';
  if (signupBtn) signupBtn.style.display = 'flex';
  if (avatarWrap) avatarWrap.style.display = 'none';
}

function updateNavAvatar() {
  const profile = window.TruelyState.userProfile;
  if (!profile) return;
  
  const name = profile.full_name || 'U';
  const initials = name.charAt(0).toUpperCase();
  const isAdmin = profile.is_admin;
  const isVerified = profile.is_verified;
  const avatarUrl = profile.avatar_url;
  
  const ringClass = isAdmin ? 'avatar-ring-admin' : isVerified ? 'avatar-ring-verified' : '';
  
  // Update nav avatar
  const navAvatar = document.getElementById('nav-avatar');
  if (navAvatar) {
    navAvatar.innerHTML = avatarUrl ? `<img src="${avatarUrl}">` : initials;
    navAvatar.className = `avatar avatar-sm ${ringClass}`;
  }
  
  // Update dropdown avatar
  const ddAvatar = document.getElementById('dd-avatar');
  if (ddAvatar) {
    ddAvatar.innerHTML = avatarUrl ? `<img src="${avatarUrl}">` : initials;
    ddAvatar.className = `avatar avatar-md ${ringClass}`;
  }
  
  // Update dropdown name
  const ddName = document.getElementById('dd-name');
  if (ddName) {
    let badge = '';
    if (isAdmin) badge = adminBadge();
    else if (isVerified) badge = verifiedBadge(14);
    ddName.innerHTML = escapeHtml(name) + (badge ? `<span class="badge">${badge}</span>` : '');
  }
  
  // Update dropdown email
  const ddEmail = document.getElementById('dd-email');
  if (ddEmail) ddEmail.textContent = profile.email || '';
  
  // Update dropdown badge
  const ddBadge = document.getElementById('dd-badge');
  if (ddBadge) {
    if (isAdmin) {
      ddBadge.textContent = 'Admin';
      ddBadge.className = 'dropdown-badge badge-admin';
    } else if (isVerified) {
      ddBadge.textContent = 'Verified';
      ddBadge.className = 'dropdown-badge badge-verified';
    } else {
      ddBadge.textContent = 'Free';
      ddBadge.className = 'dropdown-badge badge-free';
    }
  }
  
  // Show/hide verify button
  const verifyBtn = document.getElementById('dd-verify');
  if (verifyBtn) {
    verifyBtn.style.display = (isAdmin || isVerified) ? 'none' : 'flex';
  }
}

// Theme toggle
function initTheme() {
  const savedTheme = localStorage.getItem('truely-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.innerHTML = savedTheme === 'dark' ? 
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' :
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('truely-theme', newTheme);
  
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.innerHTML = newTheme === 'dark' ? 
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' :
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
}

// Export to window
window.TruelyAuth = {
  initAuth,
  signUp,
  signIn,
  signInWithGoogle,
  signOut,
  checkUnreadNotifications,
  toggleTheme,
  initTheme
};
