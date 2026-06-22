'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse } from '@/types';
import type { CalendarItem } from '@/types/calendar';

export function useCalendarDay(date: string) {
  return useQuery({
    queryKey: ['calendar-day', date],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<CalendarItem[]>>(
        `/calendar?from=${date}&to=${date}`,
      );
      return data.data ?? [];
    },
    enabled: Boolean(date),
    staleTime: 60_000,
  });
}

/** Returns a map of task ID → scheduled startTime (HH:MM) for the given day's calendar items. */
export function useTaskTimeMap(date: string): Record<string, string> {
  const { data: items = [] } = useCalendarDay(date);
  const map: Record<string, string> = {};
  for (const item of items) {
    if (item.sourceType === 'task' && item.startTime) {
      map[item.sourceId] = item.startTime;
    }
  }
  return map;
}
