'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse, Task } from '@/types';

export function useTasks(start?: string, end?: string) {
  const params = new URLSearchParams();
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  const qs = params.toString();

  return useQuery({
    queryKey: ['tasks', start, end],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Task[]>>(`/tasks${qs ? `?${qs}` : ''}`);
      return data.data ?? [];
    },
  });
}
