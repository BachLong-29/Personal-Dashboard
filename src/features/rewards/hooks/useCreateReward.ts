'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse, CreateRewardPayload, Reward } from '@/types';

export function useCreateReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateRewardPayload) => {
      const { data } = await apiClient.post<ApiResponse<Reward>>('/rewards', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
    },
  });
}
