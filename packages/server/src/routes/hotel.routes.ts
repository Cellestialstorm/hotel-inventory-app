import express from 'express';
import { HotelController } from '@/controllers/hotel.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { checkAdminOnly } from '@/middleware/roleCheck.middleware';
// TODO: Import Validation Middleware

const router = express.Router();

router.use(authenticateToken);
router.use(checkAdminOnly);

router.post('/', HotelController.createHotel);

router.get('/', HotelController.getAllHotels);

router.get('/:id', HotelController.getHotelById);

router.put('/:id', HotelController.updateHotel);

router.delete('/:id', HotelController.deleteHotel);

export default router;