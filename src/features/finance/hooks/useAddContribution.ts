'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { financeEndpoints } from '@/services/endpoints/finance';
import type { CreateContributionPayload } from '@/types';

export function useAddContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, ...payload }: CreateContributionPayload & { goalId: string }) => {
      const { data } = await financeEndpoints.addContribution(goalId, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'goals'] });
    },
  });
}
