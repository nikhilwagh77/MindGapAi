/* ----------------------------------------------------
   MindGap AI - Cognitive Gap Knowledge Graph Visualizer
   Uses Vis.js Network for Physics-based Prerequisite Graph
   ---------------------------------------------------- */

window.GapGraphController = {
    network: null,
    nodesDataSet: null,
    edgesDataSet: null,

    init: function() {
        // Render graph when container is ready
    },

    renderGraph: function(graphNodes, graphEdges) {
        const container = document.getElementById('vis-knowledge-graph');
        if (!container) return;

        // Transform nodes into Vis.js format with custom colors & shapes
        const visNodes = graphNodes.map(node => {
            let color = '#334155';
            let borderWidth = 2;
            let fontColor = '#f1f5f9';
            let shape = 'dot';
            let size = 25;

            if (node.status === 'mastered') {
                color = '#06d6a0';
            } else if (node.status === 'gap-root') {
                color = '#ff0055';
                size = 36;
                borderWidth = 4;
                shape = 'diamond';
            } else if (node.status === 'gap-dependent') {
                color = '#ffb703';
                size = 28;
            } else if (node.status === 'locked') {
                color = '#1e293b';
                fontColor = '#64748b';
            }

            return {
                id: node.id,
                label: node.label,
                color: {
                    background: color,
                    border: '#ffffff',
                    highlight: { background: color, border: '#00f0ff' }
                },
                font: { color: fontColor, face: 'Outfit', size: 14 },
                shape: shape,
                size: size,
                borderWidth: borderWidth,
                shadow: node.status === 'gap-root' ? { enabled: true, color: 'rgba(255, 0, 85, 0.6)', size: 20 } : false
            };
        });

        // Transform edges with arrows
        const visEdges = graphEdges.map(edge => ({
            from: edge.from,
            to: edge.to,
            arrows: 'to',
            color: { color: 'rgba(255, 255, 255, 0.2)', highlight: '#00f0ff' },
            width: 2,
            smooth: { type: 'cubicBezier' }
        }));

        this.nodesDataSet = new vis.DataSet(visNodes);
        this.edgesDataSet = new vis.DataSet(visEdges);

        const data = { nodes: this.nodesDataSet, edges: this.edgesDataSet };
        const options = {
            physics: {
                enabled: true,
                barnesHut: { gravitationalConstant: -3000, centralGravity: 0.3, springLength: 120 }
            },
            interaction: { hover: true, tooltipDelay: 200 }
        };

        if (this.network) {
            this.network.destroy();
        }

        this.network = new vis.Network(container, data, options);

        // Bind node click listener
        this.network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                this.inspectNode(nodeId, graphNodes);
            }
        });

        // Auto inspect root gap node if present
        const rootNode = graphNodes.find(n => n.status === 'gap-root');
        if (rootNode) {
            this.inspectNode(rootNode.id, graphNodes);
        }
    },

    inspectNode: function(nodeId, graphNodes) {
        const inspector = document.getElementById('node-inspector');
        if (!inspector) return;

        const node = graphNodes.find(n => n.id === nodeId);
        if (!node) return;

        let statusBadge = '<span class="badge badge-emerald">Mastered</span>';
        if (node.status === 'gap-root') {
            statusBadge = '<span class="badge badge-gold" style="background:rgba(255,0,85,0.2); color:#ff4d8d; border-color:#ff0055;">ROOT CONCEPTUAL GAP</span>';
        } else if (node.status === 'gap-dependent') {
            statusBadge = '<span class="badge badge-gold">Blocked Dependent Concept</span>';
        } else if (node.status === 'locked') {
            statusBadge = '<span class="badge" style="background:rgba(255,255,255,0.05); color:#94a3b8; border-color:transparent;">Locked (Prerequisite Needed)</span>';
        }

        const activeProfile = app ? app.getActiveProfile() : null;
        let evidenceSnippet = activeProfile ? activeProfile.transcript : 'High hesitation detected during problem solving.';

        inspector.innerHTML = `
            <div class="inspector-content">
                <h4>${node.label}</h4>
                <div class="inspector-badge">${statusBadge}</div>
                
                <div class="inspector-section">
                    <label><i class="fa-solid fa-code-branch"></i> Node Role:</label>
                    <p>${node.status === 'gap-root' ? 'This concept is the primary bottleneck preventing progress downstream.' : 'Prerequisite concept node.'}</p>
                </div>

                <div class="inspector-section">
                    <label><i class="fa-solid fa-file-waveform"></i> Multimodal Evidence:</label>
                    <p class="transcript-text" style="font-size:12px; font-style:italic;">${evidenceSnippet}</p>
                </div>

                ${node.status === 'gap-root' ? `
                    <button class="btn btn-accent btn-sm" style="width:100%; justify-center;" onclick="app.switchTab('interventions')">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Launch Intervention for This Node
                    </button>
                ` : ''}
            </div>
        `;
    }
};
