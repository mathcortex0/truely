// ═══════════════════════════════════════════════════════
// TRUELY — Shared Config, State & Utilities
// ═══════════════════════════════════════════════════════

const SUPABASE_URL  = 'https://pwprxidlohbzfsoxrnxs.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_hJTweaPJGWeaNPQxbBaEPw_jR0O9xhx';
const ADMIN_EMAIL   = 'alamin05052008@gmail.com';
const VERIFY_LINK   = 'https://t.me/nxReal';

const POST_LIMITS = { free: 280, verified: 600, admin: Infinity };
const MSG_LIMITS  = { free: 150, verified: 400, admin: Infinity };
const MSG_TTL     = 30;

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

window.TruelyState = { currentUser: null, userProfile: null };

// ── BADGES ──────────────────────────────────────────────
function verifiedBadge(s=16){
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" class="badge-svg verified-svg"><circle cx="12" cy="12" r="12" fill="#06B6D4"/><path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function adminBadge(){
  return `<svg width="15" height="15" viewBox="0 0 24 24" fill="#F59E0B" class="badge-svg admin-svg"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>`;
}

// ── HELPERS ─────────────────────────────────────────────
function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function timeAgo(ts){
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if(s <  60) return `${s}s`;
  if(s <3600) return `${Math.floor(s/60)}m`;
  if(s <86400)return `${Math.floor(s/3600)}h`;
  if(s <604800)return`${Math.floor(s/86400)}d`;
  return new Date(ts).toLocaleDateString('en',{month:'short',day:'numeric'});
}

function fmtCount(n){
  if(n>=1000000) return (n/1000000).toFixed(1).replace(/\.0$/,'')+'M';
  if(n>=1000)    return (n/1000).toFixed(1).replace(/\.0$/,'')+'K';
  return String(n||0);
}

function toast(msg, type=''){
  let t = document.getElementById('toast');
  if(!t){ t=document.createElement('div'); t.id='toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'toast show' + (type?' toast-'+type:'');
  clearTimeout(window._tt);
  window._tt = setTimeout(()=>t.classList.remove('show'), 2800);
}

function getPostLimit(){
  const p=window.TruelyState.userProfile, u=window.TruelyState.currentUser;
  if(!p) return POST_LIMITS.free;
  if(p.is_admin||u?.email===ADMIN_EMAIL) return POST_LIMITS.admin;
  if(p.is_verified) return POST_LIMITS.verified;
  return POST_LIMITS.free;
}
function getMsgLimit(){
  const p=window.TruelyState.userProfile, u=window.TruelyState.currentUser;
  if(!p) return MSG_LIMITS.free;
  if(p.is_admin||u?.email===ADMIN_EMAIL) return MSG_LIMITS.admin;
  if(p.is_verified) return MSG_LIMITS.verified;
  return MSG_LIMITS.free;
}
function isAdmin(){ const p=window.TruelyState.userProfile,u=window.TruelyState.currentUser; return p?.is_admin||u?.email===ADMIN_EMAIL; }

// ── SHARED AUTH ──────────────────────────────────────────
async function initSharedAuth(onLogin){
  const{data:{session}}=await sb.auth.getSession();
  if(session?.user){
    window.TruelyState.currentUser=session.user;
    await loadSharedProfile(session.user);
    showLoggedInNav();
    if(onLogin) onLogin(session.user, window.TruelyState.userProfile);
  } else {
    showLoggedOutNav();
  }
  checkUnreadNotifs();
}

async function loadSharedProfile(user){
  const{data}=await sb.from('profiles').select('*').eq('id',user.id).single();
  if(data){
    window.TruelyState.userProfile=data;
  } else {
    const name=user.user_metadata?.full_name||user.email.split('@')[0];
    const av=user.user_metadata?.avatar_url||null;
    const admin=user.email===ADMIN_EMAIL;
    await sb.from('profiles').upsert({id:user.id,full_name:name,email:user.email,avatar_url:av,is_admin:admin,is_verified:false});
    window.TruelyState.userProfile={full_name:name,email:user.email,avatar_url:av,is_admin:admin,is_verified:false};
  }
  updateNavAvatar();
}

function updateNavAvatar(){
  const p=window.TruelyState.userProfile, u=window.TruelyState.currentUser;
  if(!p) return;
  const name=p.full_name||u?.email?.split('@')[0]||'U';
  const admin=p.is_admin||u?.email===ADMIN_EMAIL;
  const ring=admin?'admin-ring':p.is_verified?'verified-ring':'';
  const avHTML=p.avatar_url?`<img src="${p.avatar_url}" alt=""/>`:`<span>${name[0].toUpperCase()}</span>`;
  ['nav-av','dd-av'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.innerHTML=avHTML;el.className=`avatar ${id==='nav-av'?'av-sm':'av-md'} ${ring}`;}
  });
  const dn=document.getElementById('dd-name');
  if(dn) dn.innerHTML=esc(name)+(admin?adminBadge():p.is_verified?verifiedBadge(14):'');
  const de=document.getElementById('dd-email');
  if(de) de.textContent=u?.email||'';
  const db=document.getElementById('dd-badge');
  if(db){
    if(admin){db.textContent='Admin';db.className='dd-tier tier-admin';}
    else if(p.is_verified){db.textContent='Verified';db.className='dd-tier tier-verified';}
    else{db.textContent='Free';db.className='dd-tier tier-free';}
  }
  const vb=document.getElementById('dd-verify');
  if(vb) vb.style.display=(admin||p.is_verified)?'none':'flex';
}

