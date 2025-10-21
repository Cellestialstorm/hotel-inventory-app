import jwt, { Secret, SignOptions } from "jsonwebtoken";
import ApiError from "./ApiError";

const ACCESS_TOKEN_SECRET: Secret = process.env.ACCESS_TOKEN_SECRET || 'secret';
const REFRESH_TOKEN_SECRET: Secret = process.env.REFRESH_TOKEN_SECRET || 'add referesh secret';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

if (ACCESS_TOKEN_SECRET === 'your_access_secret_key_dev' || REFRESH_TOKEN_SECRET === 'your_refresh_secret_key_dev') {
    console.warn('JWT secrets are using default development values. Set Access_TOKEN_SECRET and REFRESH_TOKEN_SECRET environment variables to production values');
}

export interface ITokenPayload {
    userId: string;
    username: string;
    role: string;
}

/**
 * Generate am Access Token.
 * @param payload The data to include in the token payload.
 * @returns The generated Access Token.
 */

export const generateAccessToken = (payload: ITokenPayload): string => {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY } as SignOptions);
};

/**
 * Generate a Refresh Token.
 * @param payload The data to include in the token payload.
 * @returns The generated Refresh Token.
 */

export const generateRefreshToken = (payload: Pick<ITokenPayload, 'userId'>): string => {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY } as SignOptions);
};

/**
 * Verifies a JWT token (either accessed or refresh based on the secret used).
 * Throws ApiError if verification fails.
 * @param token The JWT string to verify.
 * @param secret The secret used to sign the token.
 * @returns The decoded token payload.
 */

export const verifyToken = <T = ITokenPayload>(token: string, secret: Secret): T => {
    try {
        const decode = jwt.verify(token, secret) as T;
        return decode;
    } catch (error: any) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new ApiError(401, 'Token Expired', 'TOKEN_EXPIRED');
        } else if (error instanceof jwt.JsonWebTokenError) {
            throw new ApiError(401, 'Invalid Token', 'INVALID_TOKEN');
        } else {
            throw new ApiError(500, 'Could not verify token', 'Token_Verification_Failed', error);

        }
    }
};