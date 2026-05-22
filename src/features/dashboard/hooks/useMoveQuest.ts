'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { apiClient } from '@/libs/axios';

interface MoveQuestPayload {
  id: string;
  dueDate: string;
}

export function useMoveQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dueDate }: MoveQuestPayload) => {
      await apiClient.patch(`/quests/${id}`, { dueDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quests.all });
    },
  });
}
