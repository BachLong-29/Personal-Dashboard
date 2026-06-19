import mongoose from 'mongoose';
import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { ScheduleBlockModel } from '@/server/models/schedule-block.model';
import { TaskModel } from '@/server/models/task.model';
import { QuestModel } from '@/server/models/quest.model';
import {
  asyncHandler,
  createdResponse,
  errorResponse,
  successResponse,
  unauthorizedResponse,
} from '@/server';
import { validateBody, validateSearchParams } from '@/server/validate';
import type { ScheduleBlock } from '@/types/schedule-block';
import type { IScheduleBlock } from '@/server/models/schedule-block.model';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const createSchema = z.object({
  sourceType: z.enum(['task', 'quest']),
  sourceId: z.string().min(1),
  date: z.string().regex(DATE_RE, 'Must be YYYY-MM-DD'),
  startTime: z.string().regex(TIME_RE, 'Must be HH:MM'),
  duration: z.number().int().min(1).max(1440),
});

const querySchema = z.object({
  from: z.string().regex(DATE_RE).optional(),
  to: z.string().regex(DATE_RE).optional(),
  sourceType: z.enum(['task', 'quest']).optional(),
  sourceId: z.string().optional(),
});

export function serialize(b: IScheduleBlock): ScheduleBlock {
  return {
    id: b._id.toString(),
    userId: b.userId.toString(),
    sourceType: b.sourceType,
    sourceId: b.sourceId.toString(),
    date: b.date.toISOString().substring(0, 10),
    startTime: b.startTime,
    duration: b.duration,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

// GET /api/v1/schedule-blocks?from=&to=&sourceType=&sourceId=
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data: query, error } = await validateSearchParams(req.nextUrl.searchParams, querySchema);
  if (error) return error;

  await connectDB();

  const filter: Record<string, unknown> = { userId: user.sub };

  if (query?.from || query?.to) {
    const range: Record<string, Date> = {};
    if (query.from) range.$gte = new Date(query.from);
    // include the whole `to` day ($lt exclusive on the next midnight)
    if (query.to) range.$lt = new Date(new Date(query.to).getTime() + 86_400_000);
    filter.date = range;
  }
  if (query?.sourceType) filter.sourceType = query.sourceType;
  if (query?.sourceId) filter.sourceId = query.sourceId;

  const blocks = await ScheduleBlockModel.find(filter).sort({ date: 1, startTime: 1 });
  return successResponse(blocks.map(serialize));
});

// POST /api/v1/schedule-blocks
export const POST = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data, error } = await validateBody(req, createSchema);
  if (error) return error;

  await connectDB();

  // Verify the source belongs to this user before scheduling against it.
  const source =
    data.sourceType === 'task'
      ? await TaskModel.findOne({ _id: data.sourceId, userId: user.sub }).lean()
      : await QuestModel.findOne({ _id: data.sourceId, userId: user.sub }).lean();
  if (!source) return errorResponse(`${data.sourceType} not found`, 404);

  const block = await ScheduleBlockModel.create({
    userId: user.sub,
    sourceType: data.sourceType,
    sourceId: new mongoose.Types.ObjectId(data.sourceId),
    date: new Date(data.date),
    startTime: data.startTime,
    duration: data.duration,
  });

  return createdResponse(serialize(block), 'Schedule block created');
});
