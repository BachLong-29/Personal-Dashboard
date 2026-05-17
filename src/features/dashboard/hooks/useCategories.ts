'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse, Category } from '@/types';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Category[]>>('/categories');
      return data.data ?? [];
    },
  });
}
