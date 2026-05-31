import express from 'express';
import multer from 'multer';
import { PdfReader } from 'pdfreader';
import Resume from '../models/Resume.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Configure Multer — stores files in memory (not disk)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// Helper: extract text from PDF buffer
const extractTextFromPdf = (buffer) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        new PdfReader().parseBuffer(buffer, (err, item) => {
            if (err) return reject(err);
            if (!item) return resolve(chunks.join(' ').trim());
            if (item.text) chunks.push(item.text);
        });
    });
};

// POST /api/resumes/upload
router.post('/upload', requireAuth, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Extract text from the PDF
        const extractedText = await extractTextFromPdf(req.file.buffer);

        if (extractedText.length < 50) {
            return res.status(400).json({
                error: 'Could not extract enough text. Is this a scanned image PDF?'
            });
        }

        // Save to MongoDB
        const resume = await Resume.create({
            userId: req.userId,
            fileName: req.file.originalname,
            extractedText
        });

        res.json({
            success: true,
            resume: {
                id: resume._id,
                fileName: resume.fileName,
                textLength: extractedText.length,
                createdAt: resume.createdAt
            }
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message || 'Upload failed' });
    }
});

// GET /api/resumes — list all resumes for the current user
router.get('/', requireAuth, async (req, res) => {
    try {
        const resumes = await Resume.find({ userId: req.userId })
            .select('-extractedText') // Don't send full text in list (saves bandwidth)
            .sort('-createdAt');
        res.json({ resumes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;