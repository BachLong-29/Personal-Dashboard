import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { HabitLogModel } from '@/server/models/habit-log.model';
import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';
import { validateBody, validateSearchParams } from '@/server/validate';
import type { HabitLog } from '@/types/habit';
import type { IHabitLog } from '@/server/models/habit-log.model';

const listSchema = z.object({
  date: z.string().optional(),
});

const upsertSchema = z.object({
  habitId: z.string().min(1),
  date: z.string().min(1),
  done: z.boolean(),
});

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function serialize(log: IHabitLog): HabitLog {
  return {
    id: log._id.toString(),
    habitId: log.habitId.toString(),
    date: log.date.toISOString(),
    done: log.done,
    completedAt: log.completedAt?.toISOString(),
  };
}

// GET /api/v1/habits/logs?date=YYYY-MM-DD
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data: params, error } = validateSearchParams(req.nextUrl.searchParams, listSchema);
  if (error) return error;

  const targetDate = params?.date ? new Date(params.date) : new Date();

  await connectDB();

  const logs = await HabitLogModel.find({
    userId: user.sub,
    date: { $gte: startOfDay(targetDate), $lte: endOfDay(targetDate) },
  });

  return successResponse(logs.map(serialize));
});

// POST /api/v1/habits/logs — upsert (create or update) a log
export const POST = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data, error } = await validateBody(req, upsertSchema);
  if (error) return error;

  await connectDB();

  const date = startOfDay(new Date(data.date));

  const log = await HabitLogModel.findOneAndUpdate(
    { userId: user.sub, habitId: data.habitId, date },
    {
      done: data.done,
      completedAt: data.done ? new Date() : undefined,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return successResponse(serialize(log), 'Habit log updated');
});
