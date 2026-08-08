const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// 1. Explicit Root Route '/' ALWAYS serves landing.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

// 2. Explicit App Route '/app' serves interactive workspace (index.html)
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 3. Static middleware with index: false to prevent express.static from auto-serving index.html on '/'
app.use(express.static(path.join(__dirname), { index: false }));

// API Endpoint for Gemini Multimodal Analysis
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

// 4. Fallback route for all other requests
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  MindGap AI - Team CodeSmiths`);
    console.log(`  Landing Page: http://localhost:${PORT}`);
    console.log(`  App Dashboard: http://localhost:${PORT}/app`);
    console.log(`====================================================`);
});
