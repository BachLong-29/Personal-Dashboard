import { SCHED_COLORS } from '../constants';
import type { ScheduleItem } from '../types';

import { cn } from '@/libs/utils';

interface SchedulePanelProps {
  schedule: ScheduleItem[];
  onToggle: (index: number) => void;
}

function parseTimeToHour(time: string): number | null {
  const [hStr, mStr] = time.split(':');
  if (hStr == null || mStr == null) return null;
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h + m / 60;
}

function getCurrentIndex(schedule: ScheduleItem[]): number {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  return schedule.findIndex((s, i) => {
    const t = parseTimeToHour(s.time);
    if (t == null) return false;
    const next = schedule[i + 1];
    if (!next) return t <= currentHour;
    const nt = parseTimeToHour(next.time);
    if (nt == null) return t <= currentHour;
    return t <= currentHour && currentHour < nt;
  });
}

export function SchedulePanel({ schedule, onToggle }: SchedulePanelProps) {
  const currentIdx = getCurrentIndex(schedule);

  return (
    <div className={scheduleOuter}>
      <div className={scheduleWrap}>
        {schedule.map((item, i) => {
          const isCurrent = i === currentIdx;
          const color = SCHED_COLORS[item.type] ?? '#94a3b8';

          return (
            <div
              key={i}
              className={cn(schedItem, isCurrent && schedItemCurrent, item.done && schedItemDone)}
              onClick={() => onToggle(i)}
            >
              {isCurrent && <div className={schedPulse} />}
              <span className={cn(schedTime, isCurrent && schedTimeCurrent)}>{item.time}</span>
              <div className={schedDot} style={{ background: color, color }} />
              <span className={schedLabel}>{item.label}</span>
              {item.done && <span className={schedDoneIcon}>✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const scheduleOuter = 'flex-1 overflow-hidden min-h-0 flex flex-col';

const scheduleWrap = 'flex-1 overflow-y-auto px-3 py-2.5 flex flex-col gap-1.5 min-h-0';

const schedItem =
  'flex items-center gap-2 px-[10px] py-2 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] cursor-pointer transition-all duration-200 relative hover:border-[oklch(0.74_0.17_85_/_0.35)] hover:bg-[oklch(0.74_0.17_85_/_0.03)]';
const schedItemCurrent =
  'border-[oklch(0.74_0.17_85_/_0.5)] bg-[oklch(0.74_0.17_85_/_0.06)] shadow-[0_0_12px_var(--gold-glow)]';
const schedItemDone = 'opacity-45';

const schedTime =
  'font-[var(--font-title)] text-[10px] font-bold text-[var(--text-mid)] w-[38px] shrink-0 tracking-[0.05em]';
const schedTimeCurrent = 'text-[var(--gold)]';

const schedDot = 'w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px_currentColor]';
const schedLabel = 'flex-1 text-[11px] font-medium text-[var(--text-hi)]';
const schedDoneIcon = 'text-[12px]';

const schedPulse =
  'absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--gold)] rounded-l-[2px] animate-[pulse-glow_1.8s_ease-in-out_infinite]';
