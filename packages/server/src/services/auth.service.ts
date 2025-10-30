import mongoose from 'mongoose';
import User from '@/models/User.model';
import { IUSER } from '@hotel-inventory/shared';
import ApiError from '@/utils/ApiError';
import { generateAccessToken, generateRefreshToken, verifyToken, ITokenPayload } from '@/utils/jwt.util';
import { ILoginRequest, IRegisterRequest } from '@hotel-inventory/shared';
import logger from '@/utils/logger';
import { UserRole } from '@hotel-inventory/shared';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your_access_token_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret';

/**
 *  Create a new user. Only intended for Admin (authorization should be checked before calling).
 * @param userData - The user data to create.
 * @returns The created user object (without password).
 */

const register = async (userData: IRegisterRequest): Promise<Omit<IUSER, 'password' | 'comparePassword'>> => {
    // Note: IRegisterRequest doesn't have assignedHotelId and assignedDepartmentId directly
    // These would need to be passed separately or handled differently
    const { username, password, role = UserRole.USER, assignedDepartmentId, assignedHotelId } = userData;

    if (!username || !password || !assignedHotelId || !assignedDepartmentId) {
        throw new ApiError(400, 'Missing required fields', 'Validation_Error');
    }

    const existingUser = await User.findOne({ $or: [{ username }, { assignedHotelId }] }).lean();
    if (existingUser) {
        throw new ApiError(409, 'Username or email already exists', 'Conflict_Error');
    }

    const uniqueUserId = new mongoose.Types.ObjectId().toString();

    const newUser = new User({
        userId: uniqueUserId,
        username,
        password,
        role,
        assignedHotelId: assignedHotelId,  // Map hotelID from shared type to assignedHotelId in server model
        assignedDepartmentId: assignedDepartmentId,  // Map departmentID from shared type to assignedDepartmentId in server model
        isActive: true,
    });

    try {
        const savedUser = await newUser.save();
        const userToReturn = savedUser.toObject();
        logger.info(`User ${username} registered successfully`);
        return userToReturn;
    } catch (error: any) {
        logger.error(`Error during registration for ${username}: ${error.message}`);
        if (error.name === 'ValidationError') {
            throw new ApiError(400, 'Validation Failed', 'Validation_Error', error.errors);
        } else {
            throw new ApiError(500, 'Internal Server Error', 'Internal_Server_Error');
        }
    }
};

/**
* Authenticate a user.
* @param credentials User loging credentials (Usernaem/email and password).
* @returns An object containing the access and refresh tokens.
*/

const login = async (credentials: ILoginRequest): Promise<{ accessToken: string; refreshToken: string; user: Omit<IUSER, 'password' | 'comparePassword'> }> => {
    const { username, password } = credentials;

    if (!username || !password) {
        throw new ApiError(400, 'Missing required fields', 'Validation_Error');
    }

    const user = await User.findOne({ username: username.toLowerCase() }).select('+password');

    if (!user) {
        logger.warn(`Login attempt failed: User not found - ${username}`);
        throw new ApiError(401, 'Invalid credentials', 'Unauthorized_Error');
    }

    if (!user.isActive) {
        logger.warn(`Login attempt failed: User is not active - ${username}`);
        throw new ApiError(401, 'User is not active', 'Unauthorized_Error');
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        logger.warn(`Login attempt failed: Incorrect password - ${username}`);
        throw new ApiError(401, 'Invalid credentials', 'Unauthorized_Error');
    }

    const payload: ITokenPayload = {
        userId: user.userId,  // Use userId from user object (which is the server-side naming)
        username: user.username,
        role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ userId: user.userId });  // Use userId from user object

    const userToReturn = user.toObject();
    delete userToReturn.password;

    logger.info(`User ${username} logged in successfully`);

    return { accessToken, refreshToken, user: userToReturn };
};

/**
 * Validates an access token.
 * @param token The JWT access token to validate.
 * @returns The decoded token payload.
 */

const validateToken = (token: string): ITokenPayload => {
    try {
        const payload = verifyToken<ITokenPayload>(token, ACCESS_TOKEN_SECRET);
        logger.debug(`Token validated successfully for user ID: ${payload.userId}`);
        return payload;
    } catch (error) {
        logger.warn(`Token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { error });
        throw error;
    }
};

/**
 * Generates a new access token using a valid refresh token.
 * @param refreshToken - The refresh token to use for generating a new access token.
 * @returns A new access token.
 */

const refreshToken = async (refreshToken: string): Promise<{ accessToken: string}> => {
    if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required', 'REFRESH_TOKEN_MISSING');
    }

    try {
        const { userID: userId } = verifyToken<{ userID: string }>(refreshToken, REFRESH_TOKEN_SECRET);  // Expect userID from token (shared type naming)

        const user = await User.findOne({ userId: userId, isActive: true });  // Use userId for server-side lookup

        if (!user) {
            logger.warn(`Refresh token attempted for non-existent user: ${userId}`)
            throw new ApiError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
        }

        const newPayload: ITokenPayload = {
            userId: user.userId,  // Use userId from user object
            username: user.username,
            role: user.role,
        };

        const newAccessToken = generateAccessToken(newPayload);
        logger.info(`New access token generated for user: ${userId}`)
        return { accessToken: newAccessToken };
    } catch (error) {
        logger.error(`Error refreshing token: ${error instanceof Error ? error.message : 'Unknown error'}`)
        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(401, 'Could not refresh token', 'REFRESH_TOKEN_FAILEd');
    }
};

/**
 * Change a user's password.
 * @param userId The ID of the user changing the password.
 * @param oldPassword The old password.
 * @param newPassword The new password.
 */

const changePassword = async (userId: string, oldPassword: string, newPassword: string): Promise<void> => {
    if (!userId || !oldPassword || !newPassword) {
        throw new ApiError(400, 'User ID, old password, and new password are required', 'VALIDATION_ERROR');
    }

    if (newPassword.length < 6) {
        throw new ApiError(400, 'New password must be at least 6 characters long', 'VALIDATION_ERROR');
    }

    const user = await User.findOne( { userId: userId } ).select('+password');

    if (!user) {
        logger.warn(`Change password attempt failed: User not Found - ID ${userId}`);
        throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const isMatch = await user.comparePassword(oldPassword);

    if (!isMatch) {
        logger.warn(`Change password attempt failed: Incorrect Password - ID ${userId}`);
        throw new ApiError(401, 'Incorrect password', 'INCORRECT_PASSWORD');
    }

    user.password = newPassword;

    try {
        await user.save();
        logger.info(`Passsword changed successfully - ID ${userId}`)
    } catch (error: any) {
        logger.error(`Error changing password - ID ${userId}: ${error.message}`, error);
        throw new ApiError(500, 'Error changing password', 'DATABASE_ERROR', error);
    }
};

export const AuthService = {
    register,
    validateToken,
    refreshToken,
    login,
    changePassword
};