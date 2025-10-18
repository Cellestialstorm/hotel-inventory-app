export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
} as const;

export const API_ENDPOINTS = {
  AUTH: '/auth',
  USERS: '/users',
  HOTELS: '/hotels',
  DEPARTMENTS: '/departments',
  INVENTORY: '/inventory',
  TRANSACTIONS: '/transactions',
  REPORTS: '/reports',
} as const;