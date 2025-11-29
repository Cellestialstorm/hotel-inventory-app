import mongoose from 'mongoose';
import Hotel, { IHotelDocument } from '@/models/Hotel.model';
import User from '@/models/User.model';
import Department from '@/models/Department.model';
import ApiError from '@/utils/ApiError';
import logger from '@/utils/logger';
import { ICreateHotelRequest, IUpdateHotelRequest } from '@hotel-inventory/shared';

/**
 * Create a new hotel.
 * @param hotelData - Data for the new hotel.
 * @returns The newly created hotel object.
 */

const createHotel = async (hotelData: ICreateHotelRequest): Promise<IHotelDocument> => {
    const { name, location } = hotelData;

    if (!name || !location) {
        throw new ApiError(400, 'Name and Location are required', 'VALIDATION_ERROR');
    }

    const existingHotel = await Hotel.findOne({ name }).lean();
    if (existingHotel) {
        throw new ApiError(409, `Hotel named '${name}' already exists`, 'DUPLICATE_HOTEL');
    }

    const uniqueHotelId = new mongoose.Types.ObjectId().toString();

    const newHotel = new Hotel({
        hotelId: uniqueHotelId,
        name,
        location,
        isActive: true
    });

    try {
        const savedHotel = await newHotel.save();
        logger.info(`Hotel created successully: ${savedHotel.name} (ID: ${savedHotel.hotelId})`);
        return savedHotel;
    } catch (error: any) {
        logger.error(`Error creating otel '${name}': ${error.message}`, { error });
        if (error.code === 11000 || error.name === 'MongoServerError' && error.message.includes('duplicate key')) {
            throw new ApiError(409, `Hotel name '${name}' already exists.`, 'DUPLICATE_KEY');
        }
        if (error.name === 'ValidationError') {
            throw new ApiError(400, 'Hotel validation failed', 'VALIDATION_ERROR', error.errors);
        }
        if (error.name === 'ValidationError') {
            throw new ApiError(400, 'Hotel validation failed', 'VALIDATION_ERROR', error.errors);
        }
        throw new ApiError(500, 'Failed to create hotel', 'DATABASE_ERROR', error);
    }
};

/**
 * Retrieves a hotel by its ID (custom or internal MongoDB _id).
 * @param hotelId - The unique ID or MongoDB _id of the hotel.
 * @returns The hotel object or throws 404 if not found
 */

const getHotelById = async (hotelId: string): Promise<IHotelDocument> => {
    let hotel: IHotelDocument | null = null; 
    if (mongoose.Types.ObjectId.isValid(hotelId)) {
        hotel = await Hotel.findById(hotelId);
    }
    
    if (!hotel) {
        hotel = await Hotel.findOne({ hotelId: hotelId });
    }

    if (!hotel) {
        throw new ApiError(404, `Hotel with ID ${hotelId} not found`, 'HOTEL_NOT_FOUND');
    }
    return hotel;
};

/**
 * Retrieves all hotels (only active ones by default).
 * @returns An array of active hotel objects.
 */

const getAllHotels = async (includeInactive = false) : Promise<IHotelDocument[]> => {
    const query = includeInactive? {} : { isActive: true };
    try {
        const hotels = await Hotel.find(query).sort({ name: 1 }).lean();
        return hotels;
    } catch (error: any) {
        logger.error(`Error fetching hotels: ${error.message}`, { error });
        throw new ApiError(500, 'Failed to fetch hotels', 'DATABASE_ERROR', error);
    }
};

/**
 * Updates an existing hotel.
 * @param hotelId - The ID of the hotel to update.
 * @param updateData - An object containing the fields to update.
 * @returns The updated hotels object or null if not found.
 */

const updateHotel = async (
    hotelId: string,
    updateData: IUpdateHotelRequest
): Promise<IHotelDocument | null> => {
    const hotel = await getHotelById(hotelId);
    if (!hotel) return null;

    const { name, location, isActive } = updateData;

    if (name && name !== hotel.name) {
        const existingHotel = await Hotel.findOne({ name, _id: { $ne: hotel._id } }).lean();
        if (existingHotel) {
            throw new ApiError(409, `Another hotel named '${name}' already exists`, 'DUPLICATE_HOTEL');
        }
        hotel.name = name;
    }

    if (location) {
        hotel.location = location;
    }
    if (typeof isActive === 'boolean') {
        hotel.isActive = isActive;
    }

    try {
        const updatedHotel = await hotel.save();
        logger.info(`Hotel updated successfully: ${updatedHotel.name} (ID: ${updatedHotel.hotelId})`);
        return updatedHotel;
    } catch (error: any) {
        logger.error(`Error updating hotel ${hotelId}: ${error.message}`, { error });
        if (error.code === 11000 || error.name === 'MongoServerError' && error.message.includes('duplicate key')) {
            throw new ApiError(409, `Update failed: Hotel name '${name}' likely already exists`, 'DUPLICATE_KEY');
        }
        if (error.name === 'ValidationError') {
            throw new ApiError(400, 'Hotel calidation failed', 'VALIDATION_ERROR', error.errors);
        }
        throw new ApiError(500, 'Failed to update hotels', 'DATABASE_ERROR', error);
    }
};

/**
 * Deletes a hotel (Soft delete by default).
 * Checks if department are assigned before deletion
 * @param hotelId - The ID of the hotel to delete.
 * @returns True if deleted successfully.
 */

const deleteHotel = async (hotelId: string): Promise<boolean> => {
    const hotel = await getHotelById(hotelId);
    if (!hotel) return false;
    
    const activeDepartmentsExist = await Department.exists({ hotelId: hotel._id, isActive: true});
    if (activeDepartmentsExist) {
        throw new ApiError(400, 'Cannot delete hotel with active departments', 'HOTEL_IN_USE');
    }

    const activeUsersExist = await User.exists({ assignedHotelId: hotel._id, isActive: true });
    if (activeUsersExist) {
        throw new ApiError(400, 'Cannot delete hotel: Active users are assigned to it.', 'HOTEL_IN_USE');
    }

    try {
        await Hotel.findByIdAndDelete(hotel._id);
        logger.info(`Hotel permenantly deleted: ${hotel.name} (ID: ${hotel.hotelId})`);
        return true;
    } catch (error: any) {
        logger.error(`Error deleting hotel ${hotelId}: {error.message}`, { error });
        throw new ApiError(500, 'Failed to delete hotel', 'DATABASE_ERROR', error);
    }
};

export const HotelService = {
    createHotel,
    getHotelById,
    getAllHotels,
    updateHotel,
    deleteHotel
}