function showLoggedInNav(){
  document.getElementById('nav-auth')?.style&&(document.getElementById('nav-auth').style.display='none');
  document.getElementById('nav-user')?.style&&(document.getElementById('nav-user').style.display='flex');
}
function showLoggedOutNav(){
  document.getElementById('nav-auth')?.style&&(document.getElementById('nav-auth').style.display='flex');
  document.getElementById('nav-user')?.style&&(document.getElementById('nav-user').style.display='none');
}
async function doLogout(){
  await sb.auth.signOut();
  window.TruelyState.currentUser=null;
  window.TruelyState.userProfile=null;
  showLoggedOutNav();
  window.location.href='/';
}
function toggleDD(e){
  e.stopPropagation();
  document.getElementById('av-dd')?.classList.toggle('open');
}
document.addEventListener('click',()=>document.getElementById('av-dd')?.classList.remove('open'));

async function checkUnreadNotifs(){
  const u=window.TruelyState.currentUser; if(!u) return;
  const{data}=await sb.from('notifications').select('id').eq('user_id',u.id).eq('is_read',false);
  const dot=document.getElementById('notif-dot');
  if(dot) dot.style.display=(data?.length>0)?'block':'none';
}

async function googleAuth(){
  await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin}});
}

async function uploadAvatar(e){
  const file=e.target.files[0], user=window.TruelyState.currentUser;
  if(!file||!user) return;
  const ext=file.name.split('.').pop();
  const path=`${user.id}/avatar.${ext}`;
  const{data,error}=await sb.storage.from('avatars').upload(path,file,{upsert:true});
  if(error){toast('Upload failed','error');return;}
  const{data:{publicUrl}}=sb.storage.from('avatars').getPublicUrl(path);
  await sb.from('profiles').update({avatar_url:publicUrl}).eq('id',user.id);
  window.TruelyState.userProfile.avatar_url=publicUrl;
  updateNavAvatar();
  document.getElementById('av-dd')?.classList.remove('open');
  toast('Photo updated');
}

function goProfile(e){
  e?.stopPropagation();
  const u=window.TruelyState.currentUser;
  if(u) window.location.href=`/profile.html?id=${u.id}`;
}

function toggleTheme(){
  const html=document.documentElement;
  const dark=html.getAttribute('data-theme')==='dark';
  html.setAttribute('data-theme',dark?'light':'dark');
  document.getElementById('theme-btn').textContent=dark?'☀':'●';
  localStorage.setItem('truely-theme',dark?'light':'dark');
}
(function(){
  const saved=localStorage.getItem('truely-theme')||'dark';
  document.documentElement.setAttribute('data-theme',saved);
  window.addEventListener('DOMContentLoaded',()=>{
    const btn=document.getElementById('theme-btn');
    if(btn) btn.textContent=saved==='dark'?'●':'☀';
  });
})();

// ── SHARED CSS ───────────────────────────────────────────
const SHARED_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600;700;800&display=swap');

