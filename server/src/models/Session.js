import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    questionNumber: Number,
    question: String,
    type: { type: String, enum: ['technical', 'behavioral', 'project-deep-dive'] },
    expectedTopics: [String],
    userAnswer: { type: String, default: '' },
    scores: {
        content: { type: Number, min: 1, max: 10 },
        structure: { type: Number, min: 1, max: 10 },
        technicalDepth: { type: Number, min: 1, max: 10 },
    },
    feedback: String,
    idealAnswer: String,
});

const sessionSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
    role: {
        type: String,
        enum: ['SDE', 'Data', 'PM', 'Frontend', 'Backend'],
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium',
    },
    status: {
        type: String,
        enum: ['in-progress', 'completed'],
        default: 'in-progress',
    },
    questions: [questionSchema],
    overallScore: Number,
    createdAt: { type: Date, default: Date.now },
    completedAt: Date,
});

export default mongoose.model('Session', sessionSchema);