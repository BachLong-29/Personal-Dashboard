'use client';

import { useMemo } from 'react';

import { cn } from '@/libs/utils';

import { WEEK_DAYS, catOf, COLOR_VAR, type UITask } from '../../data/mock';
import { diffColors, sidePanel, panelHead, panelEyebrow, panelTitle } from '../shared/styles';

interface WeekPeekProps {
  tasks: UITask[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns Mon-based index of today: Mon=0, Tue=1, …, Sun=6 */
function getTodayMonBased(): number {
  return (new Date().getDay() + 6) % 7; // getDay: Sun=0 → remap to Mon=0
}

/** ISO "YYYY-MM-DD" of a date that is `offsetDays` away from today */
function dateLabel(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WeekPeek({ tasks }: WeekPeekProps) {
  /**
   * todayMonBased: which WEEK_DAYS.idx corresponds to today.
   * e.g. if today is Wednesday → todayMonBased = 2
   *
   * For each day row (idx 0–6), the task-day offset from today is:
   *   taskDay = idx - todayMonBased
   *   Monday this week = 0 - 2 = -2  (2 days ago)
   *   Wednesday (today) = 2 - 2 = 0
   *   Friday = 4 - 2 = 2  (in 2 days)
   */
  const todayMonBased = useMemo(() => getTodayMonBased(), []);

  return (
    <div className={sidePanel}>
      <div className={panelHead}>
        <span className={panelEyebrow}>PARCHMENT</span>
        <h3 className={panelTitle}>This Week</h3>
      </div>
      <div className="flex flex-col gap-[3px] mt-2 overflow-y-auto">
        {WEEK_DAYS.map((d) => {
          const offsetFromToday = d.idx - todayMonBased;
          const ts = tasks.filter((t) => t.day === offsetFromToday);
          const done = ts.filter((t) => t.done).length;
          const isToday = d.idx === todayMonBased;

          return (
            <WeekPeekDay
              key={d.idx}
              shortLabel={d.short}
              dateLabel={dateLabel(offsetFromToday)}
              tasks={ts}
              done={done}
              isToday={isToday}
              isPast={offsetFromToday < 0}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Single day row inside WeekPeek ──────────────────────────────────────────

interface WeekPeekDayProps {
  shortLabel: string;
  dateLabel: string;
  tasks: UITask[];
  done: number;
  isToday: boolean;
  isPast: boolean;
}

function WeekPeekDay({
  shortLabel,
  dateLabel: dateLbl,
  tasks,
  done,
  isToday,
  isPast,
}: WeekPeekDayProps) {
  const allDone = tasks.length > 0 && done === tasks.length;

  return (
    <div className={cn(dayRow, isToday && dayRowToday, isPast && !isToday && dayRowPast)}>
      {/* Day label */}
      <div className="w-10 shrink-0 pt-0.5">
        <div
          className={cn(
            'text-[9px] font-bold font-[var(--font-title)]',
            isToday
              ? 'text-[var(--gold)]'
              : isPast
                ? 'text-[var(--text-dim)]'
                : 'text-[var(--text-mid)]',
          )}
        >
          {shortLabel}
        </div>
        <div className="text-[8px] text-[var(--text-dim)] font-[var(--font-mono)] mt-0.5 leading-none">
          {dateLbl}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          {tasks.length === 0 ? (
            <span className="text-[8px] text-[var(--text-dim)] italic">— free —</span>
          ) : (
            <>
              <span
                className={cn(
                  'text-[9px]',
                  isPast && !isToday ? 'text-[var(--text-dim)]' : 'text-[var(--text-lo)]',
                )}
              >
                {tasks.length} {tasks.length === 1 ? 'quest' : 'quests'}
              </span>
              <span
                className={cn(
                  'text-[9px] font-[var(--font-mono)]',
                  allDone
                    ? 'text-[var(--mint)]'
                    : isPast && done < tasks.length
                      ? 'text-[var(--rose)]'
                      : 'text-[var(--text-lo)]',
                )}
              >
                {done}/{tasks.length}
              </span>
            </>
          )}

          {isToday && (
            <span className="text-[7px] font-bold text-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.12)] border border-[oklch(0.74_0.17_85_/_0.25)] px-1 py-0.5 rounded tracking-[0.1em]">
              TODAY
            </span>
          )}
          {allDone && !isToday && (
            <span className="text-[7px] font-bold text-[var(--mint)] bg-[oklch(0.76_0.14_162_/_0.1)] border border-[oklch(0.76_0.14_162_/_0.25)] px-1 py-0.5 rounded tracking-[0.1em]">
              DONE
            </span>
          )}
          {isPast && !isToday && tasks.length > 0 && done < tasks.length && (
            <span className="text-[7px] font-bold text-[var(--rose)] bg-[oklch(0.72_0.18_5_/_0.1)] border border-[oklch(0.72_0.18_5_/_0.25)] px-1 py-0.5 rounded tracking-[0.1em]">
              MISSED
            </span>
          )}
        </div>

        <div className="flex flex-col gap-[2px]">
          {tasks.slice(0, 3).map((t) => {
            const c = catOf(t.cat);
            const catColor = COLOR_VAR[c.color] ?? 'var(--text-lo)';
            return (
              <div
                key={t.id}
                className={cn(
                  'flex items-center gap-1.5',
                  t.done && 'opacity-40 line-through',
                  isPast && !t.done && 'opacity-50',
                )}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: t.done ? 'var(--text-dim)' : catColor }}
                />
                <span className="text-[9px] text-[var(--text-mid)] truncate flex-1">
                  {t.icon ? `${t.icon} ` : ''}
                  {t.title}
                </span>
                <span
                  className={cn(
                    'text-[7px] font-black w-3 text-center font-[var(--font-title)]',
                    diffColors[t.diff],
                  )}
                >
                  {t.diff}
                </span>
              </div>
            );
          })}

          {tasks.length > 3 && (
            <div className="text-[8px] text-[var(--text-lo)] italic">
              + {tasks.length - 3} more…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const dayRow =
  'flex items-start gap-2 p-2 rounded-[var(--r-sm)] transition-colors hover:bg-[var(--panel2)]';
const dayRowToday = 'bg-[oklch(0.74_0.17_85_/_0.06)] border border-[oklch(0.74_0.17_85_/_0.2)]';
const dayRowPast = 'opacity-60';
