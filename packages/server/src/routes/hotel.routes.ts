import express from 'express';
import { HotelController } from '@/controllers/hotel.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { checkRole,checkAdminOnly } from '@/middleware/roleCheck.middleware';
import { UserRole } from '@hotel-inventory/shared';

const router = express.Router();

router.use(authenticateToken);

router.post('/', checkAdminOnly, HotelController.createHotel);

router.get('/', checkRole([UserRole.ADMIN, UserRole.USER]), HotelController.getAllHotels);

router.get('/:id', checkRole([UserRole.ADMIN, UserRole.USER]), HotelController.getHotelById);

router.put('/:id', checkAdminOnly, HotelController.updateHotel);

router.delete('/:id', checkAdminOnly, HotelController.deleteHotel);

export default router;