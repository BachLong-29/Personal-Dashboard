import type { CalendarItem } from '@/types/calendar';
import type { CapacityStatus, DayCapacity, ScheduleConflict } from '@/types/calendar-insights';

/** "HH:MM" → minutes since midnight. */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h! * 60 + m!;
}

/** Items that participate in time-based checks (have a real start time + duration). */
function timedItems(items: CalendarItem[]): CalendarItem[] {
  return items.filter((i) => i.startTime !== null && i.duration > 0);
}

/**
 * Detect hard (overlap) and soft (gap < minBreak) conflicts within each day.
 * Pure — operates on the calendar items it is given.
 */
export function detectConflicts(
  items: CalendarItem[],
  minBreakMinutes: number,
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  // Group by date
  const byDate = new Map<string, CalendarItem[]>();
  for (const item of timedItems(items)) {
    const list = byDate.get(item.date) ?? [];
    list.push(item);
    byDate.set(item.date, list);
  }

  for (const [date, list] of byDate) {
    const sorted = [...list].sort((a, b) => toMinutes(a.startTime!) - toMinutes(b.startTime!));
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i]!;
      const aStart = toMinutes(a.startTime!);
      const aEnd = aStart + a.duration;

      for (let j = i + 1; j < sorted.length; j++) {
        const b = sorted[j]!;
        const bStart = toMinutes(b.startTime!);
        if (bStart >= aEnd) {
          // b starts after a ends → measure the gap (soft conflict candidate)
          const gap = bStart - aEnd;
          if (gap < minBreakMinutes) {
            conflicts.push({
              type: 'soft',
              date,
              a: endpoint(a),
              b: endpoint(b),
              gap,
            });
          }
          // Items are sorted; no later item overlaps `a`, stop scanning for it.
          break;
        }
        // Overlap → hard conflict
        conflicts.push({ type: 'hard', date, a: endpoint(a), b: endpoint(b) });
      }
    }
  }

  return conflicts;
}

function endpoint(i: CalendarItem) {
  return {
    id: i.id,
    title: i.title,
    startTime: i.startTime!,
    endTime: i.endTime ?? i.startTime!,
  };
}

/** Per-day workload vs. available capacity. */
export function computeCapacity(
  items: CalendarItem[],
  dateKeys: string[],
  availableMinutes: number,
): DayCapacity[] {
  const plannedByDate = new Map<string, number>();
  for (const item of items) {
    plannedByDate.set(item.date, (plannedByDate.get(item.date) ?? 0) + item.duration);
  }

  return dateKeys.map((date) => {
    const planned = plannedByDate.get(date) ?? 0;
    const loadPct = availableMinutes > 0 ? Math.round((planned / availableMinutes) * 100) : 0;
    let status: CapacityStatus = 'normal';
    if (loadPct > 100) status = 'overloaded';
    else if (loadPct >= 80) status = 'tight';

    return { date, plannedMinutes: planned, availableMinutes, loadPct, status };
  });
}
