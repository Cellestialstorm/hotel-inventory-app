import express from 'express';
import { DepartmentController } from '@/controllers/department.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { checkRole, checkAdminOnly } from '@/middleware/roleCheck.middleware';
import { UserRole } from '@hotel-inventory/shared';

const router = express.Router();

router.use(authenticateToken);

router.post('/', checkAdminOnly, DepartmentController.createDepartment);

router.put('/:id', checkAdminOnly, DepartmentController.updateDepartment);

router.get('/', checkRole([UserRole.ADMIN, UserRole.USER]), DepartmentController.getAllDepartments);

router.get('/hotel/:hotelId', checkRole([UserRole.ADMIN, UserRole.USER]), DepartmentController.getAllDepartments);

router.delete('/:id', checkAdminOnly, DepartmentController.deleteDepartment);

router.get('/:id', checkRole([UserRole.ADMIN, UserRole.USER]), DepartmentController.getDepartmentById);

export default router;