import { Request, Response, NextFunction } from "express";
import ApiError from "@/utils/ApiError";
import { verifyToken, ITokenPayload } from "@/utils/jwt.util";
import logger from "@/utils/logger";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your_access_secret_key_dev';

if (process.env.NODE_ENV === 'production' && (!process.env.ACCESS_TOKEN_SECRET || ACCESS_TOKEN_SECRET === 'your_access_secret_key_dev')) {
    console.error('🛑 FATAL ERROR: ACCESS_TOKEN_SECRET is missing or insecure in production environment! (auth.middleware.ts)');
    process.exit(1);
}

/**
 * Middleware to authenticate requests using JWT (Access Token).
 * Extracts token from the Authentication headers and verifies it.
 */

export const authenticateToken = (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
        return next(new ApiError(401, 'Authentication token required', 'TOKEN_MISSING'));
    }

    try {
        const payload = verifyToken<ITokenPayload>(token, ACCESS_TOKEN_SECRET);

        req.user = payload;
        logger.debug(`User authenticated: ${payload.username} (ID: ${payload.userId})`);
        next();
    } catch (error) {
        logger.warn(`Authentication failed: ${error instanceof Error ? error.message : 'Invalid token'}`, { tokenProvided: !!token});
        next(error);
    }
};