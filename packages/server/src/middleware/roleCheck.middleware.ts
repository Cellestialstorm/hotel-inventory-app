import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
import { UserRole } from '@hotel-inventory/shared';
import logger from '../utils/logger';

/**
 * Middleware factory to check if the authenticated user has one of the allowed roles.
 * Must be used AFTER authenticateToken middleware.
 * @param allowedRoles - Array of allowed roles
 */

export const checkRole = (allowedRoles: UserRole[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user || !req.user.role) {
            logger.error('Role check middleware used without preceding authentication middleware or user has no role. ');
            return next(new ApiError(500, 'User role not found on request', 'INTERNAL_SERVER_ERROR'));

        }

        const userRole = req.user.role as UserRole;

        if (allowedRoles.includes(userRole)) {
            logger.debug(`Role check passed for user ${req.user.username} (Role: ${userRole}). Required one of: ${allowedRoles.join(', ')}`);
            next(); // Role check passed, continue to next middleware
        } else {
            next(new ApiError(403, 'Forbidden: Insufficient permissions', 'FORBIDDEN'));
        }
    };
};

/**
 * Specific role check middleware to ensure only ADMIN user can proceed.
 * Must be used AFTER authenticateYoken middleware.
 */

export const checkAdminOnly = (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
        logger.warn(`Admin access denied for users ${req.user?.username || 'N/A'} (Role: ${req.user?.role || 'N/A'}).`);
        return next(new ApiError(403, 'Forbidden: Admin access required', 'FORBIDDEN_ADMIN_ONLY'));
    }

    logger.debug(`Admin access granted for users ${req.user.username}`);
    next();
};