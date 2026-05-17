'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse, Habit } from '@/types';

export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Habit[]>>('/habits');
      return data.data ?? [];
    },
  });
}
