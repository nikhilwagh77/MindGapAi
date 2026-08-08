/* ----------------------------------------------------
   MindGap AI - Teacher Analytics & Automated Grouping
   Team CodeSmiths
   ---------------------------------------------------- */

window.TeacherDashboardController = {
    chartInstance: null,

    init: function() {
        // Will be rendered when tab opens
    },

    renderDashboard: function() {
        this.renderHeatmapChart();
        this.renderAutomatedGroups();
        this.renderStudentRoster();
    },

    renderHeatmapChart: function() {
        const ctx = document.getElementById('teacher-heatmap-chart');
        if (!ctx) return;

        const data = MINDGAP_DATA.teacherData.misconceptionDistribution;
        const labels = data.map(d => d.label);
        const counts = data.map(d => d.count);

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Students Affected',
                    data: counts,
                    backgroundColor: [
                        'rgba(255, 0, 85, 0.6)',
                        'rgba(157, 78, 221, 0.6)',
                        'rgba(255, 183, 3, 0.6)',
                        'rgba(0, 240, 255, 0.6)'
                    ],
                    borderColor: [
                        '#ff0055',
                        '#9d4edd',
                        '#ffb703',
                        '#00f0ff'
                    ],
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    y: {
                        ticks: { color: '#94a3b8', stepSize: 2 },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    }
                }
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
                <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-card); border-radius:var(--radius-md); padding:14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <h4 style="font-family:var(--font-heading); color:#fff; font-size:14px; font-weight:700;">
                            <i class="fa-solid fa-users icon-cyan"></i> ${g.groupName}
                        </h4>
                        <span class="badge badge-purple">${g.students.length} Students</span>
                    </div>
                    
                    <div style="margin-bottom:8px;">
                        <span style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Members:</span>
                        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                            ${g.students.map(s => `<span style="font-size:12px; background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:4px; color:#e2e8f0;">${s}</span>`).join('')}
                        </div>
                    </div>

                    <div style="font-size:12px; color:var(--accent-emerald);">
                        <i class="fa-solid fa-bullseye"></i> <strong>AI Action Plan:</strong> ${g.recommendedActivity}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        body.innerHTML = html;
    },

    renderStudentRoster: function() {
        const tbody = document.querySelector('#teacher-roster-table tbody');
        if (!tbody) return;

        const roster = MINDGAP_DATA.teacherData.roster;

        let html = '';
        roster.forEach(r => {
            html += `
                <tr>
                    <td><strong>${r.name}</strong></td>
                    <td><span class="badge" style="background:rgba(255,255,255,0.05); color:#94a3b8; border:none;">${r.subject}</span></td>
                    <td class="text-danger">${r.gap}</td>
                    <td>${r.confidence}</td>
                    <td><span class="${r.statusClass}">${r.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="alert('Sending intervention assignment to ${r.name}!')">
                            <i class="fa-solid fa-paper-plane"></i> Assign
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }
};
