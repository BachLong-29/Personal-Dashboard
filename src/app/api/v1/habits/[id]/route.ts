import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { HabitModel } from '@/server/models/habit.model';
import {
  asyncHandler,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from '@/server';
import { validateBody } from '@/server/validate';
import type { Habit } from '@/types/habit';
import type { IHabit } from '@/server/models/habit.model';

const HABIT_COLORS = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'] as const;

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  days: z.array(z.number().min(0).max(6)).min(1).max(7).optional(),
  note: z.string().max(500).optional().nullable(),
  tagId: z.string().min(1).optional(),
  color: z.enum(HABIT_COLORS).optional(),
  icon: z.string().min(1).optional(),
  active: z.boolean().optional(),
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

// PATCH /api/v1/habits/:id
export const PATCH = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  const { data, error } = await validateBody(req, updateSchema);
  if (error) return error;

  await connectDB();

  const habit = await HabitModel.findOneAndUpdate(
    { _id: id, userId: user.sub },
    { $set: data },
    { new: true },
  );

  if (!habit) return notFoundResponse('Habit not found');

  return successResponse(serialize(habit), 'Habit updated');
});

// DELETE /api/v1/habits/:id
export const DELETE = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  await connectDB();

  const habit = await HabitModel.findOneAndUpdate(
    { _id: id, userId: user.sub },
    { active: false },
    { new: true },
  );

  if (!habit) return notFoundResponse('Habit not found');

  return successResponse(null, 'Habit deleted');
});
