import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express';
import resumeRoutes from './routes/resume.routes.js';
import sessionRoutes from './routes/session.routes.js';
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Clerk middleware — adds `req.auth()` to every request
app.use(clerkMiddleware());
app.use('/api/resumes', resumeRoutes);
app.use('/api/sessions', sessionRoutes);
// Test route (public — no auth required)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
});

// Test route (protected — uses Clerk auth)
app.get('/api/me', (req, res) => {
    const { userId } = req.auth();
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({ userId, message: 'You are authenticated!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));