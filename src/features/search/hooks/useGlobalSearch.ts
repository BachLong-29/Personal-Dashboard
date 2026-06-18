'use client';

import { useQuery } from '@tanstack/react-query';

import { searchEndpoints } from '@/services/endpoints/search';
import type { GlobalSearchResult } from '@/types';

const EMPTY: GlobalSearchResult = { tasks: [], habits: [], quests: [], projects: [] };

/**
 * Global search over tasks, habits, quests and projects.
 * Only runs when `term` (already debounced by the caller) is non-empty.
 */
export function useGlobalSearch(term: string) {
  const q = term.trim();

  const query = useQuery({
    queryKey: ['global-search', q],
    queryFn: async () => {
      const { data } = await searchEndpoints.global(q);
      return data.data;
    },
    enabled: q.length > 0,
    staleTime: 30_000,
  });

  return {
    result: query.data ?? EMPTY,
    isLoading: q.length > 0 && query.isLoading,
    isFetching: query.isFetching,
  };
}
