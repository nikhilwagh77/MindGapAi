/* ----------------------------------------------------
   MindGap AI - Main Master Application Controller
   Team CodeSmiths
   ---------------------------------------------------- */

window.app = {
    activeTab: 'diagnostic',
    activeProfileKey: 'alex',

    init: function() {
        console.log("MindGap AI Initializing...");
        
        MultimodalController.init();
        GapGraphController.init();
        InterventionsController.init();
        TeacherDashboardController.init();

        this.bindEvents();
        this.loadProfile(this.activeProfileKey);
    },

    bindEvents: function() {
        // Nav tab switching
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const targetTab = item.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });

        // Profile Select dropdown
        const profileSelect = document.getElementById('profile-select');
        if (profileSelect) {
            profileSelect.addEventListener('change', (e) => {
                this.loadProfile(e.target.value);
            });
        }

        // Quick Scan AI button
        const btnQuickScan = document.getElementById('btn-quick-scan');
        if (btnQuickScan) {
            btnQuickScan.addEventListener('click', () => {
                this.runAIDiagnosis();
            });
        }

        // Reset Demo button
        const btnResetDemo = document.getElementById('btn-reset-demo');
        if (btnResetDemo) {
            btnResetDemo.addEventListener('click', () => {
                this.loadProfile(this.activeProfileKey);
                alert("Demo state reset to original profile benchmark!");
            });
        }
    },

    switchTab: function(tabName) {
        this.activeTab = tabName;

        // Update nav item active state
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.getAttribute('data-tab') === tabName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update tab content sections
        document.querySelectorAll('.tab-content').forEach(section => {
            if (section.id === `tab-${tabName}`) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        // Tab specific triggers
        if (tabName === 'knowledge-graph') {
            const profile = this.getActiveProfile();
            setTimeout(() => {
                GapGraphController.renderGraph(profile.graphNodes, profile.graphEdges);
            }, 100);
        } else if (tabName === 'nuggets') {
            const profile = this.getActiveProfile();
            this.renderNuggetsPathway(profile);
        } else if (tabName === 'interventions') {
            const profile = this.getActiveProfile();
            InterventionsController.renderInterventions(profile);
        } else if (tabName === 'teacher-dashboard') {
            setTimeout(() => {
                TeacherDashboardController.renderDashboard();
            }, 100);
        }

        // Page title updates
        const pageTitle = document.getElementById('page-title');
        const pageSubtitle = document.getElementById('page-subtitle');
        if (pageTitle && pageSubtitle) {
            if (tabName === 'diagnostic') {
                pageTitle.innerText = "Multimodal Assessment & Diagnostics";
                pageSubtitle.innerText = "Analyze handwriting, voice explainers, and behavioral telemetry to detect hidden gaps";
            } else if (tabName === 'knowledge-graph') {
                pageTitle.innerText = "Cognitive Knowledge Dependency Graph";
                pageSubtitle.innerText = "Interactive visual network identifying prerequisite bottlenecks and conceptual gaps";
            } else if (tabName === 'nuggets') {
                pageTitle.innerText = "Century AI Micro-Learning Nuggets & Neuroscience";
                pageSubtitle.innerText = "Personalized adaptive learning pathways powered by AI, learning science, and spaced repetition";
            } else if (tabName === 'interventions') {
                pageTitle.innerText = "AI Targeted Interventions & Adaptive Practice";
                pageSubtitle.innerText = "Personalized micro-remediations tailored to student's mental model errors";
            } else if (tabName === 'teacher-dashboard') {
                pageTitle.innerText = "Classroom Heatmap & Automated Grouping";
                pageSubtitle.innerText = "Class-wide gap analytics and automated differentiated instruction groups";
            }
        }
    },

    getActiveProfile: function() {
        return MINDGAP_DATA.profiles[this.activeProfileKey] || MINDGAP_DATA.profiles.alex;
    },

    loadProfile: function(profileKey) {
        if (profileKey === 'custom') {
            this.activeProfileKey = 'alex';
            alert("Upload custom handwriting image or record audio using the input cards!");
            return;
        }

        this.activeProfileKey = profileKey;
        const profile = this.getActiveProfile();

        // Update Sidebar subject tag
        const subjectTag = document.getElementById('subject-tag');
        if (subjectTag) subjectTag.innerText = profile.subject;

        // Update Telemetry Header
        const telemetryScore = document.getElementById('telemetry-score');
        if (telemetryScore) telemetryScore.innerText = profile.hesitationScore;

        // Update OCR text box
        const ocrText = document.getElementById('ocr-text');
        if (ocrText) ocrText.innerText = profile.handwritingDetected;

        // Update Audio transcript text
        const transcriptText = document.getElementById('transcript-text');
        if (transcriptText) transcriptText.innerText = profile.transcript;

        // Update Confidence Progress bar
        const confidenceFill = document.getElementById('confidence-fill');
        if (confidenceFill) {
            confidenceFill.style.width = `${profile.confidence}%`;
            confidenceFill.innerText = `${profile.confidence}% (${profile.confidence < 40 ? 'High Hesitation' : 'Moderate Hesitation'})`;
        }

        // Update Telemetry metrics box
        const metricTime = document.getElementById('metric-time');
        const metricSwitches = document.getElementById('metric-switches');
        const metricConfidence = document.getElementById('metric-confidence');
        if (metricTime) metricTime.innerText = profile.hesitationScore;
        if (metricSwitches) metricSwitches.innerText = `${profile.misconception.impactedCount} Revisions / Switching`;
        if (metricConfidence) metricConfidence.innerText = `${Math.round(profile.confidence / 20)} / 5 (Uncertain)`;

        // Update Diagnostic Problem & Options
        const qText = document.getElementById('q-text');
        const qOptions = document.getElementById('q-options');
        if (qText && profile.question) {
            qText.innerText = profile.question.text;
        }

        if (qOptions && profile.question) {
            let optsHtml = '';
            profile.question.options.forEach(opt => {
                let cls = 'q-opt';
                let icon = '';
                if (opt.studentSelected) {
                    cls += ' incorrect';
                    icon = ' <i class="fa-solid fa-circle-xmark"></i> (Student Answer)';
                } else if (opt.correct) {
                    cls += ' correct';
                    icon = ' <i class="fa-solid fa-circle-check"></i> (Correct Answer)';
                }
                optsHtml += `<div class="${cls}">${opt.label}${icon}</div>`;
            });
            qOptions.innerHTML = optsHtml;
        }

        // Update Diagnostic Result Output Panel
        const diagTitle = document.getElementById('diag-misconception-title');
        const diagDesc = document.getElementById('diag-misconception-desc');
        const diagSeverity = document.getElementById('diag-severity');
        const diagImpact = document.getElementById('diag-impact');

        if (diagTitle) diagTitle.innerText = profile.misconception.title;
        if (diagDesc) diagDesc.innerText = profile.misconception.desc;
        if (diagSeverity) diagSeverity.innerText = profile.misconception.severity;
        if (diagImpact) diagImpact.innerText = `${profile.misconception.impactedCount} Downstream Concepts`;

        // Render Nuggets if on nuggets tab
        this.renderNuggetsPathway(profile);

        // Refresh currently active tab graphics if needed
        if (this.activeTab === 'knowledge-graph') {
            GapGraphController.renderGraph(profile.graphNodes, profile.graphEdges);
        } else if (this.activeTab === 'interventions') {
            InterventionsController.renderInterventions(profile);
        }
    },

    renderNuggetsPathway: function(profile) {
        const container = document.getElementById('nuggets-pathway-container');
        if (!container) return;

        const nuggets = profile.nuggetsPathway || [];
        let html = '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:18px;">';

        nuggets.forEach(n => {
            html += `
                <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-card); border-radius:var(--radius-md); padding:16px; display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <span class="badge ${n.statusClass}">${n.status}</span>
                            <span style="font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-clock"></i> ${n.duration}</span>
                        </div>
                        <h4 style="font-family:var(--font-heading); color:#fff; font-size:15px; margin-bottom:8px;">
                            <i class="fa-solid ${n.icon} icon-cyan"></i> ${n.title}
                        </h4>
                        <p style="font-size:12px; color:var(--text-muted); line-height:1.5;">${n.summary}</p>
                    </div>
                    <button class="btn btn-sm btn-outline" style="margin-top:14px; width:100%; justify-content:center;" onclick="app.switchTab('interventions')">
                        <i class="fa-solid fa-play"></i> Start Micro-Nugget
                    </button>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        // Update neuroscience metrics
        const retentionVal = document.getElementById('retention-val');
        const forgettingStatus = document.getElementById('forgetting-status');
        if (retentionVal) retentionVal.innerText = `${profile.memoryRetainPercent}% (${profile.memoryRetainPercent < 50 ? 'Memory Decay Alert' : 'Good Retention'})`;
        if (forgettingStatus) forgettingStatus.innerText = profile.forgettingCurveStatus;
    },

    runAIDiagnosis: function() {
        const btn = document.getElementById('btn-quick-scan');
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing Multimodal Inputs...';
            btn.disabled = true;

            setTimeout(() => {
                btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Run AI Diagnosis';
                btn.disabled = false;
                alert("✨ Gemini Multimodal AI Analysis Complete! Root conceptual gap identified and Knowledge Graph updated.");
                this.switchTab('knowledge-graph');
            }, 1200);
        }
    }
};

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});
