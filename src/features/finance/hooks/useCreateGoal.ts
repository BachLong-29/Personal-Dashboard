'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { financeEndpoints } from '@/services/endpoints/finance';
import type { CreateFinanceGoalPayload } from '@/types';

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateFinanceGoalPayload) => {
      const { data } = await financeEndpoints.createGoal(payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'goals'] });
    },
  });
}
