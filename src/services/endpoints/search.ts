import { apiClient } from '@/libs/axios';
import type { ApiResponse, GlobalSearchResult } from '@/types';

export const searchEndpoints = {
  global: (q: string, limit?: number) =>
    apiClient.get<ApiResponse<GlobalSearchResult>>('/search', {
      params: { q, ...(limit ? { limit } : {}) },
    }),
};
