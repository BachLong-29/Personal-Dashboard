'use client';

import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse, Quest } from '@/types';

interface UpdateQuestStatusPayload {
  id: string;
  done: boolean;
}

export function useUpdateQuestStatus() {
  return useMutation({
    mutationFn: async ({ id, done }: UpdateQuestStatusPayload) => {
      const { data } = await apiClient.patch<ApiResponse<Quest>>(`/quests/${id}`, { done });
      return data.data;
    },
  });
}
