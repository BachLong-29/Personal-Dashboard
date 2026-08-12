'use client';

import { useQuery } from '@tanstack/react-query';

import { financeEndpoints } from '@/services/endpoints/finance';

export function useSepayStatus(walletId: string | null) {
  return useQuery({
    queryKey: ['finance', 'wallets', walletId, 'sepay'],
    queryFn: async () => {
      const { data } = await financeEndpoints.getSepayStatus(walletId as string);
      return data.data ?? null;
    },
    enabled: !!walletId,
  });
}
