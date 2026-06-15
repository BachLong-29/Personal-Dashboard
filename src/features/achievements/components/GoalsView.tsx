'use client';

import { useMemo, useRef, useState } from 'react';

import { cn } from '@/libs/utils';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { CATEGORIES } from '../constants';
import type { Goal, AmbitionsStats, GoalCategory, GoalSortBy, GoalStatus } from '../types';
import { StatCard } from './StatCard';
import { GoalCard } from './GoalCard';

interface GoalsViewProps {
  goals: Goal[];
  stats: AmbitionsStats;
  onAction: (action: 'edit' | 'complete' | 'archive' | 'restore' | 'delete', goal: Goal) => void;
  onToggleMilestone: (goalId: string, msId: string) => void;
  onNew: () => void;
}

const STATUS_FILTERS: { k: GoalStatus | 'all'; l: string }[] = [
  { k: 'all',          l: 'All' },
  { k: 'in-progress',  l: 'Active' },
  { k: 'not-started',  l: 'Queued' },
  { k: 'completed',    l: 'Done' },
  { k: 'archived',     l: 'Archived' },
];

const SORTS: { id: GoalSortBy; label: string }[] = [
  { id: 'priority', label: 'Priority' },
  { id: 'progress', label: 'Progress' },
  { id: 'due',      label: 'Due Date' },
  { id: 'status',   label: 'Status' },
];

const PRI_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
const STS_ORDER: Record<string, number> = { 'in-progress': 0, 'not-started': 1, completed: 2, archived: 3 };

