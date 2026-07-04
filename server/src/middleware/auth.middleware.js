import jwt from 'jsonwebtoken';
import BlacklistToken from '../models/BlacklistToken.js';

export async function requireAuth(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized — please sign in' });
    }

    const isBlacklisted = await BlacklistToken.findOne({ token });
    if (isBlacklisted) {
        return res.status(401).json({ error: 'Unauthorized — please sign in' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: 'Unauthorized — please sign in' });
    }
}
