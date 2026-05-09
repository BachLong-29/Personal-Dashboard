import { SCHED_COLORS } from '../constants';
import type { ScheduleItem } from '../types';

interface SchedulePanelProps {
  schedule: ScheduleItem[];
  onToggle: (index: number) => void;
}

function getCurrentIndex(schedule: ScheduleItem[]): number {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  return schedule.findIndex((s, i) => {
    const [h, m] = s.time.split(':').map(Number);
    const t = h + m / 60;
    const next = schedule[i + 1];
    if (!next) return t <= currentHour;
    const [nh, nm] = next.time.split(':').map(Number);
    return t <= currentHour && currentHour < nh + nm / 60;
  });
}

export function SchedulePanel({ schedule, onToggle }: SchedulePanelProps) {
  const currentIdx = getCurrentIndex(schedule);

  return (
    <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div className="schedule-wrap">
        {schedule.map((item, i) => {
          const isCurrent = i === currentIdx;
          const color = SCHED_COLORS[item.type] ?? '#94a3b8';
          return (
            <div
              key={i}
              className={`sched-item${isCurrent ? ' current' : ''}${item.done ? ' done' : ''}`}
              onClick={() => onToggle(i)}
            >
              {isCurrent && <div className="sched-pulse" />}
              <span className="sched-time">{item.time}</span>
              <div className="sched-dot" style={{ background: color }} />
              <span className="sched-label">{item.label}</span>
              {item.done && <span className="sched-done-icon">✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
