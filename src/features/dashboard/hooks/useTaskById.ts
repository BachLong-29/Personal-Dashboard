'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse, Task } from '@/types';

export function useTaskById(id: string | null) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
      return data.data ?? null;
    },
    enabled: !!id,
  });
}
