import express from 'express';
import { authenticateToken } from '@/middleware/auth.middleware';
import * as ReportCtrl from '@/controllers/report.controller';

const router = express.Router();
router.use(authenticateToken);

router.get('/stock', ReportCtrl.stockReport);
router.get('/item', ReportCtrl.itemReport);

export default router;