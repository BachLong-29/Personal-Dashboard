'use client';

import { useMemo } from 'react';

import { cn } from '@/libs/utils';

import { HABIT_COLORS } from '../constants';
import { useTasks } from '../hooks/useTasks';
import type { Quest, Task, TaskColor } from '../types';
import type { ScheduleDisplayOptions } from '../hooks/useScheduleState';

interface MonthViewProps {
  year: number;
  month: number;
  display: ScheduleDisplayOptions;
  quests?: Quest[];
  onMonthChange: (month: number, year: number) => void;
  onNavigateDay: (date: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function getCalendarDays(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${pad(month + 1)}-${pad(d)}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function MonthView({
  year,
  month,
  display,
  quests = [],
  onMonthChange,
  onNavigateDay,
}: MonthViewProps) {
  const monthStart = `${year}-${pad(month + 1)}-01`;
  const monthEnd = `${year}-${pad(month + 1)}-${new Date(year, month + 1, 0).getDate()}`;

  const { data: allTasks = [] } = useTasks(monthStart, monthEnd);

  const todayStr = new Date().toISOString().substring(0, 10);
  const calendarDays = useMemo(() => getCalendarDays(year, month), [year, month]);

  // Map dateStr → tasks active on that date (UTC-safe: avoids local timezone shift)
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of allTasks as Task[]) {
      if (!task.active) continue;
      let cur = task.startDate;
      while (cur <= task.endDate) {
        if (!map[cur]) map[cur] = [];
        map[cur]!.push(task);
        // Advance by 1 day using Date.UTC so timezone never affects the result
        const [y, m, d] = cur.split('-').map(Number);
        cur = new Date(Date.UTC(y!, m! - 1, d! + 1)).toISOString().substring(0, 10);
      }
    }
    return map;
  }, [allTasks]);

  function prevMonth() {
    if (month === 0) onMonthChange(11, year - 1);
    else onMonthChange(month - 1, year);
  }

  function nextMonth() {
    if (month === 11) onMonthChange(0, year + 1);
    else onMonthChange(month + 1, year);
  }

