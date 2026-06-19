'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { apiClient } from '@/libs/axios';
import type { ApiResponse, CalendarInsights } from '@/types';

/** Fetch conflict + capacity insights for an inclusive date range. */
export function useCalendarInsights(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.calendar.insights(from, to),
    enabled: enabled && Boolean(from && to),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<CalendarInsights>>(
        `/calendar/insights?from=${from}&to=${to}`,
      );
      return data.data ?? { conflicts: [], capacity: [] };
    },
  });
}
