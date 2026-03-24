// ═══════════════════════════════════
// TRUELY — Shared Config & Utilities
// ═══════════════════════════════════

const SUPABASE_URL = 'https://pwprxidlohbzfsoxrnxs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hJTweaPJGWeaNPQxbBaEPw_jR0O9xhx';
const ADMIN_EMAIL  = 'alamin05052008@gmail.com';

const MSG_LIMITS = { free: 150, verified: 400, admin: Infinity };
const POST_LIMITS = { free: 280, verified: 600, admin: Infinity };
const MSG_TTL_SECONDS = 30;

// Init Supabase
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── SHARED STATE ──
window.TruelyState = {
  currentUser: null,
  userProfile: null,
};

// ── VERIFIED BADGE SVG ──
function verifiedBadge(size = 18) {
  return `<span class="badge"><svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#06B6D4"/>
    <path d="M7 12.5l3.5 3.5 6.5-7" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg></span>`;
}
function adminBadge() {
  return `<span class="badge"><svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
  </svg></span>`;
}

// ── HELPERS ──
function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function timeAgo(ts) {
  const d = new Date(ts), now = new Date();
  const s = Math.floor((now - d) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
}
function showToast(msg, type = 'default') {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'toast show' + (type === 'error' ? ' toast-error' : '');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── SHARED CSS VARIABLES ──
const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  :root[data-theme="dark"] {
    --bg:#0A0A0F; --bg2:#111118; --bg3:#18181f; --border:#2a2a38;
    --text:#F0F0F8; --muted:#6b6b85; --muted2:#9090aa; --card:#13131a; --hover:#1c1c26;
  }
  :root[data-theme="light"] {
    --bg:#F8F7FF; --bg2:#FFFFFF; --bg3:#F0EFF8; --border:#E2E0F0;
    --text:#0A0A1A; --muted:#9090AA; --muted2:#6b6b85; --card:#FFFFFF; --hover:#F4F3FC;
  }
  :root {
    --indigo:#4F46E5; --indigo-dark:#3730A3; --indigo-light:#6366F1;
    --cyan:#06B6D4; --cyan-dark:#0891B2; --gold:#F59E0B; --red:#EF4444; --green:#10B981;
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  html{scroll-behavior:smooth;}
  body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;transition:background 0.3s,color 0.3s;}
  ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:var(--bg);} ::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px;}
  nav{position:fixed;top:0;left:0;right:0;z-index:100;background:var(--bg);border-bottom:1px solid var(--border);backdrop-filter:blur(20px);}
  .nav-inner{max-width:680px;margin:0 auto;padding:0 16px;height:56px;display:flex;align-items:center;justify-content:space-between;gap:8px;}
  .logo{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;background:linear-gradient(135deg,var(--indigo),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;cursor:pointer;text-decoration:none;}
  .nav-links{display:flex;align-items:center;gap:4px;}
  .nav-link{padding:8px 12px;border-radius:10px;font-size:14px;font-weight:600;color:var(--muted);text-decoration:none;transition:all 0.2s;display:flex;align-items:center;gap:6px;}
  .nav-link:hover,.nav-link.active{color:var(--text);background:var(--hover);}
  .nav-link svg{width:18px;height:18px;}
  .nav-actions{display:flex;align-items:center;gap:8px;}
  .btn{padding:8px 18px;border-radius:100px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;font-size:14px;transition:all 0.2s;display:inline-flex;align-items:center;justify-content:center;gap:6px;}
  .btn-primary{background:var(--indigo);color:#fff;}
  .btn-primary:hover{background:var(--indigo-light);transform:translateY(-1px);box-shadow:0 4px 20px rgba(79,70,229,0.4);}
  .btn-outline{background:transparent;border:1px solid var(--border);color:var(--text);}
  .btn-outline:hover{border-color:var(--indigo);color:var(--indigo);}
  .btn-ghost{background:transparent;border:none;color:var(--muted);padding:8px;}
  .btn-ghost:hover{color:var(--text);background:var(--hover);}
  .btn-sm{padding:6px 14px;font-size:13px;}
  .btn-full{width:100%;padding:13px;font-size:15px;border-radius:12px;margin-top:4px;}
  .theme-btn{width:36px;height:36px;border-radius:50%;border:1px solid var(--border);background:var(--bg2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:all 0.2s;}
  .theme-btn:hover{border-color:var(--indigo);}
  .avatar{border-radius:50%;object-fit:cover;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:700;color:var(--text);overflow:hidden;flex-shrink:0;}
  .avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%;}
  .av-xs{width:28px;height:28px;font-size:11px;}
  .av-sm{width:36px;height:36px;font-size:14px;}
  .av-md{width:44px;height:44px;font-size:17px;}
  .av-lg{width:64px;height:64px;font-size:26px;}
  .av-xl{width:80px;height:80px;font-size:32px;}
  .verified-ring{border:2px solid var(--cyan)!important;}
  .admin-ring{border:2px solid var(--gold)!important;}
  .badge{display:inline-flex;align-items:center;margin-left:3px;vertical-align:middle;}
  .wrap{max-width:680px;margin:0 auto;padding:0;}
  .page-wrap{padding-top:56px;min-height:100vh;}
  .form-group{margin-bottom:16px;}
  .form-group label{display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:var(--muted2);}
  .form-group input,.form-group textarea{width:100%;padding:12px 16px;border-radius:12px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:all 0.2s;}
  .form-group input:focus,.form-group textarea:focus{border-color:var(--indigo);box-shadow:0 0 0 3px rgba(79,70,229,0.1);}
  .msg{font-size:13px;padding:11px 14px;border-radius:10px;margin-bottom:14px;display:none;}
  .msg.error{background:rgba(239,68,68,0.1);color:#EF4444;border:1px solid rgba(239,68,68,0.2);display:block;}
  .msg.success{background:rgba(16,185,129,0.1);color:#10B981;border:1px solid rgba(16,185,129,0.2);display:block;}
  .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);background:var(--text);color:var(--bg);padding:12px 20px;border-radius:100px;font-size:14px;font-weight:600;z-index:9999;transition:transform 0.3s ease;white-space:nowrap;pointer-events:none;}
  .toast.show{transform:translateX(-50%) translateY(0);}
  .toast.toast-error{background:var(--red);color:#fff;}
  .skeleton{background:linear-gradient(90deg,var(--bg3) 25%,var(--border) 50%,var(--bg3) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:8px;}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  .av-wrap{position:relative;cursor:pointer;}
  .av-dropdown{display:none;position:absolute;top:48px;right:0;background:var(--card);border:1px solid var(--border);border-radius:18px;padding:8px;min-width:230px;z-index:999;box-shadow:0 16px 48px rgba(0,0,0,0.3);}
  .av-dropdown.open{display:block;animation:fadeDown 0.15s ease;}
  @keyframes fadeDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .av-dd-head{padding:12px;border-bottom:1px solid var(--border);margin-bottom:6px;display:flex;gap:10px;align-items:center;}
  .av-dd-name{font-family:'Syne',sans-serif;font-weight:700;font-size:14px;display:flex;align-items:center;gap:4px;flex-wrap:wrap;}
  .av-dd-email{font-size:12px;color:var(--muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .av-dd-badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;margin-top:6px;}
  .badge-free-dd{background:var(--bg3);color:var(--muted);}
  .badge-verified-dd{background:rgba(6,182,212,0.15);color:var(--cyan);}
  .badge-admin-dd{background:rgba(245,158,11,0.15);color:var(--gold);}
  .dd-item{padding:10px 12px;border-radius:10px;font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:10px;color:var(--text);transition:background 0.15s;}
  .dd-item:hover{background:var(--hover);}
  .dd-item.danger{color:var(--red);}
  .notif-dot{width:8px;height:8px;background:var(--red);border-radius:50%;position:absolute;top:2px;right:2px;}
  @media(max-width:600px){.nav-link span{display:none;}.nav-link{padding:8px;}}
`;

// ── SHARED NAV HTML ──
function getNavHTML(activePage) {
  return `
  <nav>
    <div class="nav-inner">
      <a class="logo" href="/">Truely</a>
      <div class="nav-links">
        <a class="nav-link ${activePage==='feed'?'active':''}" href="/">
          <svg viewBox="0 0 24 24" fill="${activePage==='feed'?'var(--indigo)':'none'}" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>Home</span>
        </a>
        <a class="nav-link ${activePage==='search'?'active':''}" href="/search.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span>Search</span>
        </a>
        <a class="nav-link ${activePage==='messages'?'active':''}" href="/messages.html" id="msg-nav-link">
          <svg viewBox="0 0 24 24" fill="${activePage==='messages'?'var(--indigo)':'none'}" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>Messages</span>
        </a>
        <a class="nav-link ${activePage==='notifications'?'active':''}" href="/notifications.html" id="notif-nav-link" style="position:relative">
          <svg viewBox="0 0 24 24" fill="${activePage==='notifications'?'var(--indigo)':'none'}" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span>Alerts</span>
          <span class="notif-dot" id="notif-dot" style="display:none"></span>
        </a>
      </div>
      <div class="nav-actions">
        <button class="theme-btn" onclick="toggleTheme()" id="theme-btn">🌙</button>
        <button class="btn btn-outline btn-sm" id="nav-login" onclick="window.location.href='/index.html#login'">Sign In</button>
        <button class="btn btn-primary btn-sm" id="nav-signup" onclick="window.location.href='/index.html#signup'">Join</button>
        <input type="file" id="av-file" accept="image/*" onchange="uploadAvatar(event)" style="display:none"/>
        <div class="av-wrap" id="av-wrap" style="display:none" onclick="toggleDD(event)">
          <div class="avatar av-sm" id="nav-av">T</div>
          <div class="av-dropdown" id="av-dd">
            <div class="av-dd-head">
              <div class="avatar av-md" id="dd-av">T</div>
              <div style="flex:1;min-width:0">
                <div class="av-dd-name" id="dd-name">User</div>
                <div class="av-dd-email" id="dd-email"></div>
                <span class="av-dd-badge badge-free-dd" id="dd-badge">Free</span>
              </div>
            </div>
            <div class="dd-item" onclick="goProfile(event)">👤 View Profile</div>
            <div class="dd-item" onclick="document.getElementById('av-file').click();event.stopPropagation()">📷 Change Photo</div>
            <div class="dd-item" id="dd-verify-btn" onclick="window.location.href='/?verify=1';event.stopPropagation()">
              <svg viewBox="0 0 24 24" fill="var(--cyan)" width="16"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Get Verified
            </div>
            <div class="dd-item danger" onclick="doLogout()">🚪 Sign Out</div>
          </div>
        </div>
      </div>
    </div>
  </nav>`;
}

// ── SHARED AUTH FUNCTIONS ──
async function initSharedAuth(onLogin) {
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) {
    window.TruelyState.currentUser = session.user;
    await loadSharedProfile(session.user);
    showLoggedInNav();
    if (onLogin) onLogin(session.user, window.TruelyState.userProfile);
  } else {
    showLoggedOutNav();
  }
  checkUnreadNotifs();
}

async function loadSharedProfile(user) {
  const { data } = await sb.from('profiles').select('*').eq('id', user.id).single();
  if (data) {
    window.TruelyState.userProfile = data;
  } else {
    const name = user.user_metadata?.full_name || user.email.split('@')[0];
    const av = user.user_metadata?.avatar_url || null;
    const isAdmin = user.email === ADMIN_EMAIL;
    await sb.from('profiles').upsert({ id: user.id, full_name: name, email: user.email, avatar_url: av, is_admin: isAdmin, is_verified: false });
    window.TruelyState.userProfile = { full_name: name, email: user.email, avatar_url: av, is_admin: isAdmin, is_verified: false };
  }
  updateNavAvatar();
}

function updateNavAvatar() {
  const p = window.TruelyState.userProfile;
  const u = window.TruelyState.currentUser;
  if (!p) return;
  const name = p.full_name || u?.email?.split('@')[0] || 'U';
  const initials = name.charAt(0).toUpperCase();
  const isAdmin = p.is_admin || u?.email === ADMIN_EMAIL;
  const isVerified = p.is_verified;
  const av = p.avatar_url;
  const ringClass = isAdmin ? ' admin-ring' : isVerified ? ' verified-ring' : '';
  const avHTML = av ? `<img src="${av}"/>` : initials;
  ['nav-av','dd-av'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.innerHTML = avHTML; el.className = `avatar ${id==='nav-av'?'av-sm':'av-md'}${ringClass}`; }
  });
  const ddName = document.getElementById('dd-name');
  if (ddName) ddName.innerHTML = escHtml(name) + (isAdmin ? adminBadge() : isVerified ? verifiedBadge(14) : '');
  const ddEmail = document.getElementById('dd-email');
  if (ddEmail) ddEmail.textContent = u?.email || '';
  const ddBadge = document.getElementById('dd-badge');
  if (ddBadge) {
    if (isAdmin) { ddBadge.textContent = '👑 Admin'; ddBadge.className = 'av-dd-badge badge-admin-dd'; }
    else if (isVerified) { ddBadge.textContent = '✓ Verified'; ddBadge.className = 'av-dd-badge badge-verified-dd'; }
    else { ddBadge.textContent = 'Free'; ddBadge.className = 'av-dd-badge badge-free-dd'; }
  }
  const verifyBtn = document.getElementById('dd-verify-btn');
  if (verifyBtn) verifyBtn.style.display = (isAdmin || isVerified) ? 'none' : 'flex';
}

function showLoggedInNav() {
  document.getElementById('nav-login')?.style && (document.getElementById('nav-login').style.display = 'none');
  document.getElementById('nav-signup')?.style && (document.getElementById('nav-signup').style.display = 'none');
  document.getElementById('av-wrap')?.style && (document.getElementById('av-wrap').style.display = 'block');
}
function showLoggedOutNav() {
  document.getElementById('nav-login')?.style && (document.getElementById('nav-login').style.display = 'flex');
  document.getElementById('nav-signup')?.style && (document.getElementById('nav-signup').style.display = 'flex');
  document.getElementById('av-wrap')?.style && (document.getElementById('av-wrap').style.display = 'none');
}

async function doLogout() {
  await sb.auth.signOut();
  window.TruelyState.currentUser = null;
  window.TruelyState.userProfile = null;
  showLoggedOutNav();
  window.location.href = '/';
}

function toggleDD(e) {
  e.stopPropagation();
  document.getElementById('av-dd')?.classList.toggle('open');
}
document.addEventListener('click', () => document.getElementById('av-dd')?.classList.remove('open'));

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('truely-theme', isDark ? 'light' : 'dark');
}

// Load saved theme
(function() {
  const saved = localStorage.getItem('truely-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = saved === 'dark' ? '🌙' : '☀️';
  });
})();

async function uploadAvatar(e) {
  const file = e.target.files[0];
  const user = window.TruelyState.currentUser;
  if (!file || !user) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    const url = ev.target.result;
    await sb.from('profiles').update({ avatar_url: url }).eq('id', user.id);
    window.TruelyState.userProfile.avatar_url = url;
    updateNavAvatar();
    document.getElementById('av-dd')?.classList.remove('open');
    showToast('Photo updated ✓');
  };
  reader.readAsDataURL(file);
}

function goProfile(e) {
  e?.stopPropagation();
  const user = window.TruelyState.currentUser;
  if (user) window.location.href = `/profile.html?id=${user.id}`;
}

async function checkUnreadNotifs() {
  const user = window.TruelyState.currentUser;
  if (!user) return;
  const { data } = await sb.from('notifications').select('id').eq('user_id', user.id).eq('read', false);
  const dot = document.getElementById('notif-dot');
  if (dot) dot.style.display = (data && data.length > 0) ? 'block' : 'none';
}

function getMsgLimit() {
  const p = window.TruelyState.userProfile;
  const u = window.TruelyState.currentUser;
  if (!p) return MSG_LIMITS.free;
  if (p.is_admin || u?.email === ADMIN_EMAIL) return MSG_LIMITS.admin;
  if (p.is_verified) return MSG_LIMITS.verified;
  return MSG_LIMITS.free;
}

function getPostLimit() {
  const p = window.TruelyState.userProfile;
  const u = window.TruelyState.currentUser;
  if (!p) return POST_LIMITS.free;
  if (p.is_admin || u?.email === ADMIN_EMAIL) return POST_LIMITS.admin;
  if (p.is_verified) return POST_LIMITS.verified;
  return POST_LIMITS.free;
}
