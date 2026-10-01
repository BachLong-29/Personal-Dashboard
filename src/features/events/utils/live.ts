import { toLocalDate } from '@/features/tasks/utils/date.utils';
import type { EventOccurrence } from '@/types';

/** How often a view should re-ask; a minute either side is invisible to a reader. */
export const LIVE_TICK_MS = 30_000;

/**
 * How long a timed occurrence lasts when nobody said. `duration` is optional on
 * the series and arrives as 0 here, which read literally would mean such an
 * event is never under way for even a moment.
 */
const ASSUMED_DURATION_MINUTES = 60;

/**
 * Is this occurrence under way at `now`?
 *
 * An all-day occurrence owns the whole of its date. That makes the marquee and
 * the LIVE badge burn all day on a day that has one, which is the honest
 * answer: the event really is on, and a reader who marked it all-day means
 * exactly that.
 */
export function isEventLive(occ: EventOccurrence, now: Date): boolean {
  if (occ.date !== toLocalDate(now)) return false;
  if (occ.allDay) return true;
  if (!occ.startTime) return false;

  const [h = 0, m = 0] = occ.startTime.split(':').map(Number);
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const start = h * 60 + m;
  const duration = occ.duration > 0 ? occ.duration : ASSUMED_DURATION_MINUTES;

  return minutesNow >= start && minutesNow < start + duration;
}
