'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/libs/utils';
import { Modal, ModalBody, ModalFoot, ModalHead } from '@/components/ui/Modal';
import { useCategories } from '@/features/dashboard/hooks/useCategories';
import { useDeleteTask } from '@/features/dashboard/hooks/useDeleteTask';

import { type UITask } from '../../data/mock';
import { TaskAllTable, COL_DEFS, DEFAULT_VISIBLE_COLS, type ColDef } from './TaskAllTable';
import type { ColKey } from './TaskAllRow';

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
  onEdit?: (task: UITask) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskAllView({ tasks, onEdit }: TaskAllViewProps) {
  const [sortBy, setSortBy] = useState<SortByLocal>('deadline');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deletingTask, setDeletingTask] = useState<UITask | null>(null);
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(DEFAULT_VISIBLE_COLS);
  const [colPickerOpen, setColPickerOpen] = useState(false);

  const pickerRef = useRef<HTMLDivElement>(null);

  const { mutate: deleteTask } = useDeleteTask();
  const { data: categories = [] } = useCategories();

  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  // Close picker when clicking outside
  useEffect(() => {
    if (!colPickerOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setColPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [colPickerOpen]);

  function toggleCol(key: ColKey) {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const taskOnly = useMemo(() => tasks.filter((t) => t.source === 'task'), [tasks]);

  const sorted = useMemo(() => {
    let list = [...taskOnly];

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
  }, [taskOnly, sortBy, statusFilter]);

  const total = taskOnly.length;
  const done = taskOnly.filter((t) => t.status === 'done').length;
  const xpTotal = taskOnly.reduce((s, t) => s + t.xp, 0);
  const xpEarned = taskOnly.filter((t) => t.status === 'done').reduce((s, t) => s + t.xp, 0);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className={toolbar}>
        {/* Summary pills */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <SummaryPill value={`${done}/${total}`} label="done" color="mint" />
          <SummaryPill value={`+${xpEarned}`} label={`/ ${xpTotal} XP`} color="violet" />
          <SummaryPill value={taskOnly.filter((t) => t.saga).length} label="sagas" color="gold" />
        </div>

        <div className="flex-1" />

        {/* Sort — desktop only (mobile sort lives inside col picker) */}
        <div className={cn(controlGroup, 'hidden sm:flex')}>
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

        {/* Column picker — always visible */}
        <div className="relative shrink-0" ref={pickerRef}>
          <button
            type="button"
            className={cn(segBtn, colPickerOpen && segBtnActive)}
            onClick={() => setColPickerOpen((v) => !v)}
            title="Show / hide columns"
          >
            ⊞ Cols
          </button>

          {colPickerOpen && (
            <div className={colPicker}>
              {/* Mobile-only sort section */}
              <div className="sm:hidden mb-2 pb-2 border-b border-[var(--border)]">
                <span className={colPickerTitle}>Sort by</span>
                {SORT_BY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={cn(
                      colPickerRow,
                      sortBy === opt.id ? 'text-[var(--gold)] font-bold' : 'text-[var(--text-mid)]',
                    )}
                    onClick={() => setSortBy(opt.id)}
                  >
                    <span className="w-3 shrink-0 text-[var(--gold)]">
                      {sortBy === opt.id ? '✓' : ''}
                    </span>
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Column visibility */}
              <span className={colPickerTitle}>Columns</span>
              {COL_DEFS.map((c: ColDef) => (
                <label key={c.key} className={colPickerRow}>
                  <input
                    type="checkbox"
                    checked={visibleCols.has(c.key)}
                    onChange={() => toggleCol(c.key)}
                    className="accent-[var(--gold)] shrink-0 cursor-pointer"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Status filter bar — horizontal scroll on mobile ──────────────── */}
      <div className={statusBar}>
        {STATUS_FILTER_OPTIONS.map((opt) => {
          const active = statusFilter === opt.id;
          const count =
            opt.id === 'all' ? taskOnly.length : taskOnly.filter((t) => t.status === opt.id).length;
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

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <TaskAllTable
        sorted={sorted}
        visibleCols={visibleCols}
        catMap={catMap}
        onEdit={onEdit}
        onDelete={setDeletingTask}
      />

      {/* ── Delete confirm modal ─────────────────────────────────────────── */}
      <Modal open={!!deletingTask} onClose={() => setDeletingTask(null)} maxWidth="380px">
        <ModalHead
          title={
            <>
              <span style={{ color: 'var(--rose)' }}>⚠</span> Delete Task
            </>
          }
        />
        <ModalBody>
          {deletingTask && (
            <>
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
            </>
          )}
        </ModalBody>
        <ModalFoot>
          <button type="button" className="modal-btn cancel" onClick={() => setDeletingTask(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="modal-btn"
            onClick={() => {
              if (deletingTask?.sourceId) deleteTask(deletingTask.sourceId);
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
        </ModalFoot>
      </Modal>
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
  'flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-[var(--border)] shrink-0 bg-[var(--panel)]';

// overflow-x-auto so chips scroll horizontally on mobile instead of wrapping
const statusBar =
  'flex items-center gap-1.5 px-3 sm:px-4 py-2 border-b border-[var(--border)] shrink-0 bg-[var(--panel)] overflow-x-auto overscroll-x-contain';

const statusChip =
  'flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--border)] text-[9px] font-bold font-[var(--font-title)] tracking-[0.06em] text-[var(--text-lo)] transition-all cursor-pointer hover:border-[var(--border-hi)] hover:text-[var(--text-mid)]';
const statusChipActive = 'border-current';

const statusCount = 'text-[8px] font-bold opacity-50 bg-[var(--panel2)] px-1 py-px rounded-full';

const controlGroup = 'flex items-center gap-1';
const controlLabel =
  'text-[7px] font-bold tracking-[0.12em] text-[var(--text-lo)] font-[var(--font-title)] uppercase mr-0.5';

const segBtn =
  'text-[8px] font-bold px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-lo)] font-[var(--font-title)] tracking-[0.06em] transition-all hover:text-[var(--text-mid)] cursor-pointer';
const segBtnActive =
  'text-[var(--gold)] border-[oklch(0.74_0.17_85_/_0.4)] bg-[oklch(0.74_0.17_85_/_0.08)]';

const colPicker =
  'absolute right-0 top-full mt-1 z-50 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r-sm)] shadow-xl min-w-[140px] p-2 flex flex-col gap-0.5';
const colPickerTitle =
  'text-[7px] font-bold tracking-[0.12em] uppercase text-[var(--text-lo)] mb-1 font-[var(--font-title)] px-1 block';
const colPickerRow =
  'flex items-center gap-2 px-1 py-[3px] cursor-pointer text-[10px] text-[var(--text-mid)] hover:text-[var(--text-hi)] rounded transition-colors select-none';
