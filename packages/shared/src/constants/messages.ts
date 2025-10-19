export const MESSAGES = {
  ERROR: {
    UNAUTHORIZED: 'Unauthorized access.',
    FORBIDDEN: 'Access forbidden.', // Added
    NOT_FOUND: 'Resource not found.',
    INTERNAL_SERVER_ERROR: 'An internal server error occurred.',
    VALIDATION_FAILED: 'Input validation failed.',
    CONFLICT: 'Resource conflict detected.', // Added
  },
  SUCCESS: {
    FETCHED: 'Resource fetched successfully.', // Added
    CREATED: 'Resource created successfully.',
    UPDATED: 'Resource updated successfully.',
    DELETED: 'Resource deleted successfully.',
    LOGIN_SUCCESS: 'Login successful.', // Added
    REGISTER_SUCCESS: 'Registration successful.', // Added
  },
} as const;