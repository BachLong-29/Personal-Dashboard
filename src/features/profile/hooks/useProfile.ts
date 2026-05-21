'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import { queryKeys } from '@/constants/query-keys';
import type { ApiResponse, CombinedProfileResponse } from '@/types';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<CombinedProfileResponse>>('/profile');
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
