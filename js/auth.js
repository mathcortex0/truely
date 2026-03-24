async function loginWithGoogle() {
    const { data, error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/dashboard.html',
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            }
        }
    });

    if (error) {
        console.error('Error:', error.message);
        alert("Login failed. Please try again.");
    }
}
