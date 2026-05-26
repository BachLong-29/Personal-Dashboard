import { useMemo } from 'react';

import { WEEK_DAYS, type UITask } from '../../data/mock';
import { WeekColumn } from './WeekColumn';
import { WeekStats } from './WeekStats';

/** Mon-based index of today: Mon=0, Tue=1, …, Sun=6 */
function getTodayMonBased(): number {
  return (new Date().getDay() + 6) % 7;
}

interface TaskWeekViewProps {
  tasks: UITask[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onToggleDone: (id: string) => void;
  onMoveToDay: (id: string, day: number) => void;
}

export function TaskWeekView({
  tasks,
  expandedId,
  setExpandedId,
  onToggleDone,
  onMoveToDay,
}: TaskWeekViewProps) {
  // Convert Mon-based index to a day-offset from today:
  //   e.g. today=Wed (todayMonBased=2): Mon → offset -2, Tue → -1, Wed → 0, Thu → +1 …
  const todayMonBased = useMemo(getTodayMonBased, []);

  // Only include tasks that fall within the current calendar week (Mon–Sun)
  const weekTasks = tasks.filter((t) => {
    const offset = t.day;
    return offset >= -todayMonBased && offset <= 6 - todayMonBased;
  });

  return (
    <section className="flex flex-col gap-2.5 flex-1 min-h-0 overflow-hidden">
      {/* Stats row */}
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] px-3 py-2.5 shrink-0">
        <WeekStats tasks={weekTasks} />
      </div>

      {/* 7-column board */}
      <div className="flex-1 grid grid-cols-7 gap-2 min-h-0 overflow-hidden">
        {WEEK_DAYS.map((d) => {
          // d.idx is Mon-based (0=Mon, …, 6=Sun); convert to day-offset from today
          const offsetFromToday = d.idx - todayMonBased;
          const ts = weekTasks.filter((t) => t.day === offsetFromToday);
          const done = ts.filter((t) => t.done).length;
          const pct = ts.length ? Math.round((done / ts.length) * 100) : 0;
          return (
            <WeekColumn
              key={d.idx}
              dayLabel={d.short}
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