:root[data-theme="dark"]{
  --bg:       #090909;
  --bg2:      #0f0f0f;
  --bg3:      #161616;
  --card:     #0f0f0f;
  --border:   #1f1f1f;
  --border2:  #2a2a2a;
  --text:     #f0f0f0;
  --text2:    #a0a0a0;
  --text3:    #606060;
  --hover:    rgba(255,255,255,0.04);
  --press:    rgba(255,255,255,0.08);
}
:root[data-theme="light"]{
  --bg:       #fafafa;
  --bg2:      #f4f4f4;
  --bg3:      #eeeeee;
  --card:     #ffffff;
  --border:   #e8e8e8;
  --border2:  #d8d8d8;
  --text:     #0a0a0a;
  --text2:    #606060;
  --text3:    #a0a0a0;
  --hover:    rgba(0,0,0,0.04);
  --press:    rgba(0,0,0,0.08);
}
:root{
  --blue:     #1d9bf0;
  --blue2:    #1677cc;
  --green:    #00ba7c;
  --red:      #f4212e;
  --gold:     #ffd700;
  --cyan:     #06b6d4;
  --font:     'Outfit', sans-serif;
  --mono:     'DM Mono', monospace;
  --serif:    'Instrument Serif', serif;
}

*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html{scroll-behavior:smooth;}
body{
  font-family:var(--font);
  background:var(--bg);
  color:var(--text);
  min-height:100vh;
  line-height:1.5;
  -webkit-font-smoothing:antialiased;
}
::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px;}
a{text-decoration:none;color:inherit;}
button{font-family:var(--font);cursor:pointer;}
input,textarea{font-family:var(--font);}

/* ── NAV ── */
nav.main-nav{
  position:fixed;top:0;left:0;right:0;
  z-index:100;
  background:var(--bg);
  border-bottom:1px solid var(--border);
  height:53px;
}
.nav-inner{
  max-width:600px;
  margin:0 auto;
  padding:0 16px;
  height:100%;
  display:flex;
  align-items:center;
  justify-content:space-between;
}
.nav-logo{
  font-family:var(--serif);
  font-size:22px;
  font-style:italic;
  color:var(--text);
  letter-spacing:-0.02em;
}
.nav-right{display:flex;align-items:center;gap:6px;}
.nav-icon-btn{
  width:34px;height:34px;
  border-radius:50%;
  border:none;
  background:transparent;
  color:var(--text2);
  display:flex;align-items:center;justify-content:center;
  transition:background .15s,color .15s;
  position:relative;
}
.nav-icon-btn:hover{background:var(--hover);color:var(--text);}
.nav-icon-btn svg{width:19px;height:19px;}
#theme-btn{font-size:14px;color:var(--text2);}

/* auth buttons */
.nav-auth{display:flex;align-items:center;gap:8px;}
.btn-signin{padding:7px 16px;border-radius:20px;border:1px solid var(--border2);background:transparent;color:var(--text);font-size:13px;font-weight:600;transition:all .15s;}
.btn-signin:hover{background:var(--hover);}
.btn-join{padding:7px 16px;border-radius:20px;border:none;background:var(--text);color:var(--bg);font-size:13px;font-weight:700;transition:all .15s;}
.btn-join:hover{opacity:.88;}

