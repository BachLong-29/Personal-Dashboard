'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import { queryKeys } from '@/constants/query-keys';
import { useUIStore } from '@/stores/ui.store';
import type { ApiResponse } from '@/types';
import type { Notification } from './useNotifications';

function invalidateNotifications(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.put<ApiResponse<Notification>>(`/notifications/${id}/read`);
      return data.data;
    },
    onSuccess: () => invalidateNotifications(queryClient),
    onError: () => addToast({ type: 'error', message: "Couldn't mark that notification read." }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: async () => {
      await apiClient.put('/notifications/read-all');
    },
    onSuccess: () => invalidateNotifications(queryClient),
    onError: () => addToast({ type: 'error', message: "Couldn't mark all notifications read." }),
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/notifications/${id}`);
    },
    onSuccess: () => invalidateNotifications(queryClient),
    onError: () => addToast({ type: 'error', message: "Couldn't dismiss that notification." }),
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: async (payload: {
      type: string;
      title: string;
      message: string;
      expiresAt?: string;
      entityId?: string;
      /** Exact-match idempotency key — preferred over the day+type+title heuristic. */
      dedupeKey?: string;
    }) => {
      const { data } = await apiClient.post<ApiResponse<Notification>>('/notifications', payload);
      return data.data;
    },
    onSuccess: () => invalidateNotifications(queryClient),
    onError: () => addToast({ type: 'error', message: "Couldn't create that notification." }),
  });
}
