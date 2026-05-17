'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/habits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
