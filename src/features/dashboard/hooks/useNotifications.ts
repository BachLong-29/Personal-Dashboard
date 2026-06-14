'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import { queryKeys } from '@/constants/query-keys';
import type { ApiResponse } from '@/types';

export interface Notification {
  _id: string;
  type: 'planning' | 'monthly-plan' | 'reminder' | 'system' | 'reward';
  title: string;
  message: string;
  isRead: boolean;
  expiresAt?: string;
  createdAt: string;
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Notification[]>>('/notifications');
      return data.data;
    },
  });
}
