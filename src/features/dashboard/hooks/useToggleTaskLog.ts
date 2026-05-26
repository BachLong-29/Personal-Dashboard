'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse, TaskLog, ToggleTaskLogPayload } from '@/types';

/** Toggles a TaskLog entry: creates if absent, deletes if present (same as HabitLog toggle). */
export function useToggleTaskLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ToggleTaskLogPayload) => {
      const { data } = await apiClient.post<ApiResponse<TaskLog | null>>('/task-logs', payload);
      return data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-logs', variables.date] });
    },
  });
}
