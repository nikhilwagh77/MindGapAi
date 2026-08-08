-- ============================================================
-- MindGap AI - Complete Database Schema
-- Neon PostgreSQL | Team CodeSmiths
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. USERS (Teachers + Students unified table)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student')),
    avatar_url      TEXT,
    subject         VARCHAR(100),
    password_hash   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 2. TEACHER NOTES (Composed + Uploaded by teachers)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teacher_notes (
    id              SERIAL PRIMARY KEY,
    teacher_id      INT REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    content         TEXT,
    subject         VARCHAR(100),
    file_name       VARCHAR(255),
    file_size_kb    NUMERIC(10,2),
    note_type       VARCHAR(20) DEFAULT 'composed' CHECK (note_type IN ('composed', 'uploaded')),
    is_published    BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 3. CLASS ANNOUNCEMENTS (Common Feedback / Broadcast)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS class_announcements (
    id              SERIAL PRIMARY KEY,
    teacher_id      INT REFERENCES users(id) ON DELETE SET NULL,
    message         TEXT NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 4. STUDENT PROFILES (Extended student data)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_profiles (
    id                  SERIAL PRIMARY KEY,
    user_id             INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    overall_performance INT DEFAULT 0 CHECK (overall_performance BETWEEN 0 AND 100),
    risk_level          VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    learning_pattern    TEXT,
    last_activity       TIMESTAMPTZ DEFAULT NOW(),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 5. WEAK AREAS (Per student identified by AI)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weak_areas (
    id              SERIAL PRIMARY KEY,
    student_id      INT REFERENCES users(id) ON DELETE CASCADE,
    topic           VARCHAR(255) NOT NULL,
    subject         VARCHAR(100),
    severity        VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    identified_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 6. ASSESSMENTS (MCQ / Rapid Fire / Speech definitions)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessments (
    id              SERIAL PRIMARY KEY,
    teacher_id      INT REFERENCES users(id) ON DELETE SET NULL,
    title           VARCHAR(255) NOT NULL,
    subject         VARCHAR(100),
    assessment_type VARCHAR(20) NOT NULL CHECK (assessment_type IN ('mcq', 'rapid_fire', 'speech')),
    duration_mins   INT DEFAULT 5,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 7. ASSESSMENT QUESTIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessment_questions (
    id              SERIAL PRIMARY KEY,
    assessment_id   INT REFERENCES assessments(id) ON DELETE CASCADE,
    question_text   TEXT NOT NULL,
    option_a        TEXT,
    option_b        TEXT,
    option_c        TEXT,
    option_d        TEXT,
    correct_index   INT,              -- 0=A, 1=B, 2=C, 3=D for MCQ
    explanation     TEXT,
    question_type   VARCHAR(20) DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'text', 'speech')),
    order_index     INT DEFAULT 0
);

-- ────────────────────────────────────────────────────────────
-- 8. ASSESSMENT RESULTS (Per student submission)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessment_results (
    id                  SERIAL PRIMARY KEY,
    student_id          INT REFERENCES users(id) ON DELETE CASCADE,
    assessment_id       INT REFERENCES assessments(id) ON DELETE CASCADE,
    score_pct           NUMERIC(5,2),
    total_questions     INT,
    correct_answers     INT,
    time_taken_secs     INT,
    ai_feedback         TEXT,
    verbal_fluency_pct  NUMERIC(5,2),   -- for speech tests
    hesitation_index    VARCHAR(20),     -- low/medium/high
    submitted_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 9. STUDENT ANSWERS (Per question per submission)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_answers (
    id                  SERIAL PRIMARY KEY,
    result_id           INT REFERENCES assessment_results(id) ON DELETE CASCADE,
    question_id         INT REFERENCES assessment_questions(id) ON DELETE CASCADE,
    selected_option     INT,            -- for MCQ
    text_answer         TEXT,           -- for rapid fire
    speech_transcript   TEXT,           -- for speech
    is_correct          BOOLEAN,
    answered_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 10. PERFORMANCE ANALYTICS (Aggregated score trends)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS performance_analytics (
    id              SERIAL PRIMARY KEY,
    student_id      INT REFERENCES users(id) ON DELETE CASCADE,
    assessment_id   INT REFERENCES assessments(id) ON DELETE SET NULL,
    score_pct       NUMERIC(5,2),
    test_label      VARCHAR(100),   -- "Test 1", "Test 2" etc.
    subject         VARCHAR(100),
    recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 11. TEACHER FEEDBACK (Individual per student)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teacher_feedback (
    id                      SERIAL PRIMARY KEY,
    student_id              INT REFERENCES users(id) ON DELETE CASCADE,
    teacher_id              INT REFERENCES users(id) ON DELETE SET NULL,
    feedback_text           TEXT NOT NULL,
    ai_influence_override   BOOLEAN DEFAULT FALSE,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 12. AI HISTORY (AI feedback logs per student per test)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_history (
    id              SERIAL PRIMARY KEY,
    student_id      INT REFERENCES users(id) ON DELETE CASCADE,
    test_name       VARCHAR(255),
    ai_feedback     TEXT,
    date_given      DATE DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 13. KNOWLEDGE GRAPH NODES (Per student)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_graph_nodes (
    id              SERIAL PRIMARY KEY,
    student_id      INT REFERENCES users(id) ON DELETE CASCADE,
    node_key        VARCHAR(100) NOT NULL,
    label           VARCHAR(255) NOT NULL,
    status          VARCHAR(20) DEFAULT 'unknown' CHECK (status IN ('mastered', 'partial', 'gap', 'unknown')),
    subject         VARCHAR(100),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 14. KNOWLEDGE GRAPH EDGES (Prerequisite links)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
    id              SERIAL PRIMARY KEY,
    student_id      INT REFERENCES users(id) ON DELETE CASCADE,
    from_node_key   VARCHAR(100) NOT NULL,
    to_node_key     VARCHAR(100) NOT NULL,
    edge_type       VARCHAR(50) DEFAULT 'prerequisite'
);

-- ────────────────────────────────────────────────────────────
-- 15. AI NUGGETS (Micro-learning remediation items)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_nuggets (
    id              SERIAL PRIMARY KEY,
    student_id      INT REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    topic           VARCHAR(255),
    subject         VARCHAR(100),
    nugget_type     VARCHAR(50),    -- 'video', 'quiz', 'simulation', 'reading'
    duration_mins   INT DEFAULT 3,
    content_url     TEXT,
    description     TEXT,
    difficulty      VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    is_completed    BOOLEAN DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 16. MULTIMODAL DIAGNOSTICS (Vision + Audio + Behavioral)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS multimodal_diagnostics (
    id                      SERIAL PRIMARY KEY,
    student_id              INT REFERENCES users(id) ON DELETE CASCADE,
    input_type              VARCHAR(30) CHECK (input_type IN ('handwriting', 'speech', 'telemetry')),
    raw_input_path          TEXT,
    ocr_text                TEXT,
    speech_transcript       TEXT,
    hesitation_count        INT DEFAULT 0,
    error_pattern           TEXT,
    ai_misconception_title  VARCHAR(255),
    ai_misconception_desc   TEXT,
    severity                VARCHAR(20) DEFAULT 'medium',
    diagnosed_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- INDEXES for performance
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_teacher_notes_teacher ON teacher_notes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_student ON assessment_results(student_id);
CREATE INDEX IF NOT EXISTS idx_performance_analytics_student ON performance_analytics(student_id);
CREATE INDEX IF NOT EXISTS idx_weak_areas_student ON weak_areas(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_nuggets_student ON ai_nuggets(student_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_student ON knowledge_graph_nodes(student_id);
CREATE INDEX IF NOT EXISTS idx_multimodal_student ON multimodal_diagnostics(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_history_student ON ai_history(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_feedback_student ON teacher_feedback(student_id);
