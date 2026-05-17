import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { TaskModel } from '@/server/models/task.model';
import {
  asyncHandler,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from '@/server';
import { validateBody } from '@/server/validate';
import type { Task } from '@/types/task';
import type { ITask } from '@/server/models/task.model';

const TASK_COLORS = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'] as const;
const TASK_STATUSES = ['todo', 'in_progress', 'pending', 'waiting', 'done'] as const;

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  note: z.string().max(500).optional().nullable(),
  tagId: z.string().min(1).optional(),
  color: z.enum(TASK_COLORS).optional(),
  icon: z.string().min(1).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  startDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  endDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  dependencies: z.array(z.string()).optional(),
  active: z.boolean().optional(),
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
    startDate: t.startDate.toISOString().substring(0, 10),
    endDate: t.endDate.toISOString().substring(0, 10),
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

  const updateData: Record<string, unknown> = { ...data };
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);

  const task = await TaskModel.findOneAndUpdate(
    { _id: id, userId: user.sub },
    { $set: updateData },
    { new: true },
  );

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
