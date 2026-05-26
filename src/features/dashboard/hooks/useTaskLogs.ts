'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse, TaskLog } from '@/types';

/** Fetches all TaskLog entries for the authenticated user on a given date (YYYY-MM-DD). */
export function useTaskLogs(date: string) {
  return useQuery({
    queryKey: ['task-logs', date],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<TaskLog[]>>(`/task-logs?date=${date}`);
      return data.data ?? [];
    },
  });
}
