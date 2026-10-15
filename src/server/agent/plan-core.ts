/**
 * Pure placement logic for the assistant's day / week planner. No database and no clock:
 * everything it needs comes in as arguments, so it can be exercised on its own.
 */

/** Minutes since midnight, `[start, end)`. */
export type Interval = [number, number];

/** Slots start on a quarter hour so a plan reads like a person made it. */
const SLOT_STEP = 15;

export const roundUp = (minutes: number, step = SLOT_STEP) => Math.ceil(minutes / step) * step;

export function toMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
}

export function toTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/**
 * What is left of `window` once `busy` is taken out. Every busy block is widened by
 * `breakMinutes` on both sides, so nothing is placed back to back with a fixed commitment.
 */
export function freeIntervals(
  window: Interval,
  busy: Interval[],
  breakMinutes: number,
): Interval[] {
  const [open, close] = window;
  const blocks = busy
    .map(([start, end]): Interval => [start - breakMinutes, end + breakMinutes])
    .sort((a, b) => a[0] - b[0]);

  const free: Interval[] = [];
  let cursor = open;
  for (const [start, end] of blocks) {
    if (end <= cursor) continue;
    if (start > cursor) free.push([cursor, Math.min(start, close)]);
    cursor = Math.max(cursor, end);
    if (cursor >= close) break;
  }
  if (cursor < close) free.push([cursor, close]);
  return free.filter(([start, end]) => end > start);
}

export type PlanTask = {
  id: string;
  name: string;
  /** Minutes the task needs. */
  duration: number;
  /** First day it may be placed (`YYYY-MM-DD`): its own start date, if it has one. */
  notBefore?: string;
  /** Last day it may be placed: the end of a multi-day task. */
  notAfter?: string;
  /** Deadline-ish day used only for ordering. */
  due?: string;
  overdue: boolean;
  /** Spans several days: gets a session rather than a new start date. */
  multiDay: boolean;
};

export type Placement = {
  task: PlanTask;
  date: string;
  startTime: string;
  minutes: number;
};

export type Unplaced = { task: PlanTask; reason: string };

export type PlanInput = {
  /** Days that may receive work, ascending, today or later. */
  days: string[];
  /** Busy blocks already in the calendar, per day. */
  busyByDay: Map<string, Interval[]>;
  /** Minutes already planned per day, for the daily ceiling. */
  loadByDay: Map<string, number>;
  tasks: PlanTask[];
  /** The working day, `[start, end)` in minutes. */
  workday: Interval;
  breakMinutes: number;
  /** New work added to one day by this plan, so a week is spread rather than front-loaded. */
  maxNewPerDay: number;
  /** Planned + new minutes a day may reach. */
  dailyLimit: number;
  /** Today's key, and how far into it we already are. */
  today: string;
  nowMinutes: number;
};

const byUrgency = (a: PlanTask, b: PlanTask) =>
  Number(b.overdue) - Number(a.overdue) ||
  (a.due ?? '9999').localeCompare(b.due ?? '9999') ||
  (a.notBefore ?? '9999').localeCompare(b.notBefore ?? '9999') ||
  b.duration - a.duration ||
  a.name.localeCompare(b.name);

/** How full each day of the window ended up, so an empty day can be explained. */
export type DayLoad = {
  date: string;
  /** Minutes already in the calendar that day. */
  bookedMinutes: number;
  /** Minutes this plan adds. */
  addedMinutes: number;
};

/**
 * Most urgent task first. Where a task goes depends on what kind it is:
 *
 * - **Dated, single-day** (its own start date) or **overdue**: the earliest day it may use,
 *   so a task the user dated keeps to that day and a late one is not pushed back.
 * - **Undated** or **spanning several days**: the least loaded day it may use, earliest on
 *   a tie, so a week is spread across its days instead of filled from Monday.
 *
 * Either way a day needs a gap long enough and room under the daily ceilings. Deterministic:
 * the same calendar and the same tasks always give the same plan.
 */
export function planPlacements(input: PlanInput): {
  placed: Placement[];
  unplaced: Unplaced[];
  days: DayLoad[];
} {
  const { days, busyByDay, loadByDay, workday, breakMinutes, maxNewPerDay, dailyLimit } = input;

  // What this plan itself has added per day: it blocks time and counts toward the ceilings.
  const added = new Map<string, Interval[]>();
  const addedMinutes = new Map<string, number>();

  const placed: Placement[] = [];
  const unplaced: Unplaced[] = [];

  const loadOf = (day: string) => (loadByDay.get(day) ?? 0) + (addedMinutes.get(day) ?? 0);

  for (const task of [...input.tasks].sort(byUrgency)) {
    const usable = days.filter(
      (day) =>
        (!task.notBefore || day >= task.notBefore) && (!task.notAfter || day <= task.notAfter),
    );
    // Dated single-day and overdue tasks keep the earliest-first order `days` already has.
    const balanced = !task.overdue && (task.multiDay || !task.notBefore);
    const allowed = balanced
      ? [...usable].sort((a, b) => loadOf(a) - loadOf(b) || a.localeCompare(b))
      : usable;
    if (allowed.length === 0) {
      unplaced.push({ task, reason: 'none of its days fall inside the planning window' });
      continue;
    }

    let done = false;
    let tooLong = true;
    for (const day of allowed) {
      const newToday = addedMinutes.get(day) ?? 0;
      if (newToday + task.duration > maxNewPerDay) continue;
      if ((loadByDay.get(day) ?? 0) + newToday + task.duration > dailyLimit) continue;

      const open =
        day === input.today ? Math.max(workday[0], roundUp(input.nowMinutes)) : workday[0];
      const busy = [...(busyByDay.get(day) ?? []), ...(added.get(day) ?? [])];

      for (const [from, to] of freeIntervals([open, workday[1]], busy, breakMinutes)) {
        const start = roundUp(from);
        if (start + task.duration > to) continue;
        tooLong = false;

        placed.push({ task, date: day, startTime: toTime(start), minutes: task.duration });
        added.set(day, [...(added.get(day) ?? []), [start, start + task.duration]]);
        addedMinutes.set(day, newToday + task.duration);
        done = true;
        break;
      }
      if (done) break;
    }

    if (!done) {
      unplaced.push({
        task,
        reason: tooLong
          ? `no free gap of ${task.duration} min in the working hours`
          : 'the days it may use are full',
      });
    }
  }

  return {
    placed,
    unplaced,
    days: days.map((date) => ({
      date,
      bookedMinutes: loadByDay.get(date) ?? 0,
      addedMinutes: addedMinutes.get(date) ?? 0,
    })),
  };
}
