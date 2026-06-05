'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse, HabitLog } from '@/types';

/** Fetch all habit logs between two ISO date strings (inclusive). */
export function useHabitLogsRange(from: string, to: string) {
  return useQuery({
    queryKey: ['habit-logs', from, to],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<HabitLog[]>>(
        `/habits/logs?from=${from}&to=${to}`,
      );
      return data.data ?? [];
    },
    staleTime: 30_000,
  });
}
