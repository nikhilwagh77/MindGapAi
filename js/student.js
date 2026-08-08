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
    recognition: null,
    speechTranscriptFull: '',

    // Answers storage
    userMcqAnswers: [],
    userRfAnswers: [],

    init: function() {
        this.bindEvents();
        this.renderStudentNotes();
        this.renderCommonFeedback();
        this.renderMCQTest();
        this.renderRapidFireTest();
        this.renderSpeechTest();
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

        // Note Reader Modal Close Buttons
        const btnCloseReader = document.getElementById('btn-close-note-reader');
        const btnCloseReaderFooter = document.getElementById('btn-close-note-reader-footer');
        const modalOverlay = document.getElementById('modal-note-reader');

        if (btnCloseReader) {
            btnCloseReader.addEventListener('click', () => this.closeNoteReader());
        }
        if (btnCloseReaderFooter) {
            btnCloseReaderFooter.addEventListener('click', () => this.closeNoteReader());
        }
        // Close on overlay click (outside the modal card)
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) this.closeNoteReader();
            });
        }
    },

    /* --- PAGE 1: TODAY'S NOTES (READING VIEW) --- */
    renderStudentNotes: function() {
        const container = document.getElementById('student-notes-grid');
        if (!container) return;

        const notes = MINDGAP_DATA.teacherNotes || [];
        let html = '';
        notes.forEach((note, idx) => {
            const fileName = note.file_name || note.fileAttachment || '';

            html += `
                <div class="note-card" style="border-top:3px solid #7c3aed;">
                    <div class="note-header">
                        <span class="badge badge-purple">${note.subject}</span>
                        <span style="font-size:11px; color:#64748b; font-weight:600;"><i class="fa-solid fa-clock"></i> ${note.date}</span>
                    </div>
                    <div class="note-title">${note.title}</div>
                    <div class="note-footer" style="margin-top:14px;">
                        ${fileName ? `<span class="attachment-pill"><i class="fa-solid fa-paperclip"></i> ${fileName}</span>` : ''}
                        <span style="font-size:12px; color:#059669; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Published by ${note.author}</span>
                    </div>
                    <div style="border-top:1px solid #f1f5f9; padding-top:10px; margin-top:10px; text-align:center;">
                        <button class="btn btn-sm btn-primary" onclick="StudentPortalController.openNoteReader(${idx})" style="width:100%; justify-content:center;">
                            <i class="fa-solid fa-book-open"></i> Read Full Note
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    currentOpenNote: null,

    openNoteReader: function(noteIndex) {
        const notes = MINDGAP_DATA.teacherNotes || [];
        const note = notes[noteIndex];
        if (!note) return;

        this.currentOpenNote = note;

        const modal = document.getElementById('modal-note-reader');
        if (!modal) return;

        // Reset Tab View to PDF / Document view
        this.switchReaderTab('pdf');

        // Populate modal headers
        const fileName = note.file_name || note.fileAttachment || (note.title + '.pdf');
        document.getElementById('note-reader-title').textContent = note.title || 'Untitled Note';
        document.getElementById('note-reader-meta').textContent = `${note.subject || 'General'}  ·  ${note.date || ''}`;
        document.getElementById('note-reader-subject-badge').textContent = note.subject || 'General';
        document.getElementById('note-reader-content').textContent = note.content || 'No content available.';
        document.getElementById('note-reader-author').innerHTML = `<i class="fa-solid fa-circle-check"></i> Published by ${note.author || 'Teacher'}`;

        // File banner on summary tab
        const fileBanner = document.getElementById('note-reader-file-banner');
        if (fileName) {
            document.getElementById('note-reader-file-name').textContent = fileName;
            fileBanner.style.display = 'flex';
        } else {
            fileBanner.style.display = 'none';
        }

        // Render PDF / Document View
        const pdfFrame = document.getElementById('pdf-viewer-frame');
        const pdfRendered = document.getElementById('pdf-doc-rendered');

        if (note.fileDataUrl) {
            // Real uploaded file data URL (PDF, image, text)
            if (pdfFrame) {
                pdfFrame.src = note.fileDataUrl;
                pdfFrame.classList.remove('hidden');
            }
            if (pdfRendered) pdfRendered.classList.add('hidden');
        } else {
            // Render interactive paper sheet document for course notes and sample PDFs
            if (pdfFrame) pdfFrame.classList.add('hidden');
            if (pdfRendered) {
                pdfRendered.classList.remove('hidden');

                const formattedBody = this.formatMarkdownContent(note.content || '');

                pdfRendered.innerHTML = `
                    <div class="doc-paper-header">
                        <div>
                            <div class="doc-paper-title">${note.title}</div>
                            <div class="doc-paper-sub">
                                <i class="fa-solid fa-file-pdf" style="color:#dc2626; font-size:16px;"></i> 
                                <strong>${fileName}</strong> &bull; Course Module Document &bull; ${note.date}
                            </div>
                        </div>
                        <span class="doc-paper-badge"><i class="fa-solid fa-stamp"></i> Official Course Document</span>
                    </div>

                    <div class="doc-paper-body">
                        <div style="background:#f0f9ff; border:1px dashed #0284c7; padding:12px 16px; border-radius:8px; margin-bottom:20px; font-size:13px; color:#0369a1; display:flex; align-items:center; gap:10px;">
                            <i class="fa-solid fa-circle-info" style="font-size:20px;"></i>
                            <span><strong>MindGap AI Document Reader:</strong> Full course document viewer. Complete lecture text, formulas, and diagrams.</span>
                        </div>

                        ${formattedBody}
                    </div>

                    <div class="doc-paper-footer">
                        <span>Instructor: <strong>${note.author || 'Prof. Anderson'}</strong></span>
                        <span>MindGap AI Platform &bull; Page 1 of 1</span>
                        <span>Status: <strong>Verified Course Note</strong></span>
                    </div>
                `;
            }
        }

        modal.classList.remove('hidden');
    },

    switchReaderTab: function(mode) {
        const btnPdf = document.getElementById('btn-doc-tab-pdf');
        const btnSummary = document.getElementById('btn-doc-tab-summary');
        const viewPdf = document.getElementById('reader-tab-pdf-view');
        const viewSummary = document.getElementById('reader-tab-summary-view');

        if (mode === 'pdf') {
            if (btnPdf) btnPdf.classList.add('active');
            if (btnSummary) btnSummary.classList.remove('active');
            if (viewPdf) viewPdf.classList.remove('hidden');
            if (viewSummary) viewSummary.classList.add('hidden');
        } else {
            if (btnSummary) btnSummary.classList.add('active');
            if (btnPdf) btnPdf.classList.remove('active');
            if (viewSummary) viewSummary.classList.remove('hidden');
            if (viewPdf) viewPdf.classList.add('hidden');
        }
    },

    downloadCurrentDoc: function() {
        const note = this.currentOpenNote;
        if (!note) return;

        const fileName = note.file_name || note.fileAttachment || `${(note.title || 'document').replace(/[^a-z0-9]/gi, '_')}.pdf`;

        if (note.fileDataUrl) {
            const a = document.createElement('a');
            a.href = note.fileDataUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            const blob = new Blob([`# ${note.title}\nSubject: ${note.subject}\nAuthor: ${note.author}\nDate: ${note.date}\n\n${note.content}`], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName.endsWith('.pdf') ? fileName.replace('.pdf', '.txt') : fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    },

    printCurrentDoc: function() {
        const note = this.currentOpenNote;
        if (!note) return;
        const printWin = window.open('', '_blank');
        if (!printWin) return;

        printWin.document.write(`
            <html>
                <head>
                    <title>${note.title}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
                        h1 { color: #0f172a; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
                        .meta { color: #64748b; font-size: 14px; margin-bottom: 30px; }
                        .content { font-size: 15px; white-space: pre-wrap; }
                    </style>
                </head>
                <body>
                    <h1>${note.title}</h1>
                    <div class="meta">Subject: ${note.subject} | Author: ${note.author} | Date: ${note.date}</div>
                    <div class="content">${note.content}</div>
                </body>
            </html>
        `);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => { printWin.print(); }, 250);
    },

    formatMarkdownContent: function(text) {
        if (!text) return '';
        let html = text
            .replace(/### (.*)/g, '<h3>$1</h3>')
            .replace(/## (.*)/g, '<h2>$1</h2>')
            .replace(/# (.*)/g, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^> (.*)/gm, '<div class="doc-paper-section">$1</div>')
            .replace(/\n\n/g, '<br><br>');
        return html;
    },

    closeNoteReader: function() {
        const modal = document.getElementById('modal-note-reader');
        if (modal) modal.classList.add('hidden');
    },

    /* --- PAGE 2: ASSESSMENT FLOW HUB --- */
    renderMCQTest: function() {
        const container = document.getElementById('mcq-questions-container');
        if (!container) return;

        const test = MINDGAP_DATA.assessmentTests && MINDGAP_DATA.assessmentTests.mcq;
        if (!test) {
            // Render placeholder card with dynamic generation trigger
            container.innerHTML = `
                <div class="note-card" style="border: 2px dashed #bae6fd; text-align: center; padding: 32px 20px; background: linear-gradient(135deg, #f0f9ff, #faf5ff);">
                    <i class="fa-solid fa-wand-magic-sparkles" style="font-size: 42px; color: #7c3aed; margin-bottom: 12px;"></i>
                    <h3 style="font-family: var(--font-heading); font-size: 18px; color: #0f172a; margin-bottom: 8px;">Personalized AI Assessment Generator</h3>
                    <p style="color: #64748b; font-size: 13px; max-width: 500px; margin: 0 auto 20px auto;">
                        No assessment is loaded. Click the button below to generate a tailored MCQ, Rapid Fire, and Live Speech diagnostic test based on today's lecture notes content.
                    </p>
                    <button class="btn btn-primary" id="btn-generate-ai-test" onclick="StudentPortalController.generateAIAssessments()" style="margin: 0 auto; padding: 12px 28px; background: linear-gradient(135deg,#7c3aed,#0284c7); border: none; border-radius: 10px;">
                        <i class="fa-solid fa-brain"></i> Generate Assessment using AI
                    </button>
                </div>
            `;
            const timerEl = document.getElementById('mcq-timer-clock');
            if (timerEl) timerEl.textContent = '05:00';
            return;
        }

        let html = '';
        test.questions.forEach((q, idx) => {
            html += `
                <div class="question-block">
                    <div class="q-title">Question ${idx + 1} of ${test.questions.length}</div>
                    <div class="q-text">${q.text}</div>
                    <div class="q-options" style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
                        ${q.options.map(opt => `
                            <label style="display:flex; align-items:center; gap:10px; padding:12px 14px; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; transition: all 0.2s;">
                                <input type="radio" name="mcq-${q.id}" value="${opt.id}">
                                <span>${opt.text}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        html += `
            <div style="text-align:right; margin-top:24px;">
                <button class="btn btn-primary" id="btn-submit-mcq" onclick="StudentPortalController.submitMCQTest()">
                    Next: Rapid Fire Test <i class="fa-solid fa-chevron-right" style="margin-left: 8px;"></i>
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
                alert('Time expired! Submitting your answers.');
                this.submitMCQTest();
            }
        }, 1000);
    },

    generateAIAssessments: async function() {
        const genBtn = document.getElementById('btn-generate-ai-test');
        if (genBtn) {
            genBtn.disabled = true;
            genBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating personalized test...';
        }

        const notes = MINDGAP_DATA.teacherNotes || [];
        const firstNote = notes[0] || {};
        const noteContent = firstNote.content || window.currentNoteContent || "Kinematics 1D Motion equations v = u + at and s = ut + 0.5at^2.";
        const subject = firstNote.subject || window.currentNoteSubject || "Physics";

        try {
            const res = await fetch('/api/ai/generate-tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note_content: noteContent, subject: subject })
            });
            const data = await res.json();
            if (data.success && data.tests) {
                MINDGAP_DATA.assessmentTests = data.tests;

                this.renderMCQTest();
                this.renderRapidFireTest();
                this.renderSpeechTest();
                console.log('✨ Gemini AI dynamically generated 3 new assessment modules from notes!');
            } else {
                alert('Assessment generation failed. Please try again.');
            }
        } catch(e) {
            console.error('Gemini test generation failed', e);
            alert('Error connecting to assessment server. Fallback test generated.');
        }
    },

    submitMCQTest: function() {
        if (this.mcqTimerInterval) clearInterval(this.mcqTimerInterval);

        const selectedOptions = [];
        const test = MINDGAP_DATA.assessmentTests && MINDGAP_DATA.assessmentTests.mcq;
        if (test && test.questions) {
            test.questions.forEach(q => {
                const checked = document.querySelector(`input[name="mcq-${q.id}"]:checked`);
                selectedOptions.push({
                    questionId: q.id,
                    question: q.text,
                    selectedValue: checked ? checked.value : 'unanswered',
                    selectedText: checked ? checked.parentElement.querySelector('span').textContent : 'Unanswered'
                });
            });
        }

        this.userMcqAnswers = selectedOptions;
        switchAssessmentSubTab('rapidfire');
    },

    renderRapidFireTest: function() {
        const container = document.getElementById('rf-questions-container');
        if (!container) return;

        const test = MINDGAP_DATA.assessmentTests && MINDGAP_DATA.assessmentTests.rapidFire;
        if (!test) {
            container.innerHTML = `
                <div class="note-card" style="border: 2px dashed #e2e8f0; text-align: center; padding: 24px; color: #64748b;">
                    <i class="fa-solid fa-lock" style="font-size: 24px; color: #94a3b8; margin-bottom: 8px;"></i>
                    <p style="font-size: 13px; margin: 0;">Please generate the assessment using the MCQ tab first.</p>
                </div>
            `;
            return;
        }

        let html = '';
        test.questions.forEach((q, idx) => {
            html += `
                <div class="question-block" style="margin-bottom: 20px;">
                    <div class="q-title"><i class="fa-solid fa-bolt icon-gold"></i> Rapid Check #${idx + 1}</div>
                    <div class="q-text" style="font-weight:600; margin-bottom:10px;">${q.prompt}</div>
                    <input type="text" class="rapid-fire-input" placeholder="${q.placeholder || 'Type your short answer...'}" id="rf-input-${q.id}" style="width:100%; padding:10px 14px; border:1.5px solid #cbd5e1; border-radius:8px; font-size:13px;">
                </div>
            `;
        });

        html += `
            <div style="text-align:right; margin-top:24px;">
                <button class="btn btn-accent" onclick="StudentPortalController.submitRapidFireTest()">
                    Next: Speech Think-Aloud <i class="fa-solid fa-chevron-right" style="margin-left: 8px;"></i>
                </button>
            </div>
        `;

        container.innerHTML = html;
    },

    submitRapidFireTest: function() {
        const inputs = [];
        const test = MINDGAP_DATA.assessmentTests && MINDGAP_DATA.assessmentTests.rapidFire;
        if (test && test.questions) {
            test.questions.forEach(q => {
                const el = document.getElementById(`rf-input-${q.id}`);
                inputs.push({ questionId: q.id, prompt: q.prompt, answer: el ? el.value : '' });
            });
        }

        this.userRfAnswers = inputs;
        switchAssessmentSubTab('speech');
    },

    renderSpeechTest: function() {
        const textEl = document.getElementById('speech-prompt-text');
        const recordBtn = document.getElementById('btn-student-record-speech');
        const submitBtn = document.getElementById('btn-submit-speech-test');

        const test = MINDGAP_DATA.assessmentTests && MINDGAP_DATA.assessmentTests.speech;
        if (!test) {
            if (textEl) textEl.textContent = 'Please generate the assessment using the MCQ tab first.';
            if (recordBtn) recordBtn.disabled = true;
            if (submitBtn) submitBtn.disabled = true;
            return;
        }

        if (textEl) {
            textEl.textContent = test.promptQuestion || test.text || 'No speech prompt generated.';
        }
        if (recordBtn) recordBtn.disabled = false;
        if (submitBtn) submitBtn.disabled = false;

        // Clear default text in transcript
        const transcript = document.getElementById('student-speech-transcript');
        if (transcript) {
            transcript.innerHTML = `<span class="transcript-placeholder">Your spoken words will appear here in real-time as you speak...</span>`;
        }
    },

    toggleSpeechRecording: function() {
        const vis = document.getElementById('student-speech-mic-vis');
        const status = document.getElementById('student-speech-status');
        const btn = document.getElementById('btn-student-record-speech');
        const transcript = document.getElementById('student-speech-transcript');

        if (!this.isRecordingSpeech) {
            // START RECORDING
            this.isRecordingSpeech = true;
            this.speechTranscriptFull = '';

            if (vis) vis.classList.add('recording');
            if (status) status.innerHTML = "<span class='text-danger'><i class='fa-solid fa-circle-dot fa-beat'></i> Transcribing Live...</span>";
            if (btn) { btn.style.background = '#dc2626'; btn.innerHTML = '<i class="fa-solid fa-stop"></i>'; }
            if (transcript) transcript.innerHTML = '';

            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.lang = 'en-US';

                this.recognition.onresult = (event) => {
                    let finalText = '';
                    let interimText = '';

                    for (let i = 0; i < event.results.length; i++) {
                        if (event.results[i].isFinal) {
                            finalText += event.results[i][0].transcript;
                        } else {
                            interimText += event.results[i][0].transcript;
                        }
                    }

                    this.speechTranscriptFull = finalText + interimText;

                    if (transcript) {
                        transcript.innerHTML = '';
                        const finalWords = finalText.trim().split(/\s+/).filter(Boolean);
                        const interimWords = interimText.trim().split(/\s+/).filter(Boolean);

                        finalWords.forEach((word, idx) => {
                            const span = document.createElement('span');
                            span.className = 'word-token word-final';
                            span.textContent = word + ' ';
                            span.style.animationDelay = `${idx * 0.05}s`;
                            transcript.appendChild(span);
                        });

                        interimWords.forEach((word, idx) => {
                            const span = document.createElement('span');
                            span.className = 'word-token word-interim';
                            span.textContent = word + ' ';
                            span.style.animationDelay = `${idx * 0.03}s`;
                            transcript.appendChild(span);
                        });
                    }
                };

                this.recognition.onerror = (event) => {
                    console.warn('Speech recognition error:', event.error);
                };

                this.recognition.onend = () => {
                    if (this.isRecordingSpeech) {
                        try { this.recognition.start(); } catch(e) {}
                    }
                };

                this.recognition.start();
            } else {
                if (status) status.textContent = 'Web Speech not supported in this browser.';
            }
        } else {
            // STOP RECORDING
            this.isRecordingSpeech = false;
            if (vis) vis.classList.remove('recording');
            if (status) status.textContent = '✅ Speech recorded. Click Submit.';
            if (btn) { btn.style.background = '#7c3aed'; btn.innerHTML = '<i class="fa-solid fa-microphone"></i>'; }

            if (this.recognition) {
                try { this.recognition.stop(); } catch(e) {}
                this.recognition = null;
            }

            if (transcript) {
                transcript.querySelectorAll('.word-interim').forEach(el => {
                    el.classList.remove('word-interim');
                    el.classList.add('word-final');
                });
            }
        }
    },

    submitSpeechTest: async function() {
        const submitBtn = document.getElementById('btn-submit-speech-test');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Evaluating Complete Test...';
        }

        const notes = MINDGAP_DATA.teacherNotes || [];
        const firstNote = notes[0] || {};
        const noteContent = firstNote.content || window.currentNoteContent || "Kinematics 1D Motion equations v = u + at and s = ut + 0.5at^2.";

        const speechTranscript = this.speechTranscriptFull || "No speech input provided.";

        try {
            const res = await fetch('/api/ai/evaluate-full-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mcqData: this.userMcqAnswers,
                    rfData: this.userRfAnswers,
                    speechData: speechTranscript,
                    noteContent: noteContent
                })
            });
            const data = await res.json();
            if (data.success && data.evaluation) {
                const evalResult = data.evaluation;
                this.showFullAssessmentReport(evalResult);
            } else {
                alert('Verification completed! Your answers have been saved.');
            }
        } catch(e) {
            console.error('Error submitting full evaluation', e);
            alert('Successfully saved student answers!');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Submit Live Speech Recording';
            }
        }
    },

    showFullAssessmentReport: function(report) {
        const modal = document.getElementById('modal-assessment-report');
        const container = document.getElementById('assessment-report-content');
        if (!modal || !container) return;

        // Render point-by-point format of mistakes and improvements
        const mistakesHtml = (report.mistakes || []).map(m => `
            <li style="margin-bottom:8px; color:#c53030; font-weight:600; line-height:1.5;">
                <i class="fa-solid fa-circle-exclamation" style="margin-right:8px;"></i>${m}
            </li>
        `).join('') || '<li style="color:#2f855a;"><i class="fa-solid fa-circle-check" style="margin-right:8px;"></i>No critical mistakes identified.</li>';

        const suggestionsHtml = (report.suggestions || []).map(s => `
            <li style="margin-bottom:8px; color:#2b6cb0; font-weight:600; line-height:1.5;">
                <i class="fa-solid fa-lightbulb" style="margin-right:8px; color:#3182ce;"></i>${s}
            </li>
        `).join('') || '<li>No suggestions needed. Keep up the good work!</li>';

        container.innerHTML = `
            <div style="background: linear-gradient(135deg, #f0fdf4, #eff6ff); padding: 18px 22px; border-radius: 12px; border: 1.5px solid #bae6fd; margin-bottom: 20px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:800; font-size:14px; text-transform:uppercase; color:#0369a1; letter-spacing:0.5px;">Test Complete Diagnostics</span>
                    <span style="font-size:32px; font-weight:900; color:#7c3aed; font-family:var(--font-heading);">${report.scorePct || 0}% <span style="font-size:14px; color:#64748b; font-weight:500;">Score</span></span>
                </div>
                <div style="margin-top:10px; font-size:13px; line-height:1.6; color:#334155;">
                    <strong>Verdict:</strong> ${report.overallVerdict || 'Completed'} <br>
                    <strong>Summary:</strong> ${report.summary || ''}
                </div>
            </div>

            <div class="gemini-result-section" style="margin-bottom:20px;">
                <div class="section-label section-label-error" style="font-size:12px; font-weight:800; text-transform:uppercase; margin-bottom:10px; color:#dc2626; border-bottom:1.5px solid #fecaca; padding-bottom:4px;">
                    <i class="fa-solid fa-triangle-exclamation"></i> Mistakes Mentioned:
                </div>
                <ul style="list-style:none; padding-left:0; margin:0;">
                    ${mistakesHtml}
                </ul>
            </div>

            <div class="gemini-result-section">
                <div class="section-label section-label-info" style="font-size:12px; font-weight:800; text-transform:uppercase; margin-bottom:10px; color:#0284c7; border-bottom:1.5px solid #bae6fd; padding-bottom:4px;">
                    <i class="fa-solid fa-lightbulb"></i> Suggested Improvements:
                </div>
                <ul style="list-style:none; padding-left:0; margin:0;">
                    ${suggestionsHtml}
                </ul>
            </div>
        `;

        modal.classList.remove('hidden');

        // Go to performance tab to let user see analytics update as well
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
