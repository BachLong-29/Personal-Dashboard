import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { TaskModel } from '@/server/models/task.model';
import { asyncHandler, createdResponse, successResponse, unauthorizedResponse } from '@/server';
import { validateBody, validateSearchParams } from '@/server/validate';
import type { Task } from '@/types/task';
import type { ITask } from '@/server/models/task.model';

const TASK_COLORS = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'] as const;

const dateField = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

const createSchema = z.object({
  name:         z.string().min(1).max(100),
  note:         z.string().max(500).optional(),
  tagId:        z.string().min(1),
  color:        z.enum(TASK_COLORS),
  icon:         z.string().min(1),
  duration:     z.number().int().min(1).max(1440).optional(),
  startDate:    dateField,
  endDate:      dateField.optional(),
  dependencies: z.array(z.string()).optional().default([]),
});

const querySchema = z.object({
  start: z.string().optional(),
  end:   z.string().optional(),
});

function serialize(t: ITask): Task {
  return {
    id:           t._id.toString(),
    userId:       t.userId.toString(),
    name:         t.name,
    note:         t.note,
    tagId:        t.tagId,
    color:        t.color,
    icon:         t.icon,
    status:       t.status,
    duration:     t.duration,
    startDate:    t.startDate.toISOString().substring(0, 10),
    endDate:      t.endDate?.toISOString().substring(0, 10),
    dependencies: t.dependencies.map((d) => d.toString()),
    active:       t.active,
    createdAt:    t.createdAt.toISOString(),
    updatedAt:    t.updatedAt.toISOString(),
  };
}

// GET /api/v1/tasks?start=YYYY-MM-DD&end=YYYY-MM-DD
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data: query } = await validateSearchParams(req, querySchema);

  await connectDB();

  const filter: Record<string, unknown> = { userId: user.sub, active: true };

  if (query?.start || query?.end) {
    // For tasks WITH an endDate: task.startDate <= queryEnd AND task.endDate >= queryStart
    // For tasks WITHOUT an endDate (open-ended): always include them
    const orClauses: Record<string, unknown>[] = [{ endDate: { $exists: false } }];

    const withEnd: Record<string, unknown> = {};
    if (query.end)   withEnd.startDate = { $lte: new Date(query.end) };
    if (query.start) withEnd.endDate   = { $gte: new Date(query.start) };
    if (Object.keys(withEnd).length > 0) {
      orClauses.push(withEnd);
    }

    filter.$or = orClauses;
  }

  const tasks = await TaskModel.find(filter).sort({ startDate: 1 });

  return successResponse(tasks.map(serialize));
});

// POST /api/v1/tasks
export const POST = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data, error } = await validateBody(req, createSchema);
  if (error) return error;

  await connectDB();

  const startDate = new Date(data.startDate);
  const endDate   = data.endDate ? new Date(data.endDate) : undefined;

  if (endDate && endDate < startDate) {
    return successResponse(null, 'endDate must be >= startDate');
  }

  const task = await TaskModel.create({
    userId:       user.sub,
    name:         data.name,
    note:         data.note,
    tagId:        data.tagId,
    color:        data.color,
    icon:         data.icon,
    duration:     data.duration,
    startDate,
    endDate,
    dependencies: data.dependencies,
  });

  return createdResponse(serialize(task), 'Task created successfully');
});
