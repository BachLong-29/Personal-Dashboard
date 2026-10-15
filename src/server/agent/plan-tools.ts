import { z } from 'zod';

import { ScheduleBlockModel } from '@/server/models/schedule-block.model';
import { TaskModel } from '@/server/models/task.model';
import type { ITask } from '@/server/models/task.model';
import { buildCalendar, dateKeysBetween } from '@/server/services/schedule-engine';

import {
  freeIntervals,
  planPlacements,
  toMinutes,
  toTime,
  type Interval,
  type PlanTask,
  type Placement,
  type Unplaced,
} from './plan-core';

/**
 * Planner tools for the assistant. `get_free_time` only reads. `plan_schedule` is a write
 * tool like the rest: it places tasks in the calendar's free time and the placements come
 * back as ordinary `update_task` / `create_session` proposals for the user to confirm.
 */

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const time = z.string().regex(TIME_RE, 'Use 24-hour HH:MM');

/** A week and a bit: long enough to plan a week, short enough to keep the answer readable. */
const MAX_WINDOW_DAYS = 14;
const DEFAULT_DAY_START = '09:00';
const DEFAULT_DAY_END = '18:00';
const DEFAULT_BREAK_MINUTES = 15;
const DEFAULT_TASK_MINUTES = 60;
/** Most work this plan adds to one day, and the most a day may hold in total. */
const MAX_NEW_PER_DAY = 240;
const DAILY_LIMIT = 480;
/** Open tasks considered when none are named. */
const MAX_AUTO_TASKS = 30;

const windowArgs = {
  from: ymd.describe('First day of the window, YYYY-MM-DD. Days before today are skipped.'),
  to: ymd.describe(`Last day of the window, YYYY-MM-DD (at most ${MAX_WINDOW_DAYS} days).`),
  dayStart: time.optional().describe(`Start of the working day, default ${DEFAULT_DAY_START}`),
  dayEnd: time.optional().describe(`End of the working day, default ${DEFAULT_DAY_END}`),
};

const freeTimeArgs = z.object({
  ...windowArgs,
  minMinutes: z
    .number()
    .int()
    .min(5)
    .max(480)
    .optional()
    .describe('Only list gaps at least this long, default 30'),
});

const planScheduleArgs = z.object({
  ...windowArgs,
  taskIds: z
    .array(z.string().min(1))
    .min(1)
    .max(20)
    .optional()
    .describe(
      'Tasks to place, ids from list_tasks. Omit to place every open task that has no session booked yet.',
    ),
  breakMinutes: z
    .number()
    .int()
    .min(0)
    .max(60)
    .optional()
    .describe(`Gap kept around commitments, default ${DEFAULT_BREAK_MINUTES}`),
});

export const PLAN_READ_TOOLS = {
  get_free_time: {
    description:
      "List the free gaps in the user's calendar per day inside working hours. Use it to answer when they are free.",
    schema: freeTimeArgs,
  },
} as const;

export const PLAN_WRITE_TOOLS = {
  plan_schedule: {
    description:
      "Plan a day or a week: place tasks into the free time of the user's calendar and propose all placements at once. It reads the calendar itself, so do not look for gaps or place tasks one by one. Tasks keep to their own dates and the working hours. The user confirms before anything is saved.",
    schema: planScheduleArgs,
  },
} as const;

export type PlanReadToolName = keyof typeof PLAN_READ_TOOLS;
export type PlanWriteToolName = keyof typeof PLAN_WRITE_TOOLS;

/** What the planner needs to know about the caller's "now". */
export type PlanContext = { today: string; timezone: string };

const ymdOf = (date?: Date | null) => date?.toISOString().slice(0, 10);

/** Minutes since local midnight in `timezone`; falls back to UTC for an unknown zone. */
function localMinutes(timezone: string): number {
  const read = (zone: string) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
    return get('hour') * 60 + get('minute');
  };
  try {
    return read(timezone);
  } catch {
    return read('UTC');
  }
}

type Resolved = {
  days: string[];
  from: string;
  to: string;
  workday: Interval;
  nowMinutes: number;
};

/** Validates the window and drops the days already gone. */
function resolveWindow(
  args: { from: string; to: string; dayStart?: string; dayEnd?: string },
  ctx: PlanContext,
): Resolved | { error: string } {
  const workday: Interval = [
    toMinutes(args.dayStart ?? DEFAULT_DAY_START),
    toMinutes(args.dayEnd ?? DEFAULT_DAY_END),
  ];
  if (workday[1] <= workday[0]) return { error: 'dayEnd must be after dayStart' };
  if (args.to < args.from) return { error: 'to must not be before from' };

  const from = args.from < ctx.today ? ctx.today : args.from;
  if (args.to < from) return { error: 'That window is already in the past.' };

  const days = dateKeysBetween(from, args.to);
  if (days.length > MAX_WINDOW_DAYS) {
    return { error: `Plan at most ${MAX_WINDOW_DAYS} days at a time.` };
  }
  return { days, from, to: args.to, workday, nowMinutes: localMinutes(ctx.timezone) };
}

/** The calendar's timed commitments per day, as busy blocks, with each day's total. */
async function loadBusy(
  userId: string,
  from: string,
  to: string,
  ignoreTaskIds: Set<string>,
): Promise<{ busy: Map<string, Interval[]>; load: Map<string, number> }> {
  const items = await buildCalendar(userId, from, to);
  const busy = new Map<string, Interval[]>();
  const load = new Map<string, number>();

  for (const item of items) {
    if (!item.startTime || item.duration <= 0) continue;
    // An event marked "free" does not take the day's time.
    if (item.sourceType === 'event' && item.meta?.busy === false) continue;
    // Being re-planned: its old slot is not an obstacle to its new one.
    if (item.sourceType === 'task' && ignoreTaskIds.has(item.sourceId)) continue;

    const start = toMinutes(item.startTime);
    busy.set(item.date, [...(busy.get(item.date) ?? []), [start, start + item.duration]]);
    load.set(item.date, (load.get(item.date) ?? 0) + item.duration);
  }
  return { busy, load };
}

