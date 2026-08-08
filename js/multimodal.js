/* ----------------------------------------------------
   MindGap AI - Multimodal Input Controller v2
   - Live word-by-word speech transcription
   - Per-input Gemini analysis (text / speech / image)
   - Unified final report generation
   ---------------------------------------------------- */

window.MultimodalController = {
    mediaRecorder: null,
    audioChunks: [],
    isRecording: false,
    webcamStream: null,
    recognition: null,

    // State: stores analysis results from each modality
    analysisState: {
        text: null,
        speech: null,
        image: null,
        transcriptFull: '',
        ocrTextFull: ''
    },

    init: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        const imageInput   = document.getElementById('image-input');
        const btnWebcam    = document.getElementById('btn-webcam');
        const btnCloseWebcam = document.getElementById('btn-close-webcam');
        const btnCancelCam = document.getElementById('btn-cancel-cam');
        const btnCaptureCam = document.getElementById('btn-capture-cam');
        const btnClearImage = document.getElementById('btn-clear-image');
        const btnRecordAudio = document.getElementById('btn-record-audio');
        const btnRunUnified  = document.getElementById('btn-run-unified-report');
        const btnAnalyzeText = document.getElementById('btn-analyze-ocr-text');

        if (imageInput) imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        if (btnWebcam) btnWebcam.addEventListener('click', () => this.openWebcamModal());
        if (btnCloseWebcam) btnCloseWebcam.addEventListener('click', () => this.closeWebcamModal());
        if (btnCancelCam) btnCancelCam.addEventListener('click', () => this.closeWebcamModal());
        if (btnCaptureCam) btnCaptureCam.addEventListener('click', () => this.captureWebcamImage());
        if (btnClearImage) btnClearImage.addEventListener('click', () => this.clearImage());
        if (btnRecordAudio) btnRecordAudio.addEventListener('click', () => this.toggleAudioRecording());
        if (btnRunUnified) btnRunUnified.addEventListener('click', () => this.runUnifiedReport());
        if (btnAnalyzeText) btnAnalyzeText.addEventListener('click', () => this.analyzeOCRText());
    },

    /* ─── IMAGE UPLOAD / WEBCAM ─────────────────────────── */

    handleImageUpload: function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.showImagePreview(e.target.result);
            this.runImageAnalysis();
        };
        reader.readAsDataURL(file);
    },

    showImagePreview: function(imageSrc) {
        const placeholder = document.getElementById('upload-placeholder');
        const previewContainer = document.getElementById('preview-container');
        const previewImg = document.getElementById('image-preview');

        if (placeholder && previewContainer && previewImg) {
            previewImg.src = imageSrc;
            placeholder.classList.add('hidden');
            previewContainer.classList.remove('hidden');
        }
    },

    clearImage: function() {
        const placeholder = document.getElementById('upload-placeholder');
        const previewContainer = document.getElementById('preview-container');
        const imageInput = document.getElementById('image-input');

        if (placeholder && previewContainer) {
            placeholder.classList.remove('hidden');
            previewContainer.classList.add('hidden');
            if (imageInput) imageInput.value = '';
        }
        this.analysisState.image = null;
        this.analysisState.ocrTextFull = '';

        const panel = document.getElementById('gemini-image-panel');
        if (panel) panel.classList.add('hidden');
    },

    openWebcamModal: function() {
        const modal = document.getElementById('webcam-modal');
        const video = document.getElementById('webcam-video');
        if (!modal || !video) return;

        modal.classList.remove('hidden');

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then((stream) => {
                    this.webcamStream = stream;
                    video.srcObject = stream;
                })
                .catch((err) => {
                    console.warn('Webcam access error / permission denied:', err);
                    alert('Camera access unavailable. Loading pre-set scratchpad sample!');
                    this.closeWebcamModal();
                    this.showSampleScratchpad();
                });
        } else {
            this.showSampleScratchpad();
        }
    },

    closeWebcamModal: function() {
        const modal = document.getElementById('webcam-modal');
        const video = document.getElementById('webcam-video');
        if (modal) modal.classList.add('hidden');

        if (this.webcamStream) {
            this.webcamStream.getTracks().forEach(track => track.stop());
            this.webcamStream = null;
        }
        if (video) video.srcObject = null;
    },

    captureWebcamImage: function() {
        const video = document.getElementById('webcam-video');
        const canvas = document.getElementById('webcam-canvas');
        if (!video || !canvas) return;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/png');
        this.showImagePreview(dataUrl);
        this.closeWebcamModal();
        this.runImageAnalysis();
    },

    showSampleScratchpad: function() {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 400, 200);
        ctx.fillStyle = '#00f0ff';
        ctx.font = '16px "Fira Code", monospace';
        ctx.fillText('v = u + at  =>  0 = 20 - 9.8t', 20, 40);
        ctx.fillText('t = 2.04 s', 20, 80);
        ctx.fillStyle = '#ff0055';
        ctx.fillText('h = 20(2.04) + 9.8(2.04)^2', 20, 120);
        ctx.fillText('   [Sign Error: Added +g]', 20, 150);

        this.showImagePreview(canvas.toDataURL());
        // Set sample OCR text and run analysis
        const ocrEl = document.getElementById('ocr-text');
        if (ocrEl) {
            this.analysisState.ocrTextFull = ocrEl.innerText || ocrEl.textContent;
        }
        this.runImageAnalysis();
    },

    /* ─── IMAGE GEMINI ANALYSIS ─────────────────────────── */

    runImageAnalysis: function() {
        const ocrEl = document.getElementById('ocr-text');
        const ocrText = ocrEl ? (ocrEl.innerText || ocrEl.textContent) : '';
        this.analysisState.ocrTextFull = ocrText;

        if (!ocrText || ocrText.trim().length < 5) {
            this.showGeminiPanel('image', null, 'No OCR text found to analyze.');
            return;
        }

        this.showGeminiPanel('image', null, null, true); // loading state

        fetch('/api/ai/analyze-image-ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ocrText, subject: this.getCurrentSubject() })
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                this.analysisState.image = data.analysis;
                this.showGeminiPanel('image', data.analysis);
            } else {
                this.showGeminiPanel('image', null, data.error || 'Analysis failed');
            }
        })
        .catch(err => {
            console.error('Image OCR analysis failed:', err);
            this.showGeminiPanel('image', null, 'Network error during analysis');
        });
    },

    analyzeOCRText: function() {
        this.runImageAnalysis();
    },

    /* ─── LIVE SPEECH TRANSCRIPTION ─────────────────────── */

    toggleAudioRecording: function() {
        const btn = document.getElementById('btn-record-audio');
        const status = document.getElementById('record-status');
        const visualizer = document.getElementById('mic-visualizer');
        const liveWords = document.getElementById('live-transcript-words');

        if (!this.isRecording) {
            // ── START RECORDING ──
            this.isRecording = true;
            this.analysisState.transcriptFull = '';
            if (btn) { btn.classList.add('recording'); btn.innerHTML = '<i class="fa-solid fa-stop"></i>'; }
            if (status) status.innerHTML = "<span class='text-danger'><i class='fa-solid fa-circle-dot fa-beat'></i> Listening & Transcribing Live...</span>";
            if (visualizer) visualizer.classList.add('recording');

            // Clear old transcript words
            if (liveWords) liveWords.innerHTML = '';

            // Hide old speech Gemini panel
            const speechPanel = document.getElementById('gemini-speech-panel');
            if (speechPanel) speechPanel.classList.add('hidden');

            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.lang = 'en-US';

                let lastRenderedIndex = 0;

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

                    this.analysisState.transcriptFull = finalText + interimText;

                    // Build word-by-word display
                    if (liveWords) {
                        liveWords.innerHTML = '';

                        const allWords = this.analysisState.transcriptFull.trim().split(/\s+/);
                        const finalWords = finalText.trim().split(/\s+/).filter(Boolean);
                        const interimWords = interimText.trim().split(/\s+/).filter(Boolean);

                        finalWords.forEach((word, i) => {
                            const span = document.createElement('span');
                            span.className = 'word-token word-final';
                            span.textContent = word + ' ';
                            span.style.animationDelay = `${i * 0.05}s`;
                            liveWords.appendChild(span);
                        });

                        interimWords.forEach((word, i) => {
                            const span = document.createElement('span');
                            span.className = 'word-token word-interim';
                            span.textContent = word + ' ';
                            span.style.animationDelay = `${i * 0.03}s`;
                            liveWords.appendChild(span);
                        });
                    }

                    // Also update the legacy transcript-text element for compatibility
                    const legacyTranscript = document.getElementById('transcript-text');
                    if (legacyTranscript) {
                        legacyTranscript.innerText = this.analysisState.transcriptFull;
                    }
                };

                this.recognition.onerror = (event) => {
                    console.warn('Speech recognition error:', event.error);
                    if (event.error === 'no-speech') {
                        if (status) status.innerHTML = "<span class='text-warning'>No speech detected. Speak clearly into the microphone.</span>";
                    }
                };

                this.recognition.onend = () => {
                    if (this.isRecording) {
                        // Auto-restart if still supposed to be recording
                        try { this.recognition.start(); } catch(e) {}
                    }
                };

                this.recognition.start();
            } else {
                if (status) status.innerHTML = "<span class='text-warning'>Speech API not supported in this browser. Please use Chrome.</span>";
            }

        } else {
            // ── STOP RECORDING ──
            this.isRecording = false;
            if (btn) { btn.classList.remove('recording'); btn.innerHTML = '<i class="fa-solid fa-microphone"></i>'; }
            if (status) status.innerHTML = "<span class='text-success'><i class='fa-solid fa-check-circle'></i> Transcription complete — Running Gemini Analysis...</span>";
            if (visualizer) visualizer.classList.remove('recording');

            if (this.recognition) {
                try { this.recognition.stop(); } catch(e) {}
                this.recognition = null;
            }

            // Mark interim words as finalized
            if (liveWords) {
                liveWords.querySelectorAll('.word-interim').forEach(el => {
                    el.classList.remove('word-interim');
                    el.classList.add('word-final');
                });
            }

            // Run Gemini speech analysis after stopping
            if (this.analysisState.transcriptFull.trim().length > 5) {
                this.runSpeechAnalysis();
            } else {
                if (status) status.innerHTML = "<span class='text-muted'>No sufficient speech detected for analysis.</span>";
            }
        }
    },

    /* ─── SPEECH GEMINI ANALYSIS ─────────────────────────── */

    runSpeechAnalysis: function() {
        const transcript = this.analysisState.transcriptFull;
        const question = document.getElementById('speech-prompt-question')
            ? document.getElementById('speech-prompt-question').textContent
            : 'Explain the concept verbally.';
        const noteContext = window.currentNoteContent || '';

        this.showGeminiPanel('speech', null, null, true); // loading

        fetch('/api/ai/analyze-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript, question, noteContext, subject: this.getCurrentSubject() })
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                this.analysisState.speech = data.analysis;
                this.showGeminiPanel('speech', data.analysis);

                // Update confidence bar
                const fill = document.getElementById('confidence-fill');
                if (fill && data.analysis.fluencyScore !== undefined) {
                    const score = data.analysis.fluencyScore;
                    const colorClass = score >= 75 ? 'success' : score >= 50 ? 'warning' : 'danger';
                    fill.style.width = `${score}%`;
                    fill.className = `progress-fill ${colorClass}`;
                    fill.textContent = `${score}% Verbal Fluency`;
                }

                const status = document.getElementById('record-status');
                if (status) status.innerHTML = `<span class='text-success'><i class='fa-solid fa-sparkles'></i> Gemini Analysis Complete</span>`;
            } else {
                this.showGeminiPanel('speech', null, data.error || 'Analysis failed');
            }
        })
        .catch(err => {
            console.error('Speech analysis failed:', err);
            this.showGeminiPanel('speech', null, 'Network error during speech analysis');
        });
    },

    /* ─── TEXT ANALYSIS ────────────────────────────────── */

    runTextAnalysis: function(text, subject) {
        if (!text || text.trim().length < 10) return;

        this.showGeminiPanel('text', null, null, true);

        fetch('/api/ai/analyze-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, subject: subject || this.getCurrentSubject() })
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                this.analysisState.text = data.analysis;
                this.showGeminiPanel('text', data.analysis);
            } else {
                this.showGeminiPanel('text', null, data.error || 'Text analysis failed');
            }
        })
        .catch(err => {
            console.error('Text analysis failed:', err);
            this.showGeminiPanel('text', null, 'Network error during text analysis');
        });
    },

    /* ─── UNIFIED REPORT ────────────────────────────────── */

    runUnifiedReport: function() {
        const btn = document.getElementById('btn-run-unified-report');
        const reportPanel = document.getElementById('unified-report-panel');

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gemini is synthesizing all inputs...';
        }
        if (reportPanel) {
            reportPanel.classList.remove('hidden');
            reportPanel.innerHTML = this.buildLoadingHtml('Generating Unified Gemini Report from all 3 inputs...');
        }

        const subject = this.getCurrentSubject();

        fetch('/api/ai/unified-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                textAnalysis: this.analysisState.text || {},
                speechAnalysis: this.analysisState.speech || {},
                imageAnalysis: this.analysisState.image || {},
                subject
            })
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                this.renderUnifiedReport(data.report);
            } else {
                if (reportPanel) reportPanel.innerHTML = `<div class="gemini-error"><i class="fa-solid fa-circle-xmark"></i> ${data.error || 'Report generation failed'}</div>`;
            }
        })
        .catch(err => {
            console.error('Unified report failed:', err);
            if (reportPanel) reportPanel.innerHTML = `<div class="gemini-error"><i class="fa-solid fa-circle-xmark"></i> Network error. Please check server connection.</div>`;
        })
        .finally(() => {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Re-Run Full Gemini Analysis';
            }
        });
    },

    /* ─── RENDER: GEMINI PANELS PER INPUT ─────────────── */

    showGeminiPanel: function(type, analysis, errorMsg, isLoading) {
        const panelId = `gemini-${type}-panel`;
        const panel = document.getElementById(panelId);
        if (!panel) return;

        panel.classList.remove('hidden');

        if (isLoading) {
            panel.innerHTML = this.buildLoadingHtml(`Gemini is analyzing your ${type} input...`);
            return;
        }

        if (errorMsg) {
            panel.innerHTML = `<div class="gemini-error"><i class="fa-solid fa-triangle-exclamation"></i> ${errorMsg}</div>`;
            return;
        }

        if (!analysis) return;

        if (type === 'text') {
            panel.innerHTML = this.buildTextAnalysisHtml(analysis);
        } else if (type === 'speech') {
            panel.innerHTML = this.buildSpeechAnalysisHtml(analysis);
        } else if (type === 'image') {
            panel.innerHTML = this.buildImageAnalysisHtml(analysis);
        }
    },

    buildLoadingHtml: function(msg) {
        return `
        <div class="gemini-loading">
            <div class="gemini-spinner"></div>
            <span>${msg}</span>
        </div>`;
    },

    buildTextAnalysisHtml: function(a) {
        const qualityColor = a.qualityScore >= 80 ? '#059669' : a.qualityScore >= 60 ? '#d97706' : '#dc2626';
        const mistakesHtml = (a.mistakes || []).map(m => `
            <div class="report-mistake-item severity-${m.severity}">
                <div class="mistake-header">
                    <i class="fa-solid fa-circle-xmark"></i>
                    <strong>${m.point}</strong>
                    <span class="severity-badge">${m.severity}</span>
                </div>
                <p class="mistake-detail">${m.explanation}</p>
            </div>`).join('') || '<p class="text-muted">No critical mistakes detected.</p>';

        const suggestionsHtml = (a.suggestions || []).map(s => `
            <div class="report-suggestion-item">
                <i class="fa-solid fa-lightbulb"></i>
                <div><strong>${s.title}</strong><p>${s.detail}</p></div>
            </div>`).join('');

        const strengthsHtml = (a.strengths || []).map(s => `
            <span class="strength-tag"><i class="fa-solid fa-check"></i> ${s}</span>`).join('');

        return `
        <div class="gemini-analysis-result">
            <div class="gemini-result-header">
                <span class="gemini-badge"><i class="fa-brands fa-google"></i> Gemini Analysis — Text/Notes</span>
                <div class="quality-score" style="color:${qualityColor}">${a.qualityScore || '--'}<span>/100</span></div>
            </div>
            <div class="gemini-result-summary">${a.summary || ''}</div>
            ${strengthsHtml ? `<div class="strengths-row">${strengthsHtml}</div>` : ''}
            <div class="gemini-result-section">
                <div class="section-label section-label-error"><i class="fa-solid fa-circle-xmark"></i> Mistakes Found</div>
                ${mistakesHtml}
            </div>
            ${(a.missingConcepts || []).length ? `
            <div class="gemini-result-section">
                <div class="section-label section-label-warn"><i class="fa-solid fa-eye-slash"></i> Missing Concepts</div>
                ${a.missingConcepts.map(c => `<div class="missing-concept-tag"><i class="fa-solid fa-minus"></i> ${c}</div>`).join('')}
            </div>` : ''}
            <div class="gemini-result-section">
                <div class="section-label section-label-info"><i class="fa-solid fa-lightbulb"></i> Suggestions</div>
                ${suggestionsHtml}
            </div>
        </div>`;
    },

    buildSpeechAnalysisHtml: function(a) {
        const fluencyColor = (a.fluencyScore || 0) >= 75 ? '#059669' : (a.fluencyScore || 0) >= 50 ? '#d97706' : '#dc2626';
        const mistakesHtml = (a.mistakes || []).map(m => `
            <div class="report-mistake-item severity-${m.severity}">
                <div class="mistake-header">
                    <i class="fa-solid fa-circle-xmark"></i>
                    <strong>${m.point}</strong>
                    <span class="severity-badge">${m.severity}</span>
                </div>
                <p class="mistake-detail"><strong>Correction:</strong> ${m.correction}</p>
            </div>`).join('') || '<p class="text-muted">No critical conceptual errors detected.</p>';

        const hesitationsHtml = (a.hesitationWords || []).length
            ? a.hesitationWords.map(w => `<span class="hesitation-tag">${w}</span>`).join('')
            : '<span class="text-muted">None detected</span>';

        return `
        <div class="gemini-analysis-result">
            <div class="gemini-result-header">
                <span class="gemini-badge gemini-badge-purple"><i class="fa-brands fa-google"></i> Gemini Analysis — Speech</span>
                <div class="score-pair">
                    <div class="score-mini" style="color:${fluencyColor}">${a.fluencyScore || '--'}<span>Fluency</span></div>
                    <div class="score-mini">${a.conceptualAccuracyScore || '--'}<span>Accuracy</span></div>
                </div>
            </div>
            <div class="gemini-result-summary">${a.summary || ''}</div>
            <div class="gemini-result-section">
                <div class="section-label section-label-warn"><i class="fa-solid fa-comment-dots"></i> Hesitation Words (${a.hesitationCount || 0} detected)</div>
                <div class="hesitation-row">${hesitationsHtml}</div>
            </div>
            ${(a.correctPoints || []).length ? `
            <div class="gemini-result-section">
                <div class="section-label section-label-success"><i class="fa-solid fa-check-circle"></i> Correct Points</div>
                ${a.correctPoints.map(p => `<div class="correct-point"><i class="fa-solid fa-check"></i> ${p}</div>`).join('')}
            </div>` : ''}
            <div class="gemini-result-section">
                <div class="section-label section-label-error"><i class="fa-solid fa-circle-xmark"></i> Mistakes in Speech</div>
                ${mistakesHtml}
            </div>
            ${(a.missingSteps || []).length ? `
            <div class="gemini-result-section">
                <div class="section-label section-label-warn"><i class="fa-solid fa-stairs"></i> Missing Steps</div>
                ${a.missingSteps.map(s => `<div class="missing-concept-tag"><i class="fa-solid fa-minus"></i> ${s}</div>`).join('')}
            </div>` : ''}
        </div>`;
    },

    buildImageAnalysisHtml: function(a) {
        const scoreColor = (a.workQualityScore || 0) >= 75 ? '#059669' : (a.workQualityScore || 0) >= 50 ? '#d97706' : '#dc2626';
        const errorsHtml = (a.errors || []).map(e => `
            <div class="report-mistake-item severity-${e.severity}">
                <div class="mistake-header">
                    <i class="fa-solid fa-pen-to-square"></i>
                    <strong>${e.step}</strong>
                    <span class="severity-badge">${e.errorType}</span>
                </div>
                <p class="mistake-detail"><strong>Correction:</strong> ${e.correction}</p>
            </div>`).join('') || '<p class="text-muted">No errors detected in the handwritten work.</p>';

        return `
        <div class="gemini-analysis-result">
            <div class="gemini-result-header">
                <span class="gemini-badge gemini-badge-gold"><i class="fa-brands fa-google"></i> Gemini Analysis — Handwriting/OCR</span>
                <div class="quality-score" style="color:${scoreColor}">${a.workQualityScore || '--'}<span>/100</span></div>
            </div>
            <div class="gemini-result-summary">${a.overallVerdict || ''} — ${a.summary || ''}</div>
            ${(a.correctSteps || []).length ? `
            <div class="gemini-result-section">
                <div class="section-label section-label-success"><i class="fa-solid fa-check-circle"></i> Correct Steps</div>
                ${a.correctSteps.map(s => `<div class="correct-point"><i class="fa-solid fa-check"></i> ${s}</div>`).join('')}
            </div>` : ''}
            <div class="gemini-result-section">
                <div class="section-label section-label-error"><i class="fa-solid fa-bug"></i> Errors Detected</div>
                ${errorsHtml}
            </div>
            ${(a.missingSteps || []).length ? `
            <div class="gemini-result-section">
                <div class="section-label section-label-warn"><i class="fa-solid fa-stairs"></i> Missing Steps</div>
                ${a.missingSteps.map(s => `<div class="missing-concept-tag"><i class="fa-solid fa-minus"></i> ${s}</div>`).join('')}
            </div>` : ''}
        </div>`;
    },

    /* ─── RENDER: UNIFIED REPORT ─────────────────────── */

    renderUnifiedReport: function(r) {
        const panel = document.getElementById('unified-report-panel');
        if (!panel) return;

        const riskColor = r.overallRiskLevel === 'High' ? '#dc2626' : r.overallRiskLevel === 'Medium' ? '#d97706' : '#059669';
        const riskBg = r.overallRiskLevel === 'High' ? '#fef2f2' : r.overallRiskLevel === 'Medium' ? '#fffbeb' : '#f0fdf4';

        const sourceIcon = { text: '📄', speech: '🎤', image: '✏️', all: '🔗' };

        const mistakesHtml = (r.mistakes || []).map(m => `
            <div class="ur-mistake severity-${m.severity}">
                <div class="ur-mistake-header">
                    <span class="ur-source-tag">${sourceIcon[m.source] || '●'} ${m.source}</span>
                    <strong>${m.title}</strong>
                    <span class="severity-badge">${m.severity}</span>
                </div>
                <p class="ur-mistake-detail">${m.detail}</p>
                <div class="ur-correction"><i class="fa-solid fa-arrow-right-long"></i> <strong>Fix:</strong> ${m.correction}</div>
            </div>`).join('');

        const suggestionsHtml = (r.suggestions || []).sort((a,b) => a.priority - b.priority).map(s => `
            <div class="ur-suggestion">
                <div class="ur-priority-badge">#${s.priority}</div>
                <div class="ur-suggestion-body">
                    <strong>${s.title}</strong>
                    <span class="ur-target-tag">${sourceIcon[s.targetModality] || ''} ${s.targetModality}</span>
                    <p>${s.detail}</p>
                </div>
            </div>`).join('');

        const strengthsHtml = (r.strengths || []).map(s => `
            <div class="ur-strength">
                <span class="ur-source-tag">${sourceIcon[s.source] || '●'} ${s.source}</span>
                <strong>${s.title}</strong>
                <p>${s.detail}</p>
            </div>`).join('');

        const studyPlanHtml = (r.studyPlan || []).map((day, i) => `
            <div class="ur-study-day">
                <div class="ur-day-badge" style="background:hsl(${200 + i*30}, 70%, 50%)">${day.day}</div>
                <div class="ur-day-body">
                    <strong>${day.task}</strong>
                    <p>${day.focus}</p>
                </div>
            </div>`).join('');

        const patternsHtml = (r.crossModalPatterns || []).map(p => `
            <div class="ur-pattern">
                <div class="ur-pattern-sources">${p.foundIn.map(s => `<span class="ur-source-tag">${sourceIcon[s]} ${s}</span>`).join('')}</div>
                <strong>${p.pattern}</strong>
                <p>${p.impact}</p>
            </div>`).join('');

        panel.innerHTML = `
        <div class="unified-report-container">

            <!-- Header -->
            <div class="ur-header">
                <div class="ur-header-left">
                    <div class="ur-gem-icon"><i class="fa-brands fa-google"></i></div>
                    <div>
                        <h3>Gemini Unified Diagnostic Report</h3>
                        <p>Synthesized from Text · Speech · Handwriting</p>
                    </div>
                </div>
                <div class="ur-scores">
                    <div class="ur-overall-score">${r.overallScore || '--'}<span>/100</span></div>
                    <div class="ur-risk-badge" style="background:${riskBg}; color:${riskColor}; border-color:${riskColor}">
                        ${r.overallRiskLevel || '—'} Risk
                    </div>
                </div>
            </div>

            <!-- Summary -->
            <div class="ur-summary-block">
                <i class="fa-solid fa-circle-info"></i>
                <p>${r.summary || ''}</p>
            </div>

            <!-- Root Cause -->
            ${r.rootCauseGap ? `
            <div class="ur-root-cause">
                <div class="ur-section-title"><i class="fa-solid fa-magnifying-glass-chart"></i> Root Cause Gap</div>
                <div class="ur-root-body">
                    <h4>${r.rootCauseGap.title}</h4>
                    <p>${r.rootCauseGap.explanation}</p>
                    ${(r.rootCauseGap.evidenceFromSources || []).length ? `
                    <div class="ur-evidence-list">
                        ${r.rootCauseGap.evidenceFromSources.map(e => `<div class="ur-evidence-item"><i class="fa-solid fa-quote-right"></i> ${e}</div>`).join('')}
                    </div>` : ''}
                </div>
            </div>` : ''}

            <!-- Cross-Modal Patterns -->
            ${patternsHtml ? `
            <div class="ur-section">
                <div class="ur-section-title"><i class="fa-solid fa-circle-nodes"></i> Cross-Modal Patterns</div>
                <div class="ur-patterns-grid">${patternsHtml}</div>
            </div>` : ''}

            <!-- Strengths -->
            ${strengthsHtml ? `
            <div class="ur-section">
                <div class="ur-section-title"><i class="fa-solid fa-trophy"></i> Strengths Identified</div>
                <div class="ur-strengths-grid">${strengthsHtml}</div>
            </div>` : ''}

            <!-- Mistakes -->
            <div class="ur-section">
                <div class="ur-section-title error-title"><i class="fa-solid fa-circle-xmark"></i> All Mistakes Detected</div>
                <div class="ur-mistakes-list">${mistakesHtml || '<p class="text-muted">No critical mistakes identified.</p>'}</div>
            </div>

            <!-- Suggestions -->
            <div class="ur-section">
                <div class="ur-section-title info-title"><i class="fa-solid fa-lightbulb"></i> Priority Suggestions</div>
                <div class="ur-suggestions-list">${suggestionsHtml || '<p class="text-muted">No suggestions generated.</p>'}</div>
            </div>

            <!-- Study Plan -->
            ${studyPlanHtml ? `
            <div class="ur-section">
                <div class="ur-section-title success-title"><i class="fa-solid fa-calendar-check"></i> Personalized Study Plan</div>
                <div class="ur-study-plan">${studyPlanHtml}</div>
            </div>` : ''}

        </div>`;
    },

    /* ─── UTILITIES ──────────────────────────────────── */

    getCurrentSubject: function() {
        const noteSubjectEl = document.getElementById('new-note-subject');
        return noteSubjectEl ? noteSubjectEl.value : 'Physics';
    },

    triggerSimulatedOCR: function(sourceNote) {
        const ocrText = document.getElementById('ocr-text');
        if (ocrText) {
            ocrText.innerHTML = `<strong>[OCR - ${sourceNote}]</strong><br>` + ocrText.innerHTML;
        }
    }
};
