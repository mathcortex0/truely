async function loadPublicProfile() {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('u'); // ?u=alamin05052008

    if(!username) window.location.href = 'dashboard.html';

    // 1. Get User Info
    const { data: profile } = await sb.from('profiles').select('*').eq('username', username).single();
    if(!profile) return alert("User not found");

    // 2. Render Header
    document.getElementById('p-avatar').src = profile.avatar_url || 'https://via.placeholder.com/100';
    document.getElementById('p-name').innerText = profile.username || profile.email;
    document.getElementById('p-email').innerText = profile.email;

    // 3. Get Submissions (History)
    const { data: subs } = await sb.from('submissions')
        .select('*, exams(title)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

    // 4. Calculate Stats
    const totalExams = subs.length;
    const avgScore = totalExams > 0 ? Math.round(subs.reduce((acc, curr) => acc + curr.score, 0) / totalExams) : 0;
    const highScore = totalExams > 0 ? Math.max(...subs.map(s => s.score)) : 0;

    document.getElementById('stat-count').innerText = totalExams;
    document.getElementById('stat-avg').innerText = avgScore + '%';
    document.getElementById('stat-high').innerText = highScore + '%';

    // 5. Render History Table
    const tbody = document.getElementById('history-body');
    tbody.innerHTML = subs.map(s => `
        <tr>
            <td>${s.exams ? s.exams.title : 'Unknown Exam'}</td>
            <td>${s.score}%</td>
            <td>${new Date(s.created_at).toLocaleDateString()}</td>
        </tr>
    `).join('');
}
