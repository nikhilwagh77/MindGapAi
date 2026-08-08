/* ----------------------------------------------------
   MindGap AI - AI Interventions & Adaptive Practice
   Team CodeSmiths
   ---------------------------------------------------- */

window.InterventionsController = {
    currentProfile: null,
    userAnswers: {},

    init: function() {
        // Ready
    },

    renderInterventions: function(profile) {
        this.currentProfile = profile;
        this.userAnswers = {};

        this.renderMicroRemediation(profile.intervention);
        this.renderAdaptiveQuiz(profile.intervention.adaptiveQuiz);
    },

    renderMicroRemediation: function(intervention) {
        const body = document.getElementById('intervention-remediation-body');
        if (!body) return;

        body.innerHTML = `
            <div class="intervention-lesson">
                <h3 style="font-family:var(--font-heading); color:#fff; font-size:18px; margin-bottom:12px;">
                    ${intervention.title}
                </h3>
                <div class="lesson-content">
                    ${intervention.microLesson}
                </div>
                <div style="margin-top:20px; padding:12px; background:rgba(0,240,255,0.06); border-radius:8px; border:1px solid rgba(0,240,255,0.2);">
                    <span style="font-size:12px; font-weight:700; color:var(--primary); text-transform:uppercase;">
                        <i class="fa-solid fa-graduation-cap"></i> Mastery Goal:
                    </span>
                    <p style="font-size:13px; color:var(--text-main); margin-top:4px;">
                        Complete the follow-up verification quiz on the right to resolve this root gap in your Knowledge Graph!
                    </p>
                </div>
            </div>
        `;
    },

    renderAdaptiveQuiz: function(quizList) {
        const body = document.getElementById('intervention-quiz-body');
        if (!body) return;

        if (!quizList || quizList.length === 0) {
            body.innerHTML = '<p class="text-muted">No practice questions generated yet.</p>';
            return;
        }

        let html = '<div class="quiz-container" style="display:flex; flex-direction:column; gap:20px;">';

        quizList.forEach((q, qIndex) => {
            html += `
                <div class="quiz-card-item" id="quiz-item-${q.id}" style="background:rgba(0,0,0,0.3); border:1px solid var(--border-card); border-radius:var(--radius-md); padding:16px;">
                    <div style="font-size:12px; font-weight:700; color:var(--primary); margin-bottom:6px;">
                        QUESTION ${qIndex + 1} OF ${quizList.length}
                    </div>
                    <p style="font-size:14px; font-weight:600; color:#fff; margin-bottom:12px;">${q.text}</p>
                    
                    <div class="quiz-options-group" style="display:flex; flex-direction:column; gap:8px;">
                        ${q.options.map((opt, oIndex) => `
                            <button class="btn btn-outline quiz-opt-btn" 
                                    style="justify-content:flex-start; text-align:left; font-size:13px; width:100%;"
                                    onclick="InterventionsController.selectOption('${q.id}', ${oIndex}, ${q.correctIndex})">
                                ${opt}
                            </button>
                        `).join('')}
                    </div>
                    <div class="quiz-feedback hidden" id="feedback-${q.id}" style="margin-top:12px; padding:10px; border-radius:6px; font-size:13px;"></div>
                </div>
            `;
        });

        html += `
            <button class="btn btn-primary" id="btn-submit-remediation-quiz" 
                    style="margin-top:10px; width:100%; justify-content:center;"
                    onclick="InterventionsController.evaluateQuiz()">
                <i class="fa-solid fa-check-circle"></i> Verify & Resolve Knowledge Gap
            </button>
        </div>`;

        body.innerHTML = html;
    },

    selectOption: function(qId, oIndex, correctIndex) {
        this.userAnswers[qId] = { selected: oIndex, correctIndex: correctIndex };

        const quizItem = document.getElementById(`quiz-item-${qId}`);
        if (!quizItem) return;

        const btns = quizItem.querySelectorAll('.quiz-opt-btn');
        btns.forEach((btn, idx) => {
            if (idx === oIndex) {
                btn.style.borderColor = 'var(--primary)';
                btn.style.background = 'rgba(0,240,255,0.15)';
            } else {
                btn.style.borderColor = 'var(--border-card)';
                btn.style.background = 'transparent';
            }
        });
    },

    evaluateQuiz: function() {
        const quizList = this.currentProfile.intervention.adaptiveQuiz;
        let correctCount = 0;

        quizList.forEach(q => {
            const answer = this.userAnswers[q.id];
            const feedbackEl = document.getElementById(`feedback-${q.id}`);

            if (feedbackEl) {
                feedbackEl.classList.remove('hidden');
                if (answer && answer.selected === q.correctIndex) {
                    correctCount++;
                    feedbackEl.style.background = 'rgba(6,214,160,0.15)';
                    feedbackEl.style.color = '#6ee7b7';
                    feedbackEl.style.border = '1px solid rgba(6,214,160,0.3)';
                    feedbackEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> <strong>Correct!</strong> ${q.explanation}`;
                } else {
                    feedbackEl.style.background = 'rgba(255,0,85,0.15)';
                    feedbackEl.style.color = '#fca5a5';
                    feedbackEl.style.border = '1px solid rgba(255,0,85,0.3)';
                    feedbackEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> <strong>Incorrect.</strong> ${q.explanation}`;
                }
            }
        });

        if (correctCount === quizList.length) {
            // Update root node in graph
            if (this.currentProfile && app) {
                const rootNode = this.currentProfile.graphNodes.find(n => n.status === 'gap-root');
                if (rootNode) rootNode.status = 'mastered';

                alert("🎉 Conceptual Gap Resolved! Knowledge Graph node status updated to Mastered!");
                app.switchTab('knowledge-graph');
            }
        }
    }
};
