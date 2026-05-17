'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse, HabitLog, UpsertHabitLogPayload } from '@/types';

export function useToggleHabitLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpsertHabitLogPayload) => {
      const { data } = await apiClient.post<ApiResponse<HabitLog>>('/habits/logs', payload);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['habit-logs', variables.date] });
    },
  });
}
