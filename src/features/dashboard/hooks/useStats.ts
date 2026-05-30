'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import type { ApiResponse } from '@/types';

export interface TaskStat {
  total: number;
  done: number;
  inProgress: number;
  pending: number;
  todo: number;
  overdue: number;
  completionRate: number;
}

export interface HabitStat {
  activeCount: number;
  doneToday: number;
  totalToday: number;
  completionRateToday: number;
  weekCompletionRate: number;
}

export interface PendingTask {
  id: string;
  name: string;
  icon: string;
  color: string;
  status: string;
  startDate: string;
  overdue: boolean;
  daysOverdue?: number;
}

export interface WeeklyStat {
  dates: string[];
  tasksDone: number[];
  habitsDone: number[];
}

export interface DashboardStats {
  tasks: TaskStat;
  habits: HabitStat;
  weekly: WeeklyStat;
  pendingTasks: PendingTask[];
  generatedAt: string;
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<DashboardStats>>('/stats');
      return data.data ?? null;
    },
    staleTime: 60_000, // 1 min — stats don't need real-time freshness
    refetchOnWindowFocus: false,
  });
}
