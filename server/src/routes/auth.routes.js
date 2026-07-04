import express from 'express';
import {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', registerUserController);
router.post('/login', loginUserController);
router.get('/logout', logoutUserController);
router.get('/get-me', requireAuth, getMeController);

export default router;
