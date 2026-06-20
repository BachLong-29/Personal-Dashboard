'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { Task } from '@/types';
import { useCreateNotification } from '@/features/dashboard/hooks/useNotificationActions';
import { useUpdateTask } from '@/features/dashboard/hooks/useUpdateTask';
import { useTasks } from '@/features/dashboard/hooks/useTasks';
import { computeOverdueLevel, dayOffset } from '../data/adapters';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OverdueItem extends Task {
  daysOverdue: number;
  overdueLevel: 'late' | 'critical';
}

const SESSION_KEY = 'overdue_reviewed';
const CRITICAL_SESSION_PREFIX = 'overdue_critical_notified_';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOverdueReview() {
  const { data: tasks = [], isSuccess } = useTasks();
  const queryClient = useQueryClient();
  const { mutateAsync: updateTask } = useUpdateTask();
  const { mutate: notify } = useCreateNotification();

  const [overdueItems, setOverdueItems] = useState<OverdueItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const ranRef = useRef(false);

  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  useEffect(() => {
    if (!isSuccess || ranRef.current) return;
    ranRef.current = true;

    const failed: Task[] = [];
    const active: OverdueItem[] = [];

    for (const t of tasks) {
      const level = computeOverdueLevel(t);
      if (!level) continue;

      const daysOverdue = -dayOffset(t.endDate ?? t.startDate);

      if (level === 'failed') {
        failed.push(t);
      } else {
        active.push({ ...t, daysOverdue, overdueLevel: level });

        // Notify critical tasks once per session
        if (level === 'critical' && !sessionStorage.getItem(`${CRITICAL_SESSION_PREFIX}${t.id}`)) {
          sessionStorage.setItem(`${CRITICAL_SESSION_PREFIX}${t.id}`, '1');
          notifyRef.current({
            type: 'reminder',
            title: '🔴 Quest Critical',
            message: `"${t.name}" is ${daysOverdue} days overdue. Address it before it's too late.`,
          });
        }
      }
    }

    // Auto-archive tasks >= 7 days overdue
    const archiveAll = async () => {
      for (const t of failed) {
        await updateTask({ id: t.id, active: false });
        notifyRef.current({
          type: 'system',
          title: '☠ Quest Failed',
          message: `"${t.name}" was abandoned after 7+ days overdue. Click to reschedule.`,
          entityId: t.id,
        });
      }
      if (failed.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    };

    archiveAll().then(() => {
      setOverdueItems(active);
      setIsReady(true);
      if (active.length > 0 && !sessionStorage.getItem(SESSION_KEY)) {
        setShowModal(true);
      }
    });
  }, [isSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismissModal = useCallback(() => {
    setShowModal(false);
    sessionStorage.setItem(SESSION_KEY, '1');
  }, []);

  const removeItem = useCallback((taskId: string) => {
    setOverdueItems((prev) => {
      const next = prev.filter((t) => t.id !== taskId);
      if (next.length === 0) {
        // Auto-dismiss after short delay when list empties
        setTimeout(() => setShowModal(false), 1500);
      }
      return next;
    });
  }, []);

  return { overdueItems, isReady, showModal, dismissModal, removeItem };
}
