'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/libs/utils';

import { HABIT_COLORS } from '../constants';
import type { Task, TaskColor, TaskStatus } from '../types';

interface TaskCardProps {
  task: Task;
  tagLabel?: string;
  isBlocked?: boolean;
  blockedByNames?: string[];
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onClone?: (task: Task) => void;
  onStatusChange?: (id: string, status: TaskStatus) => void;
  compact?: boolean;
}

export const STATUS_META: Record<
  TaskStatus,
  { label: string; icon: string; color: string; bg: string }
> = {
  todo: { label: 'To Do', icon: '○', color: 'var(--text-lo)', bg: 'transparent' },
  in_progress: {
    label: 'In Progress',
    icon: '◐',
    color: 'oklch(0.76 0.16 205)',
    bg: 'oklch(0.76 0.16 205 / 0.12)',
  },
  pending: {
    label: 'Pending',
    icon: '⏸',
    color: 'oklch(0.76 0.16 55)',
    bg: 'oklch(0.76 0.16 55 / 0.12)',
  },
  waiting: {
    label: 'Waiting',
    icon: '⏳',
    color: 'oklch(0.66 0.22 295)',
    bg: 'oklch(0.66 0.22 295 / 0.12)',
  },
  done: {
    label: 'Done',
    icon: '●',
    color: 'oklch(0.76 0.14 162)',
    bg: 'oklch(0.76 0.14 162 / 0.12)',
  },
};

const ALL_STATUSES = Object.keys(STATUS_META) as TaskStatus[];

