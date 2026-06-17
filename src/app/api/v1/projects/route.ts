import mongoose from 'mongoose';
import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { ProjectModel } from '@/server/models/project.model';
import { TaskModel } from '@/server/models/task.model';
import { asyncHandler, createdResponse, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';
import type { IProject } from '@/server/models/project.model';
import type { ProjectDTO } from '@/types/project';

const PROJECT_COLORS = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'] as const;
const PROJECT_PRIORITIES = ['high', 'medium', 'low'] as const;

const dateField = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  color: z.enum(PROJECT_COLORS),
  icon: z.string().min(1),
  priority: z.enum(PROJECT_PRIORITIES).optional(),
  startDate: dateField.optional(),
  deadline: dateField.optional(),
  xp: z.number().int().min(0).optional(),
  coins: z.number().int().min(0).optional(),
});

/** Counts of done / total active tasks, keyed by project id string. */
export type TaskCounts = Record<string, { done: number; total: number }>;

export function serialize(p: IProject, counts?: { done: number; total: number }): ProjectDTO {
  const total = counts?.total ?? 0;
  const done = counts?.done ?? 0;
  return {
    id: p._id.toString(),
    userId: p.userId.toString(),
    name: p.name,
    description: p.description,
    color: p.color,
    icon: p.icon,
    status: p.status,
    priority: p.priority,
    startDate: p.startDate?.toISOString().substring(0, 10),
    deadline: p.deadline?.toISOString().substring(0, 10),
    xp: p.xp,
    coins: p.coins,
    completedDate: p.completedDate?.toISOString().substring(0, 10),
    progress: total > 0 ? done / total : 0,
    doneTasks: done,
    totalTasks: total,
    active: p.active,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

/** Aggregate done/total active-task counts for the given project ids. */
export async function getTaskCounts(userId: string, projectIds: string[]): Promise<TaskCounts> {
  if (projectIds.length === 0) return {};

  const rows = await TaskModel.aggregate<{
    _id: string;
    total: number;
    done: number;
  }>([
    {
      $match: {
        userId: toObjectId(userId),
        projectId: { $in: projectIds.map(toObjectId) },
        active: true,
      },
    },
    {
      $group: {
        _id: '$projectId',
        total: { $sum: 1 },
        done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
      },
    },
  ]);

  const counts: TaskCounts = {};
  for (const r of rows) counts[r._id.toString()] = { done: r.done, total: r.total };
  return counts;
}

function toObjectId(id: string) {
  return new mongoose.Types.ObjectId(id);
}

// GET /api/v1/projects?status=active
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  await connectDB();

  const filter: Record<string, unknown> = { userId: user.sub, active: true };
  if (status) filter.status = status;

  const projects = await ProjectModel.find(filter).sort({ createdAt: -1 });
  const counts = await getTaskCounts(
    user.sub,
    projects.map((p) => p._id.toString()),
  );

  return successResponse(projects.map((p) => serialize(p, counts[p._id.toString()])));
});

// POST /api/v1/projects
export const POST = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data, error } = await validateBody(req, createSchema);
  if (error) return error;

  await connectDB();

  const project = await ProjectModel.create({
    userId: user.sub,
    name: data.name,
    description: data.description,
    color: data.color,
    icon: data.icon,
    priority: data.priority ?? 'medium',
    startDate: data.startDate ? new Date(data.startDate) : undefined,
    deadline: data.deadline ? new Date(data.deadline) : undefined,
    xp: data.xp ?? 0,
    coins: data.coins ?? 0,
  });

  return createdResponse(serialize(project, { done: 0, total: 0 }), 'Project created');
});
