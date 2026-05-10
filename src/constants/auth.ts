export const TOKEN_KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
} as const;

export const TOKEN_MAX_AGE = {
  // 15 minutes — matches server-side ACCESS_TOKEN_EXPIRY
  ACCESS: 15 * 60,
  // 7 days — matches server-side REFRESH_TOKEN_EXPIRY
  REFRESH: 7 * 24 * 60 * 60,
} as const;

export const AUTH_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
} as const;

export const PROTECTED_ROUTES = ['/dashboard', '/marketplace'] as const;
