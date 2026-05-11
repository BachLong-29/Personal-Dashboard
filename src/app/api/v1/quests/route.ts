import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { COIN_MAP, QuestModel, XP_MAP } from '@/server/models/quest.model';
import { asyncHandler, createdResponse, successResponse, unauthorizedResponse } from '@/server';
import { validateBody, validateSearchParams } from '@/server/validate';
import type { Quest } from '@/types/quest';
import type { IQuest } from '@/server/models/quest.model';

const QUEST_TYPES = ['focus', 'habit', 'reflect', 'admin', 'create', 'health', 'break'] as const;
const DIFFICULTIES = ['S', 'A', 'B', 'C', 'D'] as const;

const listSchema = z.object({
  date: z.string().optional(),
});

const createSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  desc: z.string().max(300).optional(),
  type: z.enum(QUEST_TYPES),
  difficulty: z.enum(DIFFICULTIES),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
});

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

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

// GET /api/v1/quests?date=YYYY-MM-DD
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data: params, error } = validateSearchParams(req.nextUrl.searchParams, listSchema);
  if (error) return error;

  const targetDate = params?.date ? new Date(params.date) : new Date();

  await connectDB();

  const quests = await QuestModel.find({
    userId: user.sub,
    dueDate: { $gte: startOfDay(targetDate), $lte: endOfDay(targetDate) },
  }).sort({ createdAt: 1 });

  return successResponse(quests.map(serialize));
});

// POST /api/v1/quests
export const POST = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data, error } = await validateBody(req, createSchema);
  if (error) return error;

  await connectDB();

  const dueDate = data.dueDate ? new Date(data.dueDate) : new Date();

  const quest = await QuestModel.create({
    userId: user.sub,
    title: data.title,
    desc: data.desc,
    type: data.type,
    difficulty: data.difficulty,
    xp: XP_MAP[data.difficulty],
    coins: COIN_MAP[data.difficulty],
    tags: data.tags ?? [data.type],
    dueDate,
  });

  return createdResponse(serialize(quest), 'Quest created successfully');
});
