'use client';

import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import { setTokens } from '@/libs/axios/instance';
import type { ApiResponse, AuthSession } from '@/types';

import { useAuthStore } from '../stores/auth.store';
import type { LoginFormValues } from '../schemas';

async function login(credentials: LoginFormValues): Promise<ApiResponse<AuthSession>> {
  const { data } = await apiClient.post<ApiResponse<AuthSession>>('/auth/login', credentials);
  return data;
}

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      const { user, tokens } = data.data;
      // Store tokens in cookies so proxy.ts can read them for route protection
      setTokens(tokens.accessToken, tokens.refreshToken);
      // Sync user into Zustand store for in-app state
      setUser(user);
    },
  });
}
