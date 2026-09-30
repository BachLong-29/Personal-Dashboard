'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { financeEndpoints } from '@/services/endpoints/finance';
import type { ImportBudgetsPayload } from '@/types';

export function useImportBudgets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ImportBudgetsPayload) => {
      const { data } = await financeEndpoints.importBudgets(payload);
      return data.data;
    },
    onSuccess: () => {
      // Categories may have been created along the way, so the picker lists
      // and the budget lists both go stale.
      queryClient.invalidateQueries({ queryKey: ['finance', 'budgets'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'categories'] });
    },
  });
}
