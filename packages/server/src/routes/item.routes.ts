import express from 'express';
import * as ItemCtrl from '@/controllers/item.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { checkRole } from '@/middleware/roleCheck.middleware';
import { UserRole } from '@hotel-inventory/shared';

const router = express.Router();
router.use(authenticateToken);

router.post('/', ItemCtrl.createItem);
router.get('/', ItemCtrl.listItems);
router.put('/:id', checkRole([UserRole.SUPER_ADMIN, UserRole.MANAGER]), ItemCtrl.updateItem);
router.delete('/:id', checkRole([UserRole.SUPER_ADMIN, UserRole.MANAGER]), ItemCtrl.deleteItem);
router.post('/damage', ItemCtrl.markDamage);
router.post('/transfer', ItemCtrl.transfer);
router.post('/return', ItemCtrl.returnToVendor);

export default router;