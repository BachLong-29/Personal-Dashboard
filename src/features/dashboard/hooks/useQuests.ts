'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import { queryKeys } from '@/constants/query-keys';
import type { ApiResponse, Quest } from '@/types';

export function useQuests(date?: string) {
  return useQuery({
    queryKey: queryKeys.quests.list(date),
    queryFn: async () => {
      const url = date ? `/quests?date=${date}` : '/quests';
      const { data } = await apiClient.get<ApiResponse<Quest[]>>(url);
      return data.data;
    },
  });
}
