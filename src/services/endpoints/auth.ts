import { apiClient } from '@/libs/axios';
import type {
  ApiResponse,
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '@/types';

export const authEndpoints = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<ApiResponse<AuthSession>>('/auth/login', credentials),

  register: (credentials: RegisterCredentials) =>
    apiClient.post<ApiResponse<User>>('/auth/register', credentials),

  google: (credential: string) =>
    apiClient.post<ApiResponse<AuthSession>>('/auth/google', { credential }),

  refresh: (refreshToken: string) =>
    apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', {
      refreshToken,
    }),

  me: () => apiClient.get<ApiResponse<User>>('/users/me'),
};
