'use client';

import { useMemo, useState } from 'react';

import { cn } from '@/libs/utils';

import {
  DIFF_LIST,
  TASK_CATEGORIES,
  catOf,
  COLOR_VAR,
  type TaskCat,
  type TaskDiff,
  type UITask,
} from '../../data/mock';
import { TaskAllRow } from './TaskAllRow';

// ─── Group-by options ─────────────────────────────────────────────────────────

type GroupBy = 'category' | 'difficulty' | 'slot' | 'none';
type SortBy  = 'deadline' | 'xp' | 'priority' | 'title';

const GROUP_BY_OPTIONS: { id: GroupBy; label: string }[] = [
  { id: 'category',   label: 'Category'   },
  { id: 'difficulty', label: 'Difficulty' },
  { id: 'slot',       label: 'Time slot'  },
  { id: 'none',       label: 'Flat list'  },
];

const SORT_BY_OPTIONS: { id: SortBy; label: string }[] = [
  { id: 'deadline', label: 'Deadline' },
  { id: 'xp',       label: 'XP'       },
  { id: 'priority', label: 'Priority' },
  { id: 'title',    label: 'Title'    },
];

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0, high: 1, medium: 2, low: 3,
};

const SLOT_LABELS: Record<string, string> = {
  morning: '◐ Dawn (06–10)',
  deep:    '❖ Deep Work (10–13)',
  afternoon: '☉ Afternoon (13–17)',
  evening: '☾ Twilight (17–22)',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskAllViewProps {
  tasks: UITask[];
  onToggleDone: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskAllView({ tasks, onToggleDone }: TaskAllViewProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('category');
  const [sortBy,  setSortBy]  = useState<SortBy>('deadline');
  const [showDone, setShowDone] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sorted + filtered task list
  const sorted = useMemo(() => {
    let list = showDone ? tasks : tasks.filter((t) => !t.done);
    list = [...list].sort((a, b) => {
      if (sortBy === 'xp')       return b.xp - a.xp;
      if (sortBy === 'priority') return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
      if (sortBy === 'title')    return a.title.localeCompare(b.title);
      // deadline: done tasks go to the bottom
      if (a.done !== b.done) return a.done ? 1 : -1;
      return a.day - b.day;
    });
    return list;
  }, [tasks, sortBy, showDone]);

  // Build groups
  const groups = useMemo((): Array<{ key: string; label: string; color?: string; tasks: UITask[] }> => {
    if (groupBy === 'none') return [{ key: 'all', label: 'All Quests', tasks: sorted }];

    if (groupBy === 'category') {
      return TASK_CATEGORIES
        .map((cat) => ({
          key: cat.id,
          label: `${cat.icon} ${cat.label}`,
          color: COLOR_VAR[cat.color],
          tasks: sorted.filter((t) => t.cat === cat.id),
        }))
        .filter((g) => g.tasks.length > 0);
    }

    if (groupBy === 'difficulty') {
      return DIFF_LIST
        .map((diff) => ({
          key: diff,
          label: `Rank ${diff}`,
          color: DIFF_GROUP_COLORS[diff],
          tasks: sorted.filter((t) => t.diff === diff),
        }))
        .filter((g) => g.tasks.length > 0);
    }

    if (groupBy === 'slot') {
      return (['morning', 'deep', 'afternoon', 'evening'] as const)
        .map((slot) => ({
          key: slot,
          label: SLOT_LABELS[slot] ?? slot,
          tasks: sorted.filter((t) => t.slot === slot),
        }))
        .filter((g) => g.tasks.length > 0);
    }

    return [];
  }, [sorted, groupBy]);

  // Summary stats
  const total = tasks.length;
  const done  = tasks.filter((t) => t.done).length;
  const xpTotal  = tasks.reduce((s, t) => s + t.xp, 0);
  const xpEarned = tasks.filter((t) => t.done).reduce((s, t) => s + t.xp, 0);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className={toolbar}>
        {/* Summary */}
        <div className="flex items-center gap-3 shrink-0">
          <SummaryPill value={`${done}/${total}`} label="cleared" color="gold" />
          <SummaryPill value={`+${xpEarned}`} label={`/ ${xpTotal} XP`} color="violet" />
          <SummaryPill value={tasks.filter((t) => t.saga).length} label="sagas" color="mint" />
        </div>

        <div className="flex-1" />

        {/* Show done toggle */}
        <button
          type="button"
          className={cn(toggleBtn, showDone && toggleBtnActive)}
          onClick={() => setShowDone((v) => !v)}
        >
          {showDone ? '● Show done' : '○ Hide done'}
        </button>

        <Divider />

        {/* Group by */}
        <div className={controlGroup}>
          <span className={controlLabel}>Group</span>
          {GROUP_BY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={cn(segBtn, groupBy === opt.id && segBtnActive)}
              onClick={() => setGroupBy(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Divider />

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

      {/* ── Table header ─────────────────────────────────────────────────── */}
      <TableHeader />

      {/* ── Groups ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <EmptyState />
        ) : (
          groups.map((group) => (
            <TaskGroup
              key={group.key}
              label={group.label}
              color={group.color}
              tasks={group.tasks}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              onToggleDone={onToggleDone}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Group section ────────────────────────────────────────────────────────────

interface TaskGroupProps {
  label: string;
  color?: string;
  tasks: UITask[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onToggleDone: (id: string) => void;
}

function TaskGroup({ label, color, tasks, expandedId, setExpandedId, onToggleDone }: TaskGroupProps) {
  const [collapsed, setCollapsed] = useState(false);
  const done = tasks.filter((t) => t.done).length;
  const xp   = tasks.reduce((s, t) => s + t.xp, 0);

  return (
    <div>
      {/* Group header */}
      <button
        type="button"
        className={groupHeader}
        onClick={() => setCollapsed((v) => !v)}
        style={color ? { borderLeftColor: color, borderLeftWidth: 3 } : undefined}
      >
        <span className="text-[8px] text-[var(--text-lo)] transition-transform duration-150" style={{ transform: collapsed ? 'rotate(-90deg)' : 'none' }}>
          ▼
        </span>
        <span className="text-[10px] font-bold text-[var(--text-hi)] font-[var(--font-title)] tracking-[0.06em]">
          {label}
        </span>
        <span className="text-[8px] text-[var(--text-lo)] ml-1">
          {done}/{tasks.length} cleared
        </span>
        <div className="flex-1 h-[2px] bg-[var(--panel2)] rounded-full overflow-hidden mx-2">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${tasks.length ? (done / tasks.length) * 100 : 0}%`,
              background: color ?? 'var(--gold)',
            }}
          />
        </div>
        <span className="text-[8px] font-bold text-[var(--violet)] shrink-0">{xp} XP total</span>
      </button>

      {/* Rows */}
      {!collapsed && tasks.map((t) => (
        <TaskAllRow
          key={t.id}
          task={t}
          isExpanded={expandedId === t.id}
          onExpand={() => setExpandedId(expandedId === t.id ? null : t.id)}
          onToggleDone={onToggleDone}
        />
      ))}
    </div>
  );
}

// ─── Table header row ─────────────────────────────────────────────────────────

function TableHeader() {
  return (
    <div className={tableHeader}>
      <span className="w-[16px] shrink-0" />  {/* check */}
      <span className="w-[16px] shrink-0" />  {/* diff */}
      <span className="flex-1 min-w-0">Quest</span>
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
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center opacity-50">
      <div className="text-[32px]">◈</div>
      <div className="text-[12px] font-bold text-[var(--text-mid)]">No quests match the current filters</div>
      <div className="text-[10px] text-[var(--text-lo)]">Try clearing your filters or showing done quests</div>
    </div>
  );
}

// ─── Summary pill ─────────────────────────────────────────────────────────────

function SummaryPill({ value, label, color }: { value: string | number; label: string; color: string }) {
  const cssColor = `var(--${color})`;
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-[15px] font-black font-[var(--font-title)]" style={{ color: cssColor }}>
        {value}
      </span>
      <span className="text-[9px] text-[var(--text-lo)]">{label}</span>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-[var(--border)] shrink-0" />;
}

// ─── Style constants ──────────────────────────────────────────────────────────

const toolbar =
  'flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] shrink-0 bg-[var(--panel)] flex-wrap';

const toggleBtn =
  'text-[8px] font-bold px-2 py-1 rounded border border-[var(--border)] text-[var(--text-lo)] font-[var(--font-title)] tracking-[0.06em] transition-all hover:text-[var(--text-mid)]';
const toggleBtnActive =
  'text-[var(--gold)] border-[oklch(0.74_0.17_85_/_0.4)] bg-[oklch(0.74_0.17_85_/_0.06)]';

const controlGroup = 'flex items-center gap-1';
const controlLabel =
  'text-[7px] font-bold tracking-[0.12em] text-[var(--text-lo)] font-[var(--font-title)] uppercase mr-0.5';

const segBtn =
  'text-[8px] font-bold px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-lo)] font-[var(--font-title)] tracking-[0.06em] transition-all hover:text-[var(--text-mid)]';
const segBtnActive =
  'text-[var(--gold)] border-[oklch(0.74_0.17_85_/_0.4)] bg-[oklch(0.74_0.17_85_/_0.08)]';

const tableHeader =
  'flex items-center gap-3 px-4 py-1.5 bg-[var(--panel2)] border-b border-[var(--border)] text-[8px] font-bold text-[var(--text-lo)] tracking-[0.1em] uppercase font-[var(--font-title)] sticky top-0 z-10 shrink-0';

const groupHeader =
  'w-full flex items-center gap-2 px-4 py-2 bg-[var(--panel2)] border-b border-[var(--border)] border-l-[var(--border)] text-left transition-colors hover:bg-[oklch(0.74_0.17_85_/_0.03)] sticky top-[30px] z-[9]';

const DIFF_GROUP_COLORS: Record<string, string> = {
  S: 'oklch(0.74 0.17 85)',
  A: 'oklch(0.72 0.18 5)',
  B: 'oklch(0.66 0.22 295)',
  C: 'oklch(0.76 0.16 205)',
  D: 'oklch(0.76 0.14 162)',
};
