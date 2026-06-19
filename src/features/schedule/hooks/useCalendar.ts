'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { apiClient } from '@/libs/axios';
import type { ApiResponse, CalendarItem } from '@/types';

/** Fetch merged calendar items for an inclusive date range. */
export function useCalendar(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.calendar.range(from, to),
    enabled: enabled && Boolean(from && to),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<CalendarItem[]>>(
        `/calendar?from=${from}&to=${to}`,
      );
      return data.data ?? [];
    },
  });
}
