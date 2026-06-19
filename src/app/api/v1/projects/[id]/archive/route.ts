import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { ProjectModel } from '@/server/models/project.model';
import { ScheduleBlockModel } from '@/server/models/schedule-block.model';
import { TaskModel } from '@/server/models/task.model';
import { asyncHandler, notFoundResponse, successResponse, unauthorizedResponse } from '@/server';
import { serialize } from '../../route';

// PATCH /api/v1/projects/:id/archive — archive project AND hide its child tasks
export const PATCH = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  await connectDB();

  const project = await ProjectModel.findOneAndUpdate(
    { _id: id, userId: user.sub },
    { $set: { status: 'archived', active: false } },
    { new: true },
  );

  if (!project) return notFoundResponse('Project not found');

  // Cascade: hide every child task so they disappear together
  const childTasks = await TaskModel.find({ userId: user.sub, projectId: id }).select('_id').lean();
  await TaskModel.updateMany({ userId: user.sub, projectId: id }, { $set: { active: false } });

  // Cascade: drop scheduling blocks tied to those tasks
  if (childTasks.length > 0) {
    await ScheduleBlockModel.deleteMany({
      userId: user.sub,
      sourceType: 'task',
      sourceId: { $in: childTasks.map((t) => t._id) },
    });
  }

  return successResponse(serialize(project), 'Project archived');
});
