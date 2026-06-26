import { useMemo } from 'react';

import type { ScheduleBlock } from '@/types';

import { cn } from '@/libs/utils';

import { type UITask } from '../../data/mock';
import { buildTaskSessions, taskOccursOnDayOffset } from '../../utils/date.utils';
import { sidePanel, panelHead, panelEyebrow, panelTitle, btnIconMini } from '../shared/styles';

interface MonthPeekProps {
  tasks: UITask[];
  /** Task schedule blocks for the loaded range — drives session-aware placement. */
  taskBlocks?: ScheduleBlock[];
}

export function MonthPeek({ tasks, taskBlocks = [] }: MonthPeekProps) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDate = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const monthName = now.toLocaleString('en-US', { month: 'long' });

  // Session lookup so multi-day tasks count only on their scheduled days, and
  // backlog tasks (no startDate) don't inflate today's count.
  const sessions = useMemo(() => buildTaskSessions(taskBlocks), [taskBlocks]);

  // Build grid: null = empty cell, object = day cell
  const grid: Array<{ date: number; count: number; isToday: boolean; isPast: boolean } | null> = [];
  for (let i = 0; i < firstWeekday; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const offset = d - todayDate;
    const count = tasks.filter((t) => taskOccursOnDayOffset(t, offset, sessions)).length;
    grid.push({ date: d, count, isToday: d === todayDate, isPast: d < todayDate });
  }
  while (grid.length % 7 !== 0) grid.push(null);

  return (
    <div className={sidePanel}>
      <div className={panelHead}>
        <span className={panelEyebrow}>CARTOGRAPHER</span>
        <h3 className={panelTitle}>
          {monthName} {year}
        </h3>
        <div className="flex-1" />
        <div className="flex gap-1">
          <button type="button" className={btnIconMini}>
            ◂
          </button>
          <button type="button" className={btnIconMini}>
            ▸
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-[2px] mt-2">
        {/* Day-of-week headers */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div
            key={i}
            className="text-center text-[8px] text-[var(--text-lo)] py-[2px] font-[var(--font-title)]"
          >
            {d}
          </div>
        ))}

        {/* Day cells */}
        {grid.map((cell, i) => (
          <MonthPeekCell key={i} cell={cell} />
        ))}
      </div>

      {/* Heat legend */}
      <div className="flex items-center gap-1.5 mt-2 justify-center">
        {[
          { label: '1', cls: 'bg-[var(--mint)]' },
          { label: '2', cls: 'bg-[var(--cyan)]' },
          { label: '3', cls: 'bg-[var(--violet)]' },
          { label: '4+', cls: 'bg-[var(--gold)]' },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-0.5">
            <span className={cn('w-1.5 h-1.5 rounded-full', cls)} />
            <span className="text-[7px] text-[var(--text-lo)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Individual cell ──────────────────────────────────────────────────────────

type CellData = { date: number; count: number; isToday: boolean; isPast: boolean } | null;

function MonthPeekCell({ cell }: { cell: CellData }) {
  if (!cell) {
    return <div className="aspect-square" />;
  }

  const pipColor =
    cell.count >= 4
      ? 'bg-[var(--gold)]'
      : cell.count === 3
        ? 'bg-[var(--violet)]'
        : cell.count === 2
          ? 'bg-[var(--cyan)]'
          : cell.count === 1
            ? 'bg-[var(--mint)]'
            : '';

  return (
    <div
      className={cn(
        'aspect-square flex flex-col items-center justify-center rounded-sm text-[9px] relative cursor-default transition-colors',
        cell.isToday &&
          'bg-[oklch(0.74_0.17_85_/_0.15)] border border-[oklch(0.74_0.17_85_/_0.35)] text-[var(--gold)] font-bold',
        !cell.isToday && cell.isPast && 'text-[var(--text-lo)] opacity-40',
        !cell.isToday && !cell.isPast && 'text-[var(--text-mid)] hover:bg-[var(--panel2)]',
      )}
    >
      <span>{cell.date}</span>
      {cell.count > 0 && <span className={cn('w-1 h-1 rounded-full mt-0.5', pipColor)} />}
    </div>
  );
}
