import mongoose from 'mongoose';
import User from '@/models/User.model';
import { IUSER } from '@hotel-inventory/shared';
import Hotel from '@/models/Hotel.model';
import Department from '@/models/Department.model';
import ApiError from '@/utils/ApiError';
import logger from '@/utils/logger';
import { IUpdateUserRequest, UserRole, IClientUser } from '@hotel-inventory/shared';
/**
 * Retrieves a user by their custom userId.
 * @param userId - The custom ID of the user.
 * @returns The user object (without password) or throws 404.
 */

const getUserById = async (userId: string): Promise<IClientUser> => {
    const user = await User.findOne({ userId: userId }).select('-password').lean();
    if (!user) {
        throw new ApiError(404, `User with ID ${userId} not found`, 'USER_NOT_Found');
    }
    return user as IClientUser;
}

/**
 * Retrieves all users, optionally filtering.
 * @param filters - Optional filters (e.g., by hotel, department, role, isActive).
 * @returns An array of user objects (without passwords).
 */

const getAllUsers = async (filters: any = {}): Promise<IClientUser[]> => {
    const query: mongoose.FilterQuery<IUSER> = {};
    query.role = UserRole.USER;
    if (filters.hotelId) query.assignedHotelId = new mongoose.Types.ObjectId(filters.hotelId);
    if (filters.departmentId) query.assignedDepartmentId = new mongoose.Types.ObjectId(filters.departmentId);
    if (typeof filters.isActive === 'boolean') query.isActive = filters.isActive;
    else if (filters.isActive === undefined) query.isActive = true;

    try {
        const users = await User.find(query).select('-password').sort({ username: 1}).lean();
        return users as IClientUser[];
    } catch (error: any) {
        logger.error(`Error fetching users: ${error.message}`, { error, filters });
        throw new ApiError(500, 'Failed to fetch users', 'DATABASE_ERROR', error);
    }
};

/**
 * Updates an existing user.
 * @param userId - The custom ID of the user to update.
 * @param updateData - An object containing fields to update. Password updates ignored here (use auth service).
 * @returns The updated user object (without password) or throws 404.
 */

const updateUser = async (
    userId: string,
    updateData: IUpdateUserRequest
) : Promise<IClientUser> => {
    const { password, ...validUpdateData } = updateData;
    if (validUpdateData.username) {
        const existingUser = await User.findOne({ username: validUpdateData.username.toLowerCase(), userId: { $ne: userId } }).lean();
        if (existingUser) {
            throw new ApiError(409, `Username '${validUpdateData.username}' is already taken.`, 'DUPLICATE_USERNAME');
        }
        validUpdateData.username = validUpdateData.username.toLowerCase();
    }

    if (validUpdateData.assignedHotelId && !mongoose.Types.ObjectId.isValid(validUpdateData.assignedHotelId) || !(await Hotel.findById(validUpdateData.assignedHotelId))) {
        throw new ApiError(404, `Hotel with ID ${validUpdateData.assignedHotelId} not found`, 'HOTEL_NOT_FOUND');
    }

    if (validUpdateData.assignedDepartmentId && !mongoose.Types.ObjectId.isValid(validUpdateData.assignedDepartmentId) || !(await Department.findById(validUpdateData.assignedDepartmentId))) {
        throw new ApiError(404, `Department with ID ${validUpdateData.assignedDepartmentId} not found`, 'DEPARTMENT_NOT_FOUND');
    }

    try {
        const updatedUser = await User.findOneAndUpdate(
            { userId: userId },
            { $set: validUpdateData },
            { new: true, runValidators: true, context: 'query' }
        ).lean();

        if (!updatedUser) {
            throw new ApiError(404, `User with ID ${userId} not found`, 'USER_NOT_FOUND');
        }

        logger.info(`User updated successfully: ${updatedUser.username} (ID: ${userId})`);
        return updatedUser as IClientUser;
    } catch (error: any) {
        logger.error(`Error updating user ${userId}: ${error.message}`, { error });
        if (error.code === 11000 || (error.name === 'MongoServerError' && error.message.includes('duplicate key'))) {
            throw new ApiError(409, `Update failed: Username or email likely already exists.`, 'DUPLICATE_KEY');
        }
        if (error.name === 'ValidationError') {
            throw new ApiError(400, 'User validation failed', 'VALIDATION_ERROR', error.errors);
        }
        throw new ApiError(500, 'Failed to update user', 'DATABASE_ERROR', error);
    }
};

/**
 * Deletes a user (soft delete).
 * @param userId - The custom ID of the user to delete.
 * @returns True if deleted successfully.
 */

const deleteUser = async (userId: string): Promise<boolean> => {

    const updateResult = await User.updateOne(
        { userId: userId },
        { $set: { isActive: false } }
    );

    if (updateResult.matchedCount === 0) {
        throw new ApiError(404, `User with ID ${userId} not found`, 'USER_NOT_FOUND');
    }

    if (updateResult.modifiedCount === 0) {
        logger.warn(`User ${userId} was already inacive or no change was made.`);
    }

    logger.info(`User deactivated (soft delete): ID ${userId}`);
    return true;

    // // Hard delete alternative (use with caution)
    // const deleteResult = await User.deleteOne({ userId: userId });
    // if (deleteResult.deletedCount === 0) {
    //     throw new ApiError(404, `User with ID ${userId} not found`, 'USER_NOT_FOUND');
    // }
    // logger.info(`User permanently deleted: ID ${userId}`);
    // return true;
};


export const UserService = {
    getUserById,
    getAllUsers,
    updateUser,
    deleteUser
};
