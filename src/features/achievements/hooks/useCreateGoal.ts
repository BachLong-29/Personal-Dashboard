'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { goalEndpoints } from '@/services/endpoints/goals';
import type { CreateGoalPayload } from '@/types';

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateGoalPayload) => {
      const { data } = await goalEndpoints.create(payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