/* user dropdown */
.nav-user{display:none;align-items:center;gap:6px;}
.av-wrap{position:relative;}
.av-dropdown{
  display:none;position:absolute;
  top:calc(100% + 8px);right:0;
  background:var(--card);
  border:1px solid var(--border2);
  border-radius:16px;
  padding:6px;
  min-width:220px;
  z-index:999;
  box-shadow:0 8px 32px rgba(0,0,0,0.3);
}
.av-dropdown.open{display:block;animation:ddIn .15s ease;}
@keyframes ddIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.dd-head{padding:12px;border-bottom:1px solid var(--border);margin-bottom:4px;display:flex;gap:10px;align-items:center;}
.dd-info{flex:1;min-width:0;}
.dd-name{font-weight:700;font-size:14px;display:flex;align-items:center;gap:4px;}
.dd-email{font-size:12px;color:var(--text3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dd-tier{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.06em;padding:2px 8px;border-radius:10px;margin-top:5px;}
.tier-free{background:var(--bg3);color:var(--text3);}
.tier-verified{background:rgba(6,182,212,.12);color:var(--cyan);}
.tier-admin{background:rgba(255,215,0,.12);color:var(--gold);}
.dd-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;font-size:13px;font-weight:500;cursor:pointer;color:var(--text);transition:background .12s;}
.dd-item:hover{background:var(--hover);}
.dd-item.danger{color:var(--red);}
.dd-item svg{width:16px;height:16px;color:var(--text2);}

/* notif dot */
.notif-dot{width:8px;height:8px;background:var(--red);border-radius:50%;position:absolute;top:1px;right:1px;border:2px solid var(--bg);display:none;}

/* ── AVATAR ── */
.avatar{border-radius:50%;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-weight:700;font-family:var(--font);overflow:hidden;flex-shrink:0;}
.avatar img{width:100%;height:100%;object-fit:cover;display:block;}
.avatar span{color:var(--text2);}
.av-xs{width:26px;height:26px;font-size:10px;}
.av-sm{width:34px;height:34px;font-size:13px;}
.av-md{width:40px;height:40px;font-size:15px;}
.av-lg{width:64px;height:64px;font-size:24px;}
.av-xl{width:80px;height:80px;font-size:30px;}
.verified-ring{outline:2px solid var(--cyan);outline-offset:2px;}
.admin-ring{outline:2px solid var(--gold);outline-offset:2px;}

/* badge svgs */
.badge-svg{display:inline-block;vertical-align:middle;margin-left:3px;flex-shrink:0;}

/* ── LAYOUT ── */
.page-wrap{padding-top:53px;min-height:100vh;}
.main-wrap{max-width:600px;margin:0 auto;}

/* ── BUTTONS ── */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 18px;border-radius:20px;border:none;font-family:var(--font);font-weight:600;font-size:14px;cursor:pointer;transition:all .15s;}
.btn-primary{background:var(--text);color:var(--bg);}
.btn-primary:hover{opacity:.88;}
.btn-outline{background:transparent;border:1px solid var(--border2);color:var(--text);}
.btn-outline:hover{background:var(--hover);}
.btn-blue{background:var(--blue);color:#fff;}
.btn-blue:hover{background:var(--blue2);}
.btn-sm{padding:6px 14px;font-size:13px;}
.btn-full{width:100%;}
.btn-danger{background:transparent;border:1px solid var(--red);color:var(--red);}
.btn-danger:hover{background:rgba(244,33,46,.08);}

/* ── FORM ── */
.form-group{margin-bottom:16px;}
.form-group label{display:block;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--text3);margin-bottom:6px;}
.form-input{width:100%;padding:11px 14px;border-radius:10px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font-family:var(--font);font-size:14px;outline:none;transition:border .15s;}
.form-input:focus{border-color:var(--text3);}
.form-input::placeholder{color:var(--text3);}

/* ── SKELETON ── */
.skeleton{background:linear-gradient(90deg,var(--bg3) 25%,var(--border2) 50%,var(--bg3) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

/* ── TOAST ── */
.toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--text);color:var(--bg);padding:11px 20px;border-radius:20px;font-size:13px;font-weight:600;z-index:9999;opacity:0;transition:all .25s;pointer-events:none;white-space:nowrap;}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
.toast.toast-error{background:var(--red);color:#fff;}
.toast.toast-success{background:var(--green);color:#fff;}

/* ── BOTTOM NAV (mobile) ── */
.bottom-nav{
  display:none;
  position:fixed;bottom:0;left:0;right:0;
  height:54px;
  background:var(--bg);
  border-top:1px solid var(--border);
  z-index:100;
  padding:0 8px;
}
.bottom-nav-inner{display:flex;align-items:center;justify-content:space-around;height:100%;max-width:480px;margin:0 auto;}
.bn-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;width:52px;height:44px;border-radius:12px;border:none;background:transparent;color:var(--text2);position:relative;transition:color .15s;}
.bn-btn.active{color:var(--text);}
.bn-btn svg{width:22px;height:22px;}
.bn-dot{width:6px;height:6px;background:var(--red);border-radius:50%;position:absolute;top:4px;right:10px;border:2px solid var(--bg);display:none;}

/* compose fab */
.fab{
  position:fixed;
  bottom:70px;right:16px;
  width:52px;height:52px;
  border-radius:50%;
  background:var(--text);color:var(--bg);
  border:none;
  display:none;
  align-items:center;justify-content:center;
  box-shadow:0 4px 16px rgba(0,0,0,.3);
  z-index:99;
  transition:transform .15s;
}
.fab:hover{transform:scale(1.06);}
.fab svg{width:22px;height:22px;}

@media(max-width:640px){
  .bottom-nav{display:flex;}
  .fab{display:flex;}
  .page-wrap{padding-bottom:54px;}
}

/* ── MSG ── */
.msg{font-size:13px;padding:10px 13px;border-radius:10px;margin-bottom:14px;display:none;}
.msg.error{background:rgba(244,33,46,.08);color:var(--red);border:1px solid rgba(244,33,46,.15);display:block;}
.msg.success{background:rgba(0,186,124,.08);color:var(--green);border:1px solid rgba(0,186,124,.15);display:block;}

/* ── EMPTY ── */
.empty-state{text-align:center;padding:60px 20px;color:var(--text3);}
.empty-state p{font-size:15px;margin-bottom:6px;color:var(--text2);}
.empty-state small{font-size:13px;}

/* ── ANIMATIONS ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
@keyframes spin{to{transform:rotate(360deg)}}

/* ── MODAL ── */
.modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:500;justify-content:center;align-items:flex-end;padding:0;}
.modal-bg.open{display:flex;animation:fadeIn .2s ease;}
.modal-card{background:var(--card);border:1px solid var(--border2);border-radius:20px 20px 0 0;padding:24px;width:100%;max-width:600px;animation:slideUp .25s ease;}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@media(min-width:641px){
  .modal-bg{align-items:center;padding:20px;}
  .modal-card{border-radius:20px;max-width:480px;}
  @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
}
`;

// ── NAV HTML ─────────────────────────────────────────────
function getNavHTML(active){
  return `
