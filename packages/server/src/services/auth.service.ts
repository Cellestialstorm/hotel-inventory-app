import mongoose from 'mongoose';
import User from '../models/User.model';
import { IClientUser, IUSER } from '@hotel-inventory/shared';
import ApiError from '../utils/ApiError';
import { generateAccessToken, generateRefreshToken, verifyToken, ITokenPayload } from '../utils/jwt.util';
import { ILoginRequest, IRegisterRequest } from '@hotel-inventory/shared';
import logger from '../utils/logger';
import { UserRole } from '@hotel-inventory/shared';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your_access_token_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret';

/**
 * Create a new user. Only intended for Admin (authorization should be checked before calling).
 * @param userData - The user data to create.
 * @returns The created user object (without password).
 */
const register = async (userData: IRegisterRequest): Promise<Omit<IUSER, 'password' | 'comparePassword'>> => {
    const { name, username, password, role, assignedDepartmentId, assignedHotelId } = userData;

    if (!name || !username || !password || !assignedHotelId) {
        throw new ApiError(400, 'Missing required fields', 'Validation_Error');
    }

    // Convert username to lowercase to prevent duplicate users like "Rohan" and "rohan"
    const lowerCaseUsername = username.toLowerCase();

    const existingUser = await User.findOne({ username: lowerCaseUsername }).lean();
    if (existingUser) {
        throw new ApiError(409, 'Username already exists', 'Conflict_Error');
    }

    const uniqueUserId = new mongoose.Types.ObjectId().toString();

    if (!role || ![UserRole.HOD, UserRole.MANAGER].includes(role)) {
        throw new ApiError(400, 'Invalid user role', 'Validation_Error');
    }

    const newUser = new User({
        userId: uniqueUserId,
        name: name.trim(), // Trim spaces off the real name
        username: lowerCaseUsername, // Save as lowercase
        password,
        role,
        assignedHotelId: assignedHotelId,  
        assignedDepartmentId: role === UserRole.HOD ? assignedDepartmentId : undefined, 
        isActive: true,
    });

    try {
        const savedUser = await newUser.save();
        const userToReturn = savedUser.toObject();
        logger.info(`User ${lowerCaseUsername} registered successfully`);
        return userToReturn;
    } catch (error: any) {
        logger.error(`Error during registration for ${lowerCaseUsername}: ${error.message}`);
        if (error.name === 'ValidationError') {
            throw new ApiError(400, 'Validation Failed', 'Validation_Error', error.errors);
        } else {
            throw new ApiError(500, 'Internal Server Error', 'Internal_Server_Error');
        }
    }
};

/**
* Authenticate a user.
* @param credentials User login credentials (Username and password).
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
        userId: user.userId, 
        name: user.name, // <--- ADDED REAL NAME TO JWT PAYLOAD
        username: user.username,
        role: user.role,
        assignedHotelId: user.assignedHotelId?.toString() || '', 
        assignedDepartmentId: user.assignedDepartmentId?.toString() || ''
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ userId: user.userId }); 

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
const refreshToken = async (refreshToken: string): Promise<{ accessToken: string, user: IClientUser }> => {
    if (!refreshToken) {
        throw new ApiError(400, 'Refresh token is required', 'REFRESH_TOKEN_MISSING');
    }

    try {
        const { userId: userId } = verifyToken<{ userId: string }>(refreshToken, REFRESH_TOKEN_SECRET); 

        const user = await User.findOne({ userId: userId, isActive: true }).select('-password -_id --__v').lean(); 

        if (!user) {
            logger.warn(`Refresh token attempted for non-existent user: ${userId}`)
            throw new ApiError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
        }

        const newPayload: ITokenPayload = {
            userId: user.userId,
            name: user.name, // <--- ADDED REAL NAME TO REFRESH PAYLOAD
            username: user.username,
            role: user.role,
            assignedHotelId: user.assignedHotelId?.toString() || '',
            assignedDepartmentId: user.assignedDepartmentId?.toString() || ''
        };

        const newAccessToken = generateAccessToken(newPayload);
        logger.info(`New access token generated for user: ${userId}`)

        const clientUser: IClientUser = {
            userId: user.userId,
            name: user.name,
            username: user.username,
            role: user.role,
            assignedHotelId: user.assignedHotelId,
            assignedDepartmentId: user.assignedDepartmentId,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        return { accessToken: newAccessToken, user: clientUser };
    } catch (error) {
        logger.error(`Error refreshing token: ${error instanceof Error ? error.message : 'Unknown error'}`)
        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(401, 'Could not refresh token', 'REFRESH_TOKEN_FAILEd');
    }
};

export const AuthService = {
    register,
    validateToken,
    refreshToken,
    login,
};