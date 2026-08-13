'use client';

import { useQuery } from '@tanstack/react-query';

import { financeEndpoints } from '@/services/endpoints/finance';

import { todayKey } from '../utils';

export function useFinanceOverview(month: string) {
  const today = todayKey();

  return useQuery({
    queryKey: ['finance', 'overview', month, today],
    queryFn: async () => {
      const { data } = await financeEndpoints.getOverview(month, today);
      return data.data ?? null;
    },
  });
}
