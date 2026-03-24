// ============================================
// TRUELY - Configuration
// ============================================

const SUPABASE_URL = 'https://pwprxidlohbzfsoxrnxs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hJTweaPJGWeaNPQxbBaEPw_jR0O9xhx';
const ADMIN_EMAIL = 'alamin05052008@gmail.com';

// Limits based on user tier
const POST_LIMITS = {
  free: 280,
  verified: 600,
  admin: Infinity
};

const MSG_LIMITS = {
  free: 150,
  verified: 400,
  admin: Infinity
};

const MSG_TTL_SECONDS = 30;

// Initialize Supabase
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// Export to window
window.TruelyConfig = {
  SUPABASE_URL,
  SUPABASE_KEY,
  ADMIN_EMAIL,
  POST_LIMITS,
  MSG_LIMITS,
  MSG_TTL_SECONDS,
  sb
};
