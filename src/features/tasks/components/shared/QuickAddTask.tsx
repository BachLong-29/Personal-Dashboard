'use client';

import { useEffect } from 'react';

import { useUIStore } from '@/stores/ui.store';

import { AddTaskModal } from './AddTaskModal';

/** Ctrl/Cmd + Shift + Q opens a task-create modal from anywhere in the protected app,
 * pre-filled with today's start date. Mirrors GlobalSearch's self-contained listener. */
export function QuickAddTask() {
  const open = useUIStore((s) => s.quickAddTaskOpen);
  const closeQuickAddTask = useUIStore((s) => s.closeQuickAddTask);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey || e.key.toLowerCase() !== 'q') return;

      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isTyping) return;

      const store = useUIStore.getState();
      if (store.searchOpen || store.quickAddTaskOpen) return;

      e.preventDefault();
      store.openQuickAddTask();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  return (
    <AddTaskModal
      open={open}
      onClose={closeQuickAddTask}
      defaultValues={{ startDate: new Date() }}
    />
  );
}
