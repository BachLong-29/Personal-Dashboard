'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/libs/axios';
import { queryKeys } from '@/constants/query-keys';
import { useUIStore } from '@/stores/ui.store';
import type { ApiResponse } from '@/types';
import type { Notification } from './useNotifications';

type QC = ReturnType<typeof useQueryClient>;

function invalidateNotifications(queryClient: QC) {
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
}

interface NotificationSnapshot {
  list: Notification[] | undefined;
  count: number | undefined;
}

/**
 * Freeze the panel's current contents so an optimistic edit can be rolled back.
 *
 * Reading the list runs the schedule generator server-side, so waiting for the
 * round trip before touching the UI is what made dismissing and marking all
 * read feel stuck. The panel is updated first and reconciled afterwards.
 */
async function snapshotNotifications(queryClient: QC): Promise<NotificationSnapshot> {
  await queryClient.cancelQueries({ queryKey: queryKeys.notifications.list() });
  await queryClient.cancelQueries({ queryKey: queryKeys.notifications.unreadCount() });
  return {
    list: queryClient.getQueryData<Notification[]>(queryKeys.notifications.list()),
    count: queryClient.getQueryData<number>(queryKeys.notifications.unreadCount()),
  };
}

function restoreNotifications(queryClient: QC, snapshot?: NotificationSnapshot) {
  if (!snapshot) return;
  queryClient.setQueryData(queryKeys.notifications.list(), snapshot.list);
  queryClient.setQueryData(queryKeys.notifications.unreadCount(), snapshot.count);
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.put<ApiResponse<Notification>>(`/notifications/${id}/read`);
      return data.data;
    },
    onMutate: async (id) => {
      const snapshot = await snapshotNotifications(queryClient);
      const wasUnread = snapshot.list?.some((n) => n._id === id && !n.isRead) ?? false;

      queryClient.setQueryData<Notification[]>(queryKeys.notifications.list(), (old) =>
        old?.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      if (wasUnread && typeof snapshot.count === 'number') {
        queryClient.setQueryData(
          queryKeys.notifications.unreadCount(),
          Math.max(0, snapshot.count - 1),
        );
      }
      return snapshot;
    },
    onError: (_err, _id, snapshot) => {
      restoreNotifications(queryClient, snapshot);
      addToast({ type: 'error', message: "Couldn't mark that notification read." });
    },
    onSettled: () => invalidateNotifications(queryClient),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: async () => {
      await apiClient.put('/notifications/read-all');
    },
    onMutate: async () => {
      const snapshot = await snapshotNotifications(queryClient);
      queryClient.setQueryData<Notification[]>(queryKeys.notifications.list(), (old) =>
        old?.map((n) => (n.isRead ? n : { ...n, isRead: true })),
      );
      queryClient.setQueryData(queryKeys.notifications.unreadCount(), 0);
      return snapshot;
    },
    onError: (_err, _vars, snapshot) => {
      restoreNotifications(queryClient, snapshot);
      addToast({ type: 'error', message: "Couldn't mark all notifications read." });
    },
    onSettled: () => invalidateNotifications(queryClient),
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/notifications/${id}`);
    },
    onMutate: async (id) => {
      const snapshot = await snapshotNotifications(queryClient);
      const dropped = snapshot.list?.find((n) => n._id === id);

      queryClient.setQueryData<Notification[]>(queryKeys.notifications.list(), (old) =>
        old?.filter((n) => n._id !== id),
      );
      if (dropped && !dropped.isRead && typeof snapshot.count === 'number') {
        queryClient.setQueryData(
          queryKeys.notifications.unreadCount(),
          Math.max(0, snapshot.count - 1),
        );
      }
      return snapshot;
    },
    onError: (_err, _id, snapshot) => {
      restoreNotifications(queryClient, snapshot);
      addToast({ type: 'error', message: "Couldn't dismiss that notification." });
    },
    onSettled: () => invalidateNotifications(queryClient),
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
