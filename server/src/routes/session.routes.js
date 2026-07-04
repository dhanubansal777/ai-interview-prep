import express from 'express';
import Resume from '../models/Resume.js';
import Session from '../models/Session.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { callGemini } from '../services/gemini.service.js';
import { buildQuestionGenPrompt } from '../prompts/questionGen.prompt.js';
import { buildAnswerEvalPrompt } from '../prompts/answerEval.prompt.js';
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
 * GET /api/sessions/stats
 * Returns aggregated analytics for the current user's completed sessions.
 * NOTE: must be defined BEFORE the '/:id' route, or Express treats
 * "stats" as an :id value and this never runs.
 */
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const sessions = await Session.find({
            userId: req.userId,
            status: 'completed',
        }).sort('createdAt'); // oldest → newest, for the trend line

        // No completed interviews yet — return an empty-but-valid shape
        if (sessions.length === 0) {
            return res.json({
                stats: {
                    totalInterviews: 0,
                    averageScore: 0,
                    bestScore: 0,
                    dimensions: { content: 0, structure: 0, technicalDepth: 0 },
                    byRole: [],
                    trend: [],
                },
            });
        }

        // --- Helper: average a list of numbers, rounded to 1 decimal ---
        const avg = (arr) =>
            arr.length ? Math.round((arr.reduce((s, n) => s + n, 0) / arr.length) * 10) / 10 : 0;

        // --- Collect every per-question score across all sessions ---
        const allContent = [];
        const allStructure = [];
        const allDepth = [];
        const overallScores = [];
        const roleBuckets = {}; // { SDE: [scores...], Data: [...] }
        const trend = [];

        sessions.forEach((s, i) => {
            const sContent = [];
            const sStructure = [];
            const sDepth = [];

            s.questions.forEach((q) => {
                if (!q.scores) return;
                allContent.push(q.scores.content);
                allStructure.push(q.scores.structure);
                allDepth.push(q.scores.technicalDepth);
                sContent.push(q.scores.content);
                sStructure.push(q.scores.structure);
                sDepth.push(q.scores.technicalDepth);
            });

            // Per-session overall (mirror the same math used on the results page)
            const sessionScore =
                s.overallScore ??
                avg([...sContent, ...sStructure, ...sDepth]);
            overallScores.push(sessionScore);

            // Bucket by role
            if (!roleBuckets[s.role]) roleBuckets[s.role] = [];
            roleBuckets[s.role].push(sessionScore);

            // Trend point
            trend.push({
                interview: i + 1, // 1-based index for the x-axis
                score: sessionScore,
                role: s.role,
                date: s.completedAt || s.createdAt,
            });
        });

        const byRole = Object.entries(roleBuckets).map(([role, scores]) => ({
            role,
            score: avg(scores),
            count: scores.length,
        }));

        res.json({
            stats: {
                totalInterviews: sessions.length,
                averageScore: avg(overallScores),
                bestScore: Math.max(...overallScores),
                dimensions: {
                    content: avg(allContent),
                    structure: avg(allStructure),
                    technicalDepth: avg(allDepth),
                },
                byRole,
                trend,
            },
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ error: err.message || 'Failed to compute stats' });
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
/**
 * POST /api/sessions/:id/answer
 * Body: { questionNumber, answer }
 * Evaluates the user's answer using Gemini and saves it to the session.
 */
router.post('/:id/answer', requireAuth, async (req, res) => {
  try {
    const { questionNumber, answer } = req.body;

    if (questionNumber === undefined || !answer) {
      return res.status(400).json({ error: 'questionNumber and answer are required' });
    }

    if (answer.trim().length < 20) {
      return res.status(400).json({ error: 'Answer too short. Please give a substantive response.' });
    }

    // Find the session — must belong to this user
    const session = await Session.findOne({ _id: req.params.id, userId: req.userId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Find the question
    const question = session.questions.find(q => q.questionNumber === questionNumber);
    if (!question) {
      return res.status(404).json({ error: 'Question not found in session' });
    }

    // Build the eval prompt
    const prompt = buildAnswerEvalPrompt(
      question.question,
      question.expectedTopics,
      answer,
      session.role
    );

    console.log(`🤖 Evaluating answer for Q${questionNumber} (Session ${session._id})...`);
    const evaluation = await callGemini(prompt);

    if (!evaluation.scores || !evaluation.feedback || !evaluation.idealAnswer) {
      return res.status(500).json({ error: 'AI returned invalid evaluation format' });
    }

    // Update the question with the user's answer and evaluation
    question.userAnswer = answer;
    question.scores = evaluation.scores;
    question.feedback = evaluation.feedback;
    question.idealAnswer = evaluation.idealAnswer;

    // If all questions are answered, mark session complete + compute overall score
    const allAnswered = session.questions.every(q => q.userAnswer && q.userAnswer.length > 0);
    if (allAnswered) {
      session.status = 'completed';
      session.completedAt = new Date();
      // Average all scores across all questions
      const allScores = session.questions.flatMap(q => [
        q.scores.content, q.scores.structure, q.scores.technicalDepth
      ]);
      session.overallScore = Math.round(
        allScores.reduce((sum, s) => sum + s, 0) / allScores.length * 10
      ) / 10;
    }

    await session.save();
    console.log(`✅ Q${questionNumber} evaluated. Status: ${session.status}`);

    res.json({
      success: true,
      evaluation: {
        scores: evaluation.scores,
        feedback: evaluation.feedback,
        idealAnswer: evaluation.idealAnswer,
      },
      sessionStatus: session.status,
      overallScore: session.overallScore,
    });
  } catch (err) {
    console.error('Answer evaluation error:', err);
    res.status(500).json({ error: err.message || 'Evaluation failed' });
  }
});

export default router;