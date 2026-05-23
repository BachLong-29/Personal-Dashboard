import { cn } from '@/libs/utils';

import { WEEK_DAYS, catOf, COLOR_VAR, type UITask } from '../../data/mock';
import { diffColors, sidePanel, panelHead, panelEyebrow, panelTitle } from '../shared/styles';

interface WeekPeekProps {
  tasks: UITask[];
}

export function WeekPeek({ tasks }: WeekPeekProps) {
  return (
    <div className={sidePanel}>
      <div className={panelHead}>
        <span className={panelEyebrow}>PARCHMENT</span>
        <h3 className={panelTitle}>This Week</h3>
      </div>
      <div className="flex flex-col gap-[3px] mt-2 overflow-y-auto">
        {WEEK_DAYS.map((d) => {
          const ts = tasks.filter((t) => t.day === d.idx);
          const done = ts.filter((t) => t.done).length;
          return (
            <WeekPeekDay
              key={d.idx}
              shortLabel={d.short}
              tasks={ts}
              done={done}
              isToday={d.idx === 0}
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
  tasks: UITask[];
  done: number;
  isToday: boolean;
}

function WeekPeekDay({ shortLabel, tasks, done, isToday }: WeekPeekDayProps) {
  return (
    <div className={cn(dayRow, isToday && dayRowToday)}>
      {/* Day label */}
      <div className="w-8 shrink-0 pt-0.5">
        <div className="text-[9px] font-bold text-[var(--text-mid)] font-[var(--font-title)]">
          {shortLabel}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[9px] text-[var(--text-lo)]">{tasks.length} quests</span>
          {tasks.length > 0 && (
            <span className="text-[9px] text-[var(--text-lo)]">{done}/{tasks.length}</span>
          )}
          {isToday && (
            <span className="text-[7px] font-bold text-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.12)] border border-[oklch(0.74_0.17_85_/_0.25)] px-1 py-0.5 rounded tracking-[0.1em]">
              TODAY
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
                className={cn('flex items-center gap-1.5', t.done && 'opacity-40 line-through')}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: catColor }} />
                <span className="text-[9px] text-[var(--text-mid)] truncate flex-1">{t.title}</span>
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
            <div className="text-[8px] text-[var(--text-lo)] italic">+ {tasks.length - 3} more…</div>
          )}
          {tasks.length === 0 && (
            <div className="text-[8px] text-[var(--text-lo)] italic opacity-50">— no quests —</div>
          )}
        </div>
      </div>
    </div>
  );
}

const dayRow =
  'flex items-start gap-2 p-2 rounded-[var(--r-sm)] transition-colors hover:bg-[var(--panel2)]';
const dayRowToday =
  'bg-[oklch(0.74_0.17_85_/_0.06)] border border-[oklch(0.74_0.17_85_/_0.2)]';