<nav class="main-nav">
  <div class="nav-inner">
    <a class="nav-logo" href="/">Truely</a>
    <div class="nav-right">
      <button class="nav-icon-btn" id="theme-btn" onclick="toggleTheme()" title="Theme">●</button>
      <a class="nav-icon-btn" href="/search.html" title="Search" ${active==='search'?'style="color:var(--text)"':''}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      </a>
      <a class="nav-icon-btn" href="/notifications.html" title="Notifications" style="position:relative" ${active==='notifications'?'style="color:var(--text)"':''}>
        <svg viewBox="0 0 24 24" fill="${active==='notifications'?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span class="notif-dot" id="notif-dot"></span>
      </a>
      <a class="nav-icon-btn" href="/messages.html" title="Messages" ${active==='messages'?'style="color:var(--text)"':''}>
        <svg viewBox="0 0 24 24" fill="${active==='messages'?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </a>
      <div class="nav-auth" id="nav-auth">
        <button class="btn-signin" onclick="window.location.href='/#login'">Sign in</button>
        <button class="btn-join"   onclick="window.location.href='/#signup'">Join</button>
      </div>
      <div class="nav-user" id="nav-user">
        <div class="av-wrap" onclick="toggleDD(event)">
          <div class="avatar av-sm" id="nav-av"></div>
          <div class="av-dropdown" id="av-dd">
            <div class="dd-head">
              <div class="avatar av-md" id="dd-av"></div>
              <div class="dd-info">
                <div class="dd-name" id="dd-name"></div>
                <div class="dd-email" id="dd-email"></div>
                <span class="dd-tier tier-free" id="dd-badge">Free</span>
              </div>
            </div>
            <div class="dd-item" onclick="goProfile(event)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              Profile
            </div>
            <div class="dd-item" onclick="window.location.href='/settings.html'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Settings
            </div>
            <div class="dd-item" id="dd-verify" onclick="window.location.href='${VERIFY_LINK}';event.stopPropagation()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Get Verified
            </div>
            <input type="file" id="av-file" accept="image/*" onchange="uploadAvatar(event)" style="display:none"/>
            <div class="dd-item" onclick="document.getElementById('av-file').click();event.stopPropagation()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Change Photo
            </div>
            <div class="dd-item danger" onclick="doLogout()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              Sign out
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</nav>`;
}

// ── BOTTOM NAV HTML ──────────────────────────────────────
function getBottomNavHTML(active){
  return `
<nav class="bottom-nav">
  <div class="bottom-nav-inner">
    <button class="bn-btn ${active==='feed'?'active':''}" onclick="window.location.href='/'">
      <svg viewBox="0 0 24 24" fill="${active==='feed'?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    </button>
    <button class="bn-btn ${active==='search'?'active':''}" onclick="window.location.href='/search.html'">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    </button>
    <button class="bn-btn ${active==='messages'?'active':''}" onclick="window.location.href='/messages.html'">
      <svg viewBox="0 0 24 24" fill="${active==='messages'?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    </button>
    <button class="bn-btn ${active==='notifications'?'active':''}" onclick="window.location.href='/notifications.html'" style="position:relative">
      <svg viewBox="0 0 24 24" fill="${active==='notifications'?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      <span class="bn-dot" id="bn-notif-dot"></span>
    </button>
    <button class="bn-btn ${active==='profile'?'active':''}" onclick="goProfile()">
      <svg viewBox="0 0 24 24" fill="${active==='profile'?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
    </button>
  </div>
</nav>`;
}
