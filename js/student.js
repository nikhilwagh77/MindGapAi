/* ----------------------------------------------------
   MindGap AI - Student Platform Controller
   Team CodeSmiths
   ---------------------------------------------------- */

window.StudentPortalController = {
    scoreTrendChart: null,
    testTypeChart: null,
    mcqTimerInterval: null,
    mcqTimeLeftSeconds: 300, // 5 minutes
    isRecordingSpeech: false,

    init: function() {
        this.bindEvents();
        this.renderStudentNotes();
        this.renderCommonFeedback();
        this.renderMCQTest();
        this.renderRapidFireTest();
    },

    renderCommonFeedback: function() {
        const banner = document.getElementById('common-feedback-banner');
        const textEl = document.getElementById('common-feedback-text');
        const feedback = window.MINDGAP_DATA && MINDGAP_DATA.commonTeacherFeedback;

        if (feedback && feedback.trim()) {
            if (textEl) textEl.textContent = feedback;
            if (banner) banner.classList.remove('hidden');
        } else {
            if (banner) banner.classList.add('hidden');
        }
    },

    bindEvents: function() {
        // CTA Take Assessment Button
        const btnCta = document.getElementById('btn-start-assessment-cta');
        if (btnCta) {
            btnCta.addEventListener('click', () => {
                if (window.AppController) {
                    window.AppController.switchTab('student-assessment');
                }
            });
        }

        // Submit MCQ Answers
        const btnSubmitMcq = document.getElementById('btn-submit-mcq');
        if (btnSubmitMcq) {
            btnSubmitMcq.addEventListener('click', () => this.submitMCQTest());
        }

        // Submit Rapid Fire Answers
        const btnSubmitRf = document.getElementById('btn-submit-rf');
        if (btnSubmitRf) {
            btnSubmitRf.addEventListener('click', () => this.submitRapidFireTest());
        }

        // Student Live Speech Recording
        const btnRecordSpeech = document.getElementById('btn-student-record-speech');
        if (btnRecordSpeech) {
            btnRecordSpeech.addEventListener('click', () => this.toggleSpeechRecording());
        }

        // Submit Speech Recording
        const btnSubmitSpeech = document.getElementById('btn-submit-speech-test');
        if (btnSubmitSpeech) {
            btnSubmitSpeech.addEventListener('click', () => this.submitSpeechTest());
        }
    },

    /* --- PAGE 1: TODAY'S NOTES (READING VIEW) --- */
    renderStudentNotes: function() {
        const container = document.getElementById('student-notes-grid');
        if (!container) return;

        const notes = MINDGAP_DATA.teacherNotes || [];
        let html = '';
        notes.forEach(note => {
            html += `
                <div class="note-card" style="border-top:3px solid #7c3aed;">
                    <div class="note-header">
                        <span class="badge badge-purple">${note.subject}</span>
                        <span style="font-size:11px; color:#64748b; font-weight:600;"><i class="fa-solid fa-clock"></i> ${note.date}</span>
                    </div>
                    <div class="note-title">${note.title}</div>
                    <div class="note-body" style="border-left-color:#7c3aed;">${note.content}</div>
                    <div class="note-footer">
                        <span class="attachment-pill"><i class="fa-solid fa-paperclip"></i> ${note.fileAttachment}</span>
                        <span style="font-size:12px; color:#059669; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Published by ${note.author}</span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /* --- PAGE 2: ASSESSMENT FLOW HUB --- */
    renderMCQTest: function() {
        const container = document.getElementById('mcq-questions-container');
        if (!container) return;

        const test = MINDGAP_DATA.assessmentTests.mcq;
        let html = '';

        test.questions.forEach((q, idx) => {
            html += `
                <div class="question-block">
                    <div class="q-title">Question ${idx + 1} of ${test.questions.length}</div>
                    <div class="q-text">${q.text}</div>
                    <div class="q-options">
                        ${q.options.map(opt => `
                            <label style="display:flex; align-items:center; gap:10px; padding:10px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:var(--radius-sm); cursor:pointer; font-size:13px; font-weight:600;">
                                <input type="radio" name="mcq-${q.id}" value="${opt.id}">
                                <span>${opt.text}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        html += `
            <div style="text-align:right; margin-top:20px;">
                <button class="btn btn-primary" id="btn-submit-mcq-inner" onclick="StudentPortalController.submitMCQTest()">
                    <i class="fa-solid fa-paper-plane"></i> Submit MCQ Answers
                </button>
            </div>
        `;

        container.innerHTML = html;
        this.startMCQTimer();
    },

    startMCQTimer: function() {
        if (this.mcqTimerInterval) clearInterval(this.mcqTimerInterval);
        this.mcqTimeLeftSeconds = 300;

        const clock = document.getElementById('mcq-timer-clock');
        this.mcqTimerInterval = setInterval(() => {
            this.mcqTimeLeftSeconds--;
            const mins = Math.floor(this.mcqTimeLeftSeconds / 60);
            const secs = this.mcqTimeLeftSeconds % 60;
            if (clock) {
                clock.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }

            if (this.mcqTimeLeftSeconds <= 0) {
                clearInterval(this.mcqTimerInterval);
                alert('Time expired! Auto-submitting MCQ assessment.');
                this.submitMCQTest();
            }
        }, 1000);
    },

    submitMCQTest: function() {
        if (this.mcqTimerInterval) clearInterval(this.mcqTimerInterval);
        alert('🎉 MCQ Assessment Submitted Successfully!\nScore: 3/3 (100%)\nAI Feedback: High accuracy on kinematics equations.');
        switchAssessmentSubTab('rapidfire');
    },

    renderRapidFireTest: function() {
        const container = document.getElementById('rf-questions-container');
        if (!container) return;

        const test = MINDGAP_DATA.assessmentTests.rapidFire;
        let html = '';

        test.questions.forEach((q, idx) => {
            html += `
                <div class="question-block">
                    <div class="q-title"><i class="fa-solid fa-bolt icon-gold"></i> Rapid Check #${idx + 1}</div>
                    <div class="q-text">${q.prompt}</div>
                    <input type="text" class="rapid-fire-input" placeholder="${q.placeholder}" id="rf-input-${q.id}">
                </div>
            `;
        });

        html += `
            <div style="text-align:right; margin-top:20px;">
                <button class="btn btn-accent" onclick="StudentPortalController.submitRapidFireTest()">
                    <i class="fa-solid fa-bolt"></i> Submit Rapid Fire Responses
                </button>
            </div>
        `;

        container.innerHTML = html;
    },

    submitRapidFireTest: function() {
        alert('⚡ Rapid Fire Test Submitted!\nResponse Speed: 1.4s per question (Fast)\nAccuracy: 100%');
        switchAssessmentSubTab('speech');
    },

    toggleSpeechRecording: function() {
        const vis = document.getElementById('student-speech-mic-vis');
        const status = document.getElementById('student-speech-status');
        const btn = document.getElementById('btn-student-record-speech');
        const transcript = document.getElementById('student-speech-transcript');

        this.isRecordingSpeech = !this.isRecordingSpeech;

        if (this.isRecordingSpeech) {
            if (vis) vis.classList.add('recording');
            if (status) status.textContent = '🎙️ Recording student speech... Speak now!';
            if (btn) btn.style.background = '#dc2626';
            if (transcript) transcript.textContent = 'Listening to spoken explanation...';
        } else {
            if (vis) vis.classList.remove('recording');
            if (status) status.textContent = '✅ Speech recorded (18s duration). Click Submit.';
            if (btn) btn.style.background = '#7c3aed';
            if (transcript) {
                transcript.textContent = '"I calculated time by setting apex velocity to 0. Velocity formula v = u + at gives 0 = 20 + (-9.8)t, so t = 20 / 9.8 = 2.04 seconds."';
            }
        }
    },

    submitSpeechTest: function() {
        alert('🎙️ Live Speech Assessment Analyzed!\nVerbal Fluency Score: 88%\nHesitation Index: Low\nAI Recommendation: Clear understanding of vector signs.');
        if (window.AppController) {
            window.AppController.switchTab('student-performance');
        }
    },

    /* --- PAGE 3: ANALYZE YOUR PERFORMANCE --- */
    renderStudentPerformanceAnalytics: function() {
        const data = MINDGAP_DATA.studentAnalytics;

        // Populate Feedback Cards safely
        const elMcq = document.getElementById('ai-feedback-mcq');
        const elRf = document.getElementById('ai-feedback-rf');
        const elSpeech = document.getElementById('ai-feedback-speech');
        if (elMcq) elMcq.textContent = data.aiFeedback.mcq;
        if (elRf) elRf.textContent = data.aiFeedback.rapidFire;
        if (elSpeech) elSpeech.textContent = data.aiFeedback.speech;

        // Render Score Trends Chart
        const ctxTrend = document.getElementById('student-own-score-chart');
        if (ctxTrend) {
            if (this.scoreTrendChart) this.scoreTrendChart.destroy();
            this.scoreTrendChart = new Chart(ctxTrend, {
                type: 'line',
                data: {
                    labels: ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5', 'Latest'],
                    datasets: [{
                        label: 'Score %',
                        data: data.scoreTrends,
                        borderColor: '#0284c7',
                        backgroundColor: 'rgba(2, 132, 199, 0.12)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2.5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { min: 0, max: 100 } }
                }
            });
        }

        // Render Test Type Comparison Chart
        const ctxType = document.getElementById('student-own-test-type-chart');
        if (ctxType) {
            if (this.testTypeChart) this.testTypeChart.destroy();
            const labels = data.testTypeComparison.map(t => t.type);
            const scores = data.testTypeComparison.map(t => t.score);
            this.testTypeChart = new Chart(ctxType, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Score %',
                        data: scores,
                        backgroundColor: ['rgba(2, 132, 199, 0.75)', 'rgba(217, 119, 6, 0.75)', 'rgba(124, 58, 237, 0.75)'],
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { min: 0, max: 100 } }
                }
            });
        }
    }
};

// Global Helper for Assessment Subtab Switch
window.switchAssessmentSubTab = function(mode) {
    const subtabs = document.querySelectorAll('.assessment-subtab');
    const btns = document.querySelectorAll('.assessment-nav-btn');

    subtabs.forEach(s => s.classList.add('hidden'));
    btns.forEach(b => b.classList.remove('active'));

    const targetSubtab = document.getElementById(`subtab-${mode}-test`);
    const targetBtn = document.getElementById(`btn-nav-${mode}`);

    if (targetSubtab) targetSubtab.classList.remove('hidden');
    if (targetBtn) targetBtn.classList.add('active');
};
