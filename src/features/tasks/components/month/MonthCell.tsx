import { cn } from '@/libs/utils';

import { catOf, COLOR_VAR, type UITask } from '../../data/mock';

interface MonthCellProps {
  cell: { date: number; tasks: UITask[]; isToday: boolean } | null;
  onSelectTask: (id: string) => void;
}

export function MonthCell({ cell, onSelectTask }: MonthCellProps) {
  if (!cell) {
    return <div className="border border-[var(--border)] min-h-[80px] opacity-20" />;
  }

  const overflow = cell.tasks.length - 3;

  return (
    <div className={cn(cellBase, cell.isToday && cellToday)}>
      {/* Date number */}
      <div className="flex items-center justify-between mb-1.5">
        <span className={cn(cellNum, cell.isToday && 'text-[var(--gold)]')}>
          {cell.date}
        </span>
        {cell.isToday && (
          <span className="text-[6px] font-bold text-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.12)] border border-[oklch(0.74_0.17_85_/_0.3)] px-1 py-0.5 rounded tracking-[0.1em]">
            TODAY
          </span>
        )}
      </div>

      {/* Task pills */}
      <div className="flex flex-col gap-[2px]">
        {cell.tasks.slice(0, 3).map((t) => (
          <TaskPill key={t.id} task={t} onClick={() => onSelectTask(t.id)} />
        ))}
        {overflow > 0 && (
          <div className="text-[8px] text-[var(--text-lo)] pl-1 italic">
            + {overflow} more
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Task pill inside a cell ──────────────────────────────────────────────────

function TaskPill({ task, onClick }: { task: UITask; onClick: () => void }) {
  const c = catOf(task.cat);
  const catColor = COLOR_VAR[c.color] ?? 'var(--text-lo)';

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-1 py-[2px] rounded-sm border-l-[2px] cursor-pointer overflow-hidden transition-colors hover:opacity-80',
        task.done && 'opacity-40 line-through',
        task.saga && 'border-dashed',
      )}
      style={{ borderLeftColor: catColor, background: `${catColor}0E` }}
      onClick={onClick}
    >
      <span
        className="text-[6px] font-black shrink-0 font-[var(--font-title)]"
        style={{ color: catColor }}
      >
        {task.diff}
      </span>
      <span className="text-[8px] text-[var(--text-hi)] truncate leading-none">{task.title}</span>
    </div>
  );
}

const cellBase =
  'border border-[var(--border)] p-1.5 min-h-[80px] cursor-default hover:bg-[oklch(0.74_0.17_85_/_0.02)] transition-colors';
const cellToday =
  'bg-[oklch(0.74_0.17_85_/_0.04)] border-[oklch(0.74_0.17_85_/_0.3)]';
const cellNum =
  'text-[11px] font-bold text-[var(--text-mid)] font-[var(--font-title)]';
