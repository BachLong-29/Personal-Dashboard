'use client';

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import { queryKeys } from '@/constants/query-keys';
import type { ApiResponse } from '@/types';

export interface Notification {
  _id: string;
  type:
    | 'planning'
    | 'monthly-plan'
    | 'reminder'
    | 'system'
    | 'reward'
    | 'deadline'
    | 'overload'
    | 'conflict';
  title: string;
  message: string;
  isRead: boolean;
  /** Optional entity reference — e.g. task ID for "Quest Failed" notifications */
  entityId?: string;
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

/**
 * True unread total, independent of the (capped) list above — the list only
 * shows the latest 20, so counting unread within it undercounts once older
 * unread notifications fall outside that window.
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{ count: number }>>(
        '/notifications/unread-count',
      );
      return data.data.count;
    },
  });
}
