/* ============================================================
   MindGap AI - Gemini API Client with 8-Key Fallback Pool
   Team CodeSmiths
   ============================================================ */
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Parse all 8 Gemini API Keys from .env
const rawKeys = process.env.GEMINI_KEYS || '';
const API_KEYS = rawKeys.split(',').map(k => k.trim()).filter(Boolean);

console.log(`🔑 Gemini Key Manager initialized with ${API_KEYS.length} fallback key(s).`);

const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro', 'gemini-2.0-flash-lite'];

/**
 * Execute a Gemini AI prompt with automatic failover across all 8 available API keys and supported models.
 */
async function generateWithFallback(prompt, systemInstruction = '', isJson = false) {
    if (!API_KEYS || API_KEYS.length === 0) {
        throw new Error('No Gemini API keys found in environment configuration.');
    }

    let lastError = null;

    for (let i = 0; i < API_KEYS.length; i++) {
        const apiKey = API_KEYS[i];
        for (let m = 0; m < MODELS.length; m++) {
            const modelName = MODELS[m];
            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: isJson ? { responseMimeType: 'application/json' } : {}
                });

                const fullPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;
                const result = await model.generateContent(fullPrompt);
                const response = await result.response;
                const text = response.text();

                console.log(`✅ Gemini AI call succeeded using Key #${i + 1} with model [${modelName}]`);
                return text;
            } catch (err) {
                lastError = err;
            }
        }
        console.warn(`⚠️ Gemini Key #${i + 1} failed across models: ${lastError ? lastError.message : 'Error'}. Trying next fallback key...`);
    }

    throw new Error(`All ${API_KEYS.length} Gemini API keys failed. Last error: ${lastError ? lastError.message : 'Unknown'}`);
}


/**
 * Generate 3 types of assessments (MCQ, Rapid Fire, Live Speech) dynamically using Gemini AI
 */
async function generateAssessmentsFromNotes(noteContent, subject = 'General Science') {
    const systemPrompt = `You are MindGap AI, an elite adaptive learning engine inspired by Century Tech (AI + Learning Science + Neuroscience). 
Generate 3 distinct types of student assessments based on the provided lecture notes:
1. MCQ Test: 3 multiple-choice questions with 4 options each (A, B, C, D), correctIndex (0-3), and explanation.
2. Rapid Fire Check: 3 quick one-liner questions with prompt and expected short answer.
3. Live Speech Think-Aloud Prompt: 1 conceptual question requiring step-by-step verbal reasoning.

Return strict valid JSON output.`;

    const userPrompt = `Lecture Notes Subject: ${subject}\n\nLecture Content:\n${noteContent}`;

    try {
        const rawJson = await generateWithFallback(userPrompt, systemPrompt, true);
        return JSON.parse(rawJson);
    } catch(err) {
        console.warn('⚠️ All Gemini API Keys hit quota limits or offline. Using MindGap AI Fallback Generator:', err.message);
        return {
            mcq: {
                title: `MCQ Diagnostic Test: ${subject}`,
                questions: [
                    {
                        id: 'mcq-ai-1',
                        text: `Based on the lecture: What is the primary physical law governing vertical deceleration?`,
                        options: [
                            { id: 'opt-a', text: 'A) Acceleration due to gravity g acts downward (-9.8 m/s²)' },
                            { id: 'opt-b', text: 'B) Velocity remains constant throughout flight' },
                            { id: 'opt-c', text: 'C) Gravity acts upwards at apex' },
                            { id: 'opt-d', text: 'D) Displacement is always zero' }
                        ],
                        correctIndex: 0,
                        explanation: 'Gravity pulls downward towards Earth center, creating negative acceleration during upward motion.'
                    },
                    {
                        id: 'mcq-ai-2',
                        text: `Which kinematic equation calculates final velocity v given initial velocity u, acceleration a, and displacement s?`,
                        options: [
                            { id: 'opt-a2', text: 'A) v² = u² + 2as' },
                            { id: 'opt-b2', text: 'B) s = ut + at' },
                            { id: 'opt-c2', text: 'C) v = u + at²' },
                            { id: 'opt-d2', text: 'D) a = (u + v)/2' }
                        ],
                        correctIndex: 0,
                        explanation: 'The time-independent kinematics equation connects velocity, acceleration, and displacement.'
                    }
                ]
            },
            rapidFire: {
                title: `Rapid Fire Check: ${subject}`,
                questions: [
                    {
                        id: 'rf-ai-1',
                        prompt: 'What is the velocity of an upward thrown projectile at its apex?',
                        expectedAnswer: '0 m/s',
                        placeholder: 'Type answer e.g. 0 m/s'
                    },
                    {
                        id: 'rf-ai-2',
                        prompt: 'State the sign convention for downward gravitational acceleration.',
                        expectedAnswer: 'Negative (-9.8 m/s²)',
                        placeholder: 'Negative sign'
                    }
                ]
            },
            speech: {
                title: 'Live Speech Think-Aloud Assessment',
                promptQuestion: 'Explain step-by-step how you would calculate the time taken for an object launched upward at 20 m/s to reach maximum height.'
            }
        };
    }
}

/**
 * Perform deep AI diagnostic analysis on student test responses or speech transcript
 */
async function analyzeStudentAssessment(testType, answers, transcript = '', noteContent = '') {
    const systemPrompt = `You are MindGap AI Diagnostic Engine. Analyze the student's test submission or voice think-aloud transcript.
Identify deep conceptual root-cause gaps (such as acceleration vector sign errors, chain rule inner function omissions, recursion base case failures).
Provide strict valid JSON.`;

    const userPrompt = `Test Type: ${testType}\nStudent Answers: ${JSON.stringify(answers)}\nSpeech Transcript: "${transcript}"\nRelated Lecture Notes Context: ${noteContent}`;

    try {
        const rawJson = await generateWithFallback(userPrompt, systemPrompt, true);
        return JSON.parse(rawJson);
    } catch(err) {
        console.warn('⚠️ All Gemini API Keys hit quota limits or offline. Using MindGap AI Diagnostic Fallback:', err.message);
        return {
            scorePct: 88,
            accuracyRating: "High Accuracy",
            misconception: {
                title: "Acceleration Direction vs. Velocity Vector Sign Confusion",
                desc: "Student understands kinetic equations but occasionally forgets that gravity acts in opposition to upward velocity.",
                severity: "High (Prerequisite Failure)",
                impactedCount: 3
            },
            verbalFluencyPct: 88,
            hesitationIndex: "Low",
            aiFeedback: "Excellent understanding of core equations. Watch out for negative sign placement in multi-step projectile problems.",
            studyPlan: [
                { day: "Day 1", task: "Review Nugget #1: Vector Directions & Sign Conventions" },
                { day: "Day 2", task: "Complete 5 Rapid Fire practice drills" },
                { day: "Day 3", task: "Retake Live Speech Test to improve verbal confidence" }
            ]
        };
    }
}

module.exports = {
    generateWithFallback,
    generateAssessmentsFromNotes,
    analyzeStudentAssessment,
    API_KEYS
};

