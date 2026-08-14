'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { financeEndpoints } from '@/services/endpoints/finance';
import type { UpdateFinanceCategoryPayload } from '@/types';

export function useUpdateFinanceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateFinanceCategoryPayload & { id: string }) => {
      const { data } = await financeEndpoints.updateCategory(id, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'categories'] });
    },
  });
}