export function GoalsView({ goals, stats, onAction, onToggleMilestone, onNew }: GoalsViewProps) {
  const [filterCat,    setFilterCat]    = useState<GoalCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<GoalStatus | 'all'>('all');
  const [sortBy,       setSortBy]       = useState<GoalSortBy>('priority');
  const [sortOpen,     setSortOpen]     = useState(false);
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(sortRef, () => setSortOpen(false));

  const onToggleExpand = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  const visible = useMemo(() => {
    let list = goals.filter((g) => {
      if (filterCat !== 'all' && g.cat !== filterCat) return false;
      if (filterStatus !== 'all' && g.status !== filterStatus) return false;
      if (filterStatus === 'all' && g.status === 'archived') return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === 'priority') return (PRI_ORDER[a.priority] ?? 9) - (PRI_ORDER[b.priority] ?? 9) || b.progress - a.progress;
      if (sortBy === 'progress') return b.progress - a.progress;
      if (sortBy === 'due')      return (a.daysLeft || 999) - (b.daysLeft || 999);
      if (sortBy === 'status')   return (STS_ORDER[a.status] ?? 9) - (STS_ORDER[b.status] ?? 9);
      return 0;
    });
    return list;
  }, [goals, filterCat, filterStatus, sortBy]);

  const currentSortLabel = SORTS.find((s) => s.id === sortBy)?.label ?? 'Sort';

  return (
    <div className="flex flex-col gap-4">
      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-3">
        <StatCard tone="gold"   ico="◎" label="Total Goals"  value={stats.total}           sub={`${stats.active} in motion`} />
        <StatCard tone="cyan"   ico="❖" label="Active"       value={stats.active}           sub="being pursued now" />
        <StatCard tone="mint"   ico="✓" label="Completed"    value={stats.completed}        sub={`${stats.completedThisYear} this year`} />
        <StatCard tone="violet" ico="✧" label="Trophies"     value={stats.trophies}         sub={`${stats.lockedTrophies} within reach`} />
        <StatCard tone="gold"   ico="◐" label="Completion"   value={stats.completionRate}   suffix="%" sub="+14 vs last month" trend={1} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        {/* Category filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] text-[var(--text-lo)] tracking-[0.1em] uppercase font-[var(--font-title)] shrink-0">
            Realm
          </span>
          <button
            type="button"
            onClick={() => setFilterCat('all')}
            className={cn(chipBase, filterCat === 'all' && chipActive)}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilterCat(filterCat === c.id ? 'all' : c.id)}
              className={cn(chipBase, filterCat === c.id ? chipActive : '', c.textClass, filterCat !== c.id && 'opacity-60')}
            >
              {c.ci} {c.label}
            </button>
          ))}
        </div>

        <div className="flex-1 hidden sm:block" />

        {/* Status + sort + add */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status segment */}
          <div className="w-full sm:w-auto overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <div className="flex bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] p-0.5 gap-0.5 min-w-max">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.k}
                type="button"
                onClick={() => setFilterStatus(s.k)}
                className={cn(
                  'px-2.5 py-1 text-[10px] font-bold font-[var(--font-title)] tracking-[0.05em] rounded-[3px] transition-colors',
                  filterStatus === s.k
                    ? 'bg-[oklch(0.74_0.17_85_/_0.15)] text-[var(--gold)]'
                    : 'text-[var(--text-lo)] hover:text-[var(--text-mid)]',
                )}
              >
                {s.l}
              </button>
            ))}
            </div>
          </div>

          {/* Sort */}
          <div ref={sortRef} className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-[7px] bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r-sm)] text-[10px] font-bold text-[var(--text-mid)] font-[var(--font-title)] hover:border-[oklch(0.74_0.17_85_/_0.3)] hover:text-[var(--text-hi)] transition-colors"
            >
              ⇅ {currentSortLabel} <span className="text-[8px] opacity-60">▼</span>
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-[130px] bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r-sm)] shadow-[0_8px_24px_oklch(0_0_0_/_0.35)] overflow-hidden py-1">
                {SORTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setSortBy(s.id); setSortOpen(false); }}
                    className={cn(
                      'flex items-center justify-between w-full px-3 py-2 text-[11px] font-semibold transition-colors',
                      sortBy === s.id
                        ? 'text-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.08)]'
                        : 'text-[var(--text-hi)] hover:bg-[var(--panel2)]',
                    )}
                  >
                    {s.label}
                    {sortBy === s.id && <span className="text-[8px]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New goal */}
          <button
            type="button"
            onClick={onNew}
            className="flex items-center gap-1.5 px-3 py-[7px] bg-[oklch(0.74_0.17_85_/_0.12)] border border-[oklch(0.74_0.17_85_/_0.4)] rounded-[var(--r-sm)] text-[10px] font-bold text-[var(--gold)] font-[var(--font-title)] hover:bg-[oklch(0.74_0.17_85_/_0.22)] transition-colors"
          >
            <span>＋</span> New Goal
          </button>
        </div>
      </div>

      {/* Goal grid */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="text-[40px] opacity-30">✦</div>
          <div className="font-[var(--font-title)] text-[15px] font-bold text-[var(--text-mid)] tracking-[0.04em]">
            No ambitions in this realm
          </div>
          <p className="text-[11px] text-[var(--text-lo)] max-w-[320px] leading-relaxed">
            Every legend starts with a single declared intent. Forge your first ambition and the journey begins.
          </p>
          <button
            type="button"
            onClick={onNew}
            className="flex items-center gap-1.5 px-4 py-2 bg-[oklch(0.74_0.17_85_/_0.12)] border border-[oklch(0.74_0.17_85_/_0.4)] rounded-[var(--r-sm)] text-[11px] font-bold text-[var(--gold)] font-[var(--font-title)] hover:bg-[oklch(0.74_0.17_85_/_0.22)] transition-colors"
          >
            <span>＋</span> Declare an Ambition
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {visible.map((g, i) => (
            <GoalCard
              key={g.id}
              goal={g}
              index={i}
              expanded={expandedId === g.id}
              onToggleExpand={onToggleExpand}
              onToggleMilestone={onToggleMilestone}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const chipBase =
  'flex items-center gap-1 px-2.5 py-1 bg-[var(--panel2)] border border-[var(--border)] rounded-[20px] text-[10px] font-bold font-[var(--font-title)] tracking-[0.05em] transition-colors hover:border-[oklch(0.74_0.17_85_/_0.3)] cursor-pointer';

const chipActive =
  'bg-[oklch(0.74_0.17_85_/_0.1)] border-[oklch(0.74_0.17_85_/_0.45)] !text-[var(--gold)] opacity-100';
