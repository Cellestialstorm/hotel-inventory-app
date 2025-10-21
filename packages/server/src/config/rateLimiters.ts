// packages/server/src/config/rateLimiters.ts
import rateLimit from 'express-rate-limit';
import ApiError from '../utils/ApiError';

// General limiter for most API routes (adjust numbers as needed)
export const generalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (_req, _res, next, options) => {
        // Throw ApiError instead of sending direct response
		next(new ApiError(options.statusCode, options.message.message, 'RATE_LIMIT_EXCEEDED'));
    }
});

// Stricter limiter for sensitive auth routes like login and refresh
export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10, // Limit each IP to 10 auth attempts per windowMs
	message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' },
	standardHeaders: true,
	legacyHeaders: false,
     handler: (_req, _res, next, options) => {
		next(new ApiError(options.statusCode, options.message.message, 'AUTH_RATE_LIMIT_EXCEEDED'));
    }
});