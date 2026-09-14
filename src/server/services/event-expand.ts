import { EventModel } from '@/server/models/event.model';
import type { IEvent } from '@/server/models/event.model';
import type { EventOccurrence } from '@/types/event';
import type { HabitDay } from '@/types/habit';
import type { TaskColor } from '@/types/task';

/**
 * Expands event rules into concrete occurrences for a date range.
 *
 * Nothing is materialised: this mirrors how habits are expanded from their
 * weekly rule on every read, rather than how finance recurring transactions are
 * generated and stored (those have to be, since they move a wallet balance).
 *
 * Dates are stored at UTC midnight (`new Date("YYYY-MM-DD")`) and keyed with
 * local components, matching `schedule-engine`.
 */

const DAY_MS = 86_400_000;
const DOW: HabitDay[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** Parse "YYYY-MM-DD" to a local-midnight Date. */
function parseDate(s: string): Date {
  const [y = 0, m = 1, d = 1] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/** Stored Date → "YYYY-MM-DD" using local components. */
function toKey(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Monday-anchored week start, so `interval` counts whole weeks. */
function weekStart(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
  return out;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Does a recurring event fall on this day? */
function matchesRule(event: IEvent, day: Date): boolean {
  const rule = event.recurrence;
  if (!rule) return false;

  const interval = Math.max(1, rule.interval ?? 1);
  const anchor = event.startDate;

  if (rule.freq === 'weekly') {
    if (!rule.days?.includes(DOW[day.getDay()] as HabitDay)) return false;
    if (interval === 1) return true;
    const weeks = Math.round(
      (weekStart(day).getTime() - weekStart(anchor).getTime()) / (7 * DAY_MS),
    );
    return weeks >= 0 && weeks % interval === 0;
  }

  // monthly — a dayOfMonth past the end of the month lands on its last day
  const wanted = rule.dayOfMonth ?? anchor.getDate();
  const last = daysInMonth(day.getFullYear(), day.getMonth());
  if (day.getDate() !== Math.min(wanted, last)) return false;
  if (interval === 1) return true;
  const months =
    (day.getFullYear() - anchor.getFullYear()) * 12 + (day.getMonth() - anchor.getMonth());
  return months >= 0 && months % interval === 0;
}

/** An override contributes date and time; everything else comes from the series. */
function toOccurrence(
  series: IEvent,
  date: string,
  override: IEvent | null,
  eventId: string,
): EventOccurrence {
  const allDay = series.allDay;
  const startTime = allDay ? null : (override?.startTime ?? series.startTime ?? null);
  const duration = allDay ? 0 : (override?.duration ?? series.duration ?? 0);

  return {
    id: `event:${eventId}:${date}`,
    eventId,
    title: series.title ?? '',
    note: series.note,
    tagId: series.tagId ?? '',
    color: (series.color ?? 'gold') as TaskColor,
    icon: series.icon ?? '',
    date,
    startTime,
    duration,
    allDay,
    busy: series.busy,
    isOverride: override !== null,
    seriesId: override ? series._id.toString() : undefined,
    recurring: Boolean(series.recurrence),
  };
}

export async function expandEvents(
  userId: string,
  fromStr: string,
  toStr: string,
): Promise<EventOccurrence[]> {
  const from = parseDate(fromStr);
  const toEnd = new Date(parseDate(toStr).getTime() + DAY_MS); // exclusive next midnight
  const inRange = { $gte: from, $lt: toEnd };

  const rows = await EventModel.find({
    userId,
    active: true,
    $or: [
      // Series overlapping the range — an open-ended rule has no endDate.
      { recurrence: { $exists: true }, startDate: { $lt: toEnd } },
      // One-off events, and override rows landing inside the range.
      { startDate: inRange },
      // Overrides of a day inside the range, even when moved outside it — they
      // still have to suppress the occurrence the rule would generate.
      { overrideDate: inRange },
    ],
  });

  const seriesById = new Map<string, IEvent>();
  const overrides: { row: IEvent; seriesId: string }[] = [];
  const standalone: IEvent[] = [];

  for (const row of rows) {
    if (row.seriesRef) overrides.push({ row, seriesId: row.seriesRef.toString() });
    else {
      seriesById.set(row._id.toString(), row);
      if (!row.recurrence) standalone.push(row);
    }
  }

  // A series can sit outside the loaded set when only its override matched.
  const missing = [
    ...new Set(overrides.map((o) => o.seriesId).filter((id) => !seriesById.has(id))),
  ];
  if (missing.length > 0) {
    const extra = await EventModel.find({ userId, _id: { $in: missing } });
    for (const row of extra) seriesById.set(row._id.toString(), row);
  }

  // `<seriesId>:<originalDate>` → the row replacing that occurrence.
  const overrideByOccurrence = new Map<string, IEvent>();
  for (const { row, seriesId } of overrides) {
    if (!row.overrideDate) continue;
    overrideByOccurrence.set(`${seriesId}:${toKey(row.overrideDate)}`, row);
  }

  const out: EventOccurrence[] = [];

  // ── Recurring series ────────────────────────────────────────────────────
  for (const series of seriesById.values()) {
    if (!series.recurrence || !series.active) continue;
    const sid = series._id.toString();

    for (let d = new Date(from); toKey(d) <= toStr; d.setDate(d.getDate() + 1)) {
      const key = toKey(d);
      if (key < toKey(series.startDate)) continue;
      if (series.endDate && key > toKey(series.endDate)) continue;
      if (!matchesRule(series, d)) continue;
      // An overridden day is emitted from the override row instead, below.
      if (overrideByOccurrence.has(`${sid}:${key}`)) continue;

      out.push(toOccurrence(series, key, null, sid));
    }
  }

  // ── One-off events ──────────────────────────────────────────────────────
  for (const event of standalone) {
    const key = toKey(event.startDate);
    if (key < fromStr || key > toStr) continue;
    out.push(toOccurrence(event, key, null, event._id.toString()));
  }

  // ── Overrides that land inside the range ────────────────────────────────
  for (const { row, seriesId } of overrides) {
    if (row.cancelled) continue;
    const key = toKey(row.startDate);
    if (key < fromStr || key > toStr) continue;
    const series = seriesById.get(seriesId);
    if (!series || !series.active) continue;
    out.push(toOccurrence(series, key, row, row._id.toString()));
  }

  return out.sort(
    (a, b) => a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? ''),
  );
}
