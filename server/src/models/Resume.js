import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
    userId: {
        type: String,        // Clerk user ID (e.g., "user_2ab3cd...")
        required: true,
        index: true          // Speeds up "find all resumes for user X" queries
    },
    fileName: {
        type: String,
        required: true
    },
    extractedText: {
        type: String,
        required: true
    },
    skills: {
        type: [String],      // Array of strings — Gemini will fill this later
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Resume', resumeSchema);