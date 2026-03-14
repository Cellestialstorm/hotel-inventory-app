import express from 'express';
import { getTransactions, editTransaction } from '../controllers/transaction.controller';
import { authenticateToken } from '@/middleware/auth.middleware';

const router = express.Router();

router.use(authenticateToken);

// Get the audit log
router.get('/', getTransactions);

// Edit an existing transaction
router.put('/:id', editTransaction);

export default router;