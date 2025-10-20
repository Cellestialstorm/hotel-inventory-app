import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';

// Error handling middleware
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // If response headers have already been sent, delegate to default error handler
    if (res.headersSent) {
        return next(err);
    }

    let statusCode = 500;
    let message = 'Internal Server Error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details: any | null = null;
    let stack: string | undefined = undefined;

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        errorCode = err.errorCode;
        details = err.details;

        if (!err.isOperational || process.env.NODE_ENV === 'development') {
            stack = err.stack;
        }
    } else if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Failed';
        errorCode = 'VALIDATION_FAILED';
        details = err.errors ? Object.values(err.errors).map((e: any) => ({
            field: e.path,
            message: e.message
        })) : null;
        stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;
    } else if (err.name === 'CastError' && err.path) {
        statusCode = 400;
        message = `Invalid format for field: ${err.path}`;
        errorCode = 'INVALID_INPUT_FORMAT';
        details = { field: err.path, value: err.value };
        stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;
    } else if (err.code === 11000 && err.keyValue) {
        const field = Object.keys(err.keyValue)[0];
        statusCode = 409;
        message = `Duplicate field value: ${err.keyValue[field]}`;
        errorCode = 'DUPLICATE_KEY';
        details = { field: field, value: err.keyValue[field] };
        stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        errorCode = 'INVALID_TOKEN';
        stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication Token has expired';
        errorCode = 'TOKEN_EXPIRED';
        stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;
    } else if (err instanceof Error) {
        message = err.message || 'An Unknown Error Occurred';
        stack = err.stack;
    } else {
        message = 'An Unknown Error Occurred';
        stack = new Error('Unknown error source').stack;
    }

    logger.error(`${statusCode} - ${message} - ErrorCode: ${errorCode} - Path: ${req.originalUrl} - Stack: ${stack || 'N/A'}`);

    res.status(statusCode).json({
        statusCode: statusCode || 500,
        message: message || 'An Unknown Error Occurred',
        errorCode: errorCode || 'UNKNOWN_ERROR',
        details: details,
        stack: stack && process.env.NODE_ENV === 'development' ? stack : undefined
    });
}

