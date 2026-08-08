/* ----------------------------------------------------
   MindGap AI - Main Master Application Controller
   Team CodeSmiths
   ---------------------------------------------------- */

window.app = {
    activeRole: 'teacher', // 'teacher' | 'student'
    activeTab: 'teacher-notes',
    activeProfileKey: 'alex',

    init: function() {
        console.log("MindGap AI Dual-Interface Engine Initializing...");
        
        if (window.MultimodalController) MultimodalController.init();
        if (window.GapGraphController) GapGraphController.init();
        if (window.InterventionsController) InterventionsController.init();
        if (window.TeacherDashboardController) TeacherDashboardController.init();
        if (window.StudentPortalController) StudentPortalController.init();

        this.bindEvents();
        this.switchRole('teacher');
        this.loadProfile(this.activeProfileKey);
    },

    bindEvents: function() {
        // Universal Nav Tab Switching (using closest for reliable inner click handling)
        document.addEventListener('click', (e) => {
            const navBtn = e.target.closest('.nav-item');
            if (navBtn) {
                const targetTab = navBtn.getAttribute('data-tab');
                if (targetTab) {
                    this.switchTab(targetTab);
                }
            }
        });

        // Role toggle buttons in sidebar
        const btnRoleTeacher = document.getElementById('btn-role-teacher');
        const btnRoleStudent = document.getElementById('btn-role-student');
        const btnToggleTop = document.getElementById('btn-switch-role-toggle');

        if (btnRoleTeacher) {
            btnRoleTeacher.addEventListener('click', () => this.switchRole('teacher'));
        }
        if (btnRoleStudent) {
            btnRoleStudent.addEventListener('click', () => this.switchRole('student'));
        }
        if (btnToggleTop) {
            btnToggleTop.addEventListener('click', () => {
                const nextRole = this.activeRole === 'teacher' ? 'student' : 'teacher';
                this.switchRole(nextRole);
            });
        }

        // Profile Select dropdown
        const profileSelect = document.getElementById('profile-select');
        if (profileSelect) {
            profileSelect.addEventListener('change', (e) => {
                this.loadProfile(e.target.value);
            });
        }
    },

    switchRole: function(role) {
        this.activeRole = role;

        const teacherNavs = document.querySelectorAll('.role-section-teacher');
        const studentNavs = document.querySelectorAll('.role-section-student');

        const btnRoleTeacher = document.getElementById('btn-role-teacher');
        const btnRoleStudent = document.getElementById('btn-role-student');
        const roleBadge = document.getElementById('header-role-badge');

        if (role === 'teacher') {
            teacherNavs.forEach(el => el.classList.remove('hidden'));
            studentNavs.forEach(el => el.classList.add('hidden'));

            if (btnRoleTeacher) btnRoleTeacher.classList.add('active');
            if (btnRoleStudent) btnRoleStudent.classList.remove('active');
            if (roleBadge) {
                roleBadge.textContent = 'Teacher';
                roleBadge.style.color = '#0284c7';
            }
            this.switchTab('teacher-notes');
        } else {
            teacherNavs.forEach(el => el.classList.add('hidden'));
            studentNavs.forEach(el => el.classList.remove('hidden'));

            if (btnRoleStudent) btnRoleStudent.classList.add('active');
            if (btnRoleTeacher) btnRoleTeacher.classList.remove('active');
            if (roleBadge) {
                roleBadge.textContent = 'Student';
                roleBadge.style.color = '#7c3aed';
            }
            this.switchTab('student-notes');
        }
    },

    switchTab: function(tabName) {
        if (!tabName) return;
        this.activeTab = tabName;

        // Update nav item active state across all buttons
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

        // Page title & subtitle updates
        const pageTitle = document.getElementById('page-title');
        const pageSubtitle = document.getElementById('page-subtitle');

        if (pageTitle && pageSubtitle) {
            switch(tabName) {
                case 'teacher-notes':
                    pageTitle.textContent = "Today's Notes & Content Writer";
                    pageSubtitle.textContent = "Upload lecture slides or compose daily notes directly for students";
                    try { if (window.TeacherDashboardController) window.TeacherDashboardController.renderTeacherNotes(); } catch(e){}
                    break;
                case 'student-roster':
                    pageTitle.textContent = "Student Performance Dashboard";
                    pageSubtitle.textContent = "Monitor student risk levels, test trends, growth timelines, and AI overrides";
                    try { if (window.TeacherDashboardController) window.TeacherDashboardController.renderStudentRosterTable(); } catch(e){}
                    break;
                case 'teacher-dashboard':
                    pageTitle.textContent = "Misconception Heatmap & Grouping";
                    pageSubtitle.textContent = "Classroom aggregated misconception analytics and automated group instruction";
                    try { if (window.TeacherDashboardController) window.TeacherDashboardController.renderDashboard(); } catch(e){}
                    break;
                case 'student-notes':
                    pageTitle.textContent = "Today's Published Course Notes";
                    pageSubtitle.textContent = "Read lecture materials uploaded by your instructor and start personalized assessments";
                    try { if (window.StudentPortalController) window.StudentPortalController.renderStudentNotes(); } catch(e){}
                    break;
                case 'student-assessment':
                    pageTitle.textContent = "Personalized AI Assessment Hub";
                    pageSubtitle.textContent = "Complete MCQ tests with timers, Rapid Fire one-liners, or Live Speech think-alouds";
                    break;
                case 'student-performance':
                    pageTitle.textContent = "Analyze Your Performance";
                    pageSubtitle.textContent = "Review test score trends over time, AI feedback breakdown, and study plans";
                    try { if (window.StudentPortalController) window.StudentPortalController.renderStudentPerformanceAnalytics(); } catch(e){}
                    break;
                case 'diagnostic':
                    pageTitle.textContent = "Multimodal Assessment & Diagnostics";
                    pageSubtitle.textContent = "Analyze handwriting, voice explainers, and behavioral telemetry to detect hidden gaps";
                    break;
                case 'knowledge-graph':
                    pageTitle.textContent = "Cognitive Prerequisite Knowledge Graph";
                    pageSubtitle.textContent = "Interactive physics-based graph rendering prerequisite dependencies and root gaps";
                    try {
                        if (window.GapGraphController && window.MINDGAP_DATA) {
                            const profile = MINDGAP_DATA.profiles[this.activeProfileKey];
                            if (profile) window.GapGraphController.renderGraph(profile.graphNodes, profile.graphEdges);
                        }
                    } catch(e){}
                    break;
                case 'nuggets':
                    pageTitle.textContent = "Century AI Adaptive Micro-Nuggets";
                    pageSubtitle.textContent = "Hyper-personalized 3-to-5 minute learning activities targeting identified root gaps";
                    try {
                        if (window.InterventionsController && window.MINDGAP_DATA) {
                            const profile = MINDGAP_DATA.profiles[this.activeProfileKey];
                            if (profile) window.InterventionsController.renderNuggets(profile.nuggetsPathway);
                        }
                    } catch(e){}
                    break;
                case 'interventions':
                    pageTitle.textContent = "AI Interventions & Differentiated Remediation";
                    pageSubtitle.textContent = "Automated intervention packages targeting prerequisite concept gaps";
                    break;
            }
        }
    },

    loadProfile: function(profileKey) {
        this.activeProfileKey = profileKey;
        if (!window.MINDGAP_DATA) return;

        const profile = (MINDGAP_DATA.profiles && MINDGAP_DATA.profiles[profileKey]) ||
                        (MINDGAP_DATA.studentRoster && MINDGAP_DATA.studentRoster.find(s => s.id === profileKey));

        const tag = document.getElementById('subject-tag');
        if (tag && profile) {
            tag.textContent = profile.subject || profile.name;
        }

        try {
            if (this.activeTab === 'knowledge-graph' && window.GapGraphController && profile && profile.graphNodes) {
                window.GapGraphController.renderGraph(profile.graphNodes, profile.graphEdges);
            }
        } catch(e) {}

        try {
            if (this.activeTab === 'nuggets' && window.InterventionsController && profile && profile.nuggetsPathway) {
                window.InterventionsController.renderNuggets(profile.nuggetsPathway);
            }
        } catch(e) {}
    }
};

window.AppController = window.app;

// DOM Loaded Entry
document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});
