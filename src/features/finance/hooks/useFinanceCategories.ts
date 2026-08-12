'use client';

import { useQuery } from '@tanstack/react-query';

import { financeEndpoints } from '@/services/endpoints/finance';
import type { FinanceCategoryType } from '@/types';

export function useFinanceCategories(type?: FinanceCategoryType) {
  return useQuery({
    queryKey: ['finance', 'categories', type ?? 'all'],
    queryFn: async () => {
      const { data } = await financeEndpoints.listCategories(type);
      return data.data ?? [];
    },
  });
}
