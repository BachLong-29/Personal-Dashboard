'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { apiClient } from '@/libs/axios';
import type { ApiResponse, User } from '@/types';

async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<ApiResponse<User>>('/users/me');
  return data.data;
}

export function useMe() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
  });
}
