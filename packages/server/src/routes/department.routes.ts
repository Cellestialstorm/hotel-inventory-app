import express from 'express';
import { DepartmentController } from '@/controllers/department.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { checkSuperAdminOnly } from '@/middleware/roleCheck.middleware';

const router = express.Router();

router.use(authenticateToken);

router.post('/', checkSuperAdminOnly, DepartmentController.createDepartment);

router.put('/:id', checkSuperAdminOnly, DepartmentController.updateDepartment);

router.get('/', DepartmentController.getAllDepartments);

router.get('/hotel/:hotelId', DepartmentController.getAllDepartments);

router.delete('/:id', checkSuperAdminOnly, DepartmentController.deleteDepartment);

router.get('/:id', DepartmentController.getDepartmentById);

export default router;