// 1. Create New Exam
async function createExam() {
    const title = document.getElementById('new-exam-title').value;
    const desc = document.getElementById('new-exam-desc').value;
    const price = parseFloat(document.getElementById('new-exam-price').value);
    const duration = parseInt(document.getElementById('new-exam-duration').value);
    const totalMarks = parseInt(document.getElementById('new-exam-marks').value);

    if(!title || !duration) return alert("Title and Duration are required");

    const { data, error } = await sb.from('exams').insert({
        title, description: desc, price, duration_minutes: duration, total_marks: totalMarks
    }).select().single();

    if(error) return alert(error.message);
    
    alert("Exam Created! Now upload questions.");
    loadExamSelect(data.id); // Select the new exam automatically
}

// 2. Load Exams into Dropdown
function loadExamSelect(preSelectId = null) {
    sb.from('exams').select('id, title').then(({data}) => {
        const sel = document.getElementById('import-exam-select');
        sel.innerHTML = '<option value="">Select Exam...</option>';
        data.forEach(ex => {
            const selected = ex.id == preSelectId ? 'selected' : '';
            sel.innerHTML += `<option value="${ex.id}" ${selected}>${ex.title}</option>`;
        });
    });
}

// 3. Enhanced CSV Upload (Includes Marks)
function handleCSVUpload(e) {
    const file = e.target.files[0];
    const examId = document.getElementById('import-exam-select').value;
    
    if(!examId || !file) return alert("Please select an exam and a CSV file.");

    Papa.parse(file, {
        header: true,
        complete: async (results) => {
            const questions = results.data.map(row => ({
                exam_id: parseInt(examId),
                question_text: row['Question'],
                options: JSON.stringify([row['A'], row['B'], row['C'], row['D']]),
                correct_option: parseInt(row['Correct']),
                marks: parseInt(row['Marks']) || 1 // Default to 1 if empty
            })).filter(q => q.question_text);

            const { error } = await sb.from('questions').insert(questions);
            if(error) alert("Upload Error: " + error.message);
            else alert(`Success! Imported ${questions.length} questions.`);
        }
    });
}
