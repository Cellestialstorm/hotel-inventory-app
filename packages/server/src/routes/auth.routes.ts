// packages/server/src/routes/auth.routes.ts
import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { checkAdminOnly } from '../middleware/roleCheck.middleware';
import { authLimiter } from '../config/rateLimiters'; // Import the specific rate limiter

const router = express.Router();

// Apply stricter rate limiting to login and refresh token routes
router.post('/login', authLimiter, AuthController.login);
router.post('/refresh-token', authLimiter, AuthController.refreshToken);

// Logout route (less critical for rate limiting, but can be added if needed)
router.post('/logout', AuthController.logout);

// Admin-only user registration
router.post('/register', authenticateToken, checkAdminOnly, AuthController.register);

router.get('/me', authenticateToken, AuthController.getCurrentUser);

export default router;