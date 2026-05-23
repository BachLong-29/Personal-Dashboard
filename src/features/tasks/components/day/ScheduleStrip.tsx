import { cn } from '@/libs/utils';

import { ACTIVITY, TODAY_SCHEDULE, type ActivityItem, type ScheduleEntry } from '../../data/mock';
import { sidePanel, panelHead, panelEyebrow, panelTitle } from '../shared/styles';

export function ScheduleStrip() {
  return (
    <div className={cn(sidePanel, 'flex-1 flex flex-col')}>
      <div className={panelHead}>
        <span className={panelEyebrow}>HOURGLASS</span>
        <h3 className={panelTitle}>Today&apos;s Path</h3>
        <div className="flex-1" />
        <span className="text-[9px] text-[var(--text-lo)]">38m → next</span>
      </div>

      {/* Schedule list */}
      <div className="flex flex-col overflow-y-auto mt-1">
        {TODAY_SCHEDULE.map((entry, i) => (
          <ScheduleRow
            key={i}
            entry={entry}
            isLast={i === TODAY_SCHEDULE.length - 1}
          />
        ))}
      </div>

      {/* Activity feed */}
      <ActivityFeed />
    </div>
  );
}

// ─── Schedule row ─────────────────────────────────────────────────────────────

function ScheduleRow({ entry, isLast }: { entry: ScheduleEntry; isLast: boolean }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 py-[5px]',
        entry.done && 'opacity-50',
      )}
    >
      {/* Time column */}
      <div className="shrink-0 text-right w-[38px]">
        <div className="text-[8px] text-[var(--text-mid)]">{entry.time}</div>
        <div className="text-[7px] text-[var(--text-lo)]">{entry.endTime}</div>
      </div>

      {/* Spine */}
      <div className="flex flex-col items-center self-stretch shrink-0">
        <div
          className={cn(
            'w-2 h-2 rounded-full border border-[var(--border)] shrink-0',
            entry.done && 'bg-[var(--mint)] border-[var(--mint)]',
            entry.active && 'bg-[var(--cyan)] border-[var(--cyan)] shadow-[0_0_6px_var(--cyan)]',
          )}
        />
        {!isLast && <div className="w-px flex-1 bg-[var(--border)] mt-[2px]" />}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0 pb-1">
        <div className="text-[10px] text-[var(--text-hi)] font-medium truncate">{entry.label}</div>
        <div className="text-[8px] mt-[1px]">
          {entry.active && <span className="text-[var(--cyan)] font-bold">▶ NOW</span>}
          {entry.done && <span className="text-[var(--mint)]">✓ done</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Activity feed ────────────────────────────────────────────────────────────

function ActivityFeed() {
  return (
    <div className="mt-2 pt-2 border-t border-[var(--border)]">
      <div className="text-[8px] tracking-[0.12em] text-[var(--text-lo)] font-bold mb-1.5">
        RECENT ECHOES
      </div>
      <ul className="flex flex-col gap-[3px]">
        {ACTIVITY.map((item, i) => (
          <ActivityRow key={i} item={item} />
        ))}
      </ul>
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <li className="flex items-center gap-2 py-[3px]">
      <span className="text-[10px] shrink-0">{item.icon}</span>
      <span className="text-[9px] text-[var(--text-mid)] flex-1 truncate">{item.text}</span>
      <span className="text-[8px] text-[var(--text-lo)] shrink-0">{item.ts}</span>
    </li>
  );
}
