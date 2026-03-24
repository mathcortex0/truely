let realtimeChannel;

async function initDashboard() {
    const user = await getCurrentUser();
    if (!user) window.location.href = 'index.html';
    
    document.getElementById('user-display').innerHTML = `
        <a href="profile.html?u=${user.username}" style="color: inherit; text-decoration: none; font-weight: 600;">
            <img src="${user.avatar_url}" style="width:30px; border-radius:50%; vertical-align:middle; margin-right:8px;">
            ${user.username}
        </a>
    `;
    
    if (user.is_admin) {
        document.getElementById('admin-panel').style.display = 'block';
        loadExamSelect();
    }

    await loadExams(user.id);
    subscribeToLeaderboard(); // Enable Live Updates
}

async function loadExams(userId) {
    const { data: exams } = await sb.from('exams').select('*').order('created_at', { ascending: false });
    const { data: purchases } = await sb.from('purchases').select('exam_id').eq('user_id', userId);
    const purchasedIds = purchases ? purchases.map(p => p.exam_id) : [];

    const container = document.getElementById('exam-list');
    container.innerHTML = exams.map(exam => {
        const isPurchased = purchasedIds.includes(exam.id);
        const isFree = exam.price === 0;
        const actionBtn = (isFree || isPurchased) 
            ? `<a href="exam.html?id=${exam.id}" class="btn btn-primary">Start Exam</a>`
            : `<a href="purchase.html?id=${exam.id}" class="btn btn-outline">Buy $${exam.price}</a>`;

        return `
            <div class="card">
                <h3>${exam.title}</h3>
                <p style="color:var(--text-muted); margin: 0.5rem 0;">${exam.description || 'No description'}</p>
                <div style="margin: 1rem 0;">
                    <span class="price-tag">${isFree ? 'FREE' : '$' + exam.price}</span> • 
                    <span>${exam.duration_minutes} Mins</span> •
                    <span>${exam.total_marks} Marks</span>
                </div>
                ${actionBtn}
            </div>
        `;
    }).join('');

    updateLeaderboard();
}

// --- REALTIME LEADERBOARD ---
function subscribeToLeaderboard() {
    realtimeChannel = sb.channel('public:submissions')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions' }, (payload) => {
        // A new submission happened! Refresh leaderboard.
        updateLeaderboard();
    })
    .subscribe();
}

async function updateLeaderboard() {
    // Get top 5 scores across all exams
    const { data: topScores } = await sb
        .from('submissions')
        .select('score, profiles(username, avatar_url)')
        .order('score', { ascending: false })
        .limit(5);

    const list = document.getElementById('leaderboard-list');
    if(!list) return;
    
    // Remove duplicates (same user highest score)
    const uniqueUsers = [];
    const seenUsers = new Set();
    
    topScores.forEach(s => {
        if(!seenUsers.has(s.profiles.username)) {
            seenUsers.add(s.profiles.username);
            uniqueUsers.push(s);
        }
    });

    list.innerHTML = uniqueUsers.map((s, idx) => `
        <li style="display:flex; justify-content:space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-weight:bold; color:var(--primary);">#${idx+1}</span>
                <img src="${s.profiles.avatar_url}" style="width:24px; height:24px; border-radius:50%;">
                <a href="profile.html?u=${s.profiles.username}" style="text-decoration:none; color:inherit;">${s.profiles.username}</a>
            </div>
            <strong>${s.score}%</strong>
        </li>
    `).join('');
}
