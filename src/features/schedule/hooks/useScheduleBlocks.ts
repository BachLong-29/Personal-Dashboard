'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';
import { apiClient } from '@/libs/axios';
import type {
  ApiResponse,
  CreateScheduleBlockPayload,
  ScheduleBlock,
  ScheduleBlockSource,
  UpdateScheduleBlockPayload,
} from '@/types';

export interface ScheduleBlockQuery {
  from?: string;
  to?: string;
  sourceType?: ScheduleBlockSource;
  sourceId?: string;
}

/** List schedule blocks, filtered by date range and/or source. */
export function useScheduleBlocks(params: ScheduleBlockQuery = {}) {
  return useQuery({
    queryKey: queryKeys.scheduleBlocks.list(params as Record<string, unknown>),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params.from) qs.set('from', params.from);
      if (params.to) qs.set('to', params.to);
      if (params.sourceType) qs.set('sourceType', params.sourceType);
      if (params.sourceId) qs.set('sourceId', params.sourceId);
      const q = qs.toString();
      const { data } = await apiClient.get<ApiResponse<ScheduleBlock[]>>(
        `/schedule-blocks${q ? `?${q}` : ''}`,
      );
      return data.data ?? [];
    },
  });
}

/** Convenience: blocks belonging to a single task (or quest). */
export function useTaskBlocks(
  taskId: string | undefined,
  sourceType: ScheduleBlockSource = 'task',
) {
  return useQuery({
    queryKey: queryKeys.scheduleBlocks.list({ sourceType, sourceId: taskId }),
    enabled: Boolean(taskId),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<ScheduleBlock[]>>(
        `/schedule-blocks?sourceType=${sourceType}&sourceId=${taskId}`,
      );
      return data.data ?? [];
    },
  });
}

/** Invalidate every view derived from schedule blocks. */
function useInvalidateSchedule() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.scheduleBlocks.all });
    qc.invalidateQueries({ queryKey: queryKeys.calendar.all });
    qc.invalidateQueries({ queryKey: ['tasks'] });
  };
}

export function useCreateScheduleBlock() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (payload: CreateScheduleBlockPayload) => {
      const { data } = await apiClient.post<ApiResponse<ScheduleBlock>>(
        '/schedule-blocks',
        payload,
      );
      return data.data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateScheduleBlock() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateScheduleBlockPayload & { id: string }) => {
      const { data } = await apiClient.patch<ApiResponse<ScheduleBlock>>(
        `/schedule-blocks/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteScheduleBlock() {
  const invalidate = useInvalidateSchedule();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/schedule-blocks/${id}`);
    },
    onSuccess: invalidate,
  });
}
