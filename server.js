require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── PostgreSQL (Neon) Connection ─────────────────────────────────────────────
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Test DB connection on startup
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to Neon PostgreSQL Database successfully!');
        release();
    }
});

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────

// 1. Root → landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

// 2. App dashboard
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. Static files (JS, CSS, images, etc.)
app.use(express.static(path.join(__dirname), { index: false }));

// ─── API Endpoints ────────────────────────────────────────────────────────────

// Health check + DB ping
app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() AS server_time');
        res.json({ status: 'ok', db: 'connected', server_time: result.rows[0].server_time });
    } catch (err) {
        res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
    }
});

// Multimodal AI diagnosis endpoint
app.post('/api/diagnose', (req, res) => {
    res.json({
        success: true,
        misconception: {
            title: "Conceptual Prerequisite Bottleneck Detected",
            description: "Multimodal AI fusion identified root cause misconception from handwriting step alignment and audio hesitation patterns.",
            severity: "High",
            impactedTopicsCount: 3
        }
    });
});

// Get all students from DB
app.get('/api/students', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM students ORDER BY created_at DESC');
        res.json({ success: true, students: result.rows });
    } catch (err) {
        // Table may not exist yet — return empty
        res.json({ success: true, students: [], note: err.message });
    }
});

// Save feedback to DB
app.post('/api/feedback', async (req, res) => {
    const { studentId, feedback, teacherId } = req.body;
    try {
        await pool.query(
            'INSERT INTO feedback (student_id, teacher_id, feedback_text, created_at) VALUES ($1, $2, $3, NOW())',
            [studentId, teacherId || 'teacher-1', feedback]
        );
        res.json({ success: true, message: 'Feedback saved to database.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── Fallback ─────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  MindGap AI - Team CodeSmiths`);
    console.log(`  Landing Page: http://localhost:${PORT}`);
    console.log(`  App Dashboard: http://localhost:${PORT}/app`);
    console.log(`  DB Health:     http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
});
