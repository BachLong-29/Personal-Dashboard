'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse, Habit, UpdateHabitPayload } from '@/types';

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateHabitPayload & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<Habit>>(`/habits/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
