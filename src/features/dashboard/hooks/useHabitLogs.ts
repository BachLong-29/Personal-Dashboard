'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse, HabitLog } from '@/types';

export function useHabitLogs(date: string) {
  return useQuery({
    queryKey: ['habit-logs', date],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<HabitLog[]>>(`/habits/logs?date=${date}`);
      return data.data ?? [];
    },
  });
}
