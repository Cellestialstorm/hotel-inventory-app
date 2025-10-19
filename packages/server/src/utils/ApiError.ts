class ApiError extends Error {
    public statusCode: number;
    public errorCode: string;
    public details: any | null;
    public isOperational: boolean;

    /**
   * Creates an instance of ApiError.
   * @param statusCode - HTTP status code (e.g., 400, 404, 500).
   * @param message - User-friendly error message.
   * @param errorCode - A custom, unique error code string (e.g., 'USER_NOT_FOUND', 'VALIDATION_ERROR'). Defaults to 'GENERIC_ERROR'.
   * @param details - Optional additional details (e.g., validation error specifics). Defaults to null.
   * @param isOperational - Flag indicating if this is an expected/operational error. Defaults to true.
   * @param stack - Optional custom stack trace. Defaults to capturing the current stack.
   */

    constructor(
        statusCode: number,
        message: string,
        errorCode: string = 'GenericError',
        details: any | null = null,
        isOperational: boolean = true,
        stack: string = ''
    ) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        this.isOperational = isOperational;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }

        Object.setPrototypeOf(this, ApiError.prototype)
    }
}

export default ApiError;