export async function runPlanReadTool(
  name: PlanReadToolName,
  rawArgs: unknown,
  userId: string,
  ctx: PlanContext,
): Promise<unknown> {
  const parsed = PLAN_READ_TOOLS[name].schema.safeParse(rawArgs);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join('; ') };

  const args = parsed.data;
  const resolved = resolveWindow(args, ctx);
  if ('error' in resolved) return resolved;

  const minGap = args.minMinutes ?? 30;
  const { busy } = await loadBusy(userId, resolved.from, resolved.to, new Set());

  return resolved.days.map((date) => {
    const open =
      date === ctx.today
        ? Math.max(resolved.workday[0], Math.ceil(resolved.nowMinutes / 15) * 15)
        : resolved.workday[0];
    const free = freeIntervals([open, resolved.workday[1]], busy.get(date) ?? [], 0)
      .filter(([start, end]) => end - start >= minGap)
      .map(([start, end]) => ({ start: toTime(start), end: toTime(end), minutes: end - start }));
    return { date, free };
  });
}

type PlanQuery = z.infer<typeof planScheduleArgs>;

export type PlanOutcome = {
  placed: Placement[];
  unplaced: Unplaced[];
  window: { from: string; to: string; dayStart: string; dayEnd: string };
};

/** Tasks the planner should place: the ones named, or every open task with nothing booked. */
async function candidateTasks(
  userId: string,
  query: PlanQuery,
  to: string,
): Promise<{ tasks: ITask[]; missing: string[]; named: boolean }> {
  if (query.taskIds) {
    const found = await TaskModel.find({
      _id: { $in: query.taskIds.filter((id) => /^[a-f\d]{24}$/i.test(id)) },
      userId,
      active: true,
    });
    const seen = new Set(found.map((t) => t._id.toString()));
    return {
      tasks: found,
      missing: query.taskIds.filter((id) => !seen.has(id)),
      named: true,
    };
  }

  const booked = await ScheduleBlockModel.distinct('sourceId', {
    userId,
    sourceType: 'task',
    status: 'planned',
  });
  const open = await TaskModel.find({
    userId,
    active: true,
    status: { $ne: 'done' },
    _id: { $nin: booked },
    $or: [{ startDate: null }, { startDate: { $lte: new Date(to) } }],
  })
    .sort({ startDate: 1, createdAt: 1 })
    .limit(MAX_AUTO_TASKS);
  return { tasks: open, missing: [], named: false };
}

function toPlanTask(task: ITask, today: string): PlanTask {
  const start = ymdOf(task.startDate);
  const end = ymdOf(task.endDate);
  const multiDay = Boolean(start && end && end > start);
  const last = end ?? start;
  return {
    id: task._id.toString(),
    name: task.name,
    duration: task.duration ?? DEFAULT_TASK_MINUTES,
    notBefore: start ?? undefined,
    notAfter: multiDay ? end : undefined,
    due: last ?? undefined,
    overdue: Boolean(last && last < today),
    multiDay,
  };
}

/** Works out where the tasks go. Writes nothing. */
export async function planSchedule(
  rawArgs: unknown,
  userId: string,
  ctx: PlanContext,
): Promise<PlanOutcome | { error: string }> {
  const parsed = PLAN_WRITE_TOOLS.plan_schedule.schema.safeParse(rawArgs);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join('; ') };

  const query = parsed.data;
  const resolved = resolveWindow(query, ctx);
  if ('error' in resolved) return resolved;

  const { tasks, missing, named } = await candidateTasks(userId, query, resolved.to);
  const unplaced: Unplaced[] = missing.map((id) => ({
    task: { id, name: id, duration: 0, overdue: false, multiDay: false },
    reason: 'task not found',
  }));

  const open: ITask[] = [];
  for (const task of tasks) {
    if (task.status === 'done') {
      unplaced.push({ task: toPlanTask(task, ctx.today), reason: 'already done' });
    } else {
      open.push(task);
    }
  }
  if (open.length === 0 && unplaced.length === 0) {
    return { error: 'There are no open tasks waiting for a slot.' };
  }

  // Tasks being re-planned must not collide with their own current sessions.
  const replanned = named ? new Set(open.map((t) => t._id.toString())) : new Set<string>();
  const { busy, load } = await loadBusy(userId, resolved.from, resolved.to, replanned);

  const result = planPlacements({
    days: resolved.days,
    busyByDay: busy,
    loadByDay: load,
    tasks: open.map((task) => toPlanTask(task, ctx.today)),
    workday: resolved.workday,
    breakMinutes: query.breakMinutes ?? DEFAULT_BREAK_MINUTES,
    maxNewPerDay: MAX_NEW_PER_DAY,
    dailyLimit: DAILY_LIMIT,
    today: ctx.today,
    nowMinutes: resolved.nowMinutes,
  });

  return {
    placed: result.placed,
    unplaced: [...unplaced, ...result.unplaced],
    window: {
      from: resolved.from,
      to: resolved.to,
      dayStart: toTime(resolved.workday[0]),
      dayEnd: toTime(resolved.workday[1]),
    },
  };
}
