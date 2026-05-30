'use client';

import { useMemo, useState } from 'react';

import { cn } from '@/libs/utils';
import { useDeleteTask } from '@/features/dashboard/hooks/useDeleteTask';

import { type UITask } from '../../data/mock';
import { TaskAllRow } from './TaskAllRow';

// ─── Constants ────────────────────────────────────────────────────────────────

type SortByLocal = 'deadline' | 'xp' | 'priority' | 'title';
type StatusFilter = 'all' | 'todo' | 'in_progress' | 'pending' | 'waiting' | 'done';

const SORT_BY_OPTIONS: { id: SortByLocal; label: string }[] = [
  { id: 'deadline', label: 'Deadline' },
  { id: 'xp', label: 'XP' },
  { id: 'priority', label: 'Priority' },
  { id: 'title', label: 'Title' },
];

const STATUS_FILTER_OPTIONS: { id: StatusFilter; label: string; color?: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress', color: 'var(--cyan)' },
  { id: 'pending', label: 'Pending', color: 'var(--gold)' },
  { id: 'waiting', label: 'Waiting', color: 'var(--amber)' },
  { id: 'done', label: 'Done', color: 'var(--mint)' },
];

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskAllViewProps {
  tasks: UITask[];
  onToggleDone: (id: string) => void;
  onEdit?: (task: UITask) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskAllView({ tasks: allItems, onEdit }: TaskAllViewProps) {
  const tasks = allItems.filter((t) => t.source === 'task');

  const [sortBy, setSortBy] = useState<SortByLocal>('deadline');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingTask, setDeletingTask] = useState<UITask | null>(null);

  const { mutate: deleteTask } = useDeleteTask();

  const sorted = useMemo(() => {
    let list = [...tasks];

    if (statusFilter !== 'all') {
      list = list.filter((t) => t.status === statusFilter);
    }

    list.sort((a, b) => {
      if (sortBy === 'xp') return b.xp - a.xp;
      if (sortBy === 'priority')
        return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return a.day - b.day;
    });

    return list;
  }, [tasks, sortBy, statusFilter]);

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const xpTotal = tasks.reduce((s, t) => s + t.xp, 0);
  const xpEarned = tasks.filter((t) => t.status === 'done').reduce((s, t) => s + t.xp, 0);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className={toolbar}>
        {/* Summary */}
        <div className="flex items-center gap-3 shrink-0">
          <SummaryPill value={`${done}/${total}`} label="done" color="mint" />
          <SummaryPill value={`+${xpEarned}`} label={`/ ${xpTotal} XP`} color="violet" />
          <SummaryPill value={tasks.filter((t) => t.saga).length} label="sagas" color="gold" />
        </div>

        <div className="flex-1" />

        {/* Sort by */}
        <div className={controlGroup}>
          <span className={controlLabel}>Sort</span>
          {SORT_BY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={cn(segBtn, sortBy === opt.id && segBtnActive)}
              onClick={() => setSortBy(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Status filter bar ────────────────────────────────────────────── */}
      <div className={statusBar}>
        {STATUS_FILTER_OPTIONS.map((opt) => {
          const active = statusFilter === opt.id;
          const count =
            opt.id === 'all' ? tasks.length : tasks.filter((t) => t.status === opt.id).length;
          return (
            <button
              key={opt.id}
              type="button"
              className={cn(statusChip, active && statusChipActive)}
              style={
                active && opt.color
                  ? {
                      color: opt.color,
                      borderColor: `${opt.color}55`,
                      background: `${opt.color}12`,
                    }
                  : undefined
              }
              onClick={() => setStatusFilter(opt.id)}
            >
              {opt.label}
              <span className={cn(statusCount, active && 'opacity-100')}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Table header ─────────────────────────────────────────────────── */}
      <div className={tableHeader}>
        <span className="w-[16px] shrink-0" />
        <span className="flex-1 min-w-0">Quest</span>
        <span className="w-20 shrink-0">Status</span>
        <span className="w-20 shrink-0">Category</span>
        <span className="w-10 text-center shrink-0">Pri</span>
        <span className="w-24 shrink-0">Deadline</span>
        <span className="w-[60px] shrink-0">Progress</span>
        <span className="w-12 text-right shrink-0">XP</span>
        <span className="w-10 text-right shrink-0">Est</span>
        <span className="w-10 text-right shrink-0">Streak</span>
        <span className="w-8 text-right shrink-0">Sub</span>
        <span className="w-5 shrink-0" />
      </div>

      {/* ── Flat list ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center opacity-50">
            <div className="text-[32px]">◈</div>
            <div className="text-[12px] font-bold text-[var(--text-mid)]">No tasks found</div>
            <div className="text-[10px] text-[var(--text-lo)]">Try a different status filter</div>
          </div>
        ) : (
          sorted.map((t) => (
            <TaskAllRow
              key={t.id}
              task={t}
              isExpanded={expandedId === t.id}
              onExpand={() => setExpandedId(expandedId === t.id ? null : t.id)}
              onEdit={onEdit}
              onDelete={t.source === 'task' ? setDeletingTask : undefined}
            />
          ))
        )}
      </div>

      {/* ── Delete confirm modal ─────────────────────────────────────────── */}
      {deletingTask && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setDeletingTask(null)}
        >
          <div className="modal-box" style={{ width: 380 }}>
            <div className="modal-title">
              <span style={{ color: 'var(--rose)' }}>⚠</span> Delete Task
            </div>
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  background: 'var(--panel2)',
                  borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--border)',
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 18 }}>{deletingTask.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-hi)' }}>
                  {deletingTask.title}
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-mid)', margin: 0, lineHeight: 1.6 }}>
                This task will be permanently deleted. This action cannot be undone.
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn cancel"
                onClick={() => setDeletingTask(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn"
                onClick={() => {
                  if (deletingTask.sourceId) deleteTask(deletingTask.sourceId);
                  setDeletingTask(null);
                }}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, oklch(0.45 0.18 5), var(--rose))',
                  borderColor: 'var(--rose)',
                  color: '#fff',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryPill({
  value,
  label,
  color,
}: {
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-baseline gap-1">
      <span
        className="text-[15px] font-black font-[var(--font-title)]"
        style={{ color: `var(--${color})` }}
      >
        {value}
      </span>
      <span className="text-[9px] text-[var(--text-lo)]">{label}</span>
    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────

const toolbar =
  'flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] shrink-0 bg-[var(--panel)] flex-wrap';

const statusBar =
  'flex items-center gap-1.5 px-4 py-2 border-b border-[var(--border)] shrink-0 bg-[var(--panel)] flex-wrap';

const statusChip =
  'flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--border)] text-[9px] font-bold font-[var(--font-title)] tracking-[0.06em] text-[var(--text-lo)] transition-all cursor-pointer hover:border-[var(--border-hi)] hover:text-[var(--text-mid)]';
const statusChipActive = 'border-current';

const statusCount = 'text-[8px] font-bold opacity-50 bg-[var(--panel2)] px-1 py-px rounded-full';

const controlGroup = 'flex items-center gap-1';
const controlLabel =
  'text-[7px] font-bold tracking-[0.12em] text-[var(--text-lo)] font-[var(--font-title)] uppercase mr-0.5';

const segBtn =
  'text-[8px] font-bold px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-lo)] font-[var(--font-title)] tracking-[0.06em] transition-all hover:text-[var(--text-mid)]';
const segBtnActive =
  'text-[var(--gold)] border-[oklch(0.74_0.17_85_/_0.4)] bg-[oklch(0.74_0.17_85_/_0.08)]';

const tableHeader =
  'flex items-center gap-3 px-4 py-1.5 bg-[var(--panel2)] border-b border-[var(--border)] text-[8px] font-bold text-[var(--text-lo)] tracking-[0.1em] uppercase font-[var(--font-title)] sticky top-0 z-10 shrink-0';
