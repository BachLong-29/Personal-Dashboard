'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { financeEndpoints } from '@/services/endpoints/finance';
import type { UpdateGoldAccountPayload } from '@/types';

export function useUpdateGoldAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateGoldAccountPayload) => {
      const { data } = await financeEndpoints.updateGoldAccount(payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'gold-account'] });
    },
  });
}
