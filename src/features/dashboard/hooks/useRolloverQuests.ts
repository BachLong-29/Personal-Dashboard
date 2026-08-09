'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { apiClient } from '@/libs/axios';

export interface RolledOverQuestItem {
  id: string;
  title: string;
  difficulty: string;
}

export function useRolloverQuests() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{
        data: { rolledOver: number; items: RolledOverQuestItem[] };
      }>('/quests/rollover');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quests.all });
    },
  });
}
