export const MESSAGES = {
  ERROR: {
    UNAUTHORIZED: 'Unauthorized access.',
    FORBIDDEN: 'Access forbidden.',
    NOT_FOUND: 'Resource not found.',
    INTERNAL_SERVER_ERROR: 'An internal server error occurred.',
    VALIDATION_FAILED: 'Input validation failed.',
    CONFLICT: 'Resource conflict detected.',
  },
  SUCCESS: {
    FETCHED: 'Resource fetched successfully.',
    CREATED: 'Resource created successfully.',
    UPDATED: 'Resource updated successfully.',
    DELETED: 'Resource deleted successfully.',
    LOGIN_SUCCESS: 'Login successful.',
    REGISTER_SUCCESS: 'Registration successful.',
  },
} as const;