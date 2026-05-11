import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { QuestModel } from '@/server/models/quest.model';
import { asyncHandler, notFoundResponse, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';
import type { Quest } from '@/types/quest';
import type { IQuest } from '@/server/models/quest.model';

const updateSchema = z.object({
  done: z.boolean(),
});

function serialize(q: IQuest): Quest {
  return {
    id: q._id.toString(),
    userId: q.userId.toString(),
    title: q.title,
    desc: q.desc,
    type: q.type,
    difficulty: q.difficulty,
    xp: q.xp,
    coins: q.coins,
    done: q.done,
    tags: q.tags,
    dueDate: q.dueDate.toISOString(),
    completedAt: q.completedAt?.toISOString(),
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
  };
}

// PATCH /api/v1/quests/:id
export const PATCH = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  const { data, error } = await validateBody(req, updateSchema);
  if (error) return error;

  await connectDB();

  const quest = await QuestModel.findOneAndUpdate(
    { _id: id, userId: user.sub },
    {
      done: data.done,
      completedAt: data.done ? new Date() : null,
    },
    { new: true },
  );

  if (!quest) return notFoundResponse('Quest not found');

  return successResponse(serialize(quest), 'Quest updated');
});
