'use client';

import { useQuery } from '@tanstack/react-query';

import { financeEndpoints } from '@/services/endpoints/finance';

export function useGoldAccount() {
  return useQuery({
    queryKey: ['finance', 'gold-account'],
    queryFn: async () => {
      const { data } = await financeEndpoints.getGoldAccount();
      return data.data ?? null;
    },
  });
}
