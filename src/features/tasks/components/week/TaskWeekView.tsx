import { WEEK_DAYS, type UITask } from '../../data/mock';
import { WeekColumn } from './WeekColumn';
import { WeekStats } from './WeekStats';

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
  // Only include tasks that fall within the current week
  const weekTasks = tasks.filter((t) => t.day >= 0 && t.day <= 6);

  return (
    <section className="flex flex-col gap-2.5 flex-1 min-h-0 overflow-hidden">
      {/* Stats row */}
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] px-3 py-2.5 shrink-0">
        <WeekStats tasks={weekTasks} />
      </div>

      {/* 7-column board */}
      <div className="flex-1 grid grid-cols-7 gap-2 min-h-0 overflow-hidden">
        {WEEK_DAYS.map((d) => {
          const ts = weekTasks.filter((t) => t.day === d.idx);
          const done = ts.filter((t) => t.done).length;
          const pct = ts.length ? Math.round((done / ts.length) * 100) : 0;
          return (
            <WeekColumn
              key={d.idx}
              dayLabel={d.short}
              dayOffset={d.idx}
              isToday={d.idx === 0}
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
