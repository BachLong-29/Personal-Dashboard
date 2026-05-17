'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse, CreateHabitPayload, Habit } from '@/types';

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateHabitPayload) => {
      const { data } = await apiClient.post<ApiResponse<Habit>>('/habits', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
