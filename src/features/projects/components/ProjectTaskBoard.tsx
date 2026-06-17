'use client';

import { useState } from 'react';

import { cn } from '@/libs/utils';
import type { Task, TaskStatus } from '@/types';

import { COLOR_CSS, STATUS_COLUMNS } from '../constants';

interface Props {
  tasks: Task[];
  onChangeStatus: (taskId: string, status: TaskStatus) => void;
}

export function ProjectTaskBoard({ tasks, onChangeStatus }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);

  function handleDrop(status: TaskStatus) {
    if (dragId) {
      const task = tasks.find((t) => t.id === dragId);
      if (task && task.status !== status) onChangeStatus(dragId, status);
    }
    setDragId(null);
    setOverCol(null);
  }

  return (
    <div className="flex gap-3 h-full overflow-x-auto pb-2">
      {STATUS_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.value);
        return (
          <div
            key={col.value}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(col.value);
            }}
            onDragLeave={() => setOverCol((c) => (c === col.value ? null : c))}
            onDrop={() => handleDrop(col.value)}
            className={cn(
              'flex flex-col w-[230px] shrink-0 rounded-[var(--r)] border transition-colors',
              overCol === col.value
                ? 'border-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.04)]'
                : 'border-[var(--border)] bg-[var(--panel)]',
            )}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-mid)] [font-family:var(--f-title)]">
                {col.label}
              </span>
              <span className="text-[10px] text-[var(--text-lo)] font-bold">{colTasks.length}</span>
            </div>

            <div className="flex flex-col gap-2 p-2 flex-1 min-h-[60px] overflow-y-auto">
              {colTasks.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={() => setDragId(t.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverCol(null);
                  }}
                  className={cn(
                    'group flex items-start gap-2 p-2.5 rounded-[var(--r-sm)] border bg-[var(--surface-2)] cursor-grab active:cursor-grabbing transition-all',
                    'border-[var(--border)] hover:border-[var(--border-hi)]',
                    dragId === t.id && 'opacity-40',
                  )}
                >
                  <span
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ background: COLOR_CSS[t.color] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] leading-none">{t.icon}</span>
                      <span className="text-[12px] text-[var(--text-hi)] font-medium truncate">
                        {t.name}
                      </span>
                    </div>
                    {t.note && (
                      <p className="text-[10px] text-[var(--text-lo)] mt-1 line-clamp-2">
                        {t.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {colTasks.length === 0 && (
                <div className="text-[10px] text-[var(--text-lo)] text-center py-3 opacity-50">
                  —
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
