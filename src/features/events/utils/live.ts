import { toLocalDate } from '@/features/tasks/utils/date.utils';
import type { EventOccurrence } from '@/types';

/** How often a view should re-ask; a minute either side is invisible to a reader. */
export const LIVE_TICK_MS = 30_000;

/**
 * Is this occurrence under way at `now`?
 *
 * An all-day event is deliberately never "live": it is on from midnight, and
 * every caller is asking whether something is happening at this moment.
 */
export function isEventLive(occ: EventOccurrence, now: Date): boolean {
  if (occ.allDay || !occ.startTime || occ.duration <= 0) return false;
  if (occ.date !== toLocalDate(now)) return false;

  const [h = 0, m = 0] = occ.startTime.split(':').map(Number);
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const start = h * 60 + m;
  return minutesNow >= start && minutesNow < start + occ.duration;
}
