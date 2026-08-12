'use client';

import { useQuery } from '@tanstack/react-query';

import { financeEndpoints } from '@/services/endpoints/finance';
import type { TransactionFilters } from '@/types';

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ['finance', 'transactions', filters ?? {}],
    queryFn: async () => {
      const { data } = await financeEndpoints.listTransactions(filters);
      return data.data ?? [];
    },
  });
}