  return (
    <div className={outerWrap}>
      {/* Navigation */}
      <div className={navRow}>
        <button type="button" className={navBtn} onClick={prevMonth}>‹</button>
        <span className={navLabel}>{MONTH_NAMES[month]} {year}</span>
        <button type="button" className={navBtn} onClick={nextMonth}>›</button>
      </div>

      {/* Day headers */}
      <div className={headerGrid}>
        {DAY_NAMES.map((d) => (
          <div key={d} className={headerCell}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={calendarGrid}>
        {calendarDays.map((dateStr, i) => {
          if (!dateStr) {
            return <div key={`empty-${i}`} className={emptyCell} />;
          }

          const dayTasks = tasksByDate[dateStr] ?? [];
          const isToday = dateStr === todayStr;
          const dayNum = new Date(dateStr).getDate();

          // Today's quests shown only on today's cell
          const todayQuests = isToday && display.showQuests ? quests : [];
          const totalItems = dayTasks.length + todayQuests.length;
          const MAX_SHOWN = 3;
          const overflow = totalItems - MAX_SHOWN;

          // Items to render: tasks first, then quests, max MAX_SHOWN
          const taskItems = dayTasks.slice(0, MAX_SHOWN);
          const questItems = todayQuests.slice(0, Math.max(0, MAX_SHOWN - taskItems.length));

          return (
            <div
              key={dateStr}
              className={cn(dayCell, isToday && dayCellToday)}
              onClick={() => onNavigateDay(dateStr)}
            >
              {/* Day number */}
              <div className={dayNumRow}>
                <span className={cn(dayNumber, isToday && dayNumberToday)}>{dayNum}</span>
                {totalItems > 0 && (
                  <span className={itemCount}>{totalItems}</span>
                )}
              </div>

              {/* Task pills */}
              <div className={pillList}>
                {taskItems.map((task) => {
                  const color = HABIT_COLORS[task.color as TaskColor]?.value ?? 'var(--gold)';
                  const isDone = task.status === 'done';
                  return (
                    <div
                      key={task.id}
                      className={cn(taskPill, isDone && taskPillDone)}
                      style={{ borderLeftColor: color }}
                      title={`${task.icon} ${task.name}${task.note ? ` — ${task.note}` : ''}`}
                    >
                      <span className={pillIcon}>{task.icon}</span>
                      <span className={cn(pillName, isDone && pillNameDone)}>{task.name}</span>
                      {isDone && <span className={pillCheck}>✓</span>}
                    </div>
                  );
                })}

                {/* Quest pills on today */}
                {questItems.map((q) => (
                  <div
                    key={q.id}
                    className={cn(questPill, q.done && taskPillDone)}
                    title={q.title}
                  >
                    <span className={pillIcon}>{q.habitIcon ?? '⚡'}</span>
                    <span className={cn(pillName, q.done && pillNameDone)}>{q.title}</span>
                    {q.done && <span className={pillCheck}>✓</span>}
                  </div>
                ))}

                {overflow > 0 && (
                  <div className={overflowBadge}>+{overflow} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const outerWrap = 'flex flex-col flex-1 min-h-0 overflow-hidden';

const navRow =
  'flex items-center justify-between px-3 py-2 shrink-0 border-b border-[var(--border)]';
const navBtn =
  'w-7 h-7 flex items-center justify-center rounded border border-[var(--border)] bg-[var(--panel2)] text-[var(--text-mid)] text-[16px] cursor-pointer hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all';
const navLabel = 'text-[12px] font-semibold text-[var(--text-hi)]';

const headerGrid = 'grid grid-cols-7 border-b border-[var(--border)] shrink-0';
const headerCell =
  'text-center text-[9px] font-bold tracking-[0.1em] uppercase text-[var(--text-lo)] py-1.5 font-[var(--font-title)]';

const calendarGrid =
  'flex-1 overflow-y-auto grid grid-cols-7 auto-rows-[minmax(80px,1fr)]';

const emptyCell =
  'bg-[var(--panel)] border-b border-r border-[var(--border)] opacity-20';

const dayCell =
  'bg-[var(--panel)] border-b border-r border-[var(--border)] px-1.5 pt-1 pb-1.5 cursor-pointer hover:bg-[oklch(0.74_0.17_85_/_0.04)] transition-colors flex flex-col gap-0.5 min-h-[80px] overflow-hidden';
const dayCellToday =
  'bg-[oklch(0.74_0.17_85_/_0.05)] border-[oklch(0.74_0.17_85_/_0.3)]';

const dayNumRow = 'flex items-center justify-between mb-0.5 shrink-0';
const dayNumber =
  'text-[11px] font-semibold text-[var(--text-mid)] leading-none';
const dayNumberToday =
  'w-[18px] h-[18px] rounded-full bg-[var(--gold)] text-[oklch(0.15_0_0)] text-[10px] font-bold flex items-center justify-center leading-none';
const itemCount =
  'text-[8px] font-bold text-[var(--text-lo)] tabular-nums leading-none';

const pillList = 'flex flex-col gap-0.5 flex-1 overflow-hidden';

const taskPill =
  'flex items-center gap-1 pl-1.5 pr-1 py-[2px] rounded-sm border-l-[2px] bg-[var(--panel2)] overflow-hidden shrink-0';
const taskPillDone = 'opacity-45';

const questPill =
  'flex items-center gap-1 pl-1.5 pr-1 py-[2px] rounded-sm border-l-[2px] border-l-[oklch(0.74_0.17_85_/_0.7)] bg-[oklch(0.74_0.17_85_/_0.07)] overflow-hidden shrink-0';

const pillIcon = 'text-[9px] leading-none shrink-0';
const pillName =
  'flex-1 text-[9px] text-[var(--text-hi)] leading-tight truncate min-w-0';
const pillNameDone = 'line-through text-[var(--text-lo)]';
const pillCheck = 'text-[8px] text-[oklch(0.76_0.14_162)] shrink-0 leading-none';

const overflowBadge =
  'text-[8px] text-[var(--text-lo)] font-medium pl-1 leading-none mt-0.5 italic';
