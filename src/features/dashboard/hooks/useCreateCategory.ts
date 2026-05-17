'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse, Category, CreateCategoryPayload } from '@/types';

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCategoryPayload) => {
      const { data } = await apiClient.post<ApiResponse<Category>>('/categories', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
