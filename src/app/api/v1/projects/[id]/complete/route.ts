import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { ProjectModel } from '@/server/models/project.model';
import { TaskModel } from '@/server/models/task.model';
import { UserProfileModel } from '@/server/models/user-profile.model';
import { NotificationModel } from '@/server/models/notification.model';
import {
  asyncHandler,
  errorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from '@/server';
import { serialize } from '../../route';

// POST /api/v1/projects/:id/complete — award XP/coins once all tasks are done
export const POST = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  await connectDB();

  const project = await ProjectModel.findOne({ _id: id, userId: user.sub });
  if (!project) return notFoundResponse('Project not found');

  if (project.status === 'completed') {
    return errorResponse('Project already completed', 409);
  }

  const tasks = await TaskModel.find({ userId: user.sub, projectId: id, active: true });
  const done = tasks.filter((t) => t.status === 'done').length;

  // Guard: only completable when every task is done (and at least one exists)
  if (tasks.length === 0 || done < tasks.length) {
    return errorResponse('All tasks must be done before completing the project', 400);
  }

  // Atomic guard against a double-submit racing this same completion — only
  // one concurrent request's update can match `status: { $ne: 'completed' }`,
  // so only one proceeds to award XP/coins and create the reward notification.
  const updated = await ProjectModel.findOneAndUpdate(
    { _id: id, userId: user.sub, status: { $ne: 'completed' } },
    { $set: { status: 'completed', completedDate: new Date() } },
    { new: true },
  );
  if (!updated) return errorResponse('Project already completed', 409);

  // Award XP / coins to the hero profile
  if (updated.xp > 0 || updated.coins > 0) {
    await UserProfileModel.findOneAndUpdate(
      { userId: user.sub },
      { $inc: { xp: updated.xp, coins: updated.coins } },
    );
  }

  await NotificationModel.create({
    userId: user.sub,
    type: 'reward',
    title: '🚀 Project Complete',
    message: `${updated.name} — +${updated.xp} XP, +${updated.coins} coins`,
  });

  return successResponse(serialize(updated, { done, total: tasks.length }), 'Project completed');
});
