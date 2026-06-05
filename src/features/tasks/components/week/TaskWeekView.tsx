import { useMemo } from 'react';

import { WEEK_DAYS, type UITask } from '../../data/mock';
import { WeekColumn } from './WeekColumn';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Mon-based index of today: Mon=0, Tue=1, …, Sun=6 */
function getTodayMonBased(): number {
  return (new Date().getDay() + 6) % 7;
}

/** ISO 8601 week number for a given date */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

// ─── Week selector ────────────────────────────────────────────────────────────

interface WeekSelectorProps {
  weekOffset: number;
  onChange: (n: number) => void;
}

function WeekSelector({ weekOffset, onChange }: WeekSelectorProps) {
  const { monday, sunday } = useMemo(() => {
    const today = new Date();
    const monBased = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - monBased + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { monday, sunday };
  }, [weekOffset]);

  const weekNum = getWeekNumber(monday);
  const isCurrentWeek = weekOffset === 0;

  const fmtFull = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const fmtYear =
    monday.getFullYear() !== new Date().getFullYear() ? ` ${monday.getFullYear()}` : '';

  const navBtn =
    'w-7 h-7 flex items-center justify-center rounded-[var(--r-sm)] border border-[var(--border)] text-[var(--text-lo)] hover:text-[var(--text-hi)] hover:bg-[var(--panel2)] transition-colors text-[14px] leading-none shrink-0';

  return (
    <div className="flex items-center gap-2 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] px-3 py-2 shrink-0">
      {/* Prev */}
      <button
        className={navBtn}
        onClick={() => onChange(weekOffset - 1)}
        aria-label="Previous week"
      >
        ‹
      </button>

      {/* Centre label */}
      <div className="flex-1 flex items-center justify-center gap-2">
        {/* Week number badge */}
        <span className="hidden sm:inline text-[8px] font-bold tracking-[0.16em] uppercase px-1.5 py-0.5 rounded bg-[var(--panel2)] text-[var(--text-lo)]">
          W{weekNum}
        </span>

        {/* Date range */}
        <span className="text-[11px] font-semibold text-[var(--text-hi)] tabular-nums">
          {fmtFull(monday)} – {fmtFull(sunday)}
          {fmtYear}
        </span>

        {/* Current-week pill */}
        {isCurrentWeek && (
          <span
            className="hidden sm:inline text-[7px] font-bold tracking-[0.1em] uppercase px-1.5 py-0.5 rounded border"
            style={{
              color: 'var(--gold)',
              background: 'oklch(0.74 0.17 85 / 0.1)',
              borderColor: 'oklch(0.74 0.17 85 / 0.35)',
            }}
          >
            NOW
          </span>
        )}
      </div>

      {/* Jump to current week */}
      {!isCurrentWeek && (
        <button
          className="text-[9px] font-bold tracking-[0.08em] uppercase px-2 py-1 rounded-[var(--r-sm)] transition-colors shrink-0"
          style={{ color: 'var(--gold)', background: 'oklch(0.74 0.17 85 / 0.1)' }}
          onClick={() => onChange(0)}
        >
          Today
        </button>
      )}

      {/* Next */}
      <button className={navBtn} onClick={() => onChange(weekOffset + 1)} aria-label="Next week">
        ›
      </button>
    </div>
  );
}

// ─── TaskWeekView ─────────────────────────────────────────────────────────────

interface TaskWeekViewProps {
  tasks: UITask[];
  weekOffset: number;
  onWeekChange: (n: number) => void;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onToggleDone: (id: string) => void;
  onMoveToDay: (id: string, day: number) => void;
}

export function TaskWeekView({
  tasks,
  weekOffset,
  onWeekChange,
  expandedId,
  setExpandedId,
  onToggleDone,
  onMoveToDay,
}: TaskWeekViewProps) {
  const todayMonBased = useMemo(() => getTodayMonBased(), []);

  // Day-offset range for the selected week, relative to today
  const weekStart = -todayMonBased + weekOffset * 7; // Mon of selected week
  const weekEnd = 6 - todayMonBased + weekOffset * 7; // Sun of selected week

  const weekTasks = tasks.filter((t) => t.day >= weekStart && t.day <= weekEnd);

  return (
    <section className="flex flex-col gap-2.5 flex-1 min-h-0 overflow-y-auto md:overflow-hidden">
      {/* Week selector */}
      <WeekSelector weekOffset={weekOffset} onChange={onWeekChange} />

      {/* Stats row */}
      {/* <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] px-3 py-2.5 shrink-0">
        <WeekStats tasks={weekTasks} />
      </div> */}

      {/* Day columns — flex-col on mobile, 7-col grid on md+ */}
      <div className="flex flex-col gap-2 md:flex-1 md:grid md:grid-cols-7 md:min-h-0 md:overflow-hidden">
        {WEEK_DAYS.map((d) => {
          // d.idx is Mon-based (0=Mon … 6=Sun); shift by weekOffset to get offset from today
          const offsetFromToday = d.idx - todayMonBased + weekOffset * 7;

          // Compute the actual calendar date for this column
          const colDate = new Date();
          colDate.setDate(colDate.getDate() + offsetFromToday);

          const ts = weekTasks.filter((t) => t.day === offsetFromToday);
          const done = ts.filter((t) => t.done).length;
          const pct = ts.length ? Math.round((done / ts.length) * 100) : 0;

          return (
            <WeekColumn
              key={d.idx}
              dayLabel={d.short}
              date={colDate}
              dayOffset={offsetFromToday}
              isToday={offsetFromToday === 0}
              tasks={ts}
              done={done}
              pct={pct}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              onToggleDone={onToggleDone}
              onMoveToDay={onMoveToDay}
            />
          );
        })}
      </div>
    </section>
  );
}
