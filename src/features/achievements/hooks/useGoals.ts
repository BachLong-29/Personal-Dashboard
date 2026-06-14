'use client';

import { useQuery } from '@tanstack/react-query';

import { goalEndpoints } from '@/services/endpoints/goals';

export function useGoals(status?: string) {
  return useQuery({
    queryKey: ['goals', status ?? null],
    queryFn: async () => {
      const { data } = await goalEndpoints.list(status);
      return data.data ?? [];
    },
  });
}
