import { z } from 'zod';

import { CategoryModel } from '@/server/models/category.model';
import { ScheduleBlockModel } from '@/server/models/schedule-block.model';
import { TaskModel } from '@/server/models/task.model';
import type { ITask } from '@/server/models/task.model';

import type { ToolSpec } from './llm';

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

const listTasksArgs = z.object({
  start: ymd.optional().describe('First day to include, YYYY-MM-DD'),
  end: ymd.optional().describe('Last day to include, YYYY-MM-DD'),
  q: z.string().max(100).optional().describe('Search text in the task name'),
  limit: z.number().int().min(1).max(50).optional().describe('Max results, default 20'),
});

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
/** A session with no stated length is booked for this long. */
const DEFAULT_SESSION_MINUTES = 60;

const createTaskArgs = z
  .object({
    name: z.string().min(1).max(100).describe('Short task title'),
    tagId: z
      .string()
      .optional()
      .describe('Category id from list_categories. Omit to use the first category.'),
    startDate: ymd.optional().describe('Day the task starts, YYYY-MM-DD'),
    endDate: ymd.optional().describe('Last day, YYYY-MM-DD. Omit for a single-day task.'),
    startTime: z
      .string()
      .regex(TIME_RE, 'Use 24-hour HH:MM')
      .optional()
      .describe(
        'Time of day the user wants to do it, 24-hour HH:MM (10am = "10:00"). When set, a session is booked on startDate at this time. Omit when the user gave no time.',
      ),
    duration: z
      .number()
      .int()
      .min(1)
      .max(1440)
      .optional()
      .describe('Minutes. Also the session length when startTime is set (default 60).'),
    note: z.string().max(500).optional(),
  })
  .refine((args) => !args.startTime || Boolean(args.startDate), {
    message: 'startDate is required when startTime is given',
    path: ['startDate'],
  });

const completeTaskArgs = z.object({
  id: z.string().min(1).describe('Task id from list_tasks'),
});

const noArgs = z.object({});

const DEFAULT_COLOR = 'gold';
const DEFAULT_ICON = '📝';

/** Tools the assistant may run on its own — they only read. */
const READ_TOOLS = {
  list_tasks: {
    description: "List the user's tasks, optionally within a date range or matching a search text.",
    schema: listTasksArgs,
  },
  list_categories: {
    description: "List the user's task categories (id and name). Call before create_task.",
    schema: noArgs,
  },
} as const;

/** Tools that change data. The assistant only proposes them; the user confirms. */
const WRITE_TOOLS = {
  create_task: {
    description: 'Propose creating a task. The user must confirm before it is saved.',
    schema: createTaskArgs,
  },
  complete_task: {
    description: 'Propose marking a single-day task as done. The user must confirm.',
    schema: completeTaskArgs,
  },
} as const;

export type ReadToolName = keyof typeof READ_TOOLS;
export type WriteToolName = keyof typeof WRITE_TOOLS;

export type PendingAction = {
  tool: WriteToolName;
  args: Record<string, unknown>;
  /** One line for the confirm button, e.g. `Create "Study" on 2026-10-16`. */
  summary: string;
};

function spec(name: string, tool: { description: string; schema: z.ZodType }): ToolSpec {
  const parameters = z.toJSONSchema(tool.schema) as Record<string, unknown>;
  // Not every provider accepts these keys; validation happens server-side with zod anyway.
  delete parameters.$schema;
  delete parameters.additionalProperties;
  return { type: 'function', function: { name, description: tool.description, parameters } };
}

export const TOOL_SPECS: ToolSpec[] = [
  ...Object.entries(READ_TOOLS).map(([name, tool]) => spec(name, tool)),
  ...Object.entries(WRITE_TOOLS).map(([name, tool]) => spec(name, tool)),
];

export function isReadTool(name: string): name is ReadToolName {
  return name in READ_TOOLS;
}

export function isWriteTool(name: string): name is WriteToolName {
  return name in WRITE_TOOLS;
}

