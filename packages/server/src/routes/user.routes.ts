import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { checkAdminOnly } from '../middleware/roleCheck.middleware';
import { UserController } from '@/controllers/user.controller';

const router = express.Router();

router.use(authenticateToken);
router.use(checkAdminOnly);

router.get('/', UserController.getAllUsers);

// Routes accessed by logged in users
router.get('/:id', UserController.getUserById);

router.put('/:id', UserController.updateUser)

router.delete('/:id', UserController.deleteUser)

export default router;
