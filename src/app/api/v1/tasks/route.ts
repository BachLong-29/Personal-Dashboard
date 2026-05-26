import mongoose from 'mongoose';
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

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const createSchema = z.object({
  name:         z.string().min(1).max(100),
  note:         z.string().max(500).optional(),
  tagId:        z.string().min(1),
  color:        z.enum(TASK_COLORS),
  icon:         z.string().min(1),
  duration:     z.number().int().min(1).max(1440).optional(),
  startDate:    dateField,
  startTime:    z.string().regex(TIME_RE, 'Must be HH:MM').optional(),
  endDate:      dateField.optional(),
  /** Habit ObjectId — marks this task as a one-day replacement for that habit */
  habitRef:     z.string().optional(),
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
    startTime:    t.startTime,
    endDate:      t.endDate?.toISOString().substring(0, 10),
    habitRef:     t.habitRef?.toString(),
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

  // ✓ Use req.nextUrl.searchParams — not req directly
  const { data: query, error: queryError } = await validateSearchParams(req.nextUrl.searchParams, querySchema);
  if (queryError) return queryError;

  await connectDB();

  const filter: Record<string, unknown> = { userId: user.sub, active: true };

  if (query?.start || query?.end) {
    // All dates are stored as UTC midnight (new Date("YYYY-MM-DD")).
    // Add 1 day to the end bound so the query-end day is included ($lt exclusive).
    const qStart        = query.start ? new Date(query.start) : null;
    const qEndExclusive = query.end
      ? new Date(new Date(query.end).getTime() + 86_400_000)
      : null;

    // ── Single-day tasks (no endDate) ────────────────────────────────────────
    // Must have startDate within [qStart, qEnd].
    const singleDayFilter: Record<string, unknown> = { endDate: { $exists: false } };
    const startRange: Record<string, Date> = {};
    if (qStart)        startRange.$gte = qStart;
    if (qEndExclusive) startRange.$lt  = qEndExclusive;
    if (Object.keys(startRange).length > 0) singleDayFilter.startDate = startRange;

    // ── Multi-day tasks (has endDate) ─────────────────────────────────────────
    // Date range must OVERLAP [qStart, qEnd]:
    //   startDate < qEndExclusive  AND  endDate >= qStart
    const endDateFilter: Record<string, unknown> = { $exists: true };
    if (qStart) endDateFilter.$gte = qStart;

    const multiDayFilter: Record<string, unknown> = { endDate: endDateFilter };
    if (qEndExclusive) multiDayFilter.startDate = { $lt: qEndExclusive };

    filter.$or = [singleDayFilter, multiDayFilter];
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
    startTime:    data.startTime,
    endDate,
    habitRef:     data.habitRef ? new mongoose.Types.ObjectId(data.habitRef) : undefined,
    dependencies: data.dependencies,
  });

  return createdResponse(serialize(task), 'Task created successfully');
});
