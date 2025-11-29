import express from 'express';
import * as ItemCtrl from '@/controllers/item.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { checkAdminOnly } from '@/middleware/roleCheck.middleware';

const router = express.Router();
router.use(authenticateToken);

router.post('/', ItemCtrl.createItem);
router.get('/', ItemCtrl.listItems);
router.put('/:id', checkAdminOnly, ItemCtrl.updateItem);
router.delete('/:id', checkAdminOnly, ItemCtrl.deleteItem);
router.post('/damage', ItemCtrl.markDamage);
router.post('/transfer', ItemCtrl.transfer);
router.post('/return', ItemCtrl.returnToVendor);

export default router;