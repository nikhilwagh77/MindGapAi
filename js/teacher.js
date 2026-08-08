/* ----------------------------------------------------
   MindGap AI - Teacher Platform & Student Profile Analytics
   Team CodeSmiths
   ---------------------------------------------------- */

window.TeacherDashboardController = {
    heatmapChartInstance: null,
    modalScoreChart: null,
    modalTopicChart: null,
    modalGrowthChart: null,
    activeRosterFilter: 'all',
    activeSearchQuery: '',

    init: function() {
        this.bindEvents();
        this.renderTeacherNotes();
        this.renderStudentRosterTable();
    },

    bindEvents: function() {
        // Broadcast Common Feedback Button
        const btnBroadcast = document.getElementById('btn-broadcast-feedback');
        if (btnBroadcast) {
            btnBroadcast.addEventListener('click', () => {
                const input = document.getElementById('common-feedback-input');
                if (!input || !input.value.trim()) {
                    alert('Please enter common feedback or an announcement before broadcasting.');
                    return;
                }
                const text = input.value.trim();
                MINDGAP_DATA.commonTeacherFeedback = text;

                if (window.StudentPortalController) {
                    window.StudentPortalController.renderCommonFeedback();
                }

                alert('📢 Common feedback broadcasted to all students successfully!');
                input.value = '';
            });
        }

        // Save note button
        const btnSaveNote = document.getElementById('btn-save-note');
        if (btnSaveNote) {
            btnSaveNote.addEventListener('click', () => this.saveNewNote());
        }

        // File Upload: Show preview card when a file is selected
        const fileInput = document.getElementById('teacher-file-input');
        const filePreview = document.getElementById('teacher-file-preview');
        const fileNameEl = document.getElementById('teacher-filename');
        const fileSizeEl = document.getElementById('teacher-filesize');
        const uploadBtn = document.getElementById('btn-upload-file');

        if (fileInput) {
            fileInput.addEventListener('change', () => {
                const file = fileInput.files[0];
                if (file) {
                    if (fileNameEl) fileNameEl.textContent = file.name;
                    if (fileSizeEl) fileSizeEl.textContent = (file.size / 1024).toFixed(1) + ' KB — ready to publish';
                    if (filePreview) filePreview.style.display = 'block';
                }
            });
        }

        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                const file = fileInput && fileInput.files[0];
                if (!file) return;

                // Simulate upload progress on button
                uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publishing...';
                uploadBtn.disabled = true;

                setTimeout(() => {
                    // Create a note entry from the uploaded file
                    const newNote = {
                        id: 'note-' + Date.now(),
                        title: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
                        subject: 'Uploaded File',
                        date: 'Just now',
                        author: 'Current Teacher',
                        content: `📎 Uploaded file: **${file.name}** (${(file.size / 1024).toFixed(1)} KB)\n\nThis document has been published to the student portal.`,
                        tags: ['Uploaded', 'PDF']
                    };

                    if (!MINDGAP_DATA.teacherNotes) MINDGAP_DATA.teacherNotes = [];
                    MINDGAP_DATA.teacherNotes.unshift(newNote);
                    this.renderTeacherNotes();
                    if (window.StudentPortalController) window.StudentPortalController.renderStudentNotes();

                    // Reset upload zone
                    if (filePreview) filePreview.style.display = 'none';
                    if (fileInput) fileInput.value = '';
                    uploadBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Upload & Publish to Students';
                    uploadBtn.disabled = false;

                    alert(`✅ "${file.name}" uploaded and published to student portal successfully!`);
                }, 800);
            });
        }

        // Roster Search Input
        const searchInput = document.getElementById('roster-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.activeSearchQuery = e.target.value.toLowerCase();
                this.renderStudentRosterTable();
            });
        }

        // Filter Pills
        const filterBtns = document.querySelectorAll('.roster-filters .pill-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeRosterFilter = btn.getAttribute('data-filter');
                this.renderStudentRosterTable();
            });
        });

        // Close Student Profile Modal
        const btnCloseSpModal = document.getElementById('btn-close-sp-modal');
        if (btnCloseSpModal) {
            btnCloseSpModal.addEventListener('click', () => {
                document.getElementById('modal-student-profile-detail').classList.add('hidden');
            });
        }

        // Save Feedback Button in Modal
        const btnSaveFeedback = document.getElementById('btn-save-sp-modal-feedback');
        if (btnSaveFeedback) {
            btnSaveFeedback.addEventListener('click', () => {
                alert('Success! Teacher feedback saved and AI model parameters updated for this student.');
                document.getElementById('modal-student-profile-detail').classList.add('hidden');
            });
        }

        // Teacher File Input
        const fileInput = document.getElementById('teacher-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    const statusBox = document.getElementById('teacher-file-status');
                    const filename = document.getElementById('teacher-filename');
                    if (statusBox && filename) {
                        filename.textContent = e.target.files[0].name;
                        statusBox.classList.remove('hidden');
                    }
                }
            });
        }
    },

    renderDashboard: function() {
        this.renderHeatmapChart();
        this.renderAutomatedGroups();
        this.renderLegacyRoster();
    },

    /* --- PAGE 1: TODAY'S NOTES --- */
    renderTeacherNotes: function() {
        const container = document.getElementById('teacher-notes-grid');
        const countBadge = document.getElementById('teacher-notes-count-badge');
        if (!container) return;

        const notes = MINDGAP_DATA.teacherNotes || [];
        if (countBadge) countBadge.textContent = `${notes.length} Notes Active`;

        let html = '';
        notes.forEach(note => {
            html += `
                <div class="note-card">
                    <div class="note-header">
                        <span class="badge" style="background:#e0f2fe; color:#0284c7;">${note.subject}</span>
                        <span style="font-size:11px; color:#64748b; font-weight:600;"><i class="fa-solid fa-clock"></i> ${note.date}</span>
                    </div>
                    <div class="note-title">${note.title}</div>
                    <div class="note-body">${note.content.substring(0, 180)}...</div>
                    <div class="note-footer">
                        <span class="attachment-pill"><i class="fa-solid fa-paperclip"></i> ${note.fileAttachment}</span>
                        <div style="display:flex; gap:6px;">
                            <button class="btn btn-sm btn-outline" onclick="TeacherDashboardController.deleteNote('${note.id}')" title="Delete Note">
                                <i class="fa-solid fa-trash text-danger"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    saveNewNote: function() {
        const titleInput = document.getElementById('new-note-title');
        const subjectInput = document.getElementById('new-note-subject');
        const contentInput = document.getElementById('new-note-content');

        if (!titleInput.value || !contentInput.value) {
            alert('Please enter a note title and content body.');
            return;
        }

        const newNote = {
            id: 'note-' + Date.now(),
            title: titleInput.value,
            subject: subjectInput.value,
            date: 'Just Now',
            author: 'Prof. Anderson',
            content: contentInput.value,
            fileAttachment: 'Kinematics_Lecture_Summary_Ch2.pdf',
            status: 'Published'
        };

        if (!MINDGAP_DATA.teacherNotes) MINDGAP_DATA.teacherNotes = [];
        MINDGAP_DATA.teacherNotes.unshift(newNote);

        titleInput.value = '';
        contentInput.value = '';

        this.renderTeacherNotes();
        // Also update student notes view if function exists
        if (window.StudentPortalController) {
            window.StudentPortalController.renderStudentNotes();
        }

        alert('Note published successfully to student portal!');
    },

    deleteNote: function(id) {
        if (confirm('Are you sure you want to delete this lecture note?')) {
            MINDGAP_DATA.teacherNotes = MINDGAP_DATA.teacherNotes.filter(n => n.id !== id);
            this.renderTeacherNotes();
            if (window.StudentPortalController) {
                window.StudentPortalController.renderStudentNotes();
            }
        }
    },

    /* --- PAGE 2: STUDENT PERFORMANCE DASHBOARD --- */
    renderStudentRosterTable: function() {
        const tbody = document.getElementById('student-roster-tbody');
        if (!tbody) return;

        const roster = MINDGAP_DATA.studentRoster || [];
        let filtered = roster.filter(student => {
            const matchesFilter = this.activeRosterFilter === 'all' || student.riskLevel === this.activeRosterFilter;
            const matchesSearch = !this.activeSearchQuery || 
                student.name.toLowerCase().includes(this.activeSearchQuery) ||
                student.email.toLowerCase().includes(this.activeSearchQuery) ||
                student.weakAreas.some(w => w.toLowerCase().includes(this.activeSearchQuery));
            return matchesFilter && matchesSearch;
        });

        let html = '';
        filtered.forEach(s => {
            html += `
                <tr>
                    <td>
                        <div class="student-cell">
                            <img src="${s.avatar}" alt="${s.name}">
                            <div>
                                <strong>${s.name}</strong>
                                <div style="font-size:11px; color:#64748b;">${s.email}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <strong>${s.performancePct}%</strong>
                            <div class="progress-bar" style="width:70px; height:6px;">
                                <div class="progress-fill ${s.performancePct < 60 ? 'warning' : ''}" style="width:${s.performancePct}%; background:${s.performancePct < 60 ? '#dc2626' : (s.performancePct < 80 ? '#d97706' : '#059669')};"></div>
                            </div>
                        </div>
                    </td>
                    <td><span style="font-size:12px; color:#64748b;"><i class="fa-solid fa-clock"></i> ${s.lastActivity}</span></td>
                    <td><span class="risk-pill ${s.riskClass}">${s.riskLevel}</span></td>
                    <td><span style="font-size:12px; color:#475569; font-weight:600;">${s.weakAreas[0] || 'None'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="TeacherDashboardController.openStudentProfileModal('${s.id}')">
                            <i class="fa-solid fa-user-gear"></i> View Profile
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    },

    /* --- STUDENT PROFILE DETAIL MODAL WITH CHARTS --- */
    openStudentProfileModal: function(studentId) {
        const student = MINDGAP_DATA.studentRoster.find(s => s.id === studentId);
        if (!student) return;

        const modal = document.getElementById('modal-student-profile-detail');
        if (!modal) return;

        // Populate Info
        document.getElementById('sp-modal-avatar').src = student.avatar;
        document.getElementById('sp-modal-name').textContent = student.name;
        document.getElementById('sp-modal-email').textContent = student.email;
        
        const riskBadge = document.getElementById('sp-modal-risk-badge');
        riskBadge.textContent = student.riskLevel.toUpperCase();
        riskBadge.className = `risk-pill ${student.riskClass}`;

        document.getElementById('sp-modal-pattern').textContent = student.learningPattern;

        // Weak Tags
        const weakTags = document.getElementById('sp-modal-weak-tags');
        weakTags.innerHTML = student.weakAreas.map(w => 
            `<span style="font-size:11px; font-weight:700; background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:4px 10px; border-radius:12px;"><i class="fa-solid fa-circle-exclamation"></i> ${w}</span>`
        ).join('');

        // AI History
        const historyBox = document.getElementById('sp-modal-ai-history');
        historyBox.innerHTML = student.aiHistory.map(h => `
            <div class="timeline-item">
                <div class="timeline-date">${h.date}</div>
                <div class="timeline-desc">
                    <strong>${h.test}:</strong> ${h.feedback}
                </div>
            </div>
        `).join('');

        // Teacher Feedback Input
        document.getElementById('sp-modal-teacher-input').value = student.teacherFeedback || '';
        document.getElementById('sp-modal-override-checkbox').checked = student.aiInfluenceOverride;

        modal.classList.remove('hidden');

        // Render Charts
        setTimeout(() => {
            this.renderModalCharts(student);
        }, 100);
    },

    renderModalCharts: function(student) {
        // Chart 1: Scores Over Time (Line Chart)
        const ctxScore = document.getElementById('sp-modal-score-chart');
        if (ctxScore) {
            if (this.modalScoreChart) this.modalScoreChart.destroy();
            this.modalScoreChart = new Chart(ctxScore, {
                type: 'line',
                data: {
                    labels: ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5', 'Latest'],
                    datasets: [{
                        label: 'Score %',
                        data: student.scoresOverTime,
                        borderColor: '#0284c7',
                        backgroundColor: 'rgba(2, 132, 199, 0.1)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2
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

        // Chart 2: Topic Performance (Bar Chart)
        const ctxTopic = document.getElementById('sp-modal-topic-chart');
        if (ctxTopic) {
            if (this.modalTopicChart) this.modalTopicChart.destroy();
            const labels = student.topicScores.map(t => t.topic);
            const scores = student.topicScores.map(t => t.score);
            this.modalTopicChart = new Chart(ctxTopic, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Mastery %',
                        data: scores,
                        backgroundColor: scores.map(s => s < 60 ? 'rgba(220, 38, 38, 0.7)' : (s < 80 ? 'rgba(217, 119, 6, 0.7)' : 'rgba(5, 150, 105, 0.7)')),
                        borderRadius: 4
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

        // Chart 3: Growth Timeline Chart
        const ctxGrowth = document.getElementById('sp-modal-growth-chart');
        if (ctxGrowth) {
            if (this.modalGrowthChart) this.modalGrowthChart.destroy();
            this.modalGrowthChart = new Chart(ctxGrowth, {
                type: 'line',
                data: {
                    labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'],
                    datasets: [{
                        label: 'Understanding Growth Index',
                        data: student.growthTimeline,
                        borderColor: '#059669',
                        backgroundColor: 'rgba(5, 150, 105, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2
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
    },

    /* --- LEGACY HEATMAP --- */
    renderHeatmapChart: function() {
        const ctx = document.getElementById('teacher-heatmap-chart');
        if (!ctx) return;
        const data = MINDGAP_DATA.teacherData.misconceptionDistribution;
        const labels = data.map(d => d.label);
        const counts = data.map(d => d.count);

        if (this.heatmapChartInstance) this.heatmapChartInstance.destroy();
        this.heatmapChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Students Affected',
                    data: counts,
                    backgroundColor: ['#dc2626', '#7c3aed', '#d97706', '#0284c7'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    },

    renderAutomatedGroups: function() {
        const body = document.getElementById('teacher-groups-body');
        if (!body) return;
        const groups = MINDGAP_DATA.teacherData.automatedGroups;
        let html = '<div style="display:flex; flex-direction:column; gap:14px;">';
        groups.forEach(g => {
            html += `
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:var(--radius-md); padding:14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <h4 style="color:#0f172a; font-size:14px; font-weight:700;"><i class="fa-solid fa-users icon-cyan"></i> ${g.groupName}</h4>
                        <span class="badge badge-purple">${g.students.length} Students</span>
                    </div>
                    <div style="font-size:12px; color:#059669;">
                        <i class="fa-solid fa-bullseye"></i> <strong>AI Action Plan:</strong> ${g.recommendedActivity}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        body.innerHTML = html;
    },

    renderLegacyRoster: function() {
        const tbody = document.querySelector('#teacher-roster-table tbody');
        if (!tbody) return;
        const roster = MINDGAP_DATA.teacherData.roster;
        let html = '';
        roster.forEach(r => {
            html += `
                <tr>
                    <td><strong>${r.name}</strong></td>
                    <td><span class="badge">${r.subject}</span></td>
                    <td class="text-danger">${r.gap}</td>
                    <td>${r.confidence}</td>
                    <td><span class="${r.statusClass}">${r.status}</span></td>
                    <td><button class="btn btn-sm btn-outline" onclick="alert('Intervention assigned to ${r.name}')">Assign</button></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    }
};

// Global Helper for Rich Text Formatting
window.formatEditorText = function(type) {
    const textarea = document.getElementById('new-note-content');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);

    let replacement = selected;
    if (type === 'bold') replacement = `**${selected || 'Bold Text'}**`;
    if (type === 'italic') replacement = `*${selected || 'Italic Text'}*`;
    if (type === 'list') replacement = `\n* ${selected || 'List item 1'}\n* List item 2`;
    if (type === 'code') replacement = `\`${selected || 'v = u + at'}\``;
    if (type === 'formula') replacement = `\n> 💡 **Formula**: $s = ut + \\frac{1}{2}at^2$\n`;

    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
};
