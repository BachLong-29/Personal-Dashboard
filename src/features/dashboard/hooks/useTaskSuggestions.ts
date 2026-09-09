'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse, TaskSuggestion } from '@/types';

/**
 * Backlog tasks ranked for a target day, strongest fit first.
 * Disabled until a day is selected.
 */
export function useTaskSuggestions(date: string | null, limit = 5) {
  return useQuery({
    queryKey: ['tasks', 'suggestions', date, limit],
    enabled: Boolean(date),
    queryFn: async () => {
      const params = new URLSearchParams({ date: date ?? '', limit: String(limit) });
      const { data } = await apiClient.get<ApiResponse<TaskSuggestion[]>>(
        `/tasks/suggestions?${params}`,
      );
      return data.data ?? [];
    },
    staleTime: 60_000,
  });
}
