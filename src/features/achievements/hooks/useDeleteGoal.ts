'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { goalEndpoints } from '@/services/endpoints/goals';

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await goalEndpoints.remove(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
