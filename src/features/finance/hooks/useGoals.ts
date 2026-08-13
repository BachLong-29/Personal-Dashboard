'use client';

import { useQuery } from '@tanstack/react-query';

import { financeEndpoints } from '@/services/endpoints/finance';

import { todayKey } from '../utils';

export function useGoals(month: string) {
  const today = todayKey();

  return useQuery({
    queryKey: ['finance', 'goals', month, today],
    queryFn: async () => {
      const { data } = await financeEndpoints.listGoals(month, today);
      return data.data ?? [];
    },
  });
}
