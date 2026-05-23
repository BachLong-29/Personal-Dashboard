import { useMemo } from 'react';

import { type UITask } from '../../data/mock';
import { btnIcon, btnSecondary } from '../shared/styles';
import { MonthCell } from './MonthCell';
import { SagaPanel } from './SagaPanel';

interface TaskMonthViewProps {
  tasks: UITask[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onToggleDone: (id: string) => void;
}

export function TaskMonthView({
  tasks,
  setExpandedId,
}: TaskMonthViewProps) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDate = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const monthName = now.toLocaleString('en-US', { month: 'long' });

  const cells = useMemo(() => {
    const arr: Array<{ date: number; tasks: UITask[]; isToday: boolean } | null> = [];
    for (let i = 0; i < firstWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const offset = d - todayDate;
      const ts = tasks.filter((t) => t.day === offset);
      arr.push({ date: d, tasks: ts, isToday: d === todayDate });
    }
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [tasks, firstWeekday, daysInMonth, todayDate]);

  const monthTasks = tasks.filter((t) => t.day >= 0);
  const sagas = tasks.filter((t) => t.saga);

  return (
    <section className="flex flex-col gap-2.5 flex-1 min-h-0 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] px-4 py-3 shrink-0">
        {/* Title */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] tracking-[0.18em] text-[var(--text-lo)] font-[var(--font-title)] font-bold">
            CARTOGRAPHER&apos;S ATLAS
          </span>
          <div className="text-[20px] font-black text-[var(--text-hi)] font-[var(--font-title)] tracking-[0.05em]">
            {monthName}{' '}
            <span className="text-[var(--text-lo)] font-normal">{year}</span>
          </div>
        </div>

        {/* Month stats */}
        <div className="flex items-center bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] divide-x divide-[var(--border)] overflow-hidden">
          <MonthStat value={monthTasks.length} label="Quests Logged" />
          <MonthStat value={sagas.length} label="Active Sagas" />
          <MonthStat value="62%" label="Month Cleared" />
        </div>

        {/* Nav */}
        <div className="flex items-center gap-2 ml-auto">
          <button type="button" className={btnIcon}>◂</button>
          <button type="button" className={btnSecondary}>Today</button>
          <button type="button" className={btnIcon}>▸</button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-2.5 min-h-0 overflow-hidden">
        {/* Calendar grid */}
        <div className="flex-1 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] flex flex-col min-h-0 overflow-hidden">
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 border-b border-[var(--border)] shrink-0">
            {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d) => (
              <div
                key={d}
                className="text-center text-[8px] font-bold text-[var(--text-lo)] font-[var(--font-title)] tracking-[0.12em] py-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 flex-1 overflow-y-auto">
            {cells.map((cell, i) => (
              <MonthCell
                key={i}
                cell={cell}
                onSelectTask={setExpandedId}
              />
            ))}
          </div>
        </div>

        {/* Saga + activity panel */}
        <SagaPanel sagas={sagas} />
      </div>
    </section>
  );
}

// ─── Month stat chip ──────────────────────────────────────────────────────────

function MonthStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-2">
      <div className="text-[22px] font-black text-[var(--text-hi)] font-[var(--font-title)] leading-none">
        {value}
      </div>
      <div className="text-[8px] text-[var(--text-lo)] tracking-[0.1em] mt-0.5">{label}</div>
    </div>
  );
}
