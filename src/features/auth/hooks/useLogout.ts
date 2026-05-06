'use client';

import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import { AUTH_ROUTES } from '@/constants/auth';
import { clearTokens } from '@/libs/axios/instance';

import { useAuthStore } from '../stores/auth.store';

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return function logout() {
    // Clear auth cookies so proxy.ts stops treating user as authenticated
    clearTokens();
    // Clear Zustand in-memory state
    clearAuth();
    // Invalidate all cached queries
    queryClient.clear();
    router.push(AUTH_ROUTES.LOGIN);
  };
}
