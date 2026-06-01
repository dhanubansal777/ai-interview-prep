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