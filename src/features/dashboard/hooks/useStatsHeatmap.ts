'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse } from '@/types';

interface HeatmapData {
  activityMap: Record<string, number>;
}

export function useStatsHeatmap() {
  return useQuery({
    queryKey: ['stats-heatmap'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<HeatmapData>>('/stats/heatmap');
      return data.data ?? null;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
