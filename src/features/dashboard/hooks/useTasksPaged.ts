'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse, PaginationMeta, Task } from '@/types';

interface UseTasksPagedParams {
  offset: number;
  limit: number;
  /** Search by name (case-insensitive). */
  q?: string;
  /** Filter to a single category. */
  tagId?: string;
}

interface TasksPage {
  tasks: Task[];
  meta: PaginationMeta | undefined;
}

/** Paginated task list — `GET /api/v1/tasks?offset=&limit=&q=&tagId=`. */
export function useTasksPaged({ offset, limit, q, tagId }: UseTasksPagedParams) {
  const params = new URLSearchParams();
  params.set('offset', String(offset));
  params.set('limit', String(limit));
  if (q) params.set('q', q);
  if (tagId) params.set('tagId', tagId);

  return useQuery({
    queryKey: ['tasks', 'paged', offset, limit, q, tagId],
    queryFn: async (): Promise<TasksPage> => {
      const { data } = await apiClient.get<ApiResponse<Task[]>>(`/tasks?${params.toString()}`);
      return { tasks: data.data ?? [], meta: data.meta };
    },
    placeholderData: (prev) => prev,
  });
}
