/* ============================================================
   MindGap AI - DB Migration Runner
   Run: node db/migrate.js
   ============================================================ */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate() {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

    try {
        await pool.query(sql);
        console.log('✅ All MindGap AI tables created successfully!');
        console.log('');
        console.log('Tables created:');
        const tables = [
            'users', 'teacher_notes', 'class_announcements',
            'student_profiles', 'weak_areas', 'assessments',
            'assessment_questions', 'assessment_results', 'student_answers',
            'performance_analytics', 'teacher_feedback', 'ai_history',
            'knowledge_graph_nodes', 'knowledge_graph_edges',
            'ai_nuggets', 'multimodal_diagnostics'
        ];
        tables.forEach(t => console.log(`  ✓ ${t}`));
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
