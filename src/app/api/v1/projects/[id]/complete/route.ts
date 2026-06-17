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

  project.status = 'completed';
  project.completedDate = new Date();
  await project.save();

  // Award XP / coins to the hero profile
  if (project.xp > 0 || project.coins > 0) {
    await UserProfileModel.findOneAndUpdate(
      { userId: user.sub },
      { $inc: { xp: project.xp, coins: project.coins } },
    );
  }

  await NotificationModel.create({
    userId: user.sub,
    type: 'reward',
    title: '🚀 Project Complete',
    message: `${project.name} — +${project.xp} XP, +${project.coins} coins`,
  });

  return successResponse(serialize(project, { done, total: tasks.length }), 'Project completed');
});
