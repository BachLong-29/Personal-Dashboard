import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { QuestModel } from '@/server/models/quest.model';
import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

// POST /api/v1/quests/rollover
// Moves all undone quests with dueDate < today to today
export const POST = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  await connectDB();

  const today = startOfDay(new Date());

  const result = await QuestModel.updateMany(
    { userId: user.sub, done: false, dueDate: { $lt: today } },
    { $set: { dueDate: today } },
  );

  return successResponse({ rolledOver: result.modifiedCount });
});