function brief(task: ITask) {
  return {
    id: task._id.toString(),
    name: task.name,
    status: task.status,
    startDate: task.startDate?.toISOString().slice(0, 10),
    endDate: task.endDate?.toISOString().slice(0, 10),
    duration: task.duration,
    tagId: task.tagId,
  };
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Runs a read tool for `userId`. Bad arguments come back as an error object for the model. */
export async function runReadTool(
  name: ReadToolName,
  rawArgs: unknown,
  userId: string,
): Promise<unknown> {
  const parsed = READ_TOOLS[name].schema.safeParse(rawArgs);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join('; ') };

  if (name === 'list_categories') {
    const categories = await CategoryModel.find({ userId }).sort({ createdAt: 1 });
    return categories.map((c) => ({ id: c._id.toString(), name: c.name }));
  }

  const args = parsed.data as z.infer<typeof listTasksArgs>;
  const filter: Record<string, unknown> = { userId, active: true };
  if (args.q) filter.name = { $regex: escapeRegex(args.q), $options: 'i' };
  if (args.start || args.end) {
    const range: Record<string, Date> = {};
    if (args.start) range.$gte = new Date(args.start);
    if (args.end) range.$lt = new Date(new Date(args.end).getTime() + 86_400_000);
    filter.startDate = range;
  }
  const tasks = await TaskModel.find(filter)
    .sort({ startDate: 1 })
    .limit(args.limit ?? 20);
  return tasks.map(brief);
}

/** Validates a proposed write and turns it into something the user can confirm. */
export function proposeAction(
  name: WriteToolName,
  rawArgs: unknown,
): PendingAction | { error: string } {
  const parsed = WRITE_TOOLS[name].schema.safeParse(rawArgs);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join('; ') };

  if (name === 'create_task') {
    const args = parsed.data as z.infer<typeof createTaskArgs>;
    if (args.startDate && args.endDate && args.endDate < args.startDate) {
      return { error: 'endDate must not be before startDate' };
    }
    const day = args.startDate ? ` on ${args.startDate}` : '';
    const at = args.startTime ? ` at ${args.startTime}` : '';
    const minutes = args.startTime ? (args.duration ?? DEFAULT_SESSION_MINUTES) : args.duration;
    const length = minutes ? ` (${minutes} min)` : '';
    return { tool: name, args, summary: `Create "${args.name}"${day}${at}${length}` };
  }

  const args = parsed.data as z.infer<typeof completeTaskArgs>;
  return { tool: name, args, summary: 'Mark the task as done' };
}

export type ExecuteResult = { ok: boolean; message: string };

/** Performs a confirmed write. Everything is re-validated and scoped to `userId`. */
export async function executeAction(
  name: string,
  rawArgs: unknown,
  userId: string,
): Promise<ExecuteResult> {
  if (!isWriteTool(name)) return { ok: false, message: `Unknown action: ${name}` };

  const proposal = proposeAction(name, rawArgs);
  if ('error' in proposal) return { ok: false, message: proposal.error };

  if (name === 'create_task') {
    const args = proposal.args as z.infer<typeof createTaskArgs>;

    // The category must belong to the user; fall back to their first one.
    const categories = await CategoryModel.find({ userId }).sort({ createdAt: 1 });
    const tag = categories.find((c) => c._id.toString() === args.tagId) ?? categories[0];
    if (!tag) return { ok: false, message: 'Create a category first.' };

    // With a time the task is also a booked session, so its length is known either way.
    const minutes = args.startTime ? (args.duration ?? DEFAULT_SESSION_MINUTES) : args.duration;

    const task = await TaskModel.create({
      userId,
      name: args.name,
      note: args.note,
      tagId: tag._id.toString(),
      color: DEFAULT_COLOR,
      icon: DEFAULT_ICON,
      duration: minutes,
      startDate: args.startDate ? new Date(args.startDate) : undefined,
      endDate: args.endDate ? new Date(args.endDate) : undefined,
      dependencies: [],
      attachments: [],
    });

    if (!args.startTime || !args.startDate || !minutes) {
      return { ok: true, message: `Created "${task.name}".` };
    }

    // Same record `POST /schedule-blocks` writes: this is what puts the task on the day's
    // timeline at that hour.
    try {
      await ScheduleBlockModel.create({
        userId,
        sourceType: 'task',
        sourceId: task._id,
        date: new Date(args.startDate),
        startTime: args.startTime,
        duration: minutes,
      });
    } catch (error) {
      console.error('[agent] session not booked', error);
      return {
        ok: false,
        message: `Created "${task.name}" but could not book the ${args.startTime} session.`,
      };
    }
    return {
      ok: true,
      message: `Created "${task.name}" and booked ${args.startTime} on ${args.startDate} (${minutes} min).`,
    };
  }

  const args = proposal.args as z.infer<typeof completeTaskArgs>;
  const task = await TaskModel.findOne({ _id: args.id, userId, active: true }).catch(() => null);
  if (!task) return { ok: false, message: 'Task not found.' };

  const multiDay =
    task.startDate && task.endDate && task.endDate.getTime() > task.startDate.getTime();
  if (multiDay) {
    // Multi-day tasks are ticked per day through task logs in the app.
    return { ok: false, message: 'This task spans several days — complete it from the app.' };
  }

  task.status = 'done';
  await task.save();
  return { ok: true, message: `Marked "${task.name}" as done.` };
}
