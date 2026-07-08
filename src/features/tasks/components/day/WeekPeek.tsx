'use client';

import { useMemo, useState } from 'react';

import { useLocale, useTranslations } from 'next-intl';

import { Icon } from '@/components/common/Icon';
import type { ScheduleBlock } from '@/types';

import { cn } from '@/libs/utils';

import { WEEK_DAYS, catOf, COLOR_VAR, type UITask } from '../../data/mock';
import { buildTaskSessions, taskOccursOnDayOffset } from '../../utils/date.utils';
import { diffColors, sidePanel, panelHead, panelEyebrow, panelTitle } from '../shared/styles';

interface WeekPeekProps {
  tasks: UITask[];
  /** Task schedule blocks for the visible week — drives session-aware placement. */
  taskBlocks?: ScheduleBlock[];
  /** Render without the built-in panel shell (bg/border) — e.g. when wrapped by an outer panel. */
  bare?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns Mon-based index of today: Mon=0, Tue=1, …, Sun=6 */
function getTodayMonBased(): number {
  return (new Date().getDay() + 6) % 7; // getDay: Sun=0 → remap to Mon=0
}

/** ISO "YYYY-MM-DD" of a date that is `offsetDays` away from today */
function dateLabel(offsetDays: number, locale: string): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WeekPeek({ tasks, taskBlocks = [], bare = false }: WeekPeekProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.weekPeek');
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

  // Session lookup: a multi-day task with scheduled blocks appears only on its
  // session days, so an in-range day with no session (e.g. a 22→29 task on the
  // 26th with no block that day) no longer shows it.
  const sessions = useMemo(() => buildTaskSessions(taskBlocks), [taskBlocks]);

  return (
    <div className={bare ? 'p-3' : sidePanel}>
      <div className={panelHead}>
        <span className={panelEyebrow}>{t('eyebrow')}</span>
        <h3 className={panelTitle}>{t('title')}</h3>
      </div>
      <div className="flex flex-col gap-[3px] mt-2 overflow-y-auto">
        {WEEK_DAYS.map((d) => {
          const offsetFromToday = d.idx - todayMonBased;
          const ts = tasks.filter((t) => taskOccursOnDayOffset(t, offsetFromToday, sessions));
          const done = ts.filter((t) => t.done).length;
          const isToday = d.idx === todayMonBased;

          return (
            <WeekPeekDay
              key={d.idx}
              shortLabel={d.short}
              dateLabel={dateLabel(offsetFromToday, locale)}
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
  const t = useTranslations('tasks.weekPeek');
  const [expanded, setExpanded] = useState(false);
  const allDone = tasks.length > 0 && done === tasks.length;
  const visibleTasks = expanded ? tasks : tasks.slice(0, 3);

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
            <span className="text-[8px] text-[var(--text-dim)] italic">{t('free')}</span>
          ) : (
            <>
              <span
                className={cn(
                  'text-[9px]',
                  isPast && !isToday ? 'text-[var(--text-dim)]' : 'text-[var(--text-lo)]',
                )}
              >
                {t('questCount', { count: tasks.length })}
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
              {t('today')}
            </span>
          )}
          {allDone && !isToday && (
            <span className="text-[7px] font-bold text-[var(--mint)] bg-[oklch(0.76_0.14_162_/_0.1)] border border-[oklch(0.76_0.14_162_/_0.25)] px-1 py-0.5 rounded tracking-[0.1em]">
              {t('done')}
            </span>
          )}
          {isPast && !isToday && tasks.length > 0 && done < tasks.length && (
            <span className="text-[7px] font-bold text-[var(--rose)] bg-[oklch(0.72_0.18_5_/_0.1)] border border-[oklch(0.72_0.18_5_/_0.25)] px-1 py-0.5 rounded tracking-[0.1em]">
              {t('missed')}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-[2px]">
          {visibleTasks.map((t) => {
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
                  {t.icon && t.source !== 'habit' ? (
                    <>
                      <Icon icon={t.icon} className="leading-none shrink-0" />{' '}
                    </>
                  ) : null}
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
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-[8px] text-[var(--text-lo)] italic text-left hover:text-[var(--gold)] transition-colors cursor-pointer"
            >
              {expanded ? t('collapse') : t('more', { count: tasks.length - 3 })}
            </button>
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
