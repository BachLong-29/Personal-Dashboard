'use client';

import { useQuery } from '@tanstack/react-query';

import { financeEndpoints } from '@/services/endpoints/finance';

import { todayKey } from '../utils';

export function useForecast() {
  const today = todayKey();

  return useQuery({
    queryKey: ['finance', 'forecast', today],
    queryFn: async () => {
      const { data } = await financeEndpoints.getForecast(today);
      return data.data ?? null;
    },
  });
}
