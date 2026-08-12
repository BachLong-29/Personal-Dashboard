'use client';

import { useQuery } from '@tanstack/react-query';

import { financeEndpoints } from '@/services/endpoints/finance';

export function useWallets() {
  return useQuery({
    queryKey: ['finance', 'wallets'],
    queryFn: async () => {
      const { data } = await financeEndpoints.listWallets();
      return data.data ?? [];
    },
  });
}
