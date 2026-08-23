'use client';

import { useQuery } from '@tanstack/react-query';

import { financeEndpoints } from '@/services/endpoints/finance';

/** Matches the source's own ~5min refresh cadence and the server's 15min cache. */
const REFETCH_INTERVAL_MS = 5 * 60 * 1000;

export function useGoldPrice() {
  return useQuery({
    queryKey: ['finance', 'gold-price'],
    queryFn: async () => {
      const { data } = await financeEndpoints.getGoldPrice();
      return data.data ?? null;
    },
    staleTime: REFETCH_INTERVAL_MS,
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}
