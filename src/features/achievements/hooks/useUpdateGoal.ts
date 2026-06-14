'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { goalEndpoints } from '@/services/endpoints/goals';
import type { UpdateGoalPayload } from '@/types';

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateGoalPayload & { id: string }) => {
      const { data } = await goalEndpoints.update(id, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
