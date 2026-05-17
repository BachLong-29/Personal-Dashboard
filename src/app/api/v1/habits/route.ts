import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { HabitModel } from '@/server/models/habit.model';
import { asyncHandler, createdResponse, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';
import type { Habit } from '@/types/habit';
import type { IHabit } from '@/server/models/habit.model';

const HABIT_COLORS = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'] as const;

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  days: z
    .array(z.number().min(0).max(6))
    .min(1, 'At least one day is required')
    .max(7),
  note: z.string().max(500).optional(),
  tagId: z.string().min(1, 'Tag is required'),
  color: z.enum(HABIT_COLORS),
  icon: z.string().min(1, 'Icon is required'),
});

function serialize(h: IHabit): Habit {
  return {
    id: h._id.toString(),
    userId: h.userId.toString(),
    name: h.name,
    days: h.days,
    note: h.note,
    tagId: h.tagId,
    color: h.color,
    icon: h.icon,
    active: h.active,
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
  };
}

// GET /api/v1/habits
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  await connectDB();

  const habits = await HabitModel.find({ userId: user.sub, active: true }).sort({ createdAt: 1 });

  return successResponse(habits.map(serialize));
});

// POST /api/v1/habits
export const POST = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data, error } = await validateBody(req, createSchema);
  if (error) return error;

  await connectDB();

  const habit = await HabitModel.create({
    userId: user.sub,
    name: data.name,
    days: data.days,
    note: data.note,
    tagId: data.tagId,
    color: data.color,
    icon: data.icon,
  });

  return createdResponse(serialize(habit), 'Habit created successfully');
});