export function TaskCard({
  task,
  tagLabel,
  isBlocked = false,
  blockedByNames = [],
  onEdit,
  onDelete,
  onClone,
  onStatusChange,
  compact = false,
}: TaskCardProps) {
  const color = HABIT_COLORS[task.color as TaskColor]?.value ?? 'var(--gold)';
  const isDone = task.status === 'done';
  const blocked = isBlocked && task.status === 'todo';

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!dropdownOpen && !actionsOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setActionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen, actionsOpen]);

  function handleStatusBtnClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (blocked) return;
    setDropdownOpen((v) => !v);
  }

  function handleSelectStatus(e: React.MouseEvent, s: TaskStatus) {
    e.stopPropagation();
    setDropdownOpen(false);
    if (s !== task.status) onStatusChange?.(task.id, s);
  }

  const meta = STATUS_META[task.status];

  return (
    <div
      className={cn(taskCardBase, blocked && taskCardBlocked)}
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
      onClick={() => !blocked && onEdit?.(task)}
    >
      <div className={taskCardInner}>
        {/* Status button + dropdown — stopPropagation so clicks here never reach the card's onEdit */}
        <div
          className="shrink-0 pt-0.5 relative"
          ref={dropdownRef}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className={cn(statusBtn, (isDone || blocked) && 'opacity-55')}
            style={{
              color: blocked ? 'var(--text-lo)' : meta.color,
              background: blocked ? 'transparent' : meta.bg,
              borderColor: blocked ? 'var(--border)' : meta.color,
              cursor: blocked ? 'not-allowed' : 'pointer',
            }}
            onClick={handleStatusBtnClick}
            title={blocked ? `Blocked by: ${blockedByNames.join(', ')}` : `Status: ${meta.label}`}
          >
            {blocked ? '🔒' : meta.icon}
          </button>

          {dropdownOpen && (
            <div className={dropdown}>
              {ALL_STATUSES.map((s) => {
                const sm = STATUS_META[s];
                const isActive = s === task.status;
                return (
                  <button
                    key={s}
                    type="button"
                    className={cn(dropdownItem, isActive && dropdownItemActive)}
                    style={{ color: isActive ? sm.color : undefined }}
                    onClick={(e) => handleSelectStatus(e, s)}
                  >
                    <span className={dropdownIcon} style={{ color: sm.color }}>
                      {sm.icon}
                    </span>
                    <span>{sm.label}</span>
                    {isActive && <span className="ml-auto text-[8px]">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={cn(taskCardBody, (isDone || blocked) && 'opacity-55')}>
          <div className={taskCardTopRow}>
            <span className={taskIcon}>{task.icon}</span>
            <span className={cn(taskName, isDone && taskNameDone)}>{task.name}</span>
          </div>

          {!compact && (
            <div className={taskCardMeta}>
              <span
                className={statusBadge}
                style={{
                  color: blocked ? 'var(--text-lo)' : meta.color,
                  borderColor: blocked ? 'var(--border)' : `${meta.color}55`,
                  background: blocked ? 'transparent' : meta.bg,
                }}
              >
                {blocked ? 'Blocked' : meta.label}
              </span>
              {tagLabel && <span className={tagBadge}>{tagLabel}</span>}
              {task.deferReason && !task.endDate && (
                <span className={rescheduledBadge} title={task.deferReason}>
                  ↺ Rescheduled
                </span>
              )}
              <span className={dateBadge}>
                {task.startDate === task.endDate
                  ? task.startDate
                  : `${task.startDate} → ${task.endDate}`}
              </span>
            </div>
          )}

          {blocked && blockedByNames.length > 0 && (
            <div className={blockedMsg}>🔒 Blocked by: {blockedByNames.join(', ')}</div>
          )}

          {!compact && task.note && <div className={taskNote}>{task.note}</div>}
        </div>

        {!compact && (
          <div
            ref={actionsRef}
            className={cn(taskCardActions, 'relative')}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ··· trigger */}
            <button
              type="button"
              className={cn(actionBtn, actionsOpen && actionBtnOpen)}
              onClick={() => setActionsOpen((v) => !v)}
              title="Actions"
            >
              ···
            </button>

            {/* Dropdown */}
            {actionsOpen && (
              <div className={actionsDropdown}>
                <button
                  type="button"
                  className={actionsItem}
                  onClick={() => {
                    setActionsOpen(false);
                    onEdit?.(task);
                  }}
                >
                  <span className={actionsItemIcon}>✎</span> Edit
                </button>

                {onClone && (
                  <button
                    type="button"
                    className={actionsItem}
                    onClick={() => {
                      setActionsOpen(false);
                      onClone(task);
                    }}
                  >
                    <span className={cn(actionsItemIcon, 'text-[var(--cyan)]')}>⎘</span> Clone
                  </button>
                )}

                <div className={actionsDivider} />

                <button
                  type="button"
                  className={cn(actionsItem, 'hover:text-[var(--rose)]')}
                  onClick={() => {
                    setActionsOpen(false);
                    onDelete?.(task.id);
                  }}
                >
                  <span className={cn(actionsItemIcon, 'text-[var(--rose)]')}>✕</span> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const taskCardBase =
  'group bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] cursor-pointer transition-all duration-200 hover:border-[oklch(0.74_0.17_85_/_0.4)] hover:bg-[oklch(0.74_0.17_85_/_0.03)] overflow-visible';
const taskCardBlocked =
  'opacity-70 cursor-default hover:border-[var(--border)] hover:bg-[var(--panel2)]';

const taskCardInner = 'flex items-start gap-2 px-2.5 py-2';
const taskCardBody = 'flex-1 min-w-0';
const taskCardTopRow = 'flex items-center gap-1.5 mb-1';
const taskCardMeta = 'flex items-center gap-1.5 flex-wrap';
const taskCardActions =
  'flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity';

const taskIcon = 'text-[14px] leading-none shrink-0';
const taskName = 'text-[12px] font-semibold text-[var(--text-hi)] truncate flex-1';
const taskNameDone = 'line-through text-[var(--text-lo)]';

const statusBtn =
  'w-[18px] h-[18px] rounded-full border text-[10px] flex items-center justify-center font-bold transition-all shrink-0 leading-none';

const dropdown =
  'absolute left-0 top-[22px] z-50 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r-sm)] shadow-[0_4px_20px_oklch(0_0_0_/_0.4)] py-1 min-w-[130px] flex flex-col';
const dropdownItem =
  'flex items-center gap-2 px-2.5 py-[5px] text-[10px] font-medium text-[var(--text-mid)] cursor-pointer hover:bg-[var(--panel2)] hover:text-[var(--text-hi)] transition-colors whitespace-nowrap';
const dropdownItemActive = 'bg-[var(--panel2)]';
const dropdownIcon = 'text-[11px] w-4 text-center shrink-0';

const statusBadge =
  'text-[9px] font-bold tracking-[0.08em] uppercase px-1.5 py-0.5 rounded border font-[var(--font-title)]';
const tagBadge =
  'text-[9px] text-[var(--text-lo)] border border-[var(--border)] px-1.5 py-0.5 rounded bg-[var(--panel)]';
const rescheduledBadge =
  'text-[9px] font-bold tracking-[0.06em] border px-1.5 py-0.5 rounded font-[var(--font-title)] text-[var(--gold)] border-[oklch(0.74_0.17_85_/_0.4)] bg-[oklch(0.74_0.17_85_/_0.08)]';
const dateBadge = 'text-[9px] text-[var(--text-lo)] ml-auto shrink-0';

const blockedMsg = 'text-[9px] text-[var(--text-lo)] mt-0.5 leading-[1.4] italic';
const taskNote = 'text-[10px] text-[var(--text-lo)] mt-0.5 leading-[1.4] truncate';

const actionBtn =
  'w-5 h-5 flex items-center justify-center rounded text-[9px] tracking-[-1px] text-[var(--text-lo)] hover:text-[var(--text-hi)] hover:bg-[var(--panel)] transition-all border border-transparent hover:border-[var(--border)]';
const actionBtnOpen = 'text-[var(--text-hi)] bg-[var(--panel)] border-[var(--border)]';

const actionsDropdown =
  'absolute right-0 top-[22px] z-50 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r-sm)] shadow-[0_4px_20px_oklch(0_0_0_/_0.4)] py-1 min-w-[110px] flex flex-col';
const actionsItem =
  'flex items-center gap-2 px-2.5 py-[5px] text-[10px] font-medium text-[var(--text-mid)] cursor-pointer hover:bg-[var(--panel2)] hover:text-[var(--text-hi)] transition-colors whitespace-nowrap';
const actionsItemIcon = 'text-[11px] w-4 text-center shrink-0 text-[var(--text-lo)]';
const actionsDivider = 'my-1 border-t border-[var(--border)]';
