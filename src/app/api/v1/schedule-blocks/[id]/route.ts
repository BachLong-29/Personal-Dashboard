import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { ScheduleBlockModel } from '@/server/models/schedule-block.model';
import { asyncHandler, notFoundResponse, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';
import { serialize } from '../route';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const updateSchema = z.object({
  date: z.string().regex(DATE_RE, 'Must be YYYY-MM-DD').optional(),
  startTime: z.string().regex(TIME_RE, 'Must be HH:MM').optional(),
  duration: z.number().int().min(1).max(1440).optional(),
  status: z.enum(['planned', 'done', 'missed']).optional(),
});

// PATCH /api/v1/schedule-blocks/:id
export const PATCH = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  const { data, error } = await validateBody(req, updateSchema);
  if (error) return error;

  await connectDB();

  const setData: Record<string, unknown> = {};
  if (data.date) setData.date = new Date(data.date);
  if (data.startTime) setData.startTime = data.startTime;
  if (data.duration !== undefined) setData.duration = data.duration;
  if (data.status) setData.status = data.status;

  const block = await ScheduleBlockModel.findOneAndUpdate(
    { _id: id, userId: user.sub },
    { $set: setData },
    { new: true },
  );

  if (!block) return notFoundResponse('Schedule block not found');

  return successResponse(serialize(block), 'Schedule block updated');
});

// DELETE /api/v1/schedule-blocks/:id
export const DELETE = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  await connectDB();

  const block = await ScheduleBlockModel.findOneAndDelete({ _id: id, userId: user.sub });

  if (!block) return notFoundResponse('Schedule block not found');

  return successResponse(null, 'Schedule block deleted');
});
