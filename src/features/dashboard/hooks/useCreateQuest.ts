'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { apiClient } from '@/libs/axios';
import type { ApiResponse, CreateQuestPayload, Quest } from '@/types';

export function useCreateQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateQuestPayload) => {
      const { data } = await apiClient.post<ApiResponse<Quest>>('/quests', payload);
      return data.data;
    },
    onSuccess: () => {
      // The modal's onAdd callback only prepends to the dashboard's own local
      // list. Every other view reads the query, so without this a new quest
      // stays invisible in the day and week views until a reload.
      queryClient.invalidateQueries({ queryKey: queryKeys.quests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}
