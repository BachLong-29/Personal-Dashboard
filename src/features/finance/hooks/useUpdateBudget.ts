'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { financeEndpoints } from '@/services/endpoints/finance';
import type { UpdateBudgetPayload } from '@/types';

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateBudgetPayload & { id: string }) => {
      const { data } = await financeEndpoints.updateBudget(id, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'budgets'] });
    },
  });
}
