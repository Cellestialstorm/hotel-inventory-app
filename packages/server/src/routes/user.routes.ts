import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { checkRole, checkAdminOnly } from '../middleware/roleCheck.middleware';
import { UserRole } from '@hotel-inventory/shared';

const router = express.Router();

// Routes accessed by admin only
router.post('/users', authenticateToken, checkAdminOnly);

// Routes accessed by admin and anagers
router.get('/users', authenticateToken, checkRole([UserRole.ADMIN, UserRole.USER]));

// Routes accessed by logged in users
router.get('/users/me', authenticateToken);

export default router;
