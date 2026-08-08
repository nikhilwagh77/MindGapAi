/* ----------------------------------------------------
   MindGap AI - Data & Knowledge Graph Definitions
   Inspired by Century Tech (AI + Learning Science + Neuroscience)
   Team CodeSmiths
   ---------------------------------------------------- */

window.MINDGAP_DATA = {
    // Student Profiles & Diagnostic Data
    profiles: {
        alex: {
            id: 'alex',
            name: 'Alex Chen',
            subject: 'Physics: Kinematics & Gravity',
            hesitationScore: 'High (4m 12s, 4 revisions)',
            handwritingDetected: 'v = u + at → 0 = 20 + (-9.8)t\nt = 2.04 s\nh = ut + 0.5at² → h = 20(2.04) + 9.8(2.04)² [Sign Error]',
            transcript: '"I calculated the time to max height okay... then I used the second kinematics formula. But wait... is gravity negative when calculating height or positive? I... I just added them together."',
            confidence: 38,
            memoryRetainPercent: 42,
            forgettingCurveStatus: 'Urgent Review Needed (3 Days since last practice)',
            misconception: {
                title: 'Acceleration Direction vs. Velocity Vector Confusion',
                desc: 'Student systematically confuses acceleration direction when calculating projectile displacement. Student added +0.5gt² instead of subtracting -0.5gt² during deceleration phase.',
                severity: 'High (Prerequisite Failure)',
                impactedCount: 3,
                rootNodeId: 'node-vector-accel'
            },
            question: {
                text: 'A projectile is launched vertically upward at 20 m/s. Calculate the maximum height reached. (g = 9.8 m/s²)',
                options: [
                    { label: 'A) 40.8 m', studentSelected: true, correct: false },
                    { label: 'B) 20.4 m', correct: true },
                    { label: 'C) 10.2 m', correct: false },
                    { label: 'D) 204.0 m', correct: false }
                ]
            },
            // Century-Style Recommended Learning Pathway (Micro-Nuggets)
            nuggetsPathway: [
                {
                    id: 'nugget-1',
                    title: 'Nugget #1: Vector Directions & Sign Conventions in 1D',
                    duration: '4 min',
                    type: 'Micro-Video + Practice',
                    status: 'Recommended (Urgent Gap)',
                    statusClass: 'badge-danger',
                    icon: 'fa-film',
                    summary: 'Understand why downward forces are assigned negative values in coordinate systems.'
                },
                {
                    id: 'nugget-2',
                    title: 'Nugget #2: Vertical Deceleration & Maximum Height Apex',
                    duration: '3 min',
                    type: 'Diagnostic Check',
                    status: 'In Progress',
                    statusClass: 'badge-gold',
                    icon: 'fa-circle-play',
                    summary: 'Interactive breakdown of zero-velocity apex conditions.'
                },
                {
                    id: 'nugget-3',
                    title: 'Nugget #3: 2D Trajectory Parabolic Vectors',
                    duration: '6 min',
                    type: 'Stretch & Challenge',
                    status: 'Locked',
                    statusClass: 'badge-muted',
                    icon: 'fa-lock',
                    summary: 'Prerequisite Nugget #1 and #2 required to unlock.'
                }
            ],
            graphNodes: [
                { id: 'node-vectors', label: '1D Vector Directions', status: 'mastered' },
                { id: 'node-kinematics-1', label: '1D Kinematics Equations', status: 'mastered' },
                { id: 'node-vector-accel', label: 'Deceleration & Negative Acceleration', status: 'gap-root' },
                { id: 'node-projectile', label: 'Vertical Projectile Motion', status: 'gap-dependent' },
                { id: 'node-2d-motion', label: '2D Trajectory Motion', status: 'locked' }
            ],
            graphEdges: [
                { from: 'node-vectors', to: 'node-kinematics-1' },
                { from: 'node-kinematics-1', to: 'node-vector-accel' },
                { from: 'node-vector-accel', to: 'node-projectile' },
                { from: 'node-projectile', to: 'node-2d-motion' }
            ],
            intervention: {
                title: 'Understanding Acceleration as Vector Subtraction',
                microLesson: `
                    <h4><i class="fa-solid fa-lightbulb icon-gold"></i> Core Concept Breakdown:</h4>
                    <p>When an object is moving <strong>UPWARD</strong> (+v) and gravity pulls <strong>DOWNWARD</strong> (-g), velocity is decreasing. Acceleration acts as a resistance!</p>
                    <div class="formula-box" style="background:rgba(0,0,0,0.4); padding:12px; margin:12px 0; border-radius:8px; font-family:var(--font-mono);">
                        Correct Formula: h = ut - ½gt²<br>
                        h = (20)(2.04) - ½(9.8)(2.04)² = 40.8 - 20.4 = <strong>20.4 meters</strong>
                    </div>
                    <p><em>Mental Model Fix:</em> Always align your coordinate system (+Up, -Down) before substituting values into kinematics equations!</p>
                `,
                adaptiveQuiz: [
                    {
                        id: 'q1',
                        text: 'A ball thrown up at 15 m/s slows down at 9.8 m/s². What is its acceleration vector?',
                        options: ['A) +9.8 m/s²', 'B) -9.8 m/s²', 'C) 0 m/s²', 'D) +15 m/s²'],
                        correctIndex: 1,
                        explanation: 'Gravity points downwards toward Earth center, so acceleration is negative (-9.8 m/s²).'
                    },
                    {
                        id: 'q2',
                        text: 'At the apex (highest point) of vertical flight, what is velocity and acceleration?',
                        options: ['A) v=0, a=0', 'B) v=0, a=-9.8 m/s²', 'C) v=15 m/s, a=0', 'D) v=-9.8 m/s, a=0'],
                        correctIndex: 1,
                        explanation: 'Velocity briefly drops to 0 at apex, but gravity (a = -9.8 m/s²) continuously pulls down.'
                    }
                ]
            }
        },

        priya: {
            id: 'priya',
            name: 'Priya Sharma',
            subject: 'Math: Differential Calculus',
            hesitationScore: 'Medium (2m 45s, 2 revisions)',
            handwritingDetected: 'f(x) = (3x² + 5)⁴ → f\'(x) = 4(3x² + 5)³\nForgot derivative of inside function (6x) [Chain Rule Gap]',
            transcript: '"I brought down the power 4, subtracted 1 to get power 3... but my answer doesn\'t match the textbook solution. Where did the extra x term come from?"',
            confidence: 50,
            memoryRetainPercent: 64,
            forgettingCurveStatus: 'Review Due in 2 Days',
            misconception: {
                title: 'Chain Rule Inner Function Omission',
                desc: 'Student applies outer power rule correctly but forgets to multiply by the derivative of the inner composite function g\'(x).',
                severity: 'High (Prerequisite Failure)',
                impactedCount: 4,
                rootNodeId: 'node-composite-funcs'
            },
            question: {
                text: 'Find the derivative f\'(x) for f(x) = (3x² + 5)⁴.',
                options: [
                    { label: 'A) 4(3x² + 5)³', studentSelected: true, correct: false },
                    { label: 'B) 24x(3x² + 5)³', correct: true },
                    { label: 'C) 12x(3x² + 5)⁴', correct: false },
                    { label: 'D) 6x(3x² + 5)³', correct: false }
                ]
            },
            nuggetsPathway: [
                {
                    id: 'nugget-c1',
                    title: 'Nugget #1: Identifying Inner vs. Outer Functions',
                    duration: '3 min',
                    type: 'Micro-Video',
                    status: 'Recommended',
                    statusClass: 'badge-purple',
                    icon: 'fa-film',
                    summary: 'Deconstruct composite function layers using nesting visuals.'
                },
                {
                    id: 'nugget-c2',
                    title: 'Nugget #2: Multi-Layer Chain Rule Drill',
                    duration: '5 min',
                    type: 'Interactive Quiz',
                    status: 'Unlocked',
                    statusClass: 'badge-gold',
                    icon: 'fa-layer-group',
                    summary: 'Practice finding f\'(g(x)) * g\'(x).'
                }
            ],
            graphNodes: [
                { id: 'node-power-rule', label: 'Basic Power Rule', status: 'mastered' },
                { id: 'node-composite-funcs', label: 'Composite Functions & Inner Derivatives', status: 'gap-root' },
                { id: 'node-chain-rule', label: 'Calculus Chain Rule', status: 'gap-dependent' },
                { id: 'node-implicit', label: 'Implicit Differentiation', status: 'locked' }
            ],
            graphEdges: [
                { from: 'node-power-rule', to: 'node-composite-funcs' },
                { from: 'node-composite-funcs', to: 'node-chain-rule' },
                { from: 'node-chain-rule', to: 'node-implicit' }
            ],
            intervention: {
                title: 'The Russian Nesting Doll Analogy for Chain Rule',
                microLesson: `
                    <h4><i class="fa-solid fa-layer-group icon-purple"></i> The Nesting Rule:</h4>
                    <p>Think of f(g(x)) like a Russian nesting doll. You must differentiate the outer layer <em>AND THEN</em> multiply by the inner doll derivative!</p>
                    <div class="formula-box" style="background:rgba(0,0,0,0.4); padding:12px; margin:12px 0; border-radius:8px; font-family:var(--font-mono);">
                        f'(x) = [d/du (u⁴)] × [d/dx (3x² + 5)]<br>
                        f'(x) = 4(3x² + 5)³ × (6x) = <strong>24x(3x² + 5)³</strong>
                    </div>
                `,
                adaptiveQuiz: [
                    {
                        id: 'q1',
                        text: 'What is the inner function g(x) in f(x) = sin(x² + 3)?',
                        options: ['A) sin(x)', 'B) x² + 3', 'C) 2x', 'D) cos(x)'],
                        correctIndex: 1,
                        explanation: 'The function inside sin(...) is g(x) = x² + 3.'
                    }
                ]
            }
        },

        jordan: {
            id: 'jordan',
            name: 'Jordan Lee',
            subject: 'CS: Data Structures & Recursion',
            hesitationScore: 'High (5m 10s, Infinite Loop StackOverflow)',
            handwritingDetected: 'def factorial(n):\n    return n * factorial(n - 1)  # Missing base case n == 1!',
            transcript: '"My code keeps giving RecursionError: maximum recursion depth exceeded. I thought returning n * factorial(n-1) calculates factorial properly?"',
            confidence: 25,
            memoryRetainPercent: 35,
            forgettingCurveStatus: 'Urgent Memory Decay Alert',
            misconception: {
                title: 'Recursive Base Case & Termination Condition Missing',
                desc: 'Student conceptualizes recursive calls as looping constructs without recognizing the necessity of a base case to unwind the call stack.',
                severity: 'Critical (Call Stack Overflow)',
                impactedCount: 5,
                rootNodeId: 'node-call-stack'
            },
            question: {
                text: 'Why does factorial(5) cause a stack overflow in the code snippet?',
                options: [
                    { label: 'A) n is not converted to float', correct: false },
                    { label: 'B) Missing base case to stop recursion when n <= 1', studentSelected: true, correct: true },
                    { label: 'C) Python does not support recursive functions', correct: false },
                    { label: 'D) Multiplication operator is invalid', correct: false }
                ]
            },
            nuggetsPathway: [
                {
                    id: 'nugget-r1',
                    title: 'Nugget #1: Call Stack Frames & Push/Pop Unwinding',
                    duration: '4 min',
                    type: 'Visual Simulation',
                    status: 'Recommended',
                    statusClass: 'badge-danger',
                    icon: 'fa-cubes',
                    summary: 'Visualize how function call frames stack up in RAM.'
                }
            ],
            graphNodes: [
                { id: 'node-functions', label: 'Function Calls & Scope', status: 'mastered' },
                { id: 'node-call-stack', label: 'Call Stack & Stack Frames', status: 'gap-root' },
                { id: 'node-base-case', label: 'Recursive Base Cases', status: 'gap-dependent' },
                { id: 'node-tree-recursion', label: 'Tree & Graph Traversal Recursion', status: 'locked' }
            ],
            graphEdges: [
                { from: 'node-functions', to: 'node-call-stack' },
                { from: 'node-call-stack', to: 'node-base-case' },
                { from: 'node-base-case', to: 'node-tree-recursion' }
            ],
            intervention: {
                title: 'Visualizing the Call Stack Push & Pop',
                microLesson: `
                    <h4><i class="fa-solid fa-cubes icon-emerald"></i> The Call Stack Boundary:</h4>
                    <p>Every recursive call pushes a frame onto memory stack. Without a stopping condition (Base Case), frames stack infinitely until crash!</p>
                    <div class="formula-box" style="background:rgba(0,0,0,0.4); padding:12px; margin:12px 0; border-radius:8px; font-family:var(--font-mono);">
                        if n <= 1: return 1  # Base Case stops stack explosion!
                    </div>
                `,
                adaptiveQuiz: [
                    {
                        id: 'q1',
                        text: 'What happens when a function hits its base case in recursion?',
                        options: ['A) It calls itself again', 'B) It starts returning values back up the call stack', 'C) It clears all memory', 'D) It enters an infinite loop'],
                        correctIndex: 1,
                        explanation: 'The base case stops further recursive calls and unwinds the stack frames.'
                    }
                ]
            }
        }
    },

    // Classroom Grouping Data for Teacher View
    teacherData: {
        misconceptionDistribution: [
            { label: 'Sign Error in Acceleration/Vectors', count: 8, severity: 'High' },
            { label: 'Chain Rule Inner Derivative Omission', count: 6, severity: 'Medium' },
            { label: 'Recursion Missing Base Case', count: 5, severity: 'High' },
            { label: 'Confusing Mass vs Weight', count: 3, severity: 'Low' }
        ],
        automatedGroups: [
            {
                groupName: 'Group Alpha: Vector & Sign Conventions',
                students: ['Alex Chen', 'Samantha Wu', 'David Miller', 'Marcus Vance'],
                recommendedActivity: 'Assign Century AI Nugget #1 (Vector Directions) + Pair Solving'
            },
            {
                groupName: 'Group Beta: Composite Functions & Calculus',
                students: ['Priya Sharma', 'Lucas Meyer', 'Elena Rostova'],
                recommendedActivity: 'Assign Century AI Nugget #1 (Nesting Doll Chain Rule)'
            },
            {
                groupName: 'Group Gamma: Recursion Call Stack Visualization',
                students: ['Jordan Lee', 'Tariq Al-Mansoor', 'Chloe Bennett'],
                recommendedActivity: 'Assign Century AI Nugget #1 (Call Stack Frames Lab)'
            }
        ],
        roster: [
            { name: 'Alex Chen', subject: 'Physics', gap: 'Vector Acceleration Direction', confidence: '38%', status: 'In Intervention', statusClass: 'text-danger' },
            { name: 'Priya Sharma', subject: 'Calculus', gap: 'Chain Rule Inner Function', confidence: '50%', status: 'Intervention Ready', statusClass: 'text-warning' },
            { name: 'Jordan Lee', subject: 'Computer Science', gap: 'Recursion Base Case Omission', confidence: '25%', status: 'In Intervention', statusClass: 'text-danger' },
            { name: 'Samantha Wu', subject: 'Physics', gap: 'Vector Acceleration Direction', confidence: '42%', status: 'Pending Review', statusClass: 'text-warning' },
            { name: 'David Miller', subject: 'Physics', gap: 'Kinematics Sign Conventions', confidence: '30%', status: 'In Intervention', statusClass: 'text-danger' }
        ]
    }
};
