class ApiResponse<T = any> {
    public statusCode: number;
    public success: boolean;
    public message: string;
    public data: T | null;

    /**
   * Creates an instance of ApiResponse.
   * @param statusCode - HTTP status code (typically 2xx for success).
   * @param data - The data payload to send back. Defaults to null.
   * @param message - A success message. Defaults to 'Success'.
   */

    constructor (
        statusCode: number,
        data: T | null = null,
        message: string = 'Success'
    ) {
        this.statusCode = statusCode;
        this.success = statusCode >= 200 && statusCode < 300;
        this.message = message;
        this.data = data;
    }
}

export default ApiResponse;