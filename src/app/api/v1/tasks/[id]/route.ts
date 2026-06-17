import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { TaskModel } from '@/server/models/task.model';
import { asyncHandler, notFoundResponse, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';
import type { Task } from '@/types/task';
import type { ITask } from '@/server/models/task.model';

const TASK_COLORS = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'] as const;
const TASK_STATUSES = ['todo', 'in_progress', 'pending', 'waiting', 'done'] as const;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const dateField = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  note: z.string().max(500).optional().nullable(),
  tagId: z.string().min(1).optional(),
  color: z.enum(TASK_COLORS).optional(),
  icon: z.string().min(1).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  duration: z.number().int().min(1).max(1440).optional().nullable(),
  startDate: dateField.optional(),
  /** HH:MM — null to clear the field */
  startTime: z.string().regex(TIME_RE, 'Must be HH:MM').optional().nullable(),
  endDate: dateField.optional().nullable(),
  dependencies: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  deferReason: z.string().max(200).optional().nullable(),
  /** null detaches the task from its project */
  projectId: z.string().optional().nullable(),
});

function serialize(t: ITask): Task {
  return {
    id: t._id.toString(),
    userId: t.userId.toString(),
    name: t.name,
    note: t.note,
    tagId: t.tagId,
    color: t.color,
    icon: t.icon,
    status: t.status,
    duration: t.duration,
    startDate: t.startDate.toISOString().substring(0, 10),
    startTime: t.startTime,
    endDate: t.endDate?.toISOString().substring(0, 10),
    deferReason: t.deferReason,
    projectId: t.projectId?.toString(),
    dependencies: t.dependencies.map((d) => d.toString()),
    active: t.active,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

// PATCH /api/v1/tasks/:id
export const PATCH = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  const { data, error } = await validateBody(req, updateSchema);
  if (error) return error;

  await connectDB();

  // Separate fields to $set vs $unset (null = remove the field)
  const setData: Record<string, unknown> = {};
  const unsetData: Record<string, 1> = {};

  // Scalar fields — copy non-null values to $set, null values to $unset
  const { startDate, endDate, duration, ...rest } = data;
  for (const [key, val] of Object.entries(rest)) {
    if (val === null) unsetData[key] = 1;
    else if (val !== undefined) setData[key] = val;
  }

  if (startDate) setData.startDate = new Date(startDate);

  if (endDate === null) unsetData.endDate = 1;
  else if (endDate) setData.endDate = new Date(endDate);

  if (duration === null) unsetData.duration = 1;
  else if (duration !== undefined) setData.duration = duration;

  const updateOp: Record<string, unknown> = {};
  if (Object.keys(setData).length > 0) updateOp.$set = setData;
  if (Object.keys(unsetData).length > 0) updateOp.$unset = unsetData;

  const task = await TaskModel.findOneAndUpdate({ _id: id, userId: user.sub }, updateOp, {
    new: true,
  });

  if (!task) return notFoundResponse('Task not found');

  return successResponse(serialize(task), 'Task updated');
});

// DELETE /api/v1/tasks/:id
export const DELETE = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  await connectDB();

  const task = await TaskModel.findOneAndUpdate(
    { _id: id, userId: user.sub },
    { active: false },
    { new: true },
  );

  if (!task) return notFoundResponse('Task not found');

  return successResponse(null, 'Task deleted');
});
