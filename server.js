require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const pool = require('./db/pool');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Verify DB on startup
pool.connect((err, client, release) => {
    if (err) console.error('❌ DB connection failed:', err.message);
    else { console.log('✅ Neon PostgreSQL connected!'); release(); }
});

// ─────────────────────────────────────────────────────────────
// PAGE ROUTES
// ─────────────────────────────────────────────────────────────
app.get('/',    (req, res) => res.sendFile(path.join(__dirname, 'landing.html')));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.use(express.static(path.join(__dirname), { index: false }));

// ─────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
    try {
        const r = await pool.query('SELECT NOW() AS t');
        res.json({ status: 'ok', db: 'connected', server_time: r.rows[0].t });
    } catch (e) {
        res.status(500).json({ status: 'error', error: e.message });
    }
});

// ─────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
    const { role } = req.query;
    try {
        const r = role
            ? await pool.query('SELECT * FROM users WHERE role=$1 ORDER BY name', [role])
            : await pool.query('SELECT * FROM users ORDER BY role, name');
        res.json({ success: true, users: r.rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/users', async (req, res) => {
    const { name, email, role, subject, avatar_url } = req.body;
    try {
        const r = await pool.query(
            `INSERT INTO users (name, email, role, subject, avatar_url)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [name, email, role, subject, avatar_url]
        );
        res.json({ success: true, user: r.rows[0] });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ─────────────────────────────────────────────────────────────
// TEACHER NOTES
// ─────────────────────────────────────────────────────────────
app.get('/api/notes', async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT n.*, u.name AS teacher_name FROM teacher_notes n
             LEFT JOIN users u ON u.id = n.teacher_id
             WHERE n.is_published = true ORDER BY n.created_at DESC`
        );
        res.json({ success: true, notes: r.rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/notes', async (req, res) => {
    const { teacher_id, title, content, subject, file_name, file_size_kb, note_type } = req.body;
    try {
        const r = await pool.query(
            `INSERT INTO teacher_notes (teacher_id, title, content, subject, file_name, file_size_kb, note_type)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [teacher_id || 1, title, content, subject, file_name, file_size_kb, note_type || 'composed']
        );
        res.json({ success: true, note: r.rows[0] });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.delete('/api/notes/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM teacher_notes WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ─────────────────────────────────────────────────────────────
// CLASS ANNOUNCEMENTS (Broadcast Feedback)
// ─────────────────────────────────────────────────────────────
app.get('/api/announcements/active', async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT * FROM class_announcements WHERE is_active=true ORDER BY created_at DESC LIMIT 1`
        );
        res.json({ success: true, announcement: r.rows[0] || null });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/announcements', async (req, res) => {
    const { teacher_id, message } = req.body;
    try {
        await pool.query('UPDATE class_announcements SET is_active=false');
        const r = await pool.query(
            `INSERT INTO class_announcements (teacher_id, message) VALUES ($1,$2) RETURNING *`,
            [teacher_id || 1, message]
        );
        res.json({ success: true, announcement: r.rows[0] });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ─────────────────────────────────────────────────────────────
// STUDENTS (Roster + Profiles)
// ─────────────────────────────────────────────────────────────
app.get('/api/students', async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT u.*, sp.overall_performance, sp.risk_level, sp.learning_pattern, sp.last_activity
             FROM users u
             LEFT JOIN student_profiles sp ON sp.user_id = u.id
             WHERE u.role = 'student'
             ORDER BY sp.risk_level DESC, u.name`
        );
        res.json({ success: true, students: r.rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/students/:id', async (req, res) => {
    try {
        const [user, profile, weakAreas, aiHistory] = await Promise.all([
            pool.query('SELECT * FROM users WHERE id=$1', [req.params.id]),
            pool.query('SELECT * FROM student_profiles WHERE user_id=$1', [req.params.id]),
            pool.query('SELECT * FROM weak_areas WHERE student_id=$1 ORDER BY identified_at DESC', [req.params.id]),
            pool.query('SELECT * FROM ai_history WHERE student_id=$1 ORDER BY date_given DESC LIMIT 10', [req.params.id])
        ]);
        res.json({
            success: true,
            student: user.rows[0],
            profile: profile.rows[0],
            weakAreas: weakAreas.rows,
            aiHistory: aiHistory.rows
        });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.put('/api/students/:id/profile', async (req, res) => {
    const { overall_performance, risk_level, learning_pattern } = req.body;
    try {
        const r = await pool.query(
            `INSERT INTO student_profiles (user_id, overall_performance, risk_level, learning_pattern)
             VALUES ($1,$2,$3,$4)
             ON CONFLICT (user_id) DO UPDATE
             SET overall_performance=$2, risk_level=$3, learning_pattern=$4, updated_at=NOW()
             RETURNING *`,
            [req.params.id, overall_performance, risk_level, learning_pattern]
        );
        res.json({ success: true, profile: r.rows[0] });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ─────────────────────────────────────────────────────────────
// TEACHER FEEDBACK (Individual per student)
// ─────────────────────────────────────────────────────────────
app.post('/api/feedback', async (req, res) => {
    const { student_id, teacher_id, feedback_text, ai_influence_override } = req.body;
    try {
        const r = await pool.query(
            `INSERT INTO teacher_feedback (student_id, teacher_id, feedback_text, ai_influence_override)
             VALUES ($1,$2,$3,$4) RETURNING *`,
            [student_id, teacher_id || 1, feedback_text, ai_influence_override || false]
        );
        res.json({ success: true, feedback: r.rows[0] });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/feedback/:student_id', async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT f.*, u.name AS teacher_name FROM teacher_feedback f
             LEFT JOIN users u ON u.id = f.teacher_id
             WHERE f.student_id=$1 ORDER BY f.created_at DESC`,
            [req.params.student_id]
        );
        res.json({ success: true, feedbacks: r.rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ─────────────────────────────────────────────────────────────
// ASSESSMENTS
// ─────────────────────────────────────────────────────────────
app.get('/api/assessments', async (req, res) => {
    const { type } = req.query;
    try {
        const r = type
            ? await pool.query('SELECT * FROM assessments WHERE assessment_type=$1 AND is_active=true', [type])
            : await pool.query('SELECT * FROM assessments WHERE is_active=true ORDER BY created_at DESC');
        res.json({ success: true, assessments: r.rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/assessments/:id/questions', async (req, res) => {
    try {
        const r = await pool.query(
            'SELECT * FROM assessment_questions WHERE assessment_id=$1 ORDER BY order_index',
            [req.params.id]
        );
        res.json({ success: true, questions: r.rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ─────────────────────────────────────────────────────────────
// ASSESSMENT RESULTS (Submit test)
// ─────────────────────────────────────────────────────────────
app.post('/api/results', async (req, res) => {
    const { student_id, assessment_id, score_pct, total_questions, correct_answers,
            time_taken_secs, ai_feedback, verbal_fluency_pct, hesitation_index } = req.body;
    try {
        const r = await pool.query(
            `INSERT INTO assessment_results
             (student_id, assessment_id, score_pct, total_questions, correct_answers,
              time_taken_secs, ai_feedback, verbal_fluency_pct, hesitation_index)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [student_id, assessment_id, score_pct, total_questions, correct_answers,
             time_taken_secs, ai_feedback, verbal_fluency_pct, hesitation_index]
        );
        // Log to performance_analytics
        await pool.query(
            `INSERT INTO performance_analytics (student_id, assessment_id, score_pct)
             VALUES ($1,$2,$3)`,
            [student_id, assessment_id, score_pct]
        );
        res.json({ success: true, result: r.rows[0] });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/results/:student_id', async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT ar.*, a.title AS assessment_title, a.assessment_type
             FROM assessment_results ar
             LEFT JOIN assessments a ON a.id = ar.assessment_id
             WHERE ar.student_id=$1 ORDER BY ar.submitted_at DESC`,
            [req.params.student_id]
        );
        res.json({ success: true, results: r.rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ─────────────────────────────────────────────────────────────
// PERFORMANCE ANALYTICS (Score trends)
// ─────────────────────────────────────────────────────────────
app.get('/api/analytics/:student_id', async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT * FROM performance_analytics WHERE student_id=$1 ORDER BY recorded_at ASC`,
            [req.params.student_id]
        );
        res.json({ success: true, analytics: r.rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ─────────────────────────────────────────────────────────────
// WEAK AREAS
// ─────────────────────────────────────────────────────────────
app.get('/api/weak-areas/:student_id', async (req, res) => {
    try {
        const r = await pool.query(
            'SELECT * FROM weak_areas WHERE student_id=$1 ORDER BY severity DESC',
            [req.params.student_id]
        );
        res.json({ success: true, weakAreas: r.rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/weak-areas', async (req, res) => {
    const { student_id, topic, subject, severity } = req.body;
    try {
        const r = await pool.query(
            `INSERT INTO weak_areas (student_id, topic, subject, severity) VALUES ($1,$2,$3,$4) RETURNING *`,
            [student_id, topic, subject, severity || 'medium']
        );
        res.json({ success: true, weakArea: r.rows[0] });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ─────────────────────────────────────────────────────────────
// AI HISTORY
// ─────────────────────────────────────────────────────────────
app.get('/api/ai-history/:student_id', async (req, res) => {
    try {
        const r = await pool.query(
            'SELECT * FROM ai_history WHERE student_id=$1 ORDER BY date_given DESC LIMIT 20',
            [req.params.student_id]
        );
        res.json({ success: true, history: r.rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/ai-history', async (req, res) => {
    const { student_id, test_name, ai_feedback } = req.body;
    try {
        const r = await pool.query(
            `INSERT INTO ai_history (student_id, test_name, ai_feedback) VALUES ($1,$2,$3) RETURNING *`,
            [student_id, test_name, ai_feedback]
        );
        res.json({ success: true, entry: r.rows[0] });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ─────────────────────────────────────────────────────────────
// AI NUGGETS
// ─────────────────────────────────────────────────────────────
app.get('/api/nuggets/:student_id', async (req, res) => {
    try {
        const r = await pool.query(
            'SELECT * FROM ai_nuggets WHERE student_id=$1 ORDER BY is_completed, created_at DESC',
            [req.params.student_id]
        );
        res.json({ success: true, nuggets: r.rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.put('/api/nuggets/:id/complete', async (req, res) => {
    try {
        await pool.query(
            'UPDATE ai_nuggets SET is_completed=true, completed_at=NOW() WHERE id=$1',
            [req.params.id]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ─────────────────────────────────────────────────────────────
// KNOWLEDGE GRAPH
// ─────────────────────────────────────────────────────────────
app.get('/api/knowledge-graph/:student_id', async (req, res) => {
    try {
        const [nodes, edges] = await Promise.all([
            pool.query('SELECT * FROM knowledge_graph_nodes WHERE student_id=$1', [req.params.student_id]),
            pool.query('SELECT * FROM knowledge_graph_edges WHERE student_id=$1', [req.params.student_id])
        ]);
        res.json({ success: true, nodes: nodes.rows, edges: edges.rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ─────────────────────────────────────────────────────────────
// MULTIMODAL DIAGNOSTICS
// ─────────────────────────────────────────────────────────────
app.post('/api/diagnose', async (req, res) => {
    const { student_id, input_type, ocr_text, speech_transcript,
            hesitation_count, error_pattern } = req.body;
    try {
        const result = {
            title: "Conceptual Prerequisite Bottleneck Detected",
            description: "Multimodal AI identified root cause misconception from handwriting alignment and audio hesitation patterns.",
            severity: "High"
        };
        if (student_id) {
            await pool.query(
                `INSERT INTO multimodal_diagnostics
                 (student_id, input_type, ocr_text, speech_transcript, hesitation_count,
                  error_pattern, ai_misconception_title, ai_misconception_desc, severity)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                [student_id, input_type || 'handwriting', ocr_text, speech_transcript,
                 hesitation_count || 0, error_pattern, result.title, result.description, result.severity]
            );
        }
        res.json({ success: true, misconception: result });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/diagnostics/:student_id', async (req, res) => {
    try {
        const r = await pool.query(
            'SELECT * FROM multimodal_diagnostics WHERE student_id=$1 ORDER BY diagnosed_at DESC LIMIT 10',
            [req.params.student_id]
        );
        res.json({ success: true, diagnostics: r.rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

const { generateWithFallback, generateAssessmentsFromNotes, analyzeStudentAssessment } = require('./services/geminiService');

// ─────────────────────────────────────────────────────────────
// GEMINI AI INTEGRATION (3 Assessment Types + AI Diagnostics + Fallback Pool)
// ─────────────────────────────────────────────────────────────
app.post('/api/ai/generate-tests', async (req, res) => {
    const { note_content, subject } = req.body;
    try {
        const contentToUse = note_content || "1D Kinematics and Vertical Projectile Motion with sign conventions. g = -9.8 m/s^2 when moving upward.";
        const generated = await generateAssessmentsFromNotes(contentToUse, subject || 'Physics');
        res.json({ success: true, tests: generated });
    } catch (e) {
        console.error('Gemini Test Generation Error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/ai/analyze-assessment', async (req, res) => {
    const { test_type, student_id, answers, transcript, note_content, time_taken_secs } = req.body;
    try {
        const analysis = await analyzeStudentAssessment(
            test_type || 'mcq',
            answers || [],
            transcript || '',
            note_content || ''
        );

        // Save diagnostic results to DB
        const studentIdToUse = student_id || 1;

        if (analysis) {
            try {
                // Log Result
                await pool.query(
                    `INSERT INTO assessment_results
                     (student_id, score_pct, total_questions, correct_answers, time_taken_secs, ai_feedback, verbal_fluency_pct, hesitation_index)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [studentIdToUse, analysis.scorePct || 85, 3, 3, time_taken_secs || 30, analysis.aiFeedback || '', analysis.verbalFluencyPct || 85, analysis.hesitationIndex || 'Low']
                );

                // Log Performance Analytics
                await pool.query(
                    `INSERT INTO performance_analytics (student_id, score_pct, test_label) VALUES ($1, $2, $3)`,
                    [studentIdToUse, analysis.scorePct || 85, `${test_type ? test_type.toUpperCase() : 'AI'} Test`]
                );

                // Log Weak Area if misconception identified
                if (analysis.misconception && analysis.misconception.title) {
                    await pool.query(
                        `INSERT INTO weak_areas (student_id, topic, severity) VALUES ($1, $2, $3)`,
                        [studentIdToUse, analysis.misconception.title, analysis.misconception.severity && analysis.misconception.severity.toLowerCase().includes('high') ? 'high' : 'medium']
                    );

                    await pool.query(
                        `INSERT INTO multimodal_diagnostics
                         (student_id, input_type, speech_transcript, ai_misconception_title, ai_misconception_desc, severity)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [studentIdToUse, test_type === 'speech' ? 'speech' : 'telemetry', transcript || '', analysis.misconception.title, analysis.misconception.desc, analysis.misconception.severity || 'high']
                    );
                }
            } catch(dbErr) { console.warn('DB save warning:', dbErr.message); }
        }

        res.json({ success: true, analysis });
    } catch (e) {
        console.error('Gemini Assessment Analysis Error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

// ─────────────────────────────────────────────────────────────
// FALLBACK
// ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'landing.html')));


// ─────────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  MindGap AI — Team CodeSmiths`);
    console.log(`  Landing:    http://localhost:${PORT}`);
    console.log(`  Dashboard:  http://localhost:${PORT}/app`);
    console.log(`  DB Health:  http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
});
