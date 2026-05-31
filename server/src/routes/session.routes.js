import express from 'express';
import Resume from '../models/Resume.js';
import Session from '../models/Session.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { callGemini } from '../services/gemini.service.js';
import { buildQuestionGenPrompt } from '../prompts/questionGen.prompt.js';

const router = express.Router();

/**
 * POST /api/sessions/start
 * Body: { resumeId, role, difficulty }
 * Generates 5 personalized questions and creates a session.
 */
router.post('/start', requireAuth, async (req, res) => {
    try {
        const { resumeId, role, difficulty = 'Medium' } = req.body;

        if (!resumeId || !role) {
            return res.status(400).json({ error: 'resumeId and role are required' });
        }

        // Find the resume — must belong to this user
        const resume = await Resume.findOne({ _id: resumeId, userId: req.userId });
        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        // Build the prompt
        const prompt = buildQuestionGenPrompt(resume.extractedText, role, difficulty);

        // Call Gemini
        console.log(`🤖 Generating questions for ${role} (${difficulty})...`);
        const aiResponse = await callGemini(prompt);

        if (!aiResponse.questions || !Array.isArray(aiResponse.questions)) {
            return res.status(500).json({ error: 'AI returned invalid response format' });
        }

        // Save the session to MongoDB
        const session = await Session.create({
            userId: req.userId,
            resumeId: resume._id,
            role,
            difficulty,
            questions: aiResponse.questions,
        });

        console.log(`✅ Session ${session._id} created with ${session.questions.length} questions`);

        res.json({
            success: true,
            session: {
                id: session._id,
                role: session.role,
                difficulty: session.difficulty,
                questions: session.questions,
                createdAt: session.createdAt,
            },
        });
    } catch (err) {
        console.error('Session start error:', err);
        res.status(500).json({ error: err.message || 'Failed to start session' });
    }
});

/**
 * GET /api/sessions
 * Returns all sessions for the current user.
 */
router.get('/', requireAuth, async (req, res) => {
    try {
        const sessions = await Session.find({ userId: req.userId })
            .sort('-createdAt')
            .select('role difficulty status overallScore createdAt completedAt');
        res.json({ sessions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/sessions/:id
 * Returns a single session with all questions and answers.
 */
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const session = await Session.findOne({ _id: req.params.id, userId: req.userId });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json({ session });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;