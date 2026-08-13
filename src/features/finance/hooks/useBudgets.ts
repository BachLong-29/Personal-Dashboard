'use client';

import { useQuery } from '@tanstack/react-query';

import { financeEndpoints } from '@/services/endpoints/finance';

export function useBudgets(month: string) {
  return useQuery({
    queryKey: ['finance', 'budgets', month],
    queryFn: async () => {
      const { data } = await financeEndpoints.listBudgets(month);
      return data.data ?? [];
    },
  });
}
