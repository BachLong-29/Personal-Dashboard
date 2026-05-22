'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import { queryKeys } from '@/constants/query-keys';
import type { ApiResponse, Quest } from '@/types';

export function useQuests(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: queryKeys.quests.list(dateFrom, dateTo),
    queryFn: async () => {
      let url = '/quests';
      if (dateFrom) url += `?date=${dateFrom}`;
      if (dateTo) url += `${dateFrom ? '&' : '?'}dateTo=${dateTo}`;
      const { data } = await apiClient.get<ApiResponse<Quest[]>>(url);
      return data.data;
    },
  });
}
