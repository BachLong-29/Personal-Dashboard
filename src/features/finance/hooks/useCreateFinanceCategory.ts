'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { financeEndpoints } from '@/services/endpoints/finance';
import type { CreateFinanceCategoryPayload } from '@/types';

export function useCreateFinanceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateFinanceCategoryPayload) => {
      const { data } = await financeEndpoints.createCategory(payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'categories'] });
    },
  });
}
