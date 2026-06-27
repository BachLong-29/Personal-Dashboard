'use client';

import { useState } from 'react';

import { Icon } from '@/components/common/Icon';
import { cn } from '@/libs/utils';
import type { Task, TaskStatus } from '@/types';

import { COLOR_CSS, STATUS_COLUMNS, STATUS_CSS } from '../constants';

interface Props {
  tasks: Task[];
  onChangeStatus: (taskId: string, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
}

function formatSchedule(startDate: string, startTime?: string): string {
  const d = new Date(`${startDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  let dateLabel: string;
  if (diff === 0) dateLabel = 'Today';
  else if (diff === 1) dateLabel = 'Tomorrow';
  else if (diff < 0) dateLabel = `${Math.abs(diff)}d ago`;
  else dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return startTime ? `${startTime} · ${dateLabel}` : dateLabel;
}

export function ProjectTaskBoard({ tasks, onChangeStatus, onEdit }: Props) {
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
        const statusColor = STATUS_CSS[col.value];
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
              'flex flex-col flex-1 min-w-[140px] rounded-[var(--r)] border transition-colors overflow-hidden',
              overCol === col.value
                ? 'border-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.04)]'
                : 'border-[var(--border)] bg-[var(--panel)]',
            )}
          >
            {/* Status accent bar */}
            <span className="h-[3px] w-full shrink-0" style={{ background: statusColor }} />

            <div
              className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]"
              style={{ background: `color-mix(in oklch, ${statusColor} 8%, transparent)` }}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.1em] [font-family:var(--f-title)] truncate"
                  style={{ color: statusColor }}
                >
                  {col.label}
                </span>
              </span>
              <span
                className="text-[10px] font-bold px-1.5 rounded-[var(--r-xs)] shrink-0"
                style={{
                  color: statusColor,
                  background: `color-mix(in oklch, ${statusColor} 16%, transparent)`,
                }}
              >
                {colTasks.length}
              </span>
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
                  onClick={() => onEdit?.(t)}
                  className={cn(
                    'group flex items-start gap-2 p-2 rounded-[var(--r-sm)] border bg-[var(--surface-2)] transition-all',
                    'border-[var(--border)] hover:border-[var(--border-hi)]',
                    onEdit ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
                    dragId === t.id && 'opacity-40',
                  )}
                >
                  <span
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ background: COLOR_CSS[t.color] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] text-[var(--text-lo)] [font-family:var(--f-title)] tracking-[0.04em] mb-1 leading-tight whitespace-nowrap">
                      {t.startDate ? formatSchedule(t.startDate) : '—'}
                    </p>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon icon={t.icon} className="text-[12px] leading-none shrink-0" />
                      <span className="text-[11px] text-[var(--text-hi)] truncate leading-tight">
                        {t.name}
                      </span>
                    </div>
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
