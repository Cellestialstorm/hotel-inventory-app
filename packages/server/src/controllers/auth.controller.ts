// packages/server/src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { cookieOptions } from '../config/cookieOptions';
import { AuthService } from '../services/auth.service';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';
import User from '../models/User.model';

// Helper function for handling async controller logic
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Handles user login. Sets refresh token in an HttpOnly cookie.
 * @route POST /api/auth/login
 */
const login = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { username, password } = req.body;

    if (!username || !password) {
        throw new ApiError(400, 'Username and password are required', 'VALIDATION_ERROR');
    }

    const { accessToken, refreshToken, user } = await AuthService.login({ username, password });

    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.status(200).json(
        new ApiResponse(200, { accessToken, user }, 'Login successful')
    );
});

/**
 * Handles user logout. Clears the refresh token cookie.
 * @route POST /api/auth/logout
 */
const logout = asyncHandler(async (_req: Request, res: Response, _next: NextFunction) => {
    res.clearCookie('refreshToken', {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
    });

    logger.info(`User logout processed. Refresh token cookie cleared.`);
    res.status(200).json(new ApiResponse(200, null, 'Logout successful'));
});

/**
 * Handles refreshing the access token using the refresh token from the HttpOnly cookie.
 * @route POST /api/auth/refresh-token
 */
const refreshToken = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const providedToken = req.cookies.refreshToken;

    if (!providedToken) {
        logger.warn('Refresh token request failed: No refresh token cookie found.');
        throw new ApiError(401, 'Refresh token not found', 'REFRESH_TOKEN_MISSING');
    }

    const { accessToken, user } = await AuthService.refreshToken(providedToken);

    res.status(200).json(new ApiResponse(200, { accessToken, user }, 'Access token refreshed'));
});

/**
 * Handles changing the current user's password. Requires authentication.
 * @route PUT /api/auth/change-password
 */
const changePassword = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { oldPassword, newPassword } = req.body;
    const userId = (req as any).user?.userId; // Assumes authenticateToken middleware ran successfully

    if (!userId) {
        throw new ApiError(401, 'User not authenticated', 'UNAUTHENTICATED');
    }
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, 'Old password and new password are required', 'VALIDATION_ERROR');
    }

    await AuthService.changePassword(userId, oldPassword, newPassword);

    res.status(200).json(new ApiResponse(200, null, 'Password changed successfully'));
});

/**
 * Gets the details of the currently authenticated user. Requires authentication.
 * @route GET /api/auth/me
 */
const getCurrentUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = (req as any).user?.userId;

    if (!userId) {
        throw new ApiError(401, 'User not authenticated', 'UNAUTHENTICATED');
    }

    const user = await User.findOne({ userId: userId }).select('-password').lean();

    if (!user) {
        logger.error(`Authenticated user ID ${userId} not found in database.`);
        throw new ApiError(404, 'Authenticated user not found', 'USER_NOT_FOUND');
    }

    res.status(200).json(new ApiResponse(200, user, 'Current user fetched successfully'));
});

/**
 * Handles user registration. Only accessible to Admin users.
 * @route POST /api/auth/register
 */
const register = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userData = req.body;

    const newUser = await AuthService.register(userData);

    res.status(201).json(new ApiResponse(201, newUser, 'User registered successfully'));
});

// Export the controller methods
export const AuthController = {
    login,
    logout,
    refreshToken,
    changePassword,
    getCurrentUser,
    register
};