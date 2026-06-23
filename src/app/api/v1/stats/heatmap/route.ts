import type { NextRequest } from 'next/server';
import mongoose from 'mongoose';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { HabitLogModel } from '@/server/models/habit-log.model';
import { TaskLogModel } from '@/server/models/task-log.model';
import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';

// GET /api/v1/stats/heatmap
// Returns activity count per day for the last 365 days.
// activity = task logs worked + habit logs done
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  await connectDB();

  const from = new Date();
  from.setDate(from.getDate() - 364);
  from.setHours(0, 0, 0, 0);

  const userId = new mongoose.Types.ObjectId(user.sub);

  const [taskAggs, habitAggs] = await Promise.all([
    TaskLogModel.aggregate([
      { $match: { userId, date: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 },
        },
      },
    ]),
    HabitLogModel.aggregate([
      { $match: { userId, date: { $gte: from }, done: true } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const activityMap: Record<string, number> = {};
  for (const row of taskAggs)
    activityMap[row._id as string] = (activityMap[row._id as string] ?? 0) + (row.count as number);
  for (const row of habitAggs)
    activityMap[row._id as string] = (activityMap[row._id as string] ?? 0) + (row.count as number);

  return successResponse({ activityMap });
});
