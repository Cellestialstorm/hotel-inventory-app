import { Request , Response } from 'express';
import { HotelService } from '@/services/hotel.service';
import ApiResponse from '@/utils/ApiResponse';
import ApiError from '@/utils/ApiError';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Handles creation of a new hotel.
 * @route POST /api/hotels
 */

const createHotel = asyncHandler(async (req: Request, res: Response) => {
    //TODO: Add validation middleware
    const hotel = await HotelService.createHotel(req.body);
    res.status(201).json(new ApiResponse(201, hotel, 'Hotel created successfully'));
});

/**
 * Handles fetching all hotels.
 * @route GET /api/hotels
 */

const getAllHotels = asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'ADMIN';
    const hotels = await HotelService.getAllHotels(includeInactive);
    res.status(200).json(new ApiResponse(200, hotels, 'Hotels fetched successfully'));
});

/**
 * Handles fetching a single hotel by its ID.
 * @route GET /api/hotels/:id
 */

const getHotelById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const hotel = await HotelService.getHotelById(id);
    res.status(200).json(new ApiResponse(200, hotel, 'Hotel fetched successfully'));
});

/**
 * Handles updating a hotel.
 * @routes PUT /api/hotels/:id
 */

const updateHotel = asyncHandler(async (req: Request, res: Response) => {
    //TODO: Add validation middleware
    const { id } = req.params;
    const hotel = await HotelService.updateHotel(id, req.body);
    if (!hotel) {
        throw new ApiError(404, 'Hotel not found', 'HOTEL_NOT_FOUND');
    }
    res.status(200).json(new ApiResponse(200, hotel, 'Hotel updated successfully'));
});

/**
 * Handles deleting a hotel.
 * @route DELETE /api/hotels/:id
 */

const deleteHotel = asyncHandler(async (req: Request, res: Response) => { 
    const { id } = req.params;
    const success = await HotelService.deleteHotel(id);
    if (!success) {
        throw new ApiError(404, 'Hotel not found', 'HOTEL_NOT_FOUND');
    }
    res.status(200).json(new ApiResponse(200, null, 'Hotel deleted successfully'));
});

export const HotelController = {
    createHotel,
    getAllHotels,
    getHotelById,
    updateHotel,
    deleteHotel
}