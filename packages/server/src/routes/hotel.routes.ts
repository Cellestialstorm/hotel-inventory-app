import express from 'express';
import { HotelController } from '@/controllers/hotel.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { checkSuperAdminOnly } from '@/middleware/roleCheck.middleware';


const router = express.Router();

router.use(authenticateToken);

router.post('/', checkSuperAdminOnly, HotelController.createHotel);

router.get('/', HotelController.getAllHotels);

router.get('/:id', HotelController.getHotelById);

router.put('/:id', checkSuperAdminOnly, HotelController.updateHotel);

router.delete('/:id', checkSuperAdminOnly, HotelController.deleteHotel);

export default router;