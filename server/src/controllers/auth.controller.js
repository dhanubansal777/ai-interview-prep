import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import BlacklistToken from '../models/BlacklistToken.js';

const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 1 day, matches JWT expiresIn
};

function signToken(user) {
    return jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
}

export async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Please provide username, email and password' });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Account already exists with this email address or username' });
        }

        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hash });
        const token = signToken(user);

        res.cookie('token', token, COOKIE_OPTIONS);
        res.status(201).json({
            user: { id: user._id, username: user.username, email: user.email },
        });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Registration failed' });
    }
}

export async function loginUserController(req, res) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = signToken(user);

        res.cookie('token', token, COOKIE_OPTIONS);
        res.status(200).json({
            user: { id: user._id, username: user.username, email: user.email },
        });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Login failed' });
    }
}

export async function logoutUserController(req, res) {
    try {
        const token = req.cookies.token;

        if (token) {
            await BlacklistToken.create({ token });
        }

        res.clearCookie('token', COOKIE_OPTIONS);
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Logout failed' });
    }
}

export async function getMeController(req, res) {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({
            user: { id: user._id, username: user.username, email: user.email },
        });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to fetch user' });
    }
}
