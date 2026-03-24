// ═══════════════════════════════════════════════
// TRUELY v2 — Shared Config, CSS & Utilities
// ═══════════════════════════════════════════════

const T = {
  URL:   'https://pwprxidlohbzfsoxrnxs.supabase.co',
  KEY:   'sb_publishable_hJTweaPJGWeaNPQxbBaEPw_jR0O9xhx',
  ADMIN: 'alamin05052008@gmail.com',
  LIMITS: { post: { free:280, verified:600, admin:Infinity }, msg: { free:150, verified:400, admin:Infinity } },
  MSG_TTL: 30,
  state: { user: null, profile: null },
};

const { createClient } = supabase;
const sb = createClient(T.URL, T.KEY);

// ── BADGES ──────────────────────────────────────────────────
const Badge = {
  verified: (s=18) => `<svg width="${s}" height="${s}" viewBox="0 0 22 22" fill="none" style="vertical-align:middle;margin-left:3px"><circle cx="11" cy="11" r="11" fill="#06B6D4"/><path d="M6.5 11.5l3 3 6-6.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  admin:    (s=16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="#F59E0B" style="vertical-align:middle;margin-left:3px"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
};

// ── HELPERS ─────────────────────────────────────────────────
const esc  = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const ago  = ts => { const s=Math.floor((Date.now()-new Date(ts))/1000); return s<60?`${s}s`:s<3600?`${Math.floor(s/60)}m`:s<86400?`${Math.floor(s/3600)}h`:`${Math.floor(s/86400)}d`; };
const fmt  = n  => n>=1000?`${(n/1000).toFixed(1)}k`:String(n);
const toast = (msg,type='ok') => {
  let el=document.getElementById('_toast');
  if(!el){el=document.createElement('div');el.id='_toast';document.body.appendChild(el);}
  el.textContent=msg; el.className='toast show'+(type==='err'?' toast-err':'');
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),2800);
};
const linkHashtags = text => esc(text).replace(/#([a-zA-Z][a-zA-Z0-9_]{0,49})/g,'<a class="hashtag" href="/search.html?q=%23$1" onclick="event.stopPropagation()">#$1</a>');

// ── THEME ───────────────────────────────────────────────────
const Theme = {
  init() {
    const saved = localStorage.getItem('truely-theme')||'dark';
    document.documentElement.setAttribute('data-theme',saved);
  },
  toggle() {
    const cur = document.documentElement.getAttribute('data-theme')||'dark';
    const next = cur==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-theme',next);
    localStorage.setItem('truely-theme',next);
    document.querySelectorAll('.theme-icon').forEach(el=>el.textContent=next==='dark'?'☀️':'🌙');
  }
};

// ── PROFILE HELPERS ─────────────────────────────────────────
const Prof = {
  isAdmin:    p => p?.is_admin || p?.email===T.ADMIN,
  isVerified: p => p?.is_verified,
  ring:       p => Prof.isAdmin(p)?' ring-admin':Prof.isVerified(p)?' ring-verified':'',
  badge:      p => Prof.isAdmin(p)?Badge.admin():Prof.isVerified(p)?Badge.verified():'',
  av:         (p,cls='av-md') => {
    const name=p?.full_name||'U', ring=Prof.ring(p);
    return `<div class="av ${cls}${ring}">${p?.avatar_url?`<img src="${p.avatar_url}"/>`:(name.charAt(0).toUpperCase())}</div>`;
  },
  postLimit:  p => Prof.isAdmin(p)?T.LIMITS.post.admin:Prof.isVerified(p)?T.LIMITS.post.verified:T.LIMITS.post.free,
  msgLimit:   p => Prof.isAdmin(p)?T.LIMITS.msg.admin:Prof.isVerified(p)?T.LIMITS.msg.verified:T.LIMITS.msg.free,
};

// ── AUTH ─────────────────────────────────────────────────────
const Auth = {
  async init(cb) {
    const {data:{session}} = await sb.auth.getSession();
    if(session?.user) {
      T.state.user = session.user;
      await Auth.loadProfile(session.user);
    }
    Theme.init();
    Nav.render();
    if(cb) cb(T.state.user, T.state.profile);
  },
  async loadProfile(user) {
    const {data} = await sb.from('profiles').select('*').eq('id',user.id).single();
    if(data) {
      T.state.profile = data;
    } else {
      const name = user.user_metadata?.full_name||user.email.split('@')[0];
      const av   = user.user_metadata?.avatar_url||null;
      const row  = {id:user.id,full_name:name,email:user.email,avatar_url:av,is_admin:user.email===T.ADMIN};
      await sb.from('profiles').upsert(row);
      T.state.profile = row;
    }
  },
  async logout() {
    await sb.auth.signOut();
    T.state.user=null; T.state.profile=null;
    window.location.href='/landing.html';
  }
};

// ── NAV ──────────────────────────────────────────────────────
const Nav = {
  render() {
    const el = document.getElementById('_nav');
    if(!el) return;
    const p    = T.state.profile;
    const u    = T.state.user;
    const page = el.dataset.page||'';
    const li   = !!u;
    const isAdmin = Prof.isAdmin(p);
    const isVer   = Prof.isVerified(p);
    const av      = p?.avatar_url;
    const name    = p?.full_name||'';
    const initials= name.charAt(0).toUpperCase()||'T';
    el.innerHTML = `
    <nav class="nav">
      <div class="nav-inner">
        <a class="wordmark" href="${li?'/':'/landing.html'}">Truely</a>
        <div class="nav-center">
          <a class="nav-lnk${page==='home'?' active':''}" href="/">
            <svg viewBox="0 0 24 24" fill="${page==='home'?'currentColor':'none'}" stroke="currentColor" stroke-width="2" width="20"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </a>
          <a class="nav-lnk${page==='search'?' active':''}" href="/search.html">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </a>
          <a class="nav-lnk${page==='msgs'?' active':''}" href="/messages.html">
            <svg viewBox="0 0 24 24" fill="${page==='msgs'?'currentColor':'none'}" stroke="currentColor" stroke-width="2" width="20"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </a>
          <a class="nav-lnk${page==='notifs'?' active':''}" href="/notifications.html" style="position:relative">
            <svg viewBox="0 0 24 24" fill="${page==='notifs'?'currentColor':'none'}" stroke="currentColor" stroke-width="2" width="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span id="ndot" class="ndot" style="display:none"></span>
          </a>
          ${isAdmin?`<a class="nav-lnk" href="/admin.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></a>`:''}
        </div>
        <div class="nav-right">
          <button class="icon-btn theme-toggle" onclick="Theme.toggle()"><span class="theme-icon">☀️</span></button>
          ${li ? `
          <div class="av-wrap" id="av-wrap">
            <div class="av av-sm${Prof.ring(p)}" id="nav-av" onclick="Nav.toggleDD(event)" style="cursor:pointer">${av?`<img src="${av}"/>`:initials}</div>
            <div class="dd" id="nav-dd">
              <div class="dd-head">
                <div class="av av-md${Prof.ring(p)}">${av?`<img src="${av}"/>`:initials}</div>
                <div>
                  <div class="dd-name">${esc(name)}${Prof.badge(p)}</div>
                  <div class="dd-email">${esc(u?.email||'')}</div>
                  <span class="dd-tag ${isAdmin?'tag-admin':isVer?'tag-verified':'tag-free'}">${isAdmin?'Admin':isVer?'Verified':'Free'}</span>
                </div>
              </div>
              <a class="dd-item" href="/profile.html?id=${u?.id}">View Profile</a>
              <a class="dd-item" href="/settings.html">Settings</a>
              ${!isAdmin&&!isVer?`<a class="dd-item" href="/settings.html#verify">Get Verified</a>`:''}
              <div class="dd-div"></div>
              <div class="dd-item dd-danger" onclick="Auth.logout()">Sign out</div>
            </div>
          </div>` : `
          <a class="btn-ghost" href="/landing.html">Sign in</a>
          <a class="btn-pri btn-sm" href="/landing.html#signup">Join</a>`}
        </div>
      </div>
    </nav>
    <!-- MOBILE BOTTOM NAV -->
    <div class="mob-nav">
      <a class="mob-lnk${page==='home'?' active':''}" href="/"><svg viewBox="0 0 24 24" fill="${page==='home'?'currentColor':'none'}" stroke="currentColor" stroke-width="2" width="22"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></a>
      <a class="mob-lnk${page==='search'?' active':''}" href="/search.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></a>
      ${li?`<button class="mob-compose" onclick="window.Compose&&Compose.open()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="22"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>`:'<div></div>'}
      <a class="mob-lnk${page==='msgs'?' active':''}" href="/messages.html"><svg viewBox="0 0 24 24" fill="${page==='msgs'?'currentColor':'none'}" stroke="currentColor" stroke-width="2" width="22"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></a>
      <a class="mob-lnk${page==='notifs'?' active':''}" href="/notifications.html" style="position:relative"><svg viewBox="0 0 24 24" fill="${page==='notifs'?'currentColor':'none'}" stroke="currentColor" stroke-width="2" width="22"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><span id="ndot2" class="ndot" style="display:none"></span></a>
    </div>`;
    Nav.checkNotifs();
  },
  toggleDD(e) {
    e.stopPropagation();
    document.getElementById('nav-dd')?.classList.toggle('open');
  },
  async checkNotifs() {
    if(!T.state.user) return;
    const {data} = await sb.from('notifications').select('id',{count:'exact'}).eq('user_id',T.state.user.id).eq('is_read',false);
    const show = data && data.length>0;
    ['ndot','ndot2'].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display=show?'block':'none'; });
  }
};
document.addEventListener('click',()=>document.getElementById('nav-dd')?.classList.remove('open'));

// ── SHARED CSS ───────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');
:root[data-theme="dark"]{--bg:#080810;--bg2:#0f0f1a;--card:#13131f;--border:#1e1e30;--text:#eeeef8;--sub:#888899;--sub2:#aaaabc;--hover:#1a1a28;}
:root[data-theme="light"]{--bg:#f5f4fc;--bg2:#ffffff;--card:#ffffff;--border:#e8e6f5;--text:#0a0a18;--sub:#8888aa;--sub2:#6666aa;--hover:#f0eefc;}
:root{--ind:#4f46e5;--ind2:#6366f1;--cyan:#06b6d4;--gold:#f59e0b;--red:#ef4444;--green:#10b981;--rad:14px;}
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;-webkit-font-smoothing:antialiased;}
a{color:inherit;text-decoration:none;}
img{display:block;max-width:100%;}
::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px;}

/* NAV */
.nav{position:fixed;top:0;left:0;right:0;z-index:200;background:var(--bg);border-bottom:1px solid var(--border);height:52px;}
.nav-inner{max-width:1200px;margin:0 auto;padding:0 20px;height:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;}
.wordmark{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;background:linear-gradient(135deg,var(--ind),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.5px;}
.nav-center{display:flex;align-items:center;gap:4px;}
.nav-lnk{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--sub);transition:all .15s;position:relative;}
.nav-lnk:hover,.nav-lnk.active{color:var(--text);background:var(--hover);}
.nav-right{display:flex;align-items:center;gap:8px;}
.icon-btn{width:36px;height:36px;border-radius:9px;border:1px solid var(--border);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;color:var(--text);transition:all .15s;}
.icon-btn:hover{background:var(--hover);}

/* AVATAR DROPDOWN */
.av-wrap{position:relative;}
.dd{display:none;position:absolute;top:44px;right:0;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:6px;min-width:220px;z-index:999;box-shadow:0 20px 60px rgba(0,0,0,.25);}
.dd.open{display:block;animation:popIn .15s ease;}
@keyframes popIn{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
.dd-head{padding:10px;border-bottom:1px solid var(--border);margin-bottom:4px;display:flex;gap:10px;align-items:center;}
.dd-name{font-family:'Syne',sans-serif;font-weight:700;font-size:14px;display:flex;align-items:center;}
.dd-email{font-size:12px;color:var(--sub);margin-top:1px;}
.dd-tag{display:inline-block;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;margin-top:5px;letter-spacing:.3px;}
.tag-free{background:var(--border);color:var(--sub);}
.tag-verified{background:rgba(6,182,212,.15);color:var(--cyan);}
.tag-admin{background:rgba(245,158,11,.15);color:var(--gold);}
.dd-item{display:flex;align-items:center;padding:9px 10px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;color:var(--text);transition:background .12s;}
.dd-item:hover{background:var(--hover);}
.dd-danger{color:var(--red);}
.dd-div{height:1px;background:var(--border);margin:4px 0;}
.ndot{width:7px;height:7px;background:var(--red);border-radius:50%;position:absolute;top:4px;right:4px;border:2px solid var(--bg);}

/* AVATAR */
.av{border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:700;color:var(--text);overflow:hidden;flex-shrink:0;border:2px solid transparent;}
.av img{width:100%;height:100%;object-fit:cover;border-radius:50%;}
.av-xs{width:28px;height:28px;font-size:11px;}
.av-sm{width:36px;height:36px;font-size:14px;}
.av-md{width:44px;height:44px;font-size:17px;}
.av-lg{width:60px;height:60px;font-size:24px;}
.av-xl{width:80px;height:80px;font-size:32px;}
.ring-verified{border-color:var(--cyan)!important;}
.ring-admin{border-color:var(--gold)!important;}

/* BUTTONS */
.btn-pri{background:var(--ind);color:#fff;border:none;border-radius:100px;padding:9px 20px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:14px;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:6px;}
.btn-pri:hover{background:var(--ind2);transform:translateY(-1px);box-shadow:0 4px 20px rgba(79,70,229,.35);}
.btn-ghost{background:transparent;border:1px solid var(--border);color:var(--text);border-radius:100px;padding:8px 18px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:14px;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px;}
.btn-ghost:hover{border-color:var(--ind);color:var(--ind);}
.btn-sm{padding:6px 14px;font-size:13px;}
.btn-full{width:100%;justify-content:center;padding:12px;border-radius:12px;}
.btn-danger{background:var(--red);color:#fff;border:none;border-radius:100px;padding:9px 20px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:14px;cursor:pointer;}

/* LAYOUT */
.page-root{padding-top:52px;min-height:100vh;}
.center-wrap{max-width:600px;margin:0 auto;}
.wide-wrap{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 300px;gap:0;align-items:start;}
.feed-col{border-left:1px solid var(--border);border-right:1px solid var(--border);}
.side-col{padding:16px;position:sticky;top:68px;}

/* FORMS */
.field{margin-bottom:14px;}
.field label{display:block;font-size:12px;font-weight:600;letter-spacing:.4px;color:var(--sub2);margin-bottom:6px;text-transform:uppercase;}
.field input,.field textarea{width:100%;padding:11px 14px;border-radius:10px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:all .2s;}
.field input:focus,.field textarea:focus{border-color:var(--ind);box-shadow:0 0 0 3px rgba(79,70,229,.1);}
.field textarea{resize:none;}
.err-msg{font-size:13px;padding:10px 14px;border-radius:9px;border:1px solid rgba(239,68,68,.25);background:rgba(239,68,68,.08);color:var(--red);display:none;}
.err-msg.show{display:block;}
.ok-msg{font-size:13px;padding:10px 14px;border-radius:9px;border:1px solid rgba(16,185,129,.25);background:rgba(16,185,129,.08);color:var(--green);display:none;}
.ok-msg.show{display:block;}
.or-line{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--sub);margin:14px 0;}
.or-line::before,.or-line::after{content:'';flex:1;height:1px;background:var(--border);}
.btn-google{width:100%;padding:11px;border-radius:10px;border:1px solid var(--border);background:var(--card);color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:all .15s;}
.btn-google:hover{border-color:var(--ind);background:var(--hover);}

/* POST CARD */
.post{border-bottom:1px solid var(--border);padding:14px 16px;cursor:pointer;transition:background .12s;animation:riseIn .25s ease both;}
.post:hover{background:var(--hover);}
@keyframes riseIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.post-row{display:flex;gap:12px;}
.post-body{flex:1;min-width:0;}
.post-meta{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:5px;}
.post-name{font-family:'Syne',sans-serif;font-weight:700;font-size:15px;cursor:pointer;transition:color .12s;}
.post-name:hover{color:var(--ind);}
.post-handle{font-size:13px;color:var(--sub);}
.post-dot{font-size:13px;color:var(--sub);}
.post-time{font-size:13px;color:var(--sub);font-variant-numeric:tabular-nums;}
.post-text{font-size:15px;line-height:1.65;color:var(--text);white-space:pre-wrap;word-break:break-word;margin-bottom:10px;}
.post-img{border-radius:12px;max-height:400px;width:100%;object-fit:cover;margin-bottom:10px;border:1px solid var(--border);}
.hashtag{color:var(--ind);font-weight:500;}
.hashtag:hover{text-decoration:underline;}
.repost-label{font-size:12px;color:var(--sub);display:flex;align-items:center;gap:4px;margin-bottom:8px;}

/* POST ACTIONS */
.post-acts{display:flex;align-items:center;gap:0;margin-top:2px;}
.act{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:100px;border:none;background:transparent;cursor:pointer;font-family:'DM Mono',monospace;font-size:13px;font-weight:400;color:var(--sub);transition:all .15s;}
.act svg{width:17px;height:17px;transition:transform .15s;}
.act:hover{background:var(--hover);}
.act.act-like:hover,.act.act-like.on{color:var(--red);}
.act.act-like:hover{background:rgba(239,68,68,.08);}
.act.act-like.on svg{fill:var(--red);stroke:var(--red);}
.act.act-like.on{animation:likePop .2s ease;}
@keyframes likePop{0%{transform:scale(1)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
.act.act-cmt:hover{color:var(--ind);background:rgba(79,70,229,.08);}
.act.act-rep:hover{color:var(--green);background:rgba(16,185,129,.08);}
.act.act-rep.on{color:var(--green);}
.act.act-share:hover{color:var(--cyan);background:rgba(6,182,212,.08);}
.act.act-del:hover{color:var(--red);background:rgba(239,68,68,.08);}

/* COMPOSE */
.compose{border-bottom:1px solid var(--border);padding:14px 16px;}
.compose-row{display:flex;gap:12px;}
.compose-right{flex:1;}
.compose-ta{width:100%;background:transparent;border:none;outline:none;font-family:'DM Sans',sans-serif;font-size:16px;color:var(--text);resize:none;line-height:1.6;min-height:72px;}
.compose-ta::placeholder{color:var(--sub);}
.compose-foot{display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border);margin-top:8px;}
.compose-tools{display:flex;align-items:center;gap:4px;}
.ring-wrap{position:relative;width:28px;height:28px;}
.ring-svg{transform:rotate(-90deg);}
.ring-svg circle{transition:stroke-dashoffset .2s;}
.ring-count{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'DM Mono',monospace;font-size:9px;color:var(--sub);}
.img-preview{position:relative;margin-top:10px;display:inline-block;}
.img-preview img{max-height:200px;border-radius:10px;border:1px solid var(--border);}
.img-preview-del{position:absolute;top:6px;right:6px;width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,.7);border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;}

/* TABS */
.tabs{display:flex;border-bottom:1px solid var(--border);}
.tab{flex:1;padding:13px;text-align:center;font-size:14px;font-weight:600;color:var(--sub);cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;}
.tab:hover{color:var(--text);}
.tab.on{color:var(--text);border-bottom-color:var(--ind);}

/* SKELETON */
.skel{background:linear-gradient(90deg,var(--card) 25%,var(--border) 50%,var(--card) 75%);background-size:200%;animation:shimmer 1.4s infinite;border-radius:6px;}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.skel-post{padding:14px 16px;border-bottom:1px solid var(--border);display:flex;gap:12px;}
.skel-av{width:44px;height:44px;border-radius:50%;flex-shrink:0;}
.skel-lines{flex:1;}
.skel-line{height:11px;margin-bottom:8px;border-radius:4px;}

/* EMPTY / LOADING */
.empty{text-align:center;padding:56px 24px;color:var(--sub);}
.empty-icon{font-size:40px;margin-bottom:10px;}
.spinner{width:28px;height:28px;border:2px solid var(--border);border-top-color:var(--ind);border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 10px;}
@keyframes spin{to{transform:rotate(360deg)}}

/* COMMENTS SHEET */
.sheet-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:300;backdrop-filter:blur(4px);}
.sheet-bg.open{display:block;}
.sheet{position:fixed;bottom:0;left:0;right:0;max-width:640px;margin:0 auto;background:var(--card);border-radius:20px 20px 0 0;border-top:1px solid var(--border);max-height:80vh;display:flex;flex-direction:column;transform:translateY(100%);transition:transform .3s cubic-bezier(.32,.72,0,1);z-index:301;}
.sheet.open{transform:translateY(0);}
.sheet-handle{width:36px;height:4px;background:var(--border);border-radius:2px;margin:10px auto 0;}
.sheet-head{padding:14px 16px;border-bottom:1px solid var(--border);font-family:'Syne',sans-serif;font-weight:700;font-size:16px;}
.sheet-body{overflow-y:auto;flex:1;}
.sheet-foot{padding:10px 14px;border-top:1px solid var(--border);display:flex;gap:8px;align-items:center;}
.cmt-input{flex:1;padding:10px 14px;border-radius:100px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border .2s;}
.cmt-input:focus{border-color:var(--ind);}
.cmt-send{width:36px;height:36px;border-radius:50%;background:var(--ind);border:none;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.cmt-send:hover{background:var(--ind2);}
.cmt-item{display:flex;gap:10px;padding:12px 16px;border-bottom:1px solid var(--border);animation:riseIn .2s ease;}
.cmt-bubble{flex:1;}
.cmt-meta{display:flex;align-items:center;gap:4px;margin-bottom:3px;font-size:13px;}
.cmt-name{font-weight:600;display:flex;align-items:center;}
.cmt-time{color:var(--sub);}
.cmt-text{font-size:14px;line-height:1.55;}
.cmt-del{background:none;border:none;color:var(--sub);cursor:pointer;font-size:11px;padding:2px 5px;margin-left:auto;}
.cmt-del:hover{color:var(--red);}

/* NEW POSTS PILL */
.new-pill{display:none;position:sticky;top:52px;z-index:10;padding:8px 16px;}
.new-pill-inner{background:var(--ind);color:#fff;font-size:13px;font-weight:600;border-radius:100px;padding:8px 16px;cursor:pointer;text-align:center;box-shadow:0 4px 20px rgba(79,70,229,.4);transition:transform .15s;}
.new-pill-inner:hover{transform:scale(1.02);}

/* SIDEBAR */
.side-card{background:var(--card);border:1px solid var(--border);border-radius:var(--rad);padding:14px;margin-bottom:12px;}
.side-title{font-family:'Syne',sans-serif;font-weight:800;font-size:16px;margin-bottom:12px;}
.trend-item{padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;}
.trend-item:last-child{border-bottom:none;}
.trend-tag{font-weight:600;font-size:14px;color:var(--ind);}
.trend-count{font-size:12px;color:var(--sub);margin-top:1px;}
.who-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);}
.who-item:last-child{border-bottom:none;}
.who-name{font-weight:600;font-size:14px;display:flex;align-items:center;cursor:pointer;}
.who-name:hover{color:var(--ind);}
.who-sub{font-size:12px;color:var(--sub);}
.who-right{margin-left:auto;}
.follow-pill{padding:5px 14px;border-radius:100px;background:var(--text);color:var(--bg);border:none;font-family:'DM Sans',sans-serif;font-weight:600;font-size:12px;cursor:pointer;transition:all .15s;}
.follow-pill:hover{opacity:.85;}
.follow-pill.on{background:transparent;border:1px solid var(--border);color:var(--text);}

/* PROFILE PAGE */
.prof-cover{height:160px;background:linear-gradient(135deg,var(--ind),var(--cyan));position:relative;overflow:hidden;}
.prof-cover img{width:100%;height:100%;object-fit:cover;}
.prof-head{padding:0 16px 16px;border-bottom:1px solid var(--border);}
.prof-av-wrap{margin-top:-40px;margin-bottom:10px;}
.prof-top-row{display:flex;justify-content:flex-end;gap:8px;padding-top:12px;}
.prof-name{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;display:flex;align-items:center;gap:4px;}
.prof-handle{font-size:14px;color:var(--sub);margin-top:1px;}
.prof-bio{font-size:15px;line-height:1.6;margin-top:10px;}
.prof-stats{display:flex;gap:20px;margin-top:12px;}
.stat{cursor:pointer;}
.stat-n{font-family:'DM Mono',monospace;font-weight:500;font-size:17px;}
.stat-l{font-size:13px;color:var(--sub);}
.stat:hover .stat-n{color:var(--ind);}
.follow-btn{padding:8px 20px;border-radius:100px;font-weight:700;font-size:14px;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;transition:all .15s;}
.follow-btn.follow{background:var(--text);color:var(--bg);}
.follow-btn.follow:hover{opacity:.85;}
.follow-btn.following{background:transparent;border:1px solid var(--border);color:var(--text);}
.follow-btn.following:hover{border-color:var(--red);color:var(--red);}

/* MESSAGES */
.msg-layout{display:flex;height:calc(100vh - 52px);}
.msg-side{width:280px;border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;}
.msg-head{padding:14px 16px;border-bottom:1px solid var(--border);}
.msg-head h2{font-family:'Syne',sans-serif;font-weight:800;font-size:17px;}
.search-pill{width:100%;padding:8px 12px;border-radius:100px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;font-size:13px;outline:none;margin-top:10px;}
.search-pill:focus{border-color:var(--ind);}
.conv-list{flex:1;overflow-y:auto;}
.conv{display:flex;gap:10px;align-items:center;padding:12px 14px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .12s;}
.conv:hover,.conv.on{background:var(--hover);}
.conv-info{flex:1;min-width:0;}
.conv-name{font-weight:600;font-size:14px;display:flex;align-items:center;gap:3px;}
.conv-prev{font-size:12px;color:var(--sub);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px;}
.chat-area{flex:1;display:flex;flex-direction:column;}
.chat-head{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;}
.chat-head-name{font-family:'Syne',sans-serif;font-weight:700;font-size:15px;display:flex;align-items:center;gap:4px;}
.chat-ttl{font-size:11px;color:var(--red);font-weight:700;letter-spacing:.3px;margin-top:1px;}
.msgs-list{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px;}
.bbl-wrap{display:flex;gap:8px;align-items:flex-end;}
.bbl-wrap.mine{flex-direction:row-reverse;}
.bbl{max-width:72%;padding:9px 13px;border-radius:16px;font-size:14px;line-height:1.5;position:relative;}
.bbl-wrap.mine .bbl{background:var(--ind);color:#fff;border-bottom-right-radius:4px;}
.bbl-wrap.other .bbl{background:var(--card);border:1px solid var(--border);border-bottom-left-radius:4px;}
.bbl img{max-width:180px;border-radius:8px;margin-top:5px;}
.bbl-meta{font-size:10px;opacity:.55;margin-top:4px;display:flex;align-items:center;gap:4px;}
.bbl-bar{height:2px;border-radius:2px;margin-top:5px;transition:width linear 1s;}
.bbl-wrap.mine .bbl-bar{background:rgba(255,255,255,.25);}
.bbl-wrap.other .bbl-bar{background:rgba(79,70,229,.25);}
.chat-foot{padding:10px 14px;border-top:1px solid var(--border);display:flex;gap:8px;align-items:center;}
.chat-meta{font-size:11px;color:var(--sub);text-align:center;padding:6px;letter-spacing:.2px;}
.msg-in{flex:1;padding:10px 14px;border-radius:100px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border .15s;}
.msg-in:focus{border-color:var(--ind);}
.send-btn{width:38px;height:38px;border-radius:50%;background:var(--ind);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;}
.send-btn:hover{background:var(--ind2);}
.send-btn svg{fill:white;width:17px;height:17px;}
.img-attach{width:34px;height:34px;border-radius:50%;border:1px solid var(--border);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--sub);transition:all .15s;flex-shrink:0;}
.img-attach:hover{border-color:var(--cyan);color:var(--cyan);}
.msg-limit{font-size:11px;color:var(--sub);margin-bottom:6px;display:flex;justify-content:space-between;}
.msg-limit .mc{font-family:'DM Mono',monospace;}
.mc.warn{color:var(--gold);}
.mc.over{color:var(--red);}
.no-conv{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--sub);gap:8px;}

/* NOTIFICATIONS */
.notif{display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .12s;animation:riseIn .25s ease;}
.notif:hover{background:var(--hover);}
.notif.unread{background:rgba(79,70,229,.04);border-left:3px solid var(--ind);}
.notif-icon{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
.ni-like{background:rgba(239,68,68,.1);}
.ni-cmt{background:rgba(79,70,229,.1);}
.ni-follow{background:rgba(6,182,212,.1);}
.ni-rep{background:rgba(16,185,129,.1);}
.notif-text{flex:1;font-size:14px;line-height:1.5;}
.notif-text b{font-weight:700;}
.notif-time{font-size:12px;color:var(--sub);margin-top:2px;}

/* SEARCH */
.search-bar-wrap{padding:12px 16px;border-bottom:1px solid var(--border);position:sticky;top:52px;background:var(--bg);z-index:10;}
.search-bar{display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--border);border-radius:100px;padding:10px 16px;}
.search-bar svg{color:var(--sub);flex-shrink:0;}
.search-bar input{flex:1;background:transparent;border:none;outline:none;font-family:'DM Sans',sans-serif;font-size:15px;color:var(--text);}

/* SETTINGS */
.settings-wrap{max-width:560px;margin:0 auto;padding:24px 16px;}
.settings-section{background:var(--card);border:1px solid var(--border);border-radius:var(--rad);padding:20px;margin-bottom:16px;}
.settings-title{font-family:'Syne',sans-serif;font-weight:800;font-size:17px;margin-bottom:16px;}

/* ADMIN */
.admin-wrap{max-width:900px;margin:0 auto;padding:24px 16px;}
.admin-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:24px;}
.stat-card{background:var(--card);border:1px solid var(--border);border-radius:var(--rad);padding:16px;}
.stat-card .n{font-family:'DM Mono',monospace;font-size:28px;font-weight:500;color:var(--ind);}
.stat-card .l{font-size:13px;color:var(--sub);margin-top:2px;}
.admin-table{width:100%;border-collapse:collapse;font-size:14px;}
.admin-table th{text-align:left;padding:10px 12px;border-bottom:1px solid var(--border);font-size:12px;font-weight:700;letter-spacing:.4px;color:var(--sub);text-transform:uppercase;}
.admin-table td{padding:10px 12px;border-bottom:1px solid var(--border);}
.admin-table tr:hover td{background:var(--hover);}
.badge-pill{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;}
.bp-admin{background:rgba(245,158,11,.15);color:var(--gold);}
.bp-ver{background:rgba(6,182,212,.15);color:var(--cyan);}
.bp-free{background:var(--border);color:var(--sub);}
.bp-banned{background:rgba(239,68,68,.15);color:var(--red);}
.tbl-act{background:none;border:none;cursor:pointer;font-size:12px;font-weight:600;padding:3px 8px;border-radius:6px;font-family:'DM Sans',sans-serif;}
.tbl-act:hover{background:var(--hover);}
.tbl-act.danger{color:var(--red);}
.tbl-act.cyan{color:var(--cyan);}
.tbl-act.gold{color:var(--gold);}

/* LANDING */
.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:80px 24px;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(79,70,229,.12) 0%,transparent 70%);}
.hero-inner{max-width:560px;text-align:center;}
.hero-wordmark{font-family:'Syne',sans-serif;font-size:52px;font-weight:800;background:linear-gradient(135deg,var(--ind),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:16px;letter-spacing:-2px;}
.hero-sub{font-size:20px;color:var(--sub2);line-height:1.6;margin-bottom:40px;}
.hero-cta{display:flex;flex-direction:column;gap:12px;max-width:360px;margin:0 auto;}
.auth-card{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:32px;max-width:400px;width:100%;margin:0 auto;}
.auth-logo{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;background:linear-gradient(135deg,var(--ind),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px;}
.auth-sub{font-size:14px;color:var(--sub);margin-bottom:22px;}
.auth-switch{text-align:center;margin-top:16px;font-size:13px;color:var(--sub);}
.auth-switch a{color:var(--ind);cursor:pointer;font-weight:600;}
.feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:60px 24px;max-width:900px;margin:0 auto;}
.feat{text-align:center;padding:20px;}
.feat-icon{font-size:32px;margin-bottom:10px;}
.feat-title{font-family:'Syne',sans-serif;font-weight:700;font-size:16px;margin-bottom:6px;}
.feat-text{font-size:14px;color:var(--sub);line-height:1.6;}

/* TOAST */
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(70px);background:var(--text);color:var(--bg);padding:11px 20px;border-radius:100px;font-size:14px;font-weight:600;z-index:9999;pointer-events:none;white-space:nowrap;transition:transform .25s cubic-bezier(.32,.72,0,1);}
.toast.show{transform:translateX(-50%) translateY(0);}
.toast.toast-err{background:var(--red);color:#fff;}

/* MOBILE */
.mob-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:200;background:var(--bg);border-top:1px solid var(--border);height:52px;padding:0 8px;align-items:center;justify-content:space-around;}
.mob-lnk{width:40px;height:40px;display:flex;align-items:center;justify-content:center;color:var(--sub);border-radius:10px;position:relative;}
.mob-lnk.active{color:var(--text);}
.mob-compose{width:44px;height:44px;border-radius:50%;background:var(--ind);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;}
@media(max-width:768px){
  .mob-nav{display:flex;}
  .page-root{padding-bottom:60px;}
  .wide-wrap{grid-template-columns:1fr;}
  .side-col{display:none;}
  .nav-center{display:none;}
  .feed-col{border:none;}
  .msg-side{width:100%;}
  .chat-area{display:none;}
  .msg-side.hide{display:none;}
  .chat-area.show{display:flex;}
  .feat-grid{grid-template-columns:1fr;}
}
`;
