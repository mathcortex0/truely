const { createClient } = supabase;
const sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// Helper: Get current user + profile data
async function getCurrentUser() {
    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return null;

        // Fetch profile to get is_admin, username, avatar
        const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
        
        return { 
            ...user, 
            ...profile 
        };
    } catch (error) {
        console.error("Error getting user:", error);
        return null;
    }
}
