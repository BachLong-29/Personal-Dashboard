'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { apiClient } from '@/libs/axios';
import type { ApiResponse, Task, UpdateTaskPayload } from '@/types';

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateTaskPayload & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduleBlocks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
    },
  });
}
