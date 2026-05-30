'use client';

import { useQuery } from '@tanstack/react-query';

import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/libs/axios';
import type { ApiResponse, Task } from '@/types';

/**
 * Search tasks by name via API (debounced).
 * With empty query returns the `limit` most recently created tasks.
 */
export function useTaskSearch(q: string, limit = 10, excludeId?: string) {
  const debouncedQ = useDebounce(q, 300);

  return useQuery({
    queryKey: ['tasks', 'search', debouncedQ, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (debouncedQ) params.set('q', debouncedQ);
      const { data } = await apiClient.get<ApiResponse<Task[]>>(`/tasks?${params}`);
      const all = data.data ?? [];
      return excludeId ? all.filter((t) => t.id !== excludeId) : all;
    },
    staleTime: 15_000,
  });
}
