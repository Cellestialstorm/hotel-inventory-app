import { ITokenPayload } from "@/utils/jwt.util";

declare global {
    namespace Express {
        interface Request {
            user?: ITokenPayload;
        }
    }
}

export {};