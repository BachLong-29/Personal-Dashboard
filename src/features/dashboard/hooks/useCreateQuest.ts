'use client';

import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse, CreateQuestPayload, Quest } from '@/types';

export function useCreateQuest() {
  return useMutation({
    mutationFn: async (payload: CreateQuestPayload) => {
      const { data } = await apiClient.post<ApiResponse<Quest>>('/quests', payload);
      return data.data;
    },
  });
}
