'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse, RewardListResponse } from '@/types';

export interface RewardQueryParams {
  search?: string;
  rarity?: string;
  status?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export function useRewards(params: RewardQueryParams = {}) {
  const qs = new URLSearchParams();
  if (params.search)  qs.set('search',  params.search);
  if (params.rarity)  qs.set('rarity',  params.rarity);
  if (params.status)  qs.set('status',  params.status);
  if (params.sortBy)  qs.set('sortBy',  params.sortBy);
  if (params.order)   qs.set('order',   params.order);
  if (params.page)    qs.set('page',    String(params.page));
  if (params.limit)   qs.set('limit',   String(params.limit));

  const query = qs.toString();

  return useQuery({
    queryKey: ['rewards', params],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<RewardListResponse>>(
        `/rewards${query ? `?${query}` : ''}`,
      );
      return data.data;
    },
  });
}
