'use client';

import { cn } from '@/libs/utils';
import type { Task } from '@/types';

import { COLOR_CSS, STATUS_COLUMNS } from '../constants';

interface Props {
  tasks: Task[];
  onToggleDone: (task: Task) => void;
  onEdit?: (task: Task) => void;
}

const STATUS_LABEL = Object.fromEntries(STATUS_COLUMNS.map((c) => [c.value, c.label]));

export function ProjectTaskList({ tasks, onToggleDone, onEdit }: Props) {
  if (tasks.length === 0) {
    return <div className="text-[12px] text-[var(--text-lo)] text-center py-10">No tasks yet.</div>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {tasks.map((t) => {
        const done = t.status === 'done';
        return (
          <div
            key={t.id}
            className={cn(
              'group flex items-center gap-3 px-3 py-2.5 rounded-[var(--r-sm)] border bg-[var(--panel)] transition-all',
              done
                ? 'border-[var(--border-lo)] opacity-60'
                : 'border-[var(--border)] hover:border-[var(--border-hi)]',
            )}
          >
            <button
              type="button"
              onClick={() => onToggleDone(t)}
              className={cn(
                'w-5 h-5 shrink-0 rounded-[5px] border flex items-center justify-center text-[11px] transition-all',
                done
                  ? 'bg-[var(--mint)] border-[var(--mint)] text-[#021]'
                  : 'border-[var(--border-hi)] text-transparent hover:border-[var(--gold)]',
              )}
              aria-label={done ? 'Mark as not done' : 'Mark as done'}
            >
              ✓
            </button>

            <span
              className="w-1 h-5 rounded-full shrink-0"
              style={{ background: COLOR_CSS[t.color] }}
            />
            <span className="text-[14px] leading-none">{t.icon}</span>
            <span
              className={cn(
                'flex-1 min-w-0 truncate text-[13px]',
                done ? 'text-[var(--text-mid)] line-through' : 'text-[var(--text-hi)]',
              )}
            >
              {t.name}
            </span>

            <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--text-lo)] [font-family:var(--f-title)] shrink-0">
              {STATUS_LABEL[t.status]}
            </span>

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(t)}
                className="opacity-0 group-hover:opacity-100 text-[11px] text-[var(--text-lo)] hover:text-[var(--gold)] transition-opacity shrink-0"
                aria-label="Edit task"
              >
                ✏
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
