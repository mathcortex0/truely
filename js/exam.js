// ... (previous code remains same until submitExam) ...

async function submitExam() {
    clearInterval(timerInterval);
    if(!confirm("Are you sure you want to submit?")) return;

    let totalPossibleMarks = 0;
    let userObtainedMarks = 0;

    questions.forEach(q => {
        const qMark = q.marks || 1; // Default 1 if not set
        totalPossibleMarks += qMark;
        
        if(userAnswers[q.id] === q.correct_option) {
            userObtainedMarks += qMark;
        }
    });
    
    // Calculate Percentage
    const percentage = totalPossibleMarks > 0 ? Math.round((userObtainedMarks / totalPossibleMarks) * 100) : 0;

    const examId = new URLSearchParams(window.location.search).get('id');
    const user = await getCurrentUser();

    await sb.from('submissions').insert({
        user_id: user.id,
        exam_id: examId,
        score: percentage,
        answers: userAnswers
    });

    window.location.href = `result.html?score=${percentage}`;
